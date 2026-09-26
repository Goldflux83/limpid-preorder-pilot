import Link from "next/link";
import { Footer, PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { demoParticipant } from "@/config/demo";
import { featureFlags } from "@/lib/theme";
import { QrCode } from "@/components/qr-code";

export default async function ParticipantPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const participant = { ...demoParticipant, code: code.toUpperCase() };
  const remaining = participant.maxRedemptions - participant.redemptions;
  return <PilotShell><main className="page"><p className="eyebrow">{ui.participant.eyebrow}</p><h1>{ui.participant.greeting} {participant.firstName}</h1><div className="status-row"><strong>{participant.variant} · {ui.participant.card}</strong><span className="status">{ui.participant.statuses[participant.status]}</span></div><p className="muted">{ui.participant.validUntil}</p><section><h2>{ui.participant.today}</h2><p>{ui.participant.question}</p><div className="choice-row"><button>{ui.participant.yes}</button><button className="secondary">{ui.participant.no}</button></div><p className="hint">{ui.participant.reset}</p></section><section><h2>{ui.participant.redemption}</h2><p>{ui.participant.remainingBefore} <strong>{remaining} {ui.participant.remainingBetween} {participant.maxRedemptions}</strong> {ui.participant.remainingAfter}</p><label>{ui.participant.station}<select defaultValue=""><option value="" disabled>{ui.participant.chooseStation}</option>{ui.stations.map((station) => <option key={station.code}>{station.name}</option>)}</select></label><button>{ui.participant.register}</button></section><section><h2>{ui.participant.week}</h2><p>{ui.participant.weekIntro}</p><Link className="button-link" href={`/weekly/${participant.code}/1`}>{ui.participant.weekLink}</Link></section>{featureFlags.ordering && <section><h2>{ui.participant.preorder}</h2><p>{ui.participant.noOpenOrder}</p><Link className="button-link" href={`/participant/${participant.code}/order`}>{ui.participant.preorderLink}</Link></section>}<section><h2>{ui.participant.cardTitle}</h2><p className="participant-code">{participant.code}</p><QrCode value={`/participant/${participant.code}`} alt={ui.participant.qrAlt} /><p className="hint">{ui.participant.cardHint}</p>{featureFlags.digitalStampCard && <Link href={`/participant/${participant.code}/stamps`}>{ui.participant.stampLink}</Link>}</section></main><Footer /></PilotShell>;
}
