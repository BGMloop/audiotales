/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      }
    ]
  },
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  // Next.js 15 compatibility options
  experimental: {
    ppr: false,
    esmExternals: true,
    strictTemplateErrors: false,
  }
};

module.exports = nextConfig;