import { Footer, PilotShell } from "@/components/pilot-shell";

export function PageTemplate({ children, className = "page" }: { children: React.ReactNode; className?: string }) {
  return <PilotShell><main className={className}>{children}</main><Footer /></PilotShell>;
}

export const PublicPageTemplate = PageTemplate;
export const AdminPageTemplate = PageTemplate;
export const AuthPageTemplate = PageTemplate;
