import { describe, expect, it } from "vitest";
import { isFeatureKey } from "./policy";
describe("pilot feature keys", () => {
  it("only accepts the database-managed pilot feature keys", () => { expect(isFeatureKey("ordering")).toBe(true); expect(isFeatureKey("unknown")).toBe(false); expect(isFeatureKey("NEXT_PUBLIC_FEATURE_ORDERING")).toBe(false); });
});
