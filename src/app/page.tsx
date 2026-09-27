import { PublicPageTemplate } from "@/components/templates/page-template";
import { ui } from "@/config/content";
import { PageHeader } from "@/components/ui/page-header";

export default function Home() {
  return (
    <PublicPageTemplate className="landing">
        <PageHeader
          eyebrow={ui.home.eyebrow}
          title={ui.home.title}
          intro={ui.home.lead}
        />
    </PublicPageTemplate>
  );
}
