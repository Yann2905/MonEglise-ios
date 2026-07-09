/** @type {import('next').NextConfig} */
// Identifiant unique baked dans le bundle à chaque build. Sert à détecter
// côté client qu'une nouvelle version a été déployée et déclencher un reload.
const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA ?? Date.now().toString();

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
  // Optim prod : supprime les console.* sauf error/warn en build final
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
  // Optim experimentale : reduit le bundle en tree-shakant les libs lourdes
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'react-hot-toast',
      '@supabase/supabase-js',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    // Formats modernes en priorite (bandwidth economise ~40%)
    formats: ['image/avif', 'image/webp'],
    // Cache long des images optimisees
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // Compresse le JS/HTML (Vercel le fait deja mais ceinture + bretelles)
  compress: true,
  // Powered-by header inutile
  poweredByHeader: false,
  // PWA headers pour le service worker + anti-cache HTML
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        // L'API version ne doit jamais être cachée (sinon on ne détecte
        // pas les nouvelles versions)
        source: '/api/version',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
