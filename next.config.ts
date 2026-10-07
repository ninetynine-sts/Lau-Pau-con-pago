import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // PGlite (base de datos local de desarrollo) y postgres.js se cargan tal cual en Node.
  serverExternalPackages: ['@electric-sql/pglite', 'postgres'],
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: '8mb' } // subida de fotos de producto desde el panel
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' }
        ]
      }
    ];
  }
};

export default nextConfig;
