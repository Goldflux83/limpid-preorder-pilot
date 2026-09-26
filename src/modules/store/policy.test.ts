import { describe, expect, it } from "vitest";
import { isPinAttemptAllowed, matchesStationCode, shouldTouchSession } from "./policy";

describe("store access policy", () => {
  it("allows at most five PIN attempts per IP and station per hour", () => { expect(isPinAttemptAllowed(4)).toBe(true); expect(isPinAttemptAllowed(5)).toBe(false); });
  it("touches an active kiosk session at most once every five minutes", () => { const now = new Date("2026-09-26T10:00:00Z"); expect(shouldTouchSession("2026-09-26T09:55:00Z", now)).toBe(true); expect(shouldTouchSession("2026-09-26T09:55:01Z", now)).toBe(false); });
  it("does not let an AMF session open GD", () => { expect(matchesStationCode("AMF", "amf")).toBe(true); expect(matchesStationCode("AMF", "GD")).toBe(false); });
});
