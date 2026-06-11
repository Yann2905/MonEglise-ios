'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { IOSButton } from '@/components/ui/IOSButton';

export default function AdminWelcomePage() {
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
      <motion.div
        animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-brand-400/40 blur-[80px]"
      />

      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center px-6 pt-safe pb-safe">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-white font-serif text-[48px] font-semibold leading-tight tracking-tight"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            Félicitations
          </motion.h1>

          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-4 text-white/90 text-[19px] tracking-sf-tight"
          >
            Votre église{' '}
            <span className="font-semibold">{churchName || 'MonÉglise'}</span>{' '}
            est prête.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            className="mt-2 text-white/75 text-[15px] tracking-sf-tight"
          >
            Pasteur principal — {user.first_name} {user.last_name}
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
            onClick={() => router.replace('/admin')}
          >
            Entrer
          </IOSButton>
        </motion.div>
      </div>
    </main>
  );
}
