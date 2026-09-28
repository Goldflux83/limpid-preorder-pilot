import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("visual style and close navigation", () => {
  it("uses the approved local font stack and accessible interactive styles", () => {
    const css = source("src/app/globals.css");
    expect(css).toContain('font-family:Aptos, "Segoe UI", "Helvetica Neue", Arial, sans-serif');
    expect(css).toContain("a:hover");
    expect(css).toContain("a:focus-visible");
    expect(css).toContain("--purple");
    expect(css).toContain("--yellow");
  });

  it("renders an optional close link through the shared page header", () => {
    const header = source("src/components/ui/page-header.tsx");
    expect(header).toContain("closeHref?: string");
    expect(header).toContain("ui.navigation.close");
    expect(header).toContain('className="close-link"');
  });

  it("returns public detail pages to their fixed parent routes", () => {
    expect(source("src/app/k/[code]/order/page.tsx")).toContain('closeHref={`/k/${code}`}');
    expect(source("src/app/k/[code]/stamps/page.tsx")).toContain('closeHref={`/k/${code}`}');
    expect(source("src/app/k/[code]/card-photo/page.tsx")).toContain('closeHref={`/k/${code}`}');
    expect(source("src/app/privacy/page.tsx")).toContain('closeHref="/"');
    expect(source("src/app/signup/page.tsx")).toContain('closeHref="/"');
    expect(source("src/app/voucher/[code]/page.tsx")).toContain('closeHref="/"');
  });
});
