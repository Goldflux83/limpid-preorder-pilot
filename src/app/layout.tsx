import type { Metadata } from "next";
import { ui } from "@/config/content";
import "./globals.css";

export const metadata: Metadata = {
  title: ui.home.eyebrow,
  description: ui.home.lead,
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
