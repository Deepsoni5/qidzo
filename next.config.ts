import type { NextConfig } from "next";
import path from "node:path";

const LOADER = path.resolve(
  __dirname,
  "src/visual-edits/component-tagger-loader.js",
);

const nextConfig: NextConfig = {
  // ─── www → non-www redirect ───────────────────────────────────────────────
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.qidzo.com" }],
        destination: "https://qidzo.com/:path*",
        permanent: true, // 301 redirect — tells Google to always use non-www
      },
    ];
  },

  // ─── Images ───────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },

  // ─── Build ────────────────────────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
// Orchids restart: 1770032239940
