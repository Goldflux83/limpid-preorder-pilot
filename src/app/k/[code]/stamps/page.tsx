import { notFound } from "next/navigation";
import { PublicPageTemplate } from "@/components/templates/page-template";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { FormField } from "@/components/ui/form-field";
import { ui } from "@/config/content";
import { getStations } from "@/modules/catalog/server";
import { getDigitalStampState } from "@/modules/participant_extensions/server";
import { normalizeParticipantCode } from "@/modules/participants/policy";
import { getActiveParticipantByCode } from "@/modules/participants/server";
import { isFeatureEnabled } from "@/modules/settings/features";
import { addDigitalStamp } from "./actions";

export const dynamic = "force-dynamic";

export default async function StampCardPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ status?: string }> }) {
  const { code: rawCode } = await params;
  const { status } = await searchParams;
  const code = normalizeParticipantCode(rawCode);
  const [participant, enabled, stations] = await Promise.all([getActiveParticipantByCode(code), isFeatureEnabled("digital_stamps"), getStations()]);
  if (!participant || !enabled) notFound();
  const state = await getDigitalStampState(participant.id);
  return <PublicPageTemplate>
    <PageHeader eyebrow={ui.stamps.eyebrow} title={ui.stamps.title} intro={ui.stamps.intro} />
    <Panel title={ui.stamps.title}><div className="stamp-grid">{Array.from({ length: 12 }, (_, index) => <span className={index < state.progress ? "stamp-filled" : "stamp-empty"} key={index} />)}</div></Panel>
    {state.voucher && <Panel title={ui.stamps.voucher}><p className="participant-code">{state.voucher.code}</p></Panel>}
    {status === "success" && <p className="hint">{ui.stamps.success}</p>}
    {status === "unavailable" && <p className="hint">{ui.stamps.unavailable}</p>}
    <form action={addDigitalStamp}><input type="hidden" name="code" value={code} /><FormField label={ui.stamps.station}><select name="stationId" required defaultValue=""><option value="" disabled>{ui.stamps.chooseStation}</option>{stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}</select></FormField><button type="submit">{ui.stamps.stamp}</button></form>
  </PublicPageTemplate>;
}
