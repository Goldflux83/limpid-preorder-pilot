import { Footer, PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
export default function PrivacyPage() {
  return (
    <PilotShell>
      <main className="page prose">
        <p className="eyebrow">{ui.privacy.eyebrow}</p>
        <h1>{ui.privacy.title}</h1>
        <p>{ui.privacy.body}</p>
        <p>{ui.privacy.retention}</p>
      </main>
      <Footer />
    </PilotShell>
  );
}
