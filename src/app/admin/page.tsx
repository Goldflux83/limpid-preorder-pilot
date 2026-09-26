import { Footer, PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { getStations } from "@/modules/catalog/server";
export default async function AdminPage() { const stations = await getStations(); return <PilotShell><main className="page"><p className="eyebrow">{ui.admin.eyebrow}</p><h1>{ui.admin.title}</h1><p>{ui.admin.intro}</p><div className="admin-grid">{ui.admin.sections.map((section) => <section key={section}><h2>{section}</h2><p>{ui.admin.ready}</p></section>)}</div><section><h2>{ui.admin.stations}</h2>{stations.map((station) => <div className="list-item" key={station.id}><strong>{station.code} · {station.name}</strong></div>)}{!stations.length && <p>{ui.catalog.noStations}</p>}</section></main><Footer /></PilotShell>; }
