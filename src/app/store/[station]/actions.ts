"use server";
import { revalidatePath } from "next/cache";
import { closeStoreOrder, pauseStoreSlots } from "@/modules/store/orders";
import { requireStoreSession } from "@/modules/store/session";

export async function closeOrder(formData: FormData) {
  const station = String(formData.get("station"));
  const order = String(formData.get("order"));
  const status = String(formData.get("status"));
  const session = await requireStoreSession(station);
  if (status === "collected" || status === "not_collected")
    await closeStoreOrder(session.stationId, session.sessionId, order, status);
  revalidatePath(`/store/${station}`);
}
export async function pauseOrders(formData: FormData) {
  const station = String(formData.get("station"));
  const session = await requireStoreSession(station);
  await pauseStoreSlots(session.stationId, session.sessionId);
  revalidatePath(`/store/${station}`);
}
