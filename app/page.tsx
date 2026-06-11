'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { IOSButton } from '@/components/ui/IOSButton';

export default function WelcomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Auto-redirect si déjà connecté
  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role_global === 'admin' ? '/admin' : '/member');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-brand-600">
        <Spinner />
      </div>
    );
  }

  if (user) return null; // pendant la redirection

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      {/* ── Fond bleu marine avec blobs animés ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500" />
      <BackgroundBlobs />

      {/* ── Contenu ── */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center px-6 pt-safe pb-safe">
        <div className="flex flex-1 flex-col items-center justify-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.1,
            }}
            className="relative h-32 w-32 mb-6"
          >
            <div className="absolute inset-0 rounded-[36px] bg-white shadow-2xl flex items-center justify-center overflow-hidden">
              {/* Si tu mets l'icône PNG dans /public/icons, on l'affichera. Sinon fallback emoji */}
              <img
                src="/icons/icon-192.png"
                alt="MonÉglise"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </motion.div>

          {/* Titre Cormorant */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-white text-[44px] font-serif font-semibold tracking-tight"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            MonÉglise
          </motion.h1>

          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 0.9 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-2 text-white/85 text-[15px] tracking-sf-tight"
          >
            Votre communauté en un seul endroit
          </motion.p>
        </div>

        {/* ── Boutons en bas ── */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="w-full max-w-md space-y-3 pb-8"
        >
          <IOSButton
            fullWidth
            size="lg"
            className="bg-white !text-brand-600 shadow-ios-xl"
            onClick={() => router.push('/register')}
          >
            Créer un compte
          </IOSButton>

          <button
            onClick={() => router.push('/login')}
            className="w-full h-14 rounded-ios-lg border-[1.5px] border-white/70 text-white font-semibold text-[17px] tracking-sf-tight active:opacity-70 transition-opacity"
          >
            Se connecter
          </button>
        </motion.div>
      </div>
    </main>
  );
}

function BackgroundBlobs() {
  return (
    <>
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-brand-400/40 blur-[80px]"
      />
      <motion.div
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 30, -30, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-10%] right-[-15%] h-[450px] w-[450px] rounded-full bg-brand-700/50 blur-[100px]"
      />
      <motion.div
        animate={{
          x: [0, 20, -10, 0],
          y: [0, -20, 30, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[40%] right-[20%] h-[300px] w-[300px] rounded-full bg-brand-300/30 blur-[80px]"
      />
    </>
  );
}

function Spinner() {
  return (
    <div className="relative h-12 w-12">
      <div className="absolute inset-0 rounded-full border-[3px] border-white/30" />
      <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-white animate-spin" />
    </div>
  );
}
