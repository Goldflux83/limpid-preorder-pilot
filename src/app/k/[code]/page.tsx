import { notFound } from "next/navigation";
import Link from "next/link";
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
import { answerDailyQuestion, registerRedemption } from "./actions";
import { getDailyQuestionAnswered } from "@/modules/daily_questions/server";
import { getFeatureFlags } from "@/modules/settings/features";
import { getLatestParticipantOrder } from "@/modules/orders/server";
import { currentIsoWeek } from "@/modules/participant_extensions/policy";
import { getWeeklyQuestionStatus, getWeeklyQuestionUrl } from "@/modules/participant_extensions/server";
import { participantPageUrl } from "@/lib/app_url";

export const dynamic = "force-dynamic";

export default async function ParticipantPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ status?: string; daily?: string }>;
}) {
  const { code: rawCode } = await params;
  const code = normalizeParticipantCode(rawCode);
  const participant = await getActiveParticipantByCode(code);
  if (!participant) notFound();
  const week = currentIsoWeek();
  const [{ status, daily }, stations, redemptionCount, features, latestOrder, weeklyQuestionUrl, weeklyQuestionComplete, dailyAnswered] = await Promise.all([
    searchParams,
    getStations(),
    getParticipantRedemptionCount(participant.id),
    getFeatureFlags(),
    getLatestParticipantOrder(participant.id),
    getWeeklyQuestionUrl(),
    getWeeklyQuestionStatus(participant.id, week),
    getDailyQuestionAnswered(participant.id),
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
      <Panel title={ui.participant.today}>
        {dailyAnswered || daily === "answered" ? <p className="hint">{ui.participant.answered}</p> : <form action={answerDailyQuestion}>
          <input type="hidden" name="code" value={code} />
          <p>{ui.participant.question}</p>
          <FormField label={ui.participant.question}>
            <select name="collected" defaultValue="" required>
              <option value="" disabled>{ui.participant.question}</option>
              <option value="yes">{ui.participant.yes}</option>
              <option value="no">{ui.participant.no}</option>
            </select>
          </FormField>
          <FormField label={ui.participant.station}>
            <select name="stationId" defaultValue="">
              <option value="">{ui.participant.chooseStation}</option>
              {stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
            </select>
          </FormField>
          <FormField label={ui.participant.addOn}>
            <select name="addOn" defaultValue="">
              <option value="">{ui.participant.addOn}</option>
              {Object.entries(ui.participant.addOnOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </FormField>
          <FormField label={ui.participant.feeling}>
            <select name="feeling" defaultValue="">
              <option value="">{ui.participant.feeling}</option>
              {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </FormField>
          {daily === "unavailable" && <p className="hint">{ui.participant.questionUnavailable}</p>}
          <button type="submit">{ui.participant.answer}</button>
        </form>}
        <p className="muted">{ui.participant.reset}</p>
      </Panel>
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
      <Panel title={ui.participant.week}>
        <p>{ui.participant.weekIntro}</p>
        {weeklyQuestionComplete ? <p className="hint">{ui.participant.weekComplete}</p> : weeklyQuestionUrl ? <Link className="button-link" href={`/w/${code}/${week}`}>{ui.participant.weekLink}</Link> : <p className="hint">{ui.participant.weekUnavailable}</p>}
      </Panel>
      {features.ordering && participant.can_preorder && <Panel title={ui.participant.preorder}>
        {latestOrder?.status === "received" && <p>{latestOrder.number}</p>}
        <Link className="button-link" href={`/k/${code}/order`}>{ui.participant.preorderLink}</Link>
      </Panel>}
      {features.digital_stamps && <Panel title={ui.participant.cardTitle}><Link className="button-link" href={`/k/${code}/stamps`}>{ui.participant.stampLink}</Link></Panel>}
      {features.card_photos && <Panel title={ui.participant.cardTitle}><Link className="button-link" href={`/k/${code}/card-photo`}>{ui.participant.cardPhotoLink}</Link></Panel>}
      <Panel title={ui.participant.cardTitle}>
        <p className="participant-code">{code}</p>
        <QrCode value={participantPageUrl(code)} alt={ui.participant.qrAlt} />
      </Panel>
    </PublicPageTemplate>
  );
}
