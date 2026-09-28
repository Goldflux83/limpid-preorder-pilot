import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("admin authentication feedback", () => {
  it("shows redirected login and MFA errors in their forms", () => {
    expect(source("src/app/admin/login/page.tsx")).toContain('role="alert"');
    expect(source("src/app/admin/login/page.tsx")).toContain("mfa-not-enrolled");
    expect(source("src/app/admin/mfa/page.tsx")).toContain('role="alert"');
  });

  it("rejects authenticated users without an active admin profile before MFA", () => {
    const action = source("src/app/admin/login/actions.ts");
    expect(action).toContain('.eq("active", true)');
    expect(action).toContain('redirect("/admin/login?error=not-authorized")');
  });
});
