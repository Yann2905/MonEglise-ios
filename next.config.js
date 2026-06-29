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
  },
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
