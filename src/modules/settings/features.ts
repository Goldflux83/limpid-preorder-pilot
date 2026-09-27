import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { defaultFeatureFlags, isFeatureKey } from "./policy";
export { featureKeys, isFeatureKey, isManageableFeatureKey, manageableFeatureKeys } from "./policy";
export type { FeatureFlags, FeatureKey } from "./policy";

import type { FeatureFlags, FeatureKey } from "./policy";
export async function getFeatureFlags(): Promise<FeatureFlags> {
  const { data } = await createSupabaseAdminClient().from("pilot_feature_flags").select("key,enabled");
  return (data ?? []).reduce<FeatureFlags>((flags, row) => isFeatureKey(row.key) ? { ...flags, [row.key]: row.enabled } : flags, defaultFeatureFlags);
}
export async function isFeatureEnabled(key: FeatureKey) { return (await getFeatureFlags())[key]; }
export async function setFeatureFlag(key: FeatureKey, enabled: boolean, adminId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("pilot_feature_flags").update({ enabled, updated_at: new Date().toISOString() }).eq("key", key);
  if (error) throw error;
  await admin.from("events").insert({ type: "pilot_feature_updated", actor_type: "admin", actor_id: adminId, data: { key, enabled } });
}
