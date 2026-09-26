import { Footer, PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { PageHeader } from "@/components/ui/page-header";
export default function PrivacyPage() {
  return (
    <PilotShell>
      <main className="page prose">
        <PageHeader eyebrow={ui.privacy.eyebrow} title={ui.privacy.title} />
        <p>{ui.privacy.body}</p>
        <p>{ui.privacy.retention}</p>
      </main>
      <Footer />
    </PilotShell>
  );
}
