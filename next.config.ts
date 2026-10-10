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
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          // Obliga a usar HTTPS durante 2 años (solo tiene efecto servido por HTTPS). Sin
          // includeSubDomains: así no afecta a otros subdominios del dominio que no tengan HTTPS.
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000' }]
            : [])
        ]
      }
    ];
  }
};

export default nextConfig;
