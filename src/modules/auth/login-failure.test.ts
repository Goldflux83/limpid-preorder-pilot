import { describe, expect, it } from "vitest";
import { classifyAdminLoginFailure } from "./login-failure";

describe("admin login failures", () => {
  it("keeps invalid credentials generic to prevent account enumeration", () => {
    expect(classifyAdminLoginFailure({ code: "invalid_credentials" })).toBe("invalid");
  });

  it("separates confirmation and temporary Auth failures", () => {
    expect(classifyAdminLoginFailure({ code: "email_not_confirmed" })).toBe("email-not-confirmed");
    expect(classifyAdminLoginFailure({ name: "AuthRetryableFetchError" })).toBe("auth-unavailable");
  });
});
