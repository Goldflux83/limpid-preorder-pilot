import Link from "next/link";
import { ui } from "@/config/content";
import { theme } from "@/lib/theme";
export function PilotShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link href="/" className="brand">
          {theme.name}
        </Link>
        <span className="pilot-badge">{theme.pilotLabel}</span>
      </header>
      {children}
    </div>
  );
}
export function Footer() {
  return (
    <footer>
      <Link href="/privacy">{ui.navigation.privacy}</Link>
      <span>•</span>
      <span>{ui.navigation.footer}</span>
    </footer>
  );
}
