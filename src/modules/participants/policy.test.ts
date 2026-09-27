import { describe, expect, it } from "vitest";
import { canRecordRedemption, isParticipantCode, isParticipantMutationAllowed, normalizeParticipantCode } from "./policy";

describe("participant policy", () => {
  it("normalizes and excludes ambiguous participant code characters", () => {
    expect(normalizeParticipantCode(" ka-7f4q ")).toBe("KA-7F4Q");
    expect(isParticipantCode("KA-7F4Q")).toBe(true);
    expect(isParticipantCode("KO-7F4Q")).toBe(false);
    expect(isParticipantCode("K1-7F4Q")).toBe(false);
  });

  it("allows at most three self-reported redemptions per Amsterdam day", () => {
    expect(canRecordRedemption(2)).toBe(true);
    expect(canRecordRedemption(3)).toBe(false);
  });
  it("limits code-authenticated mutations per source per hour", () => {
    expect(isParticipantMutationAllowed(19)).toBe(true);
    expect(isParticipantMutationAllowed(20)).toBe(false);
  });
});
