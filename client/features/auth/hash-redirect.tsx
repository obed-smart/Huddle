"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * The backend's OAuth callback still returns to the old hash route (for example
 * `/#/dashboard`), a leftover from the earlier hash router. This app uses real
 * routes, so a hash path lands here on the landing page instead of the app.
 * When one is present on load, send the browser to the real path once.
 */
export function HashRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#/")) {
      router.replace(hash.slice(1)); // "#/dashboard" -> "/dashboard"
    }
  }, [router]);

  return null;
}
