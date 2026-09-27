import { createHash } from "crypto";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requiredRuntimeValue } from "@/lib/runtime-config";
import { isParticipantCode, isParticipantMutationAllowed, normalizeParticipantCode } from "./policy";

export type ParticipantView = {
  id: string;
  first_name: string;
  cohort: string;
  variant: string;
  status: "active" | "paused" | "blocked";
  can_preorder: boolean;
};

export async function getActiveParticipantByCode(rawCode: string) {
  const code = normalizeParticipantCode(rawCode);
  if (!isParticipantCode(code)) return null;
  const { data } = await createSupabaseAdminClient()
    .from("participant_codes")
    .select("participant:participants!inner(id,first_name,cohort,variant,status,can_preorder)")
    .eq("code", code)
    .eq("status", "active")
    .maybeSingle();
  const participant = data?.participant;
  const resolved = (Array.isArray(participant) ? participant[0] : participant) as ParticipantView | null;
  return resolved?.status === "active" ? resolved : null;
}

export async function getParticipantRedemptionCount(participantId: string) {
  const { count } = await createSupabaseAdminClient()
    .from("redemptions")
    .select("id", { count: "exact", head: true })
    .eq("participant_id", participantId);
  return count ?? 0;
}

export async function recordParticipantRedemption(participantId: string, stationId: string, addOn: string | null) {
  const validAddOn = addOn === "nothing" || addOn === "food" || addOn === "other" ? addOn : null;
  const { error } = await createSupabaseAdminClient().rpc("record_self_redemption", {
    p_participant_id: participantId,
    p_station_id: stationId,
    p_add_on: validAddOn,
  });
  return !error;
}

export async function isParticipantMutationAllowedForRequest(code: string) {
  const requestHeaders = await headers();
  const address = requestHeaders.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const fingerprint = createHash("sha256").update(`${requiredRuntimeValue("PARTICIPANT_RATE_LIMIT_SALT", "local")}:${address}:${code}`).digest("hex");
  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin.from("participant_action_attempts").select("id", { count: "exact", head: true }).eq("fingerprint_hash", fingerprint).gt("attempted_at", since);
  if (!isParticipantMutationAllowed(count ?? 0)) return false;
  await admin.from("participant_action_attempts").insert({ fingerprint_hash: fingerprint });
  return true;
}
