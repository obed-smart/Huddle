import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { networkInterfaces } from "node:os";

const isDev = process.env.NODE_ENV === "development";

function lanIps(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => i!.address);
}

// Optional: tunnel hostnames etc., comma separated, e.g. in .env.local
// DEV_ORIGINS=my-tunnel.trycloudflare.com
const extraOrigins = (process.env.DEV_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * REST is forwarded by the BFF route handler (`app/api/v1/[...path]`, which
 * reads `BACKEND_ORIGIN` itself), and the socket connects straight to the
 * backend (`NEXT_PUBLIC_SOCKET_URL`), so nothing is rewritten here. The
 * Content-Security-Policy is set per request in `proxy.ts` (nonce based); this
 * file only carries the static security headers that do not need a nonce.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Calls need the camera/mic from this origin; nothing else.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=()",
  },
  // HTTPS only: browsers ignore HSTS over plain HTTP, and you don't want it in dev.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]),
];

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder: the repo also has a lockfile at its
  // root, which would otherwise make Next guess the wrong root.
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },

  allowedDevOrigins: isDev ? [...lanIps(), ...extraOrigins] : [],

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
