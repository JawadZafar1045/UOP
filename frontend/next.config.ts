import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // ── Turbopack CSS module resolution ──────────────────────────────────────
  // Turbopack uses the nearest .git directory (UOP/) as workspace root, so
  // CSS `@import "tailwindcss"` fails because there's no node_modules there.
  // This alias explicitly points to the correct local node_modules.
  turbopack: {
    resolveAlias: {
      tailwindcss: path.resolve(__dirname, "node_modules/tailwindcss"),
    },
  },

  // ── Development performance optimizations ─────────────────────────────────
  // Disabling source maps in dev cuts memory usage significantly.
  // Re-enable if you need stack traces pointing to original source lines.
  productionBrowserSourceMaps: false,


  // External image domains (add more as needed)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
