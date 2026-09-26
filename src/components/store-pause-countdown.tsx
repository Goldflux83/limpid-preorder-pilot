"use client";
import { useEffect, useState } from "react";
import { remainingPauseSeconds } from "@/modules/store/policy";

export function StorePauseCountdown({ endsAt, label }: { endsAt: string; label: string }) {
  const [seconds, setSeconds] = useState(() => remainingPauseSeconds(endsAt));
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(remainingPauseSeconds(endsAt)), 1_000);
    return () => window.clearInterval(timer);
  }, [endsAt]);
  return <p>{label}: {Math.ceil(seconds / 60)}</p>;
}
