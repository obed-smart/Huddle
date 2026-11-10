"use client";

import { useEffect, useState } from "react";

/** "m:ss", or "h:mm:ss" once a call passes the hour. */
function format(totalSeconds: number): string {
  const whole = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const clock = `${mm}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${clock}` : clock;
}

/**
 * The live call duration as a clock string, ticking once a second. Returns an
 * empty string before the call connects (startedAt null), so callers can show
 * a status word instead.
 */
export function useCallDuration(startedAt: number | null): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startedAt == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (startedAt == null) return "";
  return format((now - startedAt) / 1000);
}
