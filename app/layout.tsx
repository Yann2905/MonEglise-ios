import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'MonÉglise',
  description: "Votre communauté en un seul endroit.",
  manifest: '/manifest.json',
  applicationName: 'MonÉglise',
  appleWebApp: {
    capable: true,
    title: 'MonÉglise',
    statusBarStyle: 'black-translucent',
    startupImage: [
      { url: '/icons/apple-touch-icon.png' },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'MonÉglise',
    description: "Votre communauté en un seul endroit.",
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        {/* iOS PWA — meta indispensables pour "Add to home screen" */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MonÉglise" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'rgba(28, 28, 30, 0.92)',
                color: '#fff',
                borderRadius: '14px',
                padding: '12px 16px',
                fontSize: '15px',
                fontWeight: 500,
                letterSpacing: '-0.015em',
                backdropFilter: 'blur(20px)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
