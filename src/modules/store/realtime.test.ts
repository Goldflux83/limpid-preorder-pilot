import { generateKeyPairSync } from "crypto";
import { describe, expect, it, vi } from "vitest";
import { createStoreRealtimeToken } from "./realtime";

describe("store realtime token", () => {
  it("scopes the JWT to one station and expires it quickly", () => {
    const key = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ format: "der", type: "pkcs8" }).toString("base64");
    vi.stubEnv("SUPABASE_JWT_SIGNING_PRIVATE_KEY", key);
    vi.stubEnv("SUPABASE_JWT_SIGNING_KEY_ID", "test-key-id");
    const token = createStoreRealtimeToken({ stationId: "station-amf", sessionId: "session-1" }, new Date("2026-09-26T10:00:00Z"));
    const payload = JSON.parse(Buffer.from(token!.split(".")[1], "base64url").toString());
    expect(payload.store_station_id).toBe("station-amf");
    expect(payload.exp - payload.iat).toBe(90);
    expect(payload.role).toBe("authenticated");
    expect(JSON.parse(Buffer.from(token!.split(".")[0], "base64url").toString()).kid).toBe("test-key-id");
  });
  it("does not issue a browser token without a signing secret", () => {
    vi.stubEnv("SUPABASE_JWT_SIGNING_PRIVATE_KEY", "");
    vi.stubEnv("SUPABASE_JWT_SIGNING_KEY_ID", "");
    expect(createStoreRealtimeToken({ stationId: "station-amf", sessionId: "session-1" })).toBeNull();
  });
});
