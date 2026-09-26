import { describe, expect, it } from "vitest";
import { isSignupAttemptAllowed, isValidBooleanChoice, isValidEmail, normalizeEmail } from "./policy";

describe("waitlist policy", () => {
  it("normalizes email addresses before duplicate detection", () => { expect(normalizeEmail(" Test@Example.NL ")).toBe("test@example.nl"); expect(isValidEmail(" test@example.nl ")).toBe(true); });
  it("rejects malformed emails and invalid trial choices", () => { expect(isValidEmail("not-an-email")).toBe(false); expect(isValidBooleanChoice("yes")).toBe(true); expect(isValidBooleanChoice("maybe")).toBe(false); });
  it("allows five hourly submissions per hashed IP", () => { expect(isSignupAttemptAllowed(4)).toBe(true); expect(isSignupAttemptAllowed(5)).toBe(false); });
});
