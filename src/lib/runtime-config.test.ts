import { describe, expect, it, vi } from "vitest";
import { appBaseUrl, requiredRuntimeValue } from "./runtime-config";

describe("runtime configuration", () => {
  it("permits explicit development fallbacks only outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(requiredRuntimeValue("MISSING_VALUE", "local")).toBe("local");
  });
  it("requires runtime secrets in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MISSING_VALUE", "");
    expect(() => requiredRuntimeValue("MISSING_VALUE", "local")).toThrow("MISSING_VALUE is required");
  });
  it("requires an absolute public URL", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "not-a-url");
    expect(() => appBaseUrl()).toThrow("absolute URL");
  });
});
