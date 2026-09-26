"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
type RealtimeConfig = {
  url: string;
  publishableKey: string;
  token: string;
  stationId: string;
};
export function StoreAutoRefresh({
  soundEnabled,
  openOrderCount,
  realtime,
  connectedLabel,
  fallbackLabel,
}: {
  soundEnabled: boolean;
  openOrderCount: number;
  realtime: RealtimeConfig | null;
  connectedLabel: string;
  fallbackLabel: string;
}) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 10_000);
    return () => window.clearInterval(timer);
  }, [router]);
  useEffect(() => {
    if (!realtime) return;
    const client = createClient(realtime.url, realtime.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    client.realtime.setAuth(realtime.token);
    const channel = client
      .channel(`store-orders:${realtime.stationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `station_id=eq.${realtime.stationId}`,
        },
        () => router.refresh()
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));
    return () => {
      void client.removeChannel(channel);
    };
  }, [realtime, router]);
  const previous = useRef(openOrderCount);
  useEffect(() => {
    if (soundEnabled && openOrderCount > previous.current) {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      oscillator.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.15);
      oscillator.addEventListener("ended", () => void context.close());
    }
    previous.current = openOrderCount;
  }, [openOrderCount, soundEnabled]);
  const fallbackStyle = connected ? undefined : { color: "#b42318" };
  return (
    <span className="connection" style={fallbackStyle}>
      <i style={connected ? undefined : { background: "#b42318" }} />{" "}
      {connected ? connectedLabel : fallbackLabel}
    </span>
  );
}
