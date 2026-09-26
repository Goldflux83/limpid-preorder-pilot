import { Footer, PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { demoParticipant } from "@/config/demo";
import { QrCode } from "@/components/qr-code";
import { getStations } from "@/modules/catalog/server";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function ParticipantPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const participant = { ...demoParticipant, code: code.toUpperCase() };
  const stations = await getStations();
  const remaining = participant.maxRedemptions - participant.redemptions;
  return (
    <PilotShell>
      <main className="page">
        <PageHeader
          eyebrow={ui.participant.eyebrow}
          title={`${ui.participant.greeting} ${participant.firstName}`}
        />
        <div className="status-row">
          <strong>
            {participant.variant} · {ui.participant.card}
          </strong>
          <StatusBadge>
            {ui.participant.statuses[participant.status]}
          </StatusBadge>
        </div>
        <p className="muted">{ui.participant.validUntil}</p>
        <Panel title={ui.participant.redemption}>
          <p>
            {ui.participant.remainingBefore}{" "}
            <strong>
              {remaining} {ui.participant.remainingBetween}{" "}
              {participant.maxRedemptions}
            </strong>{" "}
            {ui.participant.remainingAfter}
          </p>
          <FormField label={ui.participant.station}>
            <select defaultValue="">
              <option value="" disabled>
                {ui.participant.chooseStation}
              </option>
              {stations.map((station) => (
                <option key={station.id}>{station.name}</option>
              ))}
            </select>
          </FormField>
          {!stations.length && <EmptyState>{ui.catalog.noStations}</EmptyState>}
          <button>{ui.participant.register}</button>
        </Panel>
        <Panel title={ui.participant.cardTitle}>
          <p className="participant-code">{participant.code}</p>
          <QrCode value={`/k/${participant.code}`} alt={ui.participant.qrAlt} />
        </Panel>
      </main>
      <Footer />
    </PilotShell>
  );
}
