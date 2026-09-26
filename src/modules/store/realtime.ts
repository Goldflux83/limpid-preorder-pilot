import { createPrivateKey, sign } from "crypto";

type RealtimeSession = { stationId: string; sessionId: string };

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const normalizeSupabaseUrl = (value: string) => value.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

export function createStoreRealtimeToken(session: RealtimeSession, now = new Date()) {
  const privateKey = process.env.SUPABASE_JWT_SIGNING_PRIVATE_KEY;
  const keyId = process.env.SUPABASE_JWT_SIGNING_KEY_ID;
  if (!privateKey || !keyId) return null;
  const issuedAt = Math.floor(now.getTime() / 1000);
  const header = encode({ alg: "RS256", typ: "JWT", kid: keyId });
  const payload = encode({ aud: "authenticated", role: "authenticated", sub: session.sessionId, store_station_id: session.stationId, iat: issuedAt, exp: issuedAt + 90 });
  const input = `${header}.${payload}`;
  const key = createPrivateKey({ key: Buffer.from(privateKey, "base64"), format: "der", type: "pkcs8" });
  return `${input}.${sign("RSA-SHA256", Buffer.from(input), key).toString("base64url")}`;
}

export function getStoreRealtimeConfig(session: RealtimeSession) {
  const configuredUrl = process.env.SUPABASE_URL;
  const url = configuredUrl && normalizeSupabaseUrl(configuredUrl);
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const token = createStoreRealtimeToken(session);
  return url && publishableKey && token ? { url, publishableKey, token, stationId: session.stationId } : null;
}
