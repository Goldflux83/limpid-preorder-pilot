import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { orderFailure, slotState, type OrderFailure, type SlotState } from "./policy";

export type ParticipantOrder = {
  id: string; number: string; station_id: string; product_id: string; slot_start: string; status: "received" | "collected" | "not_collected" | "cancelled" | "unknown"; smiley: number | null;
  product: { name: string } | null;
};

export async function getLatestParticipantOrder(participantId: string) {
  const { data } = await createSupabaseAdminClient()
    .from("orders")
    .select("id,number,station_id,product_id,slot_start,status,smiley,product:products(name)")
    .eq("participant_id", participantId)
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { ...data, product: Array.isArray(data.product) ? data.product[0] ?? null : data.product } as ParticipantOrder;
}

export async function createParticipantOrder(input: { participantId: string; stationId: string; productId: string; option: string; slotStart: string }) {
  const { data, error } = await createSupabaseAdminClient().rpc("create_order_with_capacity", {
    p_participant_id: input.participantId,
    p_station_id: input.stationId,
    p_product_id: input.productId,
    p_options: input.option ? { selection: input.option } : {},
    p_slot_start: input.slotStart,
  });
  if (error || !data || typeof data !== "object" || !("id" in data)) return { outcome: orderFailure(error?.message) } as { outcome: OrderFailure };
  return { outcome: "created" as const, id: String(data.id) };
}

export async function cancelParticipantOrder(participantId: string, orderId: string) {
  const { data, error } = await createSupabaseAdminClient().rpc("cancel_participant_order", { p_participant_id: participantId, p_order_id: orderId });
  return !error && data === true;
}

export async function recordParticipantOrderFeedback(participantId: string, orderId: string, smiley: number, answer: string) {
  const { validOrderFeedback } = await import("./policy");
  if (!validOrderFeedback(smiley, answer)) return false;
  const { data, error } = await createSupabaseAdminClient().rpc("record_order_feedback", {
    p_participant_id: participantId,
    p_order_id: orderId,
    p_smiley: smiley,
    p_open_answer: answer.trim() || null,
  });
  return !error && data === true;
}

export async function getSlotStates(stationId: string, slots: string[], maxPerSlot: number): Promise<Record<string, SlotState>> {
  if (!slots.length) return {};
  const admin = createSupabaseAdminClient();
  const [ordersResult, closuresResult] = await Promise.all([
    admin.from("orders").select("slot_start").eq("station_id", stationId).eq("status", "received").gte("slot_start", slots[0]).lte("slot_start", slots[slots.length - 1]),
    admin.from("slot_closures").select("starts_at,ends_at,opened_at").eq("station_id", stationId).is("opened_at", null).lt("starts_at", slots[slots.length - 1]).gt("ends_at", slots[0]),
  ]);
  const counts = (ordersResult.data ?? []).reduce<Record<string, number>>((total, order) => ({ ...total, [order.slot_start]: (total[order.slot_start] ?? 0) + 1 }), {});
  return Object.fromEntries(slots.map((slot) => [slot, slotState(slot, maxPerSlot, counts[slot] ?? 0, closuresResult.data ?? [])]));
}
