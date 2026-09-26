import { PublicPageTemplate } from "@/components/templates/page-template";
import { ui } from "@/config/content";
import { PageHeader } from "@/components/ui/page-header";
export default function PrivacyPage() {
  return (
    <PublicPageTemplate className="page prose">
        <PageHeader eyebrow={ui.privacy.eyebrow} title={ui.privacy.title} />
        <p>{ui.privacy.body}</p>
        <p>{ui.privacy.retention}</p>
    </PublicPageTemplate>
  );
}
