import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

/**
 * The backend origin stays server-only (never NEXT_PUBLIC): it is read here, on
 * the server, and used only to proxy same-origin `/api/v1` and `/socket.io`
 * requests to the real backend. The browser only ever sees same-origin paths,
 * so no backend URL reaches the shipped bundle. When unset (e.g. the API is
 * already served same-origin by a reverse proxy) the rewrites are a no-op.
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
    return [
      { source: "/api/v1/:path*", destination: `${BACKEND_ORIGIN}/api/v1/:path*` },
      { source: "/socket.io/:path*", destination: `${BACKEND_ORIGIN}/socket.io/:path*` },
    ];
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
