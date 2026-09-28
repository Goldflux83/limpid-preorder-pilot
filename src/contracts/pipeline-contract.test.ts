import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const file = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("deployment pipeline contracts", () => {
  it("deploys only after verification and registers a tst release candidate", () => {
    const workflow = file(".github/workflows/verify.yml");
    expect(workflow).toContain("needs: verify");
    expect(workflow).toContain("vercel@latest deploy --yes");
    expect(workflow).toContain("environment=tst");
    expect(workflow).toContain("required_contexts[]");
    expect(workflow).toContain("deployments: write");
  });

  it("keeps production promotion manual and promotes an existing deployment", () => {
    const workflow = file(".github/workflows/promote-production.yml");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("environment: prd");
    expect(workflow).toContain("deployments: read");
    expect(workflow).toContain("vercel@latest promote");
    expect(workflow).not.toContain("vercel@latest deploy");
    expect(existsSync(resolve(root, ".github/workflows/release.yml"))).toBe(false);
  });

  it("keeps database changes manual, confirmed, and separate from Vercel deployment", () => {
    const workflow = file(".github/workflows/database-migrate.yml");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("APPLY_${TARGET^^}");
    expect(workflow).toContain("SUPABASE_DB_URL");
    expect(workflow).toContain("db push");
    expect(workflow).toContain("db query");
  });
});
