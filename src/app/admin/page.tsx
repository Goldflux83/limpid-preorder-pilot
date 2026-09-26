import { Footer, PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { getStations } from "@/modules/catalog/server";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { requireAdmin } from "@/modules/auth/admin";
import { getStoreSessionSummaries } from "@/modules/store/admin";
import { revokeStationSessions, rotateStationPinAction } from "./actions";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  await requireAdmin();
  const [stations, sessionSummaries] = await Promise.all([
    getStations(),
    getStoreSessionSummaries(),
  ]);
  return (
    <PilotShell>
      <main className="page">
        <PageHeader
          eyebrow={ui.admin.eyebrow}
          title={ui.admin.title}
          intro={ui.admin.intro}
        />
        {ui.admin.sections.map((section) => (
          <Panel key={section} title={section}>
            <p>{ui.admin.ready}</p>
          </Panel>
        ))}

        <Panel title={ui.admin.stations}>
          {stations.map((station) => (
            <div className="list-item" key={station.id}>
              <strong>
                {station.code} · {station.name}
              </strong>
            </div>
          ))}
          {!stations.length && <EmptyState>{ui.catalog.noStations}</EmptyState>}
        </Panel>

        <Panel title={ui.adminSessions.title}>
          {stations.map((station) => {
            const summary = sessionSummaries[station.id];
            return (
              <form action={revokeStationSessions} key={station.id}>
                <input type="hidden" name="stationId" value={station.id} />
                <div className="list-item">
                  <strong>
                    {station.code} · {station.name}
                  </strong>
                  <span>
                    {ui.adminSessions.active}: {summary?.activeCount ?? 0}
                  </span>
                  <span>
                    {ui.adminSessions.lastSeen}:{" "}
                    {summary?.lastSeenAt
                      ? new Intl.DateTimeFormat("nl-NL", {
                          dateStyle: "short",
                          timeStyle: "short",
                          timeZone: "Europe/Amsterdam",
                        }).format(new Date(summary.lastSeenAt))
                      : ui.adminSessions.none}
                  </span>
                </div>
                <label>
                  {ui.adminSessions.confirmation}
                  <input name="confirmation" autoComplete="off" />
                </label>
                <button type="submit">{ui.adminSessions.submit}</button>
              </form>
            );
          })}
          {!stations.length && <EmptyState>{ui.catalog.noStations}</EmptyState>}
        </Panel>
        <Panel title={ui.adminSessions.pinTitle}>
          {stations.map((station) => (
            <form action={rotateStationPinAction} key={station.id}>
              <input type="hidden" name="stationId" value={station.id} />
              <strong>{station.code} · {station.name}</strong>
              <label>{ui.adminSessions.pin}<input name="pin" inputMode="numeric" pattern="[0-9]{4}" required /></label>
              <label>{ui.adminSessions.pinConfirmation}<input name="pinConfirmation" inputMode="numeric" pattern="[0-9]{4}" required /></label>
              <button type="submit">{ui.adminSessions.pinSubmit}</button>
            </form>
          ))}
          {!stations.length && <EmptyState>{ui.catalog.noStations}</EmptyState>}
        </Panel>
      </main>
      <Footer />
    </PilotShell>
  );
}
