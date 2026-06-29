import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { ModalProvider } from '@/lib/modal-context';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { UpdateChecker } from '@/components/UpdateChecker';

export const metadata: Metadata = {
  title: 'MonÉglise',
  description: "Votre communauté en un seul endroit.",
  manifest: '/manifest.json',
  applicationName: 'MonÉglise',
  appleWebApp: {
    capable: true,
    title: 'MonÉglise',
    statusBarStyle: 'black-translucent',
    startupImage: [{ url: '/icons/apple-touch-icon.png' }],
  },
  formatDetection: { telephone: false },
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
  themeColor: '#FFFFFF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MonÉglise" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* Preconnect aux services critiques : économise 100-300 ms par 1ère requête */}
        <link rel="preconnect" href="https://jjnggbkofkadtstxvteo.supabase.co" crossOrigin="" />
        <link rel="dns-prefetch" href="https://jjnggbkofkadtstxvteo.supabase.co" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://api.cloudinary.com" crossOrigin="" />

        {/* Cormorant Garamond pour les titres */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Évite le flash blanc au load en sombre : applique la classe AVANT React */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('moneglise_theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <ModalProvider>
              <ServiceWorkerRegister />
              <UpdateChecker />
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
            </ModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
