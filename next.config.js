/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Hover prefetches (HoverPrefetchLink) would otherwise be reused for 5 minutes; edits don't
    // refresh the router cache, so keep them as fresh as visited pages (30s).
    staleTimes: { static: 30 },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'limitlesstcg.s3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
