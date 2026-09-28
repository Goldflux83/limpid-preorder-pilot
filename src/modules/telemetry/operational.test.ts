import { describe, expect, it, vi } from "vitest";
import { createOperationalPayload, reportOperationalTelemetry } from "./operational";

describe("operational telemetry", () => {
  it("creates a payload without pilot or personal data", () => {
    const payload = createOperationalPayload({ type: "server_action", action: "signup", outcome: "success" });
    expect(payload).toMatchObject({ source: "limpid-preorder-pilot", type: "server_action", action: "signup", outcome: "success" });
    expect(Object.keys(payload)).not.toContain("email");
    expect(Object.keys(payload)).not.toContain("password");
  });
  it("does nothing when Goldflux telemetry is not configured", async () => {
    vi.stubEnv("GOLDFLUX_TELEMETRY_ENDPOINT", "");
    vi.stubEnv("GOLDFLUX_TELEMETRY_TOKEN", "");
    await expect(reportOperationalTelemetry({ type: "server_started" })).resolves.toBeUndefined();
  });
});
