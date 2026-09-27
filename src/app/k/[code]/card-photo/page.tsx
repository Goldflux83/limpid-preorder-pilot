import { notFound } from "next/navigation";
import { PublicPageTemplate } from "@/components/templates/page-template";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { FormField } from "@/components/ui/form-field";
import { ui } from "@/config/content";
import { normalizeParticipantCode } from "@/modules/participants/policy";
import { getActiveParticipantByCode } from "@/modules/participants/server";
import { isFeatureEnabled } from "@/modules/settings/features";
import { submitCardPhoto } from "./actions";

export const dynamic = "force-dynamic";

export default async function CardPhotoPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ status?: string }> }) {
  const { code: rawCode } = await params;
  const { status } = await searchParams;
  const code = normalizeParticipantCode(rawCode);
  const [participant, enabled] = await Promise.all([getActiveParticipantByCode(code), isFeatureEnabled("card_photos")]);
  if (!participant || !enabled) notFound();
  return <PublicPageTemplate><PageHeader eyebrow={ui.cardPhoto.eyebrow} title={ui.cardPhoto.title} intro={ui.cardPhoto.intro} /><Panel title={ui.cardPhoto.title}>{status === "success" && <p className="hint">{ui.cardPhoto.success}</p>}{status === "unavailable" && <p className="hint">{ui.cardPhoto.unavailable}</p>}<form action={submitCardPhoto}><input type="hidden" name="code" value={code} /><FormField label={ui.cardPhoto.file}><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required /></FormField><button type="submit">{ui.cardPhoto.submit}</button></form></Panel></PublicPageTemplate>;
}
