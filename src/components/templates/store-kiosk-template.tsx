import { PilotShell } from "@/components/pilot-shell";

export function StoreKioskTemplate({ children }: { children: React.ReactNode }) {
  return <PilotShell><main className="store-screen">{children}</main></PilotShell>;
}
