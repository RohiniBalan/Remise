/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Keep these out of the Next.js bundle so their internal worker-thread
  // paths resolve correctly against node_modules (not .next/).
  serverExternalPackages: ['tesseract.js', '@anthropic-ai/sdk', '@google/generative-ai', 'sharp'],
}

module.exports = nextConfig
