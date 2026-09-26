import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Limpid Preorder Pilot",
  description: "Pilot voor koffie vooraf bestellen",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="nl"><body>{children}</body></html>;
}
