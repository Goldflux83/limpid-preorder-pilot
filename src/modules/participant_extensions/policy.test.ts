import { describe, expect, it } from "vitest";
import { canUploadCardPhoto, currentIsoWeek, stampCardProgress, validWeekNumber } from "./policy";

describe("participant extension policy", () => {
  it("accepts only ISO-style week numbers", () => { expect(validWeekNumber("1")).toBe(1); expect(validWeekNumber("53")).toBe(53); expect(validWeekNumber("54")).toBeNull(); });
  it("allows one card photo in a rolling week", () => { expect(canUploadCardPhoto(0)).toBe(true); expect(canUploadCardPhoto(1)).toBe(false); });
  it("starts the stamp card at two and resets after twelve", () => { expect(stampCardProgress(0)).toBe(2); expect(stampCardProgress(10)).toBe(0); });
  it("uses ISO weeks at the year boundary", () => { expect(currentIsoWeek(new Date("2027-01-01T12:00:00Z"))).toBe(53); });
});
