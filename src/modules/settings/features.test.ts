import { describe, expect, it } from "vitest";
import { isFeatureKey, isManageableFeatureKey } from "./policy";
describe("pilot feature keys", () => {
  it("only accepts the database-managed pilot feature keys", () => { expect(isFeatureKey("ordering")).toBe(true); expect(isFeatureKey("unknown")).toBe(false); expect(isFeatureKey("NEXT_PUBLIC_FEATURE_ORDERING")).toBe(false); });
  it("exposes completed participant features as database-managed settings", () => { expect(isManageableFeatureKey("ordering")).toBe(true); expect(isManageableFeatureKey("digital_stamps")).toBe(true); expect(isManageableFeatureKey("card_photos")).toBe(true); });
});
