'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { IOSButton } from '@/components/ui/IOSButton';
import { IOSTextField } from '@/components/ui/IOSTextField';

export default function LoginPage() {
  const router = useRouter();
  const { loginByPhone } = useAuth();
  const [phone, setPhone] = useState('+225 ');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!/^\+\d{10,15}$/.test(cleanPhone)) {
      toast.error('Numéro invalide. Format : +225XXXXXXXXXX');
      return;
    }

    setLoading(true);
    const { ok, error } = await loginByPhone(cleanPhone);
    setLoading(false);

    if (ok) {
      toast.success('Connexion réussie');
      router.replace('/');
    } else {
      toast.error(error ?? 'Erreur de connexion');
    }
  };

  return (
    <main className="min-h-[100dvh] bg-ios-bg-light pt-safe pb-safe">
      {/* Back button */}
      <div className="px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center -ml-2 px-2 py-2 active:opacity-60 transition-opacity"
        >
          <ChevronLeft className="h-7 w-7 text-brand-600" />
        </button>
      </div>

      <div className="px-6 mt-8 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="ios-large-title text-ios-label-light">Bienvenue</h1>
          <p className="mt-2 text-[17px] text-ios-label-secondary text-ios-gray tracking-sf-tight leading-snug">
            Entrez votre numéro de téléphone pour vous connecter.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-10"
        >
          <IOSTextField
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+225 07 12 34 56 78"
            leftIcon={<Phone className="h-5 w-5" />}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-6"
        >
          <IOSButton fullWidth size="lg" onClick={handleLogin} isLoading={loading}>
            Se connecter
          </IOSButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="mt-8 text-center"
        >
          <span className="text-[15px] text-ios-gray">Pas encore inscrit ? </span>
          <button
            onClick={() => router.push('/register')}
            className="text-[15px] font-semibold text-brand-600 active:opacity-60"
          >
            S'inscrire
          </button>
        </motion.div>
      </div>
    </main>
  );
}
