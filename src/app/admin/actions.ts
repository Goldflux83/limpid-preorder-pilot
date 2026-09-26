"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { revokeStoreSessions } from "@/modules/store/admin";

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
