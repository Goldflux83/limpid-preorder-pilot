import { createHash } from "crypto";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSignupAttemptAllowed, isValidBooleanChoice, isValidEmail, normalizeEmail } from "./policy";

export type WaitlistInput = { email: string; station: string; poster: string; frequency: string; when: string; price: string; priceOther: string; formats: string[]; wantsToJoin: string; consent: string; honeypot: string };

export async function createWaitlistSignup(input: WaitlistInput) {
  if (input.honeypot || !isValidEmail(input.email) || !input.station || input.consent !== "yes" || !isValidBooleanChoice(input.wantsToJoin)) return { result: "invalid" as const };
  const requestHeaders = await headers();
  const address = requestHeaders.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const fingerprint = createHash("sha256").update(`${process.env.WAITLIST_RATE_LIMIT_SALT ?? "local"}:${address}`).digest("hex");
  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin.from("waitlist_attempts").select("id", { count: "exact", head: true }).eq("fingerprint_hash", fingerprint).gt("attempted_at", since);
  if (!isSignupAttemptAllowed(count ?? 0)) return { result: "rate_limited" as const };
  await admin.from("waitlist_attempts").insert({ fingerprint_hash: fingerprint });
  const answers = { desired_time: input.when.trim(), price_willingness: input.price, price_other: input.priceOther.trim(), preferred_formats: input.formats };
  const { data, error } = await admin.rpc("create_waitlist_signup", { p_email: normalizeEmail(input.email), p_station_code: input.station.toUpperCase(), p_poster: input.poster, p_travel_frequency: input.frequency, p_answers: answers, p_wants_to_join: input.wantsToJoin === "yes" });
  if (error) return { result: "invalid" as const };
  const row = Array.isArray(data) ? data[0] : data;
  return row?.result === "created" ? { result: "created" as const, voucherCode: row.voucher_code as string } : { result: "duplicate" as const };
}

export async function getVoucherForDisplay(code: string) {
  const { data } = await createSupabaseAdminClient().from("vouchers").select("code,valid_until,redeemed_at,stations!inner(code,name)").eq("code", code.toUpperCase()).eq("kind", "waitlist_reward").maybeSingle();
  if (!data || data.redeemed_at || (data.valid_until && data.valid_until < new Date().toISOString().slice(0, 10))) return null;
  const station = Array.isArray(data.stations) ? data.stations[0] : data.stations;
  return { code: data.code, validUntil: data.valid_until, stationName: (station as { name: string }).name };
}
