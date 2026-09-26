import { PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { getStations } from "@/modules/catalog/server";
export default async function StorePage({ params }: { params: Promise<{ station: string }> }) { const { station: code } = await params; const stations = await getStations(); const station = stations.find((item) => item.code === code.toUpperCase()); return <PilotShell><main className="store-screen"><div className="store-top"><p>{station?.name ?? code}</p><span className="connection"><i /> {ui.store.connected}</span></div><div className="empty-ticket"><h1>{ui.store.empty}</h1><p>{ui.store.emptyHint}</p></div><button className="pause-button">{ui.store.pause}</button></main></PilotShell>; }
