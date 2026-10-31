import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder: the repo also has a lockfile at its
  // root, which would otherwise make Next guess the wrong root.
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
  allowedDevOrigins: ["10.191.91.217"],
};

export default nextConfig;
