import { redirect } from "next/navigation";
import { PublicPageTemplate } from "@/components/templates/page-template";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ui } from "@/config/content";
import { getVoucherForDisplay } from "@/modules/waitlist/server";

export default async function VoucherPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const voucher = await getVoucherForDisplay(code);
  if (!voucher) redirect("/signup");
  return <PublicPageTemplate><PageHeader eyebrow={ui.voucher.eyebrow} title={ui.voucher.title} intro={ui.voucher.intro} /><Panel title={ui.voucher.cardTitle}><p className="participant-code">{voucher.code}</p><p>{ui.voucher.station}: {voucher.stationName}</p><p>{ui.voucher.validUntil}: {voucher.validUntil ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "long", timeZone: "Europe/Amsterdam" }).format(new Date(`${voucher.validUntil}T12:00:00Z`)) : ui.voucher.noExpiry}</p><p>{ui.voucher.instructions}</p></Panel></PublicPageTemplate>;
}
