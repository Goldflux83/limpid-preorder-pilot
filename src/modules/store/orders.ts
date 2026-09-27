import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isOrderOverdue } from "./policy";

export type StoreOrder = {
  id: string;
  number: string;
  slot_start: string;
  options: Record<string, string>;
  product: { name: string } | null;
  participant: { first_name: string } | null;
};

export async function markOverdueOrdersUnknown(stationId?: string) {
  const admin = createSupabaseAdminClient();
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  let query = admin
    .from("orders")
    .select("id")
    .eq("status", "received")
    .lt("slot_start", cutoff);
  if (stationId) query = query.eq("station_id", stationId);
  const { data: stale } = await query;
  let updated = 0;
  for (const order of stale ?? []) {
    const { data } = await admin
      .from("orders")
      .update({ status: "unknown", closed_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("status", "received")
      .select("id,station_id")
      .maybeSingle();
    if (!data) continue;
    await admin
      .from("events")
      .insert({
        type: "order_marked_unknown",
        station_id: data.station_id,
        order_id: order.id,
        actor_type: "system",
      });
    updated += 1;
  }
  return updated;
}

export async function getOpenStoreOrders(stationId: string, sessionId: string) {
  const admin = createSupabaseAdminClient();
  await markOverdueOrdersUnknown(stationId);
  const { data } = await admin
    .from("orders")
    .select(
      "id,number,slot_start,options,product:products(name),participant:participants(first_name)"
    )
    .eq("station_id", stationId)
    .eq("status", "received")
    .order("slot_start");
  const orders = (data ?? []).map((order) => ({
    ...order,
    product: Array.isArray(order.product)
      ? order.product[0] ?? null
      : order.product,
    participant: Array.isArray(order.participant)
      ? order.participant[0] ?? null
      : order.participant,
  })) as StoreOrder[];
  for (const order of orders) {
    const { data: displayed } = await admin.from("orders").update({ displayed_at: new Date().toISOString() }).eq("id", order.id).is("displayed_at", null).select("id").maybeSingle();
    if (displayed) await admin.from("events").insert({ type: "order_displayed", station_id: stationId, order_id: order.id, actor_type: "store", actor_id: sessionId });
  }
  return orders;
}

export async function closeStoreOrder(
  stationId: string,
  sessionId: string,
  orderId: string,
  status: "collected" | "not_collected"
) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: openOrder } = await admin.from("orders").select("slot_start").eq("id", orderId).eq("station_id", stationId).eq("status", "received").maybeSingle();
  if (!openOrder || (status === "not_collected" && !isOrderOverdue(openOrder.slot_start))) return "too_early" as const;
  const { data, error } = await admin
    .from("orders")
    .update({ status, closed_at: now })
    .eq("id", orderId)
    .eq("station_id", stationId)
    .eq("status", "received")
    .select("id")
    .maybeSingle();
  if (error || !data) return "unavailable" as const;
  await admin
    .from("events")
    .insert({
      type: status === "collected" ? "order_collected" : "order_marked_no_show",
      station_id: stationId,
      order_id: orderId,
      actor_type: "store",
      actor_id: sessionId,
    });
  return "closed" as const;
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

export async function getActiveQuickPause(stationId: string) {
  const { data } = await createSupabaseAdminClient().from("slot_closures").select("id,ends_at").eq("station_id", stationId).eq("reason", "quick_pause").is("opened_at", null).gt("ends_at", new Date().toISOString()).order("ends_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}

export async function resumeStoreSlots(stationId: string, sessionId: string) {
  const now = new Date().toISOString();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("slot_closures").update({ opened_at: now }).eq("station_id", stationId).eq("reason", "quick_pause").is("opened_at", null).gt("ends_at", now).select("id");
  if (error) throw error;
  await admin.from("events").insert({ type: "store_pause_ended", station_id: stationId, actor_type: "store", actor_id: sessionId, data: { count: data.length } });
  return data.length;
}

export async function redeemStoreVoucher(stationId: string, sessionId: string, code: string) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin.from("vouchers").update({ redeemed_at: now }).eq("code", code.trim().toUpperCase()).eq("station_id", stationId).is("redeemed_at", null).or(`valid_until.is.null,valid_until.gte.${now.slice(0, 10)}`).select("id").maybeSingle();
  if (error || !data) return false;
  await admin.from("events").insert({ type: "voucher_redeemed", station_id: stationId, voucher_id: data.id, actor_type: "store", actor_id: sessionId });
  return true;
}
