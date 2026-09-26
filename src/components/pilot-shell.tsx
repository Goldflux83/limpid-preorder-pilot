import Link from "next/link";
import { theme } from "@/lib/theme";
export function PilotShell({ children }: { children: React.ReactNode }) { return <div className="site-shell"><header className="site-header"><Link href="/" className="brand">{theme.name}</Link><span className="pilot-badge">{theme.pilotLabel}</span></header>{children}</div>; }
export function Footer() { return <footer><Link href="/privacy">Privacyverklaring</Link><span>•</span><span>Pilot van Limpid &amp; Co in opdracht van NS Retail</span></footer>; }
