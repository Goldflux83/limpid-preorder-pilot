import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type StoreOrder = {
  id: string;
  number: string;
  slot_start: string;
  options: Record<string, string>;
  product: { name: string } | null;
  participant: { first_name: string } | null;
};

export async function getOpenStoreOrders(stationId: string) {
  const admin = createSupabaseAdminClient();
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: stale } = await admin
    .from("orders")
    .select("id")
    .eq("station_id", stationId)
    .eq("status", "received")
    .lt("slot_start", cutoff);
  for (const order of stale ?? []) {
    await admin
      .from("orders")
      .update({ status: "unknown", closed_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("status", "received");
    await admin
      .from("events")
      .insert({
        type: "order_marked_unknown",
        station_id: stationId,
        order_id: order.id,
        actor_type: "system",
      });
  }
  const { data } = await admin
    .from("orders")
    .select(
      "id,number,slot_start,options,product:products(name),participant:participants(first_name)"
    )
    .eq("station_id", stationId)
    .eq("status", "received")
    .order("slot_start");
  return (data ?? []).map((order) => ({
    ...order,
    product: Array.isArray(order.product)
      ? order.product[0] ?? null
      : order.product,
    participant: Array.isArray(order.participant)
      ? order.participant[0] ?? null
      : order.participant,
  })) as StoreOrder[];
}

export async function closeStoreOrder(
  stationId: string,
  sessionId: string,
  orderId: string,
  status: "collected" | "not_collected"
) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("orders")
    .update({ status, closed_at: now })
    .eq("id", orderId)
    .eq("station_id", stationId)
    .eq("status", "received")
    .select("id")
    .maybeSingle();
  if (error || !data) return false;
  await admin
    .from("events")
    .insert({
      type: status === "collected" ? "order_collected" : "order_marked_no_show",
      station_id: stationId,
      order_id: orderId,
      actor_type: "store",
      actor_id: sessionId,
    });
  return true;
}

export async function pauseStoreSlots(stationId: string, sessionId: string) {
  const now = new Date();
  const until = new Date(now.getTime() + 15 * 60 * 1000);
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("slot_closures")
    .insert({
      station_id: stationId,
      starts_at: now.toISOString(),
      ends_at: until.toISOString(),
      actor: "store",
      reason: "quick_pause",
    });
  if (!error)
    await admin
      .from("events")
      .insert({
        type: "store_pause_started",
        station_id: stationId,
        actor_type: "store",
        actor_id: sessionId,
        data: { ends_at: until.toISOString() },
      });
}
