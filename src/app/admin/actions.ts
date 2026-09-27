"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { revokeStoreSessions, rotateStationPin } from "@/modules/store/admin";
import { isValidStationPin } from "@/modules/store/policy";
import { isManageableFeatureKey, setFeatureFlag } from "@/modules/settings/features";
import { reportOperationalTelemetry } from "@/modules/telemetry/operational";
import { isExportDataset } from "@/modules/admin/policy";
import { anonymizePilotPersonalData, convertWaitlistEntry, createExportToken, createParticipant, createProduct, revokeExportToken, rotateParticipantCode, setRetentionUntil, setWeeklyQuestionUrl, updateParticipant, updateProduct } from "@/modules/admin/server";

const optional = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "").trim();
  return text || null;
};

function participantInput(formData: FormData, adminId: string) {
  return {
    id: String(formData.get("id") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    cohort: String(formData.get("cohort") ?? ""),
    variant: String(formData.get("variant") ?? ""),
    stationId: optional(formData.get("stationId")),
    origin: optional(formData.get("origin")),
    channel: optional(formData.get("channel")),
    status: String(formData.get("status") ?? "active"),
    canPreorder: formData.get("canPreorder") === "on",
    blockedReason: optional(formData.get("blockedReason")),
    notes: optional(formData.get("notes")),
    adminId,
  };
}

export async function revokeStationSessions(formData: FormData) {
  const admin = await requireAdmin();
  const stationId = String(formData.get("stationId"));
  const confirmation = String(formData.get("confirmation")).toUpperCase();
  const { data: station } = await createSupabaseAdminClient()
    .from("stations")
    .select("code")
    .eq("id", stationId)
    .maybeSingle();
  if (!station || confirmation !== station.code) return;
  await revokeStoreSessions(stationId, admin.id);
  void reportOperationalTelemetry({ type: "server_action", action: "store_sessions_revoked", outcome: "success" });
  revalidatePath("/admin");
}

export async function rotateStationPinAction(formData: FormData) {
  const admin = await requireAdmin();
  const stationId = String(formData.get("stationId"));
  const pin = String(formData.get("pin"));
  const confirmation = String(formData.get("pinConfirmation"));
  if (!isValidStationPin(pin) || pin !== confirmation) return;
  const { data: station } = await createSupabaseAdminClient().from("stations").select("id").eq("id", stationId).maybeSingle();
  if (!station) return;
  await rotateStationPin(stationId, admin.id, pin);
  void reportOperationalTelemetry({ type: "server_action", action: "station_pin_rotated", outcome: "success" });
  revalidatePath("/admin");
}

export async function updateFeatureFlag(formData: FormData) {
  const admin = await requireAdmin();
  const key = String(formData.get("key"));
  if (!isManageableFeatureKey(key)) return;
  await setFeatureFlag(key, formData.get("enabled") === "true", admin.id);
  void reportOperationalTelemetry({ type: "server_action", action: "pilot_feature_updated", outcome: "success" });
  revalidatePath("/admin");
  revalidatePath("/store");
  revalidatePath("/participant");
}

export async function createParticipantAction(formData: FormData) {
  const admin = await requireAdmin();
  const input = participantInput(formData, admin.id);
  if (!input.firstName || !input.cohort || !input.variant) return;
  await createParticipant(input);
  revalidatePath("/admin");
}

export async function updateParticipantAction(formData: FormData) {
  const admin = await requireAdmin();
  const input = participantInput(formData, admin.id);
  if (!input.id || !input.firstName || !input.cohort || !input.variant) return;
  await updateParticipant(input);
  revalidatePath("/admin");
}

export async function rotateParticipantCodeAction(formData: FormData) {
  const admin = await requireAdmin();
  const participantId = String(formData.get("participantId") ?? "");
  if (!participantId) return;
  await rotateParticipantCode(participantId, admin.id);
  revalidatePath("/admin");
}

export async function createProductAction(formData: FormData) {
  const admin = await requireAdmin();
  const stationId = String(formData.get("stationId") ?? "");
  const name = String(formData.get("name") ?? "");
  if (!stationId || !name.trim()) return;
  await createProduct({ stationId, name, options: String(formData.get("options") ?? ""), position: Number(formData.get("position") ?? 0), adminId: admin.id });
  revalidatePath("/admin");
}

export async function updateProductAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const stationId = String(formData.get("stationId") ?? "");
  const name = String(formData.get("name") ?? "");
  if (!id || !stationId || !name.trim()) return;
  await updateProduct({ id, stationId, name, options: String(formData.get("options") ?? ""), position: Number(formData.get("position") ?? 0), active: formData.get("active") === "on", adminId: admin.id });
  revalidatePath("/admin");
}

export async function createExportTokenAction(formData: FormData) {
  const admin = await requireAdmin();
  const dataset = String(formData.get("dataset") ?? "");
  if (!isExportDataset(dataset)) return null;
  const token = await createExportToken(dataset, admin.id);
  revalidatePath("/admin");
  return token ? `/export/${dataset}/${token}` : null;
}

export async function revokeExportTokenAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await revokeExportToken(id, admin.id);
  revalidatePath("/admin");
}

export async function setRetentionUntilAction(formData: FormData) {
  const admin = await requireAdmin();
  await setRetentionUntil(String(formData.get("retentionUntil") ?? ""), admin.id);
  revalidatePath("/admin");
}

export async function anonymizePilotPersonalDataAction(formData: FormData) {
  const admin = await requireAdmin();
  if (String(formData.get("confirmation") ?? "") !== "ANONIMISEREN") return;
  const anonymized = await anonymizePilotPersonalData(admin.id);
  void reportOperationalTelemetry({ type: "server_action", action: "personal_data_anonymized", outcome: anonymized ? "success" : "rejected" });
  revalidatePath("/admin");
}

export async function convertWaitlistEntryAction(formData: FormData) {
  const admin = await requireAdmin();
  const waitlistId = String(formData.get("waitlistId") ?? "");
  const firstName = String(formData.get("firstName") ?? "");
  const cohort = String(formData.get("cohort") ?? "");
  const variant = String(formData.get("variant") ?? "");
  if (!waitlistId || !firstName.trim() || !cohort.trim() || !variant.trim()) return;
  await convertWaitlistEntry({ waitlistId, firstName, cohort, variant, canPreorder: formData.get("canPreorder") === "on", adminId: admin.id });
  revalidatePath("/admin");
}

export async function setWeeklyQuestionUrlAction(formData: FormData) {
  const admin = await requireAdmin();
  await setWeeklyQuestionUrl(String(formData.get("weeklyQuestionUrl") ?? ""), admin.id);
  revalidatePath("/admin");
  revalidatePath("/k");
}
