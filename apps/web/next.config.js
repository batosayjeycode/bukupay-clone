// next.config.js — enable standalone output mode for Docker
/** @type {import('next').NextConfig} */
const nextConfig = {
  // PENTING: standalone mode untuk Docker — copy minimal files saja
  output: 'standalone',

  // API proxy ke backend (development & production)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.INTERNAL_API_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // Environment variables yang diekspos ke browser
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '2.0.0',
  },

  // Disable telemetry di Docker
  telemetry: false,
};

module.exports = nextConfig;
