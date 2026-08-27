import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// ── Normalize Windows CWD & Environment Path Casing ─────────────────────────────
if (process.platform === 'win32') {
  try {
    if (process.env.PWD) process.env.PWD = process.env.PWD.replace(/\\uop\\/i, '\\UOP\\');
    if (process.env.INIT_CWD) process.env.INIT_CWD = process.env.INIT_CWD.replace(/\\uop\\/i, '\\UOP\\');
  } catch {}
}

const nextConfig: NextConfig = {
  // ── Development performance optimizations ─────────────────────────────────
  productionBrowserSourceMaps: false,

  turbopack: {},

  // External image domains
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    
    // Map lowercase uop to uppercase UOP so Webpack never creates duplicate modules
    const uopUpper = path.resolve(__dirname).replace(/\\uop\\/i, '\\UOP\\');
    const uopLower = path.resolve(__dirname).replace(/\\UOP\\/i, '\\uop\\');
    
    config.resolve.alias[uopLower] = uopUpper;

    return config;
  },
};

export default nextConfig;
