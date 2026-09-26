"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { revokeStoreSessions, rotateStationPin } from "@/modules/store/admin";
import { isValidStationPin } from "@/modules/store/policy";
import { isFeatureKey, setFeatureFlag } from "@/modules/settings/features";
import { reportOperationalTelemetry } from "@/modules/telemetry/operational";

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
  if (!isFeatureKey(key)) return;
  await setFeatureFlag(key, formData.get("enabled") === "true", admin.id);
  void reportOperationalTelemetry({ type: "server_action", action: "pilot_feature_updated", outcome: "success" });
  revalidatePath("/admin");
  revalidatePath("/store");
  revalidatePath("/participant");
}
