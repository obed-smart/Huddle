"use client";

import { useEffect, useState } from "react";

const QUERY = "(min-width: 768px)";

/** True on md+ viewports. The initial value is read synchronously so the right
    surface (popover vs full screen) renders on first paint, with no flash. */
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}
