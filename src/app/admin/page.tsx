import { AdminPageTemplate } from "@/components/templates/page-template";
import { ui } from "@/config/content";
import { getStations } from "@/modules/catalog/server";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { requireAdmin } from "@/modules/auth/admin";
import { getStoreSessionSummaries } from "@/modules/store/admin";
import { getFeatureFlags, manageableFeatureKeys } from "@/modules/settings/features";
import { exportDatasets } from "@/modules/admin/policy";
import { getAdminParticipants, getAdminProducts, getAdminWaitlistEntries, getExportTokens, getRetentionSettings } from "@/modules/admin/server";
import { getWeeklyQuestionUrl } from "@/modules/participant_extensions/server";
import { ExportTokenForm } from "./export-token-form";
import { anonymizePilotPersonalDataAction, convertWaitlistEntryAction, createParticipantAction, createProductAction, revokeExportTokenAction, revokeStationSessions, rotateParticipantCodeAction, rotateStationPinAction, setRetentionUntilAction, setWeeklyQuestionUrlAction, updateFeatureFlag, updateParticipantAction, updateProductAction } from "./actions";

export const dynamic = "force-dynamic";

function StationOptions({ stations, value }: { stations: Awaited<ReturnType<typeof getStations>>; value?: string | null }) {
  return <select name="stationId" defaultValue={value ?? ""}><option value="" />{stations.map((station) => <option key={station.id} value={station.id}>{station.code} · {station.name}</option>)}</select>;
}

