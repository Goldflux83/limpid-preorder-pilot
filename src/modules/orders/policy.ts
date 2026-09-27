import type { Station } from "@/modules/catalog/server";

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Amsterdam",
  weekday: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function localParts(date: Date) {
  return Object.fromEntries(timeFormatter.formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

export function isSlotWithinOpeningHours(station: Station, slot: Date) {
  const parts = localParts(slot);
  const hours = station.opening_hours[parts.weekday.toLowerCase()];
  if (!hours?.open || !hours.close) return false;
  const time = `${parts.hour}:${parts.minute}`;
  return time >= hours.open && time < hours.close;
}

export function buildAvailableSlots(station: Station, now = new Date()) {
  const start = new Date(Math.ceil((now.getTime() + station.order_min_minutes * 60_000) / (station.slot_minutes * 60_000)) * station.slot_minutes * 60_000);
  const end = now.getTime() + station.order_max_minutes * 60_000;
  const slots: string[] = [];
  for (let instant = start.getTime(); instant <= end; instant += station.slot_minutes * 60_000) {
    const slot = new Date(instant);
    if (isSlotWithinOpeningHours(station, slot)) slots.push(slot.toISOString());
  }
  return slots;
}

export function validOrderOption(value: string, productOptions: string[]) {
  return value === "" || productOptions.includes(value);
}

export type SlotState = "available" | "full" | "closed";
export type OrderFailure = "slot_unavailable" | "unavailable";

export function slotState(slot: string, maxPerSlot: number, orderCount: number, closures: { starts_at: string; ends_at: string; opened_at: string | null }[]) : SlotState {
  const time = new Date(slot).getTime();
  if (closures.some((closure) => !closure.opened_at && time >= new Date(closure.starts_at).getTime() && time < new Date(closure.ends_at).getTime())) return "closed";
  return orderCount >= maxPerSlot ? "full" : "available";
}

export function orderFailure(message: string | undefined): OrderFailure {
  return message === "slot is full" || message === "slot is closed" ? "slot_unavailable" : "unavailable";
}
