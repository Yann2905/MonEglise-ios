'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { IOSButton } from '@/components/ui/IOSButton';

export default function MemberWelcomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [churchName, setChurchName] = useState<string>('');

  useEffect(() => {
    if (!user?.church_id) return;
    supabase
      .from('churches')
      .select('name')
      .eq('id', user.church_id)
      .maybeSingle()
      .then(({ data }) => setChurchName((data?.name as string) ?? ''));
  }, [user]);

  if (!user) {
    router.replace('/');
    return null;
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500" />
      {/* Blobs */}
      <motion.div
        animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-brand-400/40 blur-[80px]"
      />
      <motion.div
        animate={{ x: [0, -40, 30, 0], y: [0, 30, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-10%] right-[-15%] h-[450px] w-[450px] rounded-full bg-brand-700/50 blur-[100px]"
      />

      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center px-6 pt-safe pb-safe">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.1 }}
            className="mb-8 flex h-32 w-32 items-center justify-center rounded-[36px] bg-white shadow-2xl overflow-hidden"
          >
            <img
              src="/icons/icon-192.png"
              alt="MonÉglise"
              className="h-full w-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-white font-serif text-[44px] font-semibold leading-tight tracking-tight"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            Bienvenue
          </motion.h1>

          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-3 text-white/90 text-[19px] tracking-sf-tight px-4"
          >
            à l'église{' '}
            <span className="font-semibold">{churchName || 'MonÉglise'}</span>
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="w-full max-w-md pb-8"
        >
          <IOSButton
            fullWidth
            size="lg"
            className="bg-white !text-brand-600 shadow-ios-xl"
            onClick={() => router.replace('/member')}
          >
            Entrer
          </IOSButton>
        </motion.div>
      </div>
    </main>
  );
}
