import { createHash, randomBytes } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ExportDataset, generateParticipantCode, parseProductOptions } from "./policy";

export type AdminParticipant = {
  id: string; first_name: string; cohort: string; variant: string; station_id: string | null;
  origin: string | null; channel: string | null; status: "active" | "paused" | "blocked";
  can_preorder: boolean; blocked_reason: string | null; notes: string | null; created_at: string;
  active_code: { code: string }[];
};
export type AdminProduct = { id: string; station_id: string; name: string; options: string[]; active: boolean; position: number };

export async function getAdminParticipants() {
  const { data } = await createSupabaseAdminClient()
    .from("participants")
    .select("id,first_name,cohort,variant,station_id,origin,channel,status,can_preorder,blocked_reason,notes,created_at,active_code:participant_codes!left(code)")
    .eq("participant_codes.status", "active")
    .order("created_at", { ascending: false });
  return (data ?? []) as AdminParticipant[];
}

export async function getAdminProducts() {
  const { data } = await createSupabaseAdminClient().from("products").select("id,station_id,name,options,active,position").order("position");
  return (data ?? []) as AdminProduct[];
}

export async function createParticipant(input: {
  firstName: string; cohort: string; variant: string; stationId: string | null; origin: string | null; channel: string | null; canPreorder: boolean; adminId: string;
}) {
  const admin = createSupabaseAdminClient();
  const { data: participant, error } = await admin.from("participants").insert({
    first_name: input.firstName.trim(), cohort: input.cohort.trim(), variant: input.variant.trim(), station_id: input.stationId,
    origin: input.origin, channel: input.channel, can_preorder: input.canPreorder,
  }).select("id").single();
  if (error || !participant) return false;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error: codeError } = await admin.from("participant_codes").insert({ participant_id: participant.id, code: generateParticipantCode(), issued_by_admin_id: input.adminId });
    if (!codeError) {
      await admin.from("events").insert({ type: "participant_created", participant_id: participant.id, actor_type: "admin", actor_id: input.adminId });
      return true;
    }
  }
  return false;
}

export async function updateParticipant(input: {
  id: string; firstName: string; cohort: string; variant: string; stationId: string | null; origin: string | null; channel: string | null; status: string; canPreorder: boolean; blockedReason: string | null; notes: string | null; adminId: string;
}) {
  if (input.status !== "active" && input.status !== "paused" && input.status !== "blocked") return false;
  const { error } = await createSupabaseAdminClient().from("participants").update({
    first_name: input.firstName.trim(), cohort: input.cohort.trim(), variant: input.variant.trim(), station_id: input.stationId,
    origin: input.origin, channel: input.channel, status: input.status, can_preorder: input.canPreorder,
    blocked_reason: input.blockedReason, notes: input.notes,
  }).eq("id", input.id);
  if (error) return false;
  await createSupabaseAdminClient().from("events").insert({ type: "participant_updated", participant_id: input.id, actor_type: "admin", actor_id: input.adminId, data: { status: input.status } });
  return true;
}

export async function rotateParticipantCode(participantId: string, adminId: string) {
  const admin = createSupabaseAdminClient();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await admin.rpc("rotate_participant_code", { p_participant_id: participantId, p_code: generateParticipantCode(), p_admin_id: adminId });
    if (!error) {
      return true;
    }
  }
  return false;
}

export async function createProduct(input: { stationId: string; name: string; options: string; position: number; adminId: string }) {
  const { error } = await createSupabaseAdminClient().from("products").insert({ station_id: input.stationId, name: input.name.trim(), options: parseProductOptions(input.options), position: input.position, active: true });
  if (!error) await createSupabaseAdminClient().from("events").insert({ type: "product_created", station_id: input.stationId, actor_type: "admin", actor_id: input.adminId });
  return !error;
}

export async function updateProduct(input: { id: string; stationId: string; name: string; options: string; position: number; active: boolean; adminId: string }) {
  const { error } = await createSupabaseAdminClient().from("products").update({ station_id: input.stationId, name: input.name.trim(), options: parseProductOptions(input.options), position: input.position, active: input.active }).eq("id", input.id);
  if (!error) await createSupabaseAdminClient().from("events").insert({ type: "product_updated", station_id: input.stationId, actor_type: "admin", actor_id: input.adminId });
  return !error;
}

