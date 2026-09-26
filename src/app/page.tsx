import Link from "next/link";
import { Footer, PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { PageHeader } from "@/components/ui/page-header";

export default function Home() {
  return (
    <PilotShell>
      <main className="landing">
        <PageHeader
          eyebrow={ui.home.eyebrow}
          title={ui.home.title}
          intro={ui.home.lead}
        />
        <div className="action-list">
          <Link href="/k/KA-7F4Q">{ui.home.participant}</Link>
          <Link href="/store/AMF">{ui.home.store}</Link>
          <Link href="/signup?s=AMF&p=poster">{ui.home.signup}</Link>
          <Link href="/admin">{ui.home.admin}</Link>
        </div>
      </main>
      <Footer />
    </PilotShell>
  );
}
