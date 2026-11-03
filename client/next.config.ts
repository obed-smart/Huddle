import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

/**
 * The backend origin stays server-only (never NEXT_PUBLIC). The REST API is
 * forwarded by the BFF route handler (`app/api/v1/[...path]/route.ts`), so the
 * only thing left to rewrite here is the socket: a websocket cannot pass through
 * a route handler, so `/socket.io` is proxied at the edge straight to the
 * backend. The browser only ever sees same-origin paths, so no backend URL
 * reaches the shipped bundle. When `BACKEND_ORIGIN` is unset the rewrite is a
 * no-op (the API is assumed to be served on the same host already).
 */
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN?.replace(/\/+$/, "");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Calls need the camera/mic from this origin; nothing else.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder: the repo also has a lockfile at its
  // root, which would otherwise make Next guess the wrong root.
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },

  async rewrites() {
    if (!BACKEND_ORIGIN) return [];
    return [{ source: "/socket.io/:path*", destination: `${BACKEND_ORIGIN}/socket.io/:path*` }];
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
