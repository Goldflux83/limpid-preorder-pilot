import { createHmac } from "crypto";

type RealtimeSession = { stationId: string; sessionId: string };

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

export function createStoreRealtimeToken(session: RealtimeSession, now = new Date()) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;
  const issuedAt = Math.floor(now.getTime() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ aud: "authenticated", role: "authenticated", sub: session.sessionId, store_station_id: session.stationId, iat: issuedAt, exp: issuedAt + 90 });
  const input = `${header}.${payload}`;
  return `${input}.${createHmac("sha256", secret).update(input).digest("base64url")}`;
}

export function getStoreRealtimeConfig(session: RealtimeSession) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const token = createStoreRealtimeToken(session);
  return url && anonKey && token ? { url, anonKey, token, stationId: session.stationId } : null;
}
