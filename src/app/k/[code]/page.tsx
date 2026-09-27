import { notFound } from "next/navigation";
import { PublicPageTemplate } from "@/components/templates/page-template";
import { ui } from "@/config/content";
import { QrCode } from "@/components/qr-code";
import { getStations } from "@/modules/catalog/server";
import { normalizeParticipantCode } from "@/modules/participants/policy";
import { getActiveParticipantByCode, getParticipantRedemptionCount } from "@/modules/participants/server";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { registerRedemption } from "./actions";

export const dynamic = "force-dynamic";

export default async function ParticipantPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { code: rawCode } = await params;
  const code = normalizeParticipantCode(rawCode);
  const participant = await getActiveParticipantByCode(code);
  if (!participant) notFound();
  const [{ status }, stations, redemptionCount] = await Promise.all([
    searchParams,
    getStations(),
    getParticipantRedemptionCount(participant.id),
  ]);
  const remaining = Math.max(0, 10 - redemptionCount);
  return (
    <PublicPageTemplate>
      <PageHeader eyebrow={ui.participant.eyebrow} title={`${ui.participant.greeting} ${participant.first_name}`} />
      <div className="status-row">
        <strong>{participant.variant} · {ui.participant.card}</strong>
        <StatusBadge>{ui.participant.statuses[participant.status]}</StatusBadge>
      </div>
      <p className="muted">{ui.participant.validUntil}</p>
      <Panel title={ui.participant.redemption}>
        <p>
          {ui.participant.remainingBefore} <strong>{remaining} {ui.participant.remainingBetween} 10</strong> {ui.participant.remainingAfter}
        </p>
        {status === "unavailable" && <p className="hint">{ui.participant.registrationUnavailable}</p>}
        <form action={registerRedemption}>
          <input type="hidden" name="code" value={code} />
          <FormField label={ui.participant.station}>
            <select name="stationId" defaultValue="" required>
              <option value="" disabled>{ui.participant.chooseStation}</option>
              {stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
            </select>
          </FormField>
          <FormField label={ui.participant.addOn}>
            <select name="addOn" defaultValue="nothing">
              {Object.entries(ui.participant.addOnOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </FormField>
          {!stations.length && <EmptyState>{ui.catalog.noStations}</EmptyState>}
          <button type="submit" disabled={!stations.length}>{ui.participant.register}</button>
        </form>
      </Panel>
      <Panel title={ui.participant.cardTitle}>
        <p className="participant-code">{code}</p>
        <QrCode value={`/k/${code}`} alt={ui.participant.qrAlt} />
      </Panel>
    </PublicPageTemplate>
  );
}
