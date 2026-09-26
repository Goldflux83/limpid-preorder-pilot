import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type StoreSessionSummary = {
  activeCount: number;
  lastSeenAt: string | null;
};

export async function getStoreSessionSummaries() {
  const { data } = await createSupabaseAdminClient()
    .from("store_sessions")
    .select("station_id,last_seen_at")
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString());
  return (data ?? []).reduce<Record<string, StoreSessionSummary>>(
    (summaries, session) => {
      const current = summaries[session.station_id] ?? {
        activeCount: 0,
        lastSeenAt: null,
      };
      current.activeCount += 1;
      if (!current.lastSeenAt || session.last_seen_at > current.lastSeenAt)
        current.lastSeenAt = session.last_seen_at;
      summaries[session.station_id] = current;
      return summaries;
    },
    {}
  );
}

export async function revokeStoreSessions(stationId: string, adminId: string) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("store_sessions")
    .update({
      revoked_at: now,
      revoked_by_admin_id: adminId,
      revoked_reason: "admin_revocation",
    })
    .eq("station_id", stationId)
    .is("revoked_at", null)
    .gt("expires_at", now)
    .select("id");
  if (error) throw error;
  await admin
    .from("events")
    .insert({
      type: "store_sessions_revoked",
      station_id: stationId,
      actor_type: "admin",
      actor_id: adminId,
      data: { count: data.length, reason: "admin_revocation" },
    });
  return data.length;
}
