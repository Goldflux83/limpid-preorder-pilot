import { describe, expect, it, vi } from "vitest";
import { createStoreRealtimeToken } from "./realtime";

describe("store realtime token", () => {
  it("scopes the JWT to one station and expires it quickly", () => {
    vi.stubEnv("SUPABASE_JWT_SECRET", "test-secret");
    const token = createStoreRealtimeToken({ stationId: "station-amf", sessionId: "session-1" }, new Date("2026-09-26T10:00:00Z"));
    const payload = JSON.parse(Buffer.from(token!.split(".")[1], "base64url").toString());
    expect(payload.store_station_id).toBe("station-amf");
    expect(payload.exp - payload.iat).toBe(90);
    expect(payload.role).toBe("authenticated");
  });
  it("does not issue a browser token without a signing secret", () => {
    vi.stubEnv("SUPABASE_JWT_SECRET", "");
    expect(createStoreRealtimeToken({ stationId: "station-amf", sessionId: "session-1" })).toBeNull();
  });
});
