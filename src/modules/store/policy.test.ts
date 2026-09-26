import { describe, expect, it } from "vitest";
import { dailyLogHref, isOrderOverdue, isPinAttemptAllowed, isValidStationPin, matchesStationCode, remainingPauseSeconds, shouldTouchSession } from "./policy";

describe("store access policy", () => {
  it("allows at most five PIN attempts per IP and station per hour", () => { expect(isPinAttemptAllowed(4)).toBe(true); expect(isPinAttemptAllowed(5)).toBe(false); });
  it("touches an active kiosk session at most once every five minutes", () => { const now = new Date("2026-09-26T10:00:00Z"); expect(shouldTouchSession("2026-09-26T09:55:00Z", now)).toBe(true); expect(shouldTouchSession("2026-09-26T09:55:01Z", now)).toBe(false); });
  it("does not let an AMF session open GD", () => { expect(matchesStationCode("AMF", "amf")).toBe(true); expect(matchesStationCode("AMF", "GD")).toBe(false); });
  it("accepts only exactly four numeric PIN digits", () => { expect(isValidStationPin("1234")).toBe(true); expect(isValidStationPin("123")).toBe(false); expect(isValidStationPin("12a4")).toBe(false); });
  it("marks tickets orange after ten minutes and closes pauses at their end", () => { const now = new Date("2026-09-26T10:10:00Z"); expect(isOrderOverdue("2026-09-26T10:00:00Z", now)).toBe(true); expect(isOrderOverdue("2026-09-26T10:00:01Z", now)).toBe(false); expect(remainingPauseSeconds("2026-09-26T10:10:30Z", now)).toBe(30); });
  it("adds the station to a configured daily log URL", () => { expect(dailyLogHref("https://example.test/log?x=1", "AMF")).toBe("https://example.test/log?x=1&station=AMF"); });
});
