"use server";

import { redirect } from "next/navigation";
import { normalizeParticipantCode } from "@/modules/participants/policy";
import { getActiveParticipantByCode } from "@/modules/participants/server";
import { cancelParticipantOrder, createParticipantOrder } from "@/modules/orders/server";
import { reportOperationalTelemetry } from "@/modules/telemetry/operational";

export async function placeOrder(formData: FormData) {
  const code = normalizeParticipantCode(String(formData.get("code") ?? ""));
  const participant = await getActiveParticipantByCode(code);
  if (!participant) redirect(`/k/${code}/order`);
  const order = await createParticipantOrder({
    participantId: participant.id,
    stationId: String(formData.get("stationId") ?? ""),
    productId: String(formData.get("productId") ?? ""),
    option: String(formData.get("option") ?? ""),
    slotStart: String(formData.get("slotStart") ?? ""),
  });
  void reportOperationalTelemetry({ type: "server_action", action: "participant_order_created", outcome: order.outcome === "created" ? "success" : "rejected" });
  const query = new URLSearchParams({
    station: String(formData.get("stationId") ?? ""),
    product: String(formData.get("productId") ?? ""),
    status: order.outcome === "created" ? "created" : order.outcome === "slot_unavailable" ? "slot-unavailable" : "unavailable",
  });
  redirect(`/k/${code}/order?${query.toString()}`);
}

export async function cancelOrder(formData: FormData) {
  const code = normalizeParticipantCode(String(formData.get("code") ?? ""));
  const participant = await getActiveParticipantByCode(code);
  if (!participant) redirect(`/k/${code}/order`);
  const cancelled = await cancelParticipantOrder(participant.id, String(formData.get("orderId") ?? ""));
  void reportOperationalTelemetry({ type: "server_action", action: "participant_order_cancelled", outcome: cancelled ? "success" : "rejected" });
  redirect(`/k/${code}/order${cancelled ? "?status=cancelled" : "?status=cancel-unavailable"}`);
}
