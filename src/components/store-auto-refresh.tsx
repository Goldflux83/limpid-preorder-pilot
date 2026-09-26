"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
export function StoreAutoRefresh({ soundEnabled, openOrderCount }: { soundEnabled: boolean; openOrderCount: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 10_000);
    return () => window.clearInterval(timer);
  }, [router]);
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
  return null;
}
