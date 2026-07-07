import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  serverExternalPackages: ['tesseract.js', '@anthropic-ai/sdk'],
  env: {
    INDICTRANS_URL: process.env.INDICTRANS_URL || 'http://localhost:8400',
  },
};

export default nextConfig;
