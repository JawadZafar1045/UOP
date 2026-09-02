import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Development performance optimizations ─────────────────────────────────
  // Disabling source maps in dev cuts memory usage significantly.
  // Re-enable if you need stack traces pointing to original source lines.
  productionBrowserSourceMaps: false,

  // Turbopack configuration
  turbopack: {
    root: __dirname,
  },

  // External image domains (add more as needed)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
