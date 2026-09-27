import { describe, expect, it } from "vitest";
import { generateParticipantCode, isExportDataset, parseProductOptions } from "./policy";

describe("admin policy", () => {
  it("generates codes without ambiguous characters", () => {
    expect(generateParticipantCode(() => Buffer.from([0, 8, 9, 10, 11, 12]))).toMatch(/^[A-HJ-NP-Z2-9]{2}-[A-HJ-NP-Z2-9]{4}$/);
  });

  it("keeps only non-empty product options and allowed export datasets", () => {
    expect(parseProductOptions(" oat, , soy ")).toEqual(["oat", "soy"]);
    expect(isExportDataset("events")).toBe(true);
    expect(isExportDataset("waitlist_entries")).toBe(false);
  });
});
