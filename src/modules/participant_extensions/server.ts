import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { canUploadCardPhoto, stampCardProgress } from "./policy";

export async function getWeeklyQuestionUrl() {
  const { data } = await createSupabaseAdminClient().from("pilot_integrations").select("weekly_question_url").eq("singleton", true).maybeSingle();
  return data?.weekly_question_url ?? null;
}

export async function getWeeklyQuestionStatus(participantId: string, weekNumber: number) {
  const { data } = await createSupabaseAdminClient().from("weekly_question_statuses").select("completed_at").eq("participant_id", participantId).eq("week_number", weekNumber).maybeSingle();
  return Boolean(data?.completed_at);
}

export async function markWeeklyQuestionComplete(participantId: string, weekNumber: number) {
  const { data, error } = await createSupabaseAdminClient().rpc("mark_weekly_question_complete", { p_participant_id: participantId, p_week_number: weekNumber });
  return !error && data === true;
}

export async function getDigitalStampState(participantId: string) {
  const admin = createSupabaseAdminClient();
  const [{ count }, { data: voucher }] = await Promise.all([
    admin.from("redemptions").select("id", { count: "exact", head: true }).eq("participant_id", participantId).eq("source", "digital_stamp"),
    admin.from("vouchers").select("code,valid_until").eq("participant_id", participantId).eq("kind", "digital_stamp_reward").is("redeemed_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return { stampCount: count ?? 0, progress: stampCardProgress(count ?? 0), voucher: voucher ?? null };
}

export async function recordDigitalStamp(participantId: string, stationId: string) {
  const { data, error } = await createSupabaseAdminClient().rpc("record_digital_stamp", { p_participant_id: participantId, p_station_id: stationId });
  return !error && Array.isArray(data) ? data[0] : null;
}

export async function uploadCardPhoto(participantId: string, file: File) {
  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin.from("card_photos").select("id", { count: "exact", head: true }).eq("participant_id", participantId).gte("uploaded_at", since);
  if (!canUploadCardPhoto(count ?? 0)) return false;
  const extension = file.type.split("/")[1];
  const objectPath = `${participantId}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await admin.storage.from("card-photos").upload(objectPath, file, { contentType: file.type, upsert: false });
  if (uploadError) return false;
  const { error } = await admin.from("card_photos").insert({ participant_id: participantId, object_path: objectPath });
  if (error) await admin.storage.from("card-photos").remove([objectPath]);
  if (!error) await admin.from("events").insert({ type: "card_photo_uploaded", participant_id: participantId, actor_type: "participant" });
  return !error;
}
