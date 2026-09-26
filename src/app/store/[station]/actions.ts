"use server";
import { revalidatePath } from "next/cache";
import { closeStoreOrder, pauseStoreSlots, redeemStoreVoucher, resumeStoreSlots } from "@/modules/store/orders";
import { requireStoreSession } from "@/modules/store/session";
import { isFeatureEnabled } from "@/modules/settings/features";
import { reportOperationalTelemetry } from "@/modules/telemetry/operational";

export async function closeOrder(formData: FormData) {
  if (!(await isFeatureEnabled("store_screen"))) return;
  const station = String(formData.get("station"));
  const order = String(formData.get("order"));
  const status = String(formData.get("status"));
  const session = await requireStoreSession(station);
  if (status === "collected" || status === "not_collected")
    await closeStoreOrder(session.stationId, session.sessionId, order, status);
  void reportOperationalTelemetry({ type: "server_action", action: "store_order_closed", outcome: "success" });
  revalidatePath(`/store/${station}`);
}
export async function pauseOrders(formData: FormData) {
  if (!(await isFeatureEnabled("store_screen"))) return;
  const station = String(formData.get("station"));
  const session = await requireStoreSession(station);
  await pauseStoreSlots(session.stationId, session.sessionId);
  void reportOperationalTelemetry({ type: "server_action", action: "store_pause", outcome: "success" });
  revalidatePath(`/store/${station}`);
}
export async function resumeOrders(formData: FormData) {
  if (!(await isFeatureEnabled("store_screen"))) return;
  const station = String(formData.get("station"));
  const session = await requireStoreSession(station);
  await resumeStoreSlots(session.stationId, session.sessionId);
  void reportOperationalTelemetry({ type: "server_action", action: "store_resume", outcome: "success" });
  revalidatePath(`/store/${station}`);
}
export async function redeemVoucher(formData: FormData) {
  if (!(await isFeatureEnabled("store_screen"))) return;
  const station = String(formData.get("station"));
  const code = String(formData.get("voucherCode"));
  const session = await requireStoreSession(station);
  if (code) await redeemStoreVoucher(session.stationId, session.sessionId, code);
  void reportOperationalTelemetry({ type: "server_action", action: "store_voucher", outcome: "success" });
  revalidatePath(`/store/${station}`);
}
