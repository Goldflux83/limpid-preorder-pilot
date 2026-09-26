import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const cookieName = "pilot_store_session";
const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function openStoreSession(stationCode: string, pin: string) {
  const token = randomBytes(32).toString("base64url");
  const admin = createSupabaseAdminClient();
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
    .select("station_id, stations!inner(code)")
    .eq("token_hash", tokenHash(token))
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (
    !data ||
    (data.stations as unknown as { code: string }).code !==
      stationCode.toUpperCase()
  )
    redirect(`/store/${stationCode}/login`);
  return data.station_id;
}
