import { describe, expect, it } from "vitest";
import { buildAvailableSlots, isSlotWithinOpeningHours, orderFailure, validOrderOption } from "./policy";

const station = {
  id: "station", code: "AMF", name: "Amersfoort", ordering_enabled: true, sound_enabled: false, daily_log_url: null,
  opening_hours: { friday: { open: "09:00", close: "11:00" } }, slot_minutes: 5, max_per_slot: 3, order_min_minutes: 15, order_max_minutes: 120,
};

describe("order slot policy", () => {
  it("uses Amsterdam opening hours and configured ordering limits", () => {
    expect(isSlotWithinOpeningHours(station, new Date("2026-09-25T07:00:00Z"))).toBe(true);
    expect(isSlotWithinOpeningHours(station, new Date("2026-09-25T06:55:00Z"))).toBe(false);
    expect(buildAvailableSlots(station, new Date("2026-09-25T06:40:00Z"))[0]).toBe("2026-09-25T07:00:00.000Z");
  });
  it("only accepts an option offered by the selected product", () => {
    expect(validOrderOption("Oat", ["Oat", "Regular"])).toBe(true);
    expect(validOrderOption("Soy", ["Oat", "Regular"])).toBe(false);
  });
  it("keeps closed and full slots unavailable before the database repeats the check", async () => {
    const { slotState } = await import("./policy");
    const slot = "2026-09-25T07:00:00Z";
    expect(slotState(slot, 3, 3, [])).toBe("full");
    expect(slotState(slot, 3, 0, [{ starts_at: "2026-09-25T06:55:00Z", ends_at: "2026-09-25T07:05:00Z", opened_at: null }])).toBe("closed");
  });
  it("maps a post-submit slot conflict to a safe, actionable failure", () => {
    expect(orderFailure("slot is full")).toBe("slot_unavailable");
    expect(orderFailure("slot is closed")).toBe("slot_unavailable");
    expect(orderFailure("participant cannot preorder")).toBe("unavailable");
  });
});
