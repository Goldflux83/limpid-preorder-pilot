import { Footer, PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { demoParticipant } from "@/config/demo";
import { QrCode } from "@/components/qr-code";
import { getStations } from "@/modules/catalog/server";

export default async function ParticipantPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; const participant = { ...demoParticipant, code: code.toUpperCase() }; const stations = await getStations(); const remaining = participant.maxRedemptions - participant.redemptions;
  return <PilotShell><main className="page"><p className="eyebrow">{ui.participant.eyebrow}</p><h1>{ui.participant.greeting} {participant.firstName}</h1><div className="status-row"><strong>{participant.variant} · {ui.participant.card}</strong><span className="status">{ui.participant.statuses[participant.status]}</span></div><p className="muted">{ui.participant.validUntil}</p><section><h2>{ui.participant.redemption}</h2><p>{ui.participant.remainingBefore} <strong>{remaining} {ui.participant.remainingBetween} {participant.maxRedemptions}</strong> {ui.participant.remainingAfter}</p><label>{ui.participant.station}<select defaultValue=""><option value="" disabled>{ui.participant.chooseStation}</option>{stations.map((station) => <option key={station.id}>{station.name}</option>)}</select></label>{!stations.length && <p className="hint">{ui.catalog.noStations}</p>}<button>{ui.participant.register}</button></section><section><h2>{ui.participant.cardTitle}</h2><p className="participant-code">{participant.code}</p><QrCode value={`/k/${participant.code}`} alt={ui.participant.qrAlt} /></section></main><Footer /></PilotShell>;
}
