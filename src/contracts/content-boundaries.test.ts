import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("content and configuration boundaries", () => {
  it("keeps labels in the typed content configuration", () => {
    const content = source("src/config/content.ts");
    expect(content).toContain("adminSessions");
    expect(content).toContain("voucherSubmit");
    expect(content).toContain("pinSubmit");
  });
  it("does not expose functional flags through NEXT_PUBLIC variables", () => {
    expect(source("src/lib/theme.ts")).not.toMatch(/NEXT_PUBLIC_FEATURE/);
    expect(source("src/modules/catalog/server.ts")).toContain("SUPABASE_SECRET_KEY");
  });
  it("keeps the canonical participant route and does not advertise role routes publicly", () => {
    expect(source("src/app/k/[code]/page.tsx")).toContain("getActiveParticipantByCode");
    expect(source("src/app/page.tsx")).not.toContain('href="/admin"');
    expect(source("src/app/page.tsx")).not.toContain('href="/store');
    expect(source("src/app/store/[station]/page.tsx")).toContain("StoreKioskTemplate");
  });
});