export default async function AdminPage() {
  await requireAdmin();
  const [stations, sessionSummaries, features, participants, products, tokens, retentionUntil, waitlist, weeklyQuestionUrl] = await Promise.all([getStations(), getStoreSessionSummaries(), getFeatureFlags(), getAdminParticipants(), getAdminProducts(), getExportTokens(), getRetentionSettings(), getAdminWaitlistEntries(), getWeeklyQuestionUrl()]);
  return <AdminPageTemplate>
    <PageHeader eyebrow={ui.admin.eyebrow} title={ui.admin.title} intro={ui.admin.intro} />
    <Panel title={ui.adminManagement.participants}>
      <form action={createParticipantAction}>
        <label>{ui.adminManagement.firstName}<input name="firstName" required /></label><label>{ui.adminManagement.cohort}<input name="cohort" required /></label><label>{ui.adminManagement.variant}<input name="variant" required /></label><label>{ui.adminManagement.station}<StationOptions stations={stations} /></label><label>{ui.adminManagement.origin}<input name="origin" /></label><label>{ui.adminManagement.channel}<input name="channel" /></label><label className="check"><input type="checkbox" name="canPreorder" /> {ui.adminManagement.canPreorder}</label><button type="submit">{ui.adminManagement.create}</button>
      </form>
      {participants.map((participant) => <div key={participant.id}><form action={updateParticipantAction}><input type="hidden" name="id" value={participant.id} /><p><strong>{ui.adminManagement.code}: {participant.active_code[0]?.code ?? ""}</strong></p><label>{ui.adminManagement.firstName}<input name="firstName" defaultValue={participant.first_name} required /></label><label>{ui.adminManagement.cohort}<input name="cohort" defaultValue={participant.cohort} required /></label><label>{ui.adminManagement.variant}<input name="variant" defaultValue={participant.variant} required /></label><label>{ui.adminManagement.station}<StationOptions stations={stations} value={participant.station_id} /></label><label>{ui.adminManagement.origin}<input name="origin" defaultValue={participant.origin ?? ""} /></label><label>{ui.adminManagement.channel}<input name="channel" defaultValue={participant.channel ?? ""} /></label><label>{ui.adminManagement.status}<select name="status" defaultValue={participant.status}>{Object.entries(ui.adminManagement.statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="check"><input type="checkbox" name="canPreorder" defaultChecked={participant.can_preorder} /> {ui.adminManagement.canPreorder}</label><label>{ui.adminManagement.blockedReason}<input name="blockedReason" defaultValue={participant.blocked_reason ?? ""} /></label><label>{ui.adminManagement.notes}<textarea name="notes" defaultValue={participant.notes ?? ""} /></label><button type="submit">{ui.adminManagement.save}</button></form><form action={rotateParticipantCodeAction}><input type="hidden" name="participantId" value={participant.id} /><button type="submit">{ui.adminManagement.rotateCode}</button></form></div>)}
      {!participants.length && <EmptyState>{ui.adminManagement.noParticipants}</EmptyState>}
    </Panel>
    <Panel title={ui.adminManagement.waitlist}>{waitlist.map((entry) => <form action={convertWaitlistEntryAction} key={entry.id}><input type="hidden" name="waitlistId" value={entry.id} /><p>{entry.email ?? ""}</p><label>{ui.adminManagement.firstName}<input name="firstName" required /></label><label>{ui.adminManagement.cohort}<input name="cohort" required /></label><label>{ui.adminManagement.variant}<input name="variant" required /></label><label className="check"><input type="checkbox" name="canPreorder" /> {ui.adminManagement.canPreorder}</label><button type="submit">{ui.adminManagement.convert}</button></form>)}{!waitlist.length && <EmptyState>{ui.adminManagement.noWaitlist}</EmptyState>}</Panel>
    <Panel title={ui.adminManagement.products}>
      <form action={createProductAction}><label>{ui.adminManagement.station}<StationOptions stations={stations} /></label><label>{ui.adminManagement.name}<input name="name" required /></label><label>{ui.adminManagement.options}<input name="options" /></label><label>{ui.adminManagement.position}<input name="position" type="number" defaultValue="0" required /></label><button type="submit">{ui.adminManagement.create}</button></form>
      {products.map((product) => <form action={updateProductAction} key={product.id}><input type="hidden" name="id" value={product.id} /><label>{ui.adminManagement.station}<StationOptions stations={stations} value={product.station_id} /></label><label>{ui.adminManagement.name}<input name="name" defaultValue={product.name} required /></label><label>{ui.adminManagement.options}<input name="options" defaultValue={product.options.join(", ")} /></label><label>{ui.adminManagement.position}<input name="position" type="number" defaultValue={product.position} required /></label><label className="check"><input type="checkbox" name="active" defaultChecked={product.active} /> {ui.adminManagement.active}</label><button type="submit">{ui.adminManagement.save}</button></form>)}
      {!products.length && <EmptyState>{ui.adminManagement.noProducts}</EmptyState>}
    </Panel>
    <Panel title={ui.adminManagement.qrSheets}><a className="button-link" href="/admin/qr-sheet">{ui.adminManagement.qrDownload}</a></Panel>
    <Panel title={ui.adminManagement.exports}><ExportTokenForm datasets={exportDatasets} />{tokens.map((token) => <form action={revokeExportTokenAction} key={token.id} className="list-item"><input type="hidden" name="id" value={token.id} /><span>{token.table_name}</span><span>{token.active ? ui.adminManagement.active : ""}</span>{token.active && <button type="submit">{ui.adminManagement.revoke}</button>}</form>)}{!tokens.length && <EmptyState>{ui.adminManagement.noTokens}</EmptyState>}</Panel>
    <Panel title={ui.adminManagement.privacy}>
      <form action={setRetentionUntilAction}><label>{ui.adminManagement.retentionUntil}<input type="date" name="retentionUntil" defaultValue={retentionUntil} required /></label><button type="submit">{ui.adminManagement.save}</button></form>
      <p className="hint">{ui.adminManagement.anonymizeWarning}</p>
      <form action={anonymizePilotPersonalDataAction}><label>{ui.adminManagement.anonymizeConfirmation}<input name="confirmation" autoComplete="off" required /></label><button type="submit">{ui.adminManagement.anonymize}</button></form>
    </Panel>
    <Panel title={ui.adminManagement.integrations}><form action={setWeeklyQuestionUrlAction}><label>{ui.adminManagement.weeklyQuestionUrl}<input type="url" name="weeklyQuestionUrl" defaultValue={weeklyQuestionUrl ?? ""} /></label><button type="submit">{ui.adminManagement.save}</button></form></Panel>
    <Panel title={ui.admin.stations}>{stations.map((station) => <div className="list-item" key={station.id}><strong>{station.code} · {station.name}</strong></div>)}{!stations.length && <EmptyState>{ui.catalog.noStations}</EmptyState>}</Panel>
    <Panel title={ui.adminSessions.title}>{stations.map((station) => { const summary = sessionSummaries[station.id]; return <form action={revokeStationSessions} key={station.id}><input type="hidden" name="stationId" value={station.id} /><div className="list-item"><strong>{station.code} · {station.name}</strong><span>{ui.adminSessions.active}: {summary?.activeCount ?? 0}</span><span>{ui.adminSessions.lastSeen}: {summary?.lastSeenAt ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Amsterdam" }).format(new Date(summary.lastSeenAt)) : ui.adminSessions.none}</span></div><label>{ui.adminSessions.confirmation}<input name="confirmation" autoComplete="off" /></label><button type="submit">{ui.adminSessions.submit}</button></form>; })}</Panel>
    <Panel title={ui.adminSessions.pinTitle}>{stations.map((station) => <form action={rotateStationPinAction} key={station.id}><input type="hidden" name="stationId" value={station.id} /><strong>{station.code} · {station.name}</strong><label>{ui.adminSessions.pin}<input name="pin" inputMode="numeric" pattern="[0-9]{4}" required /></label><label>{ui.adminSessions.pinConfirmation}<input name="pinConfirmation" inputMode="numeric" pattern="[0-9]{4}" required /></label><button type="submit">{ui.adminSessions.pinSubmit}</button></form>)}</Panel>
    <Panel title={ui.features.title}>{manageableFeatureKeys.map((key) => <form action={updateFeatureFlag} key={key} className="list-item"><input type="hidden" name="key" value={key} /><strong>{ui.features[key]}</strong><select name="enabled" defaultValue={String(features[key])}><option value="true">{ui.features.enabled}</option><option value="false">{ui.features.disabled}</option></select><button type="submit">{ui.features.save}</button></form>)}</Panel>
  </AdminPageTemplate>;
}
