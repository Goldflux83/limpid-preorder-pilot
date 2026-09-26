import { createHash, randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  isPinAttemptAllowed,
  matchesStationCode,
  shouldTouchSession,
} from "./policy";

const cookieName = "pilot_store_session";
const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function openStoreSession(stationCode: string, pin: string) {
  const requestHeaders = await headers();
  const address =
    requestHeaders.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const fingerprint = createHash("sha256")
    .update(`${process.env.STORE_RATE_LIMIT_SALT ?? "local"}:${address}`)
    .digest("hex");
  const admin = createSupabaseAdminClient();
  const { count } = await admin
    .from("store_pin_attempts")
    .select("id", { count: "exact", head: true })
    .eq("station_code", stationCode.toUpperCase())
    .eq("fingerprint_hash", fingerprint)
    .gt("attempted_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if (!isPinAttemptAllowed(count ?? 0)) return false;
  await admin
    .from("store_pin_attempts")
    .insert({
      station_code: stationCode.toUpperCase(),
      fingerprint_hash: fingerprint,
    });
  const token = randomBytes(32).toString("base64url");
  const { data, error } = await admin.rpc("open_store_session", {
    p_station_code: stationCode,
    p_pin: pin,
    p_token_hash: tokenHash(token),
  });
  if (error || !data) return false;
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/store",
  });
  return true;
}

export async function requireStoreSession(stationCode: string) {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) redirect(`/store/${stationCode}/login`);
  const { data } = await createSupabaseAdminClient()
    .from("store_sessions")
    .select("id, station_id, last_seen_at, stations!inner(code)")
    .eq("token_hash", tokenHash(token))
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (
    !data ||
    !matchesStationCode(
      (data.stations as unknown as { code: string }).code,
      stationCode
    )
  )
    redirect(`/store/${stationCode}/login`);
  if (shouldTouchSession(data.last_seen_at))
    await createSupabaseAdminClient()
      .from("store_sessions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", data.id);
  return { stationId: data.station_id, sessionId: data.id };
}
