import Link from "next/link";
import { Footer, PilotShell } from "@/components/pilot-shell";

export default function Home() {
  return <PilotShell><main className="landing"><p className="eyebrow">Limpid Preorder Pilot</p><h1>Koffie ophalen, zonder wachten.</h1><p className="lead">Een besloten pilot voor deelnemers en kioskteams in Amersfoort en Gouda.</p><div className="action-list"><Link href="/k/KA-7F4Q">Open deelnemervoorbeeld</Link><Link href="/winkel/AMF">Open winkelscherm</Link><Link href="/aanmelden?s=AMF&p=poster">Open wachtlijst</Link><Link href="/beheer">Open beheer</Link></div></main><Footer /></PilotShell>;
}
