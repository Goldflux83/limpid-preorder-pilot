import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("admin authentication feedback", () => {
  it("shows redirected login and MFA errors in their forms", () => {
    expect(source("src/app/admin/login/page.tsx")).toContain('role="alert"');
    expect(source("src/app/admin/login/page.tsx")).toContain("mfa-not-enrolled");
    expect(source("src/app/admin/login/page.tsx")).toContain("email-not-confirmed");
    expect(source("src/app/admin/login/page.tsx")).toContain("auth-unavailable");
    expect(source("src/app/admin/login/page.tsx")).toContain("configuration");
    expect(source("src/app/admin/mfa/page.tsx")).toContain('role="alert"');
    expect(source("src/app/admin/mfa/enroll/enrollment-form.tsx")).toContain('role="alert"');
  });

  it("rejects authenticated users without an active admin profile before MFA", () => {
    const action = source("src/app/admin/login/actions.ts");
    expect(action).toContain('.eq("active", true)');
    expect(action).toContain('redirect("/admin/login?error=not-authorized")');
  });

  it("requires a verified TOTP factor and enables it for local Supabase", () => {
    expect(source("src/app/admin/login/actions.ts")).toContain('redirect("/admin/mfa/enroll")');
    expect(source("src/app/admin/mfa/actions.ts")).toContain('factorType: "totp"');
    expect(source("src/app/admin/mfa/actions.ts")).toContain("issuer: ui.adminMfa.factorName");
    expect(source("src/modules/auth/admin.ts")).toContain('currentLevel !== "aal2"');
    const config = source("supabase/config.toml");
    expect(config).toContain("enroll_enabled = true");
    expect(config).toContain("verify_enabled = true");
  });

  it("removes trailing whitespace from Supabase's SVG QR-code URL", () => {
    expect(source("src/app/admin/mfa/enroll/enrollment-form.tsx")).toContain("enrollment.qrCode.trimEnd()");
  });
});
