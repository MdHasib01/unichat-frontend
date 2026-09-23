/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: 'scontent.**' },
    ],
  },
  async rewrites() {
    return [
      {
        // Same-origin API path so auth cookies work without CORS in production.
        source: '/api/:path*',
        destination: `${process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
