import { describe, expect, it } from "vitest";
import { participantPageUrl } from "./app_url";

describe("participant page URL", () => {
  it("creates an absolute, encoded QR destination", () => {
    expect(participantPageUrl("KA-7F4Q")).toMatch(/\/k\/KA-7F4Q$/);
  });
});
