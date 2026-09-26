"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { revokeStoreSessions, rotateStationPin } from "@/modules/store/admin";
import { isValidStationPin } from "@/modules/store/policy";

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
  revalidatePath("/admin");
}
