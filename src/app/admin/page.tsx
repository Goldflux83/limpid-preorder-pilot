import { Footer, PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { getStations } from "@/modules/catalog/server";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { requireAdmin } from "@/modules/auth/admin";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  await requireAdmin();
  const stations = await getStations();
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
      </main>
      <Footer />
    </PilotShell>
  );
}
