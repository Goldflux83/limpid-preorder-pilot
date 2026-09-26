import Link from "next/link";
import { Footer, PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";

export default function Home() {
  return (
    <PilotShell>
      <main className="landing">
        <p className="eyebrow">{ui.home.eyebrow}</p>
        <h1>{ui.home.title}</h1>
        <p className="lead">{ui.home.lead}</p>
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
