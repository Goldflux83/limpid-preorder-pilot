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