export async function createExportToken(dataset: ExportDataset, adminId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { error } = await createSupabaseAdminClient().from("export_tokens").insert({ table_name: dataset, token_hash: tokenHash });
  if (error) return null;
  await createSupabaseAdminClient().from("events").insert({ type: "export_token_created", actor_type: "admin", actor_id: adminId, data: { dataset } });
  return token;
}

export async function revokeExportToken(id: string, adminId: string) {
  const { data, error } = await createSupabaseAdminClient().from("export_tokens").update({ active: false }).eq("id", id).eq("active", true).select("table_name").maybeSingle();
  if (error || !data) return false;
  await createSupabaseAdminClient().from("events").insert({ type: "export_token_revoked", actor_type: "admin", actor_id: adminId, data: { dataset: data.table_name } });
  return true;
}

export async function getExportTokens() {
  const { data } = await createSupabaseAdminClient().from("export_tokens").select("id,table_name,active,created_at").order("created_at", { ascending: false });
  return data ?? [];
}

export async function getRetentionSettings() {
  const { data } = await createSupabaseAdminClient().from("pilot_retention_settings").select("personal_data_retention_until").eq("singleton", true).maybeSingle();
  return data?.personal_data_retention_until ?? "2027-03-31";
}

export async function setRetentionUntil(value: string, adminId: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const { error } = await createSupabaseAdminClient().from("pilot_retention_settings").update({ personal_data_retention_until: value, updated_at: new Date().toISOString() }).eq("singleton", true);
  if (error) return false;
  await createSupabaseAdminClient().from("events").insert({ type: "personal_data_retention_updated", actor_type: "admin", actor_id: adminId, data: { retention_until: value } });
  return true;
}

export async function anonymizePilotPersonalData(adminId: string) {
  const admin = createSupabaseAdminClient();
  const retentionUntil = await getRetentionSettings();
  if (new Date(`${retentionUntil}T23:59:59.999Z`).getTime() > Date.now()) return false;
  const { data: photos } = await admin.from("card_photos").select("id,object_path");
  if (photos?.length) {
    const { error: storageError } = await admin.storage.from("card-photos").remove(photos.map((photo) => photo.object_path));
    if (storageError) return false;
    const { error: recordError } = await admin.from("card_photos").delete().in("id", photos.map((photo) => photo.id));
    if (recordError) return false;
  }
  const { data, error } = await admin.rpc("anonymize_pilot_personal_data", { p_admin_id: adminId });
  return !error && Boolean(data);
}

export type AdminWaitlistEntry = { id: string; email: string | null; station_id: string | null; poster: string | null; travel_frequency: string | null; wants_to_join: boolean; created_at: string };

export async function getAdminWaitlistEntries() {
  const { data } = await createSupabaseAdminClient().from("waitlist_entries").select("id,email,station_id,poster,travel_frequency,wants_to_join,created_at").is("converted_participant_id", null).order("created_at", { ascending: false });
  return (data ?? []) as AdminWaitlistEntry[];
}

export async function convertWaitlistEntry(input: { waitlistId: string; firstName: string; cohort: string; variant: string; canPreorder: boolean; adminId: string }) {
  const { data, error } = await createSupabaseAdminClient().rpc("convert_waitlist_entry", {
    p_waitlist_id: input.waitlistId, p_first_name: input.firstName.trim(), p_cohort: input.cohort.trim(), p_variant: input.variant.trim(),
    p_can_preorder: input.canPreorder, p_code: generateParticipantCode(), p_admin_id: input.adminId,
  });
  return !error && Boolean(data);
}

export async function setWeeklyQuestionUrl(value: string, adminId: string) {
  const weeklyQuestionUrl = value.trim() || null;
  if (weeklyQuestionUrl) {
    try { new URL(weeklyQuestionUrl); } catch { return false; }
  }
  const { error } = await createSupabaseAdminClient().from("pilot_integrations").update({ weekly_question_url: weeklyQuestionUrl, updated_at: new Date().toISOString() }).eq("singleton", true);
  if (error) return false;
  await createSupabaseAdminClient().from("events").insert({ type: "weekly_question_url_updated", actor_type: "admin", actor_id: adminId });
  return true;
}
