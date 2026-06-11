'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Church } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { IOSButton } from '@/components/ui/IOSButton';

export default function ChurchCodePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    const c = code.trim().toUpperCase();
    if (c.length < 4 || c.length > 8) {
      toast.error('Le code doit contenir 4 à 8 caractères.');
      return;
    }
    setLoading(true);
    try {
      // Cherche l'admin avec ce member_code
      const { data: adminRow } = await supabase
        .from('users')
        .select('id, church_id')
        .eq('member_code', c)
        .eq('role_global', 'admin')
        .maybeSingle();

      if (!adminRow?.church_id) {
        toast.error("Code introuvable. Vérifiez auprès de votre pasteur.");
        setLoading(false);
        return;
      }

      // Navigation vers le formulaire en passant les ids
      const params = new URLSearchParams({
        code: c,
        adminId: adminRow.id,
        churchId: adminRow.church_id,
      });
      router.push(`/register/member?${params.toString()}`);
    } catch (e: any) {
      toast.error('Erreur de vérification : ' + e.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-ios-bg-light pt-safe pb-safe">
      <div className="px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center -ml-2 px-2 py-2 active:opacity-60"
        >
          <ChevronLeft className="h-7 w-7 text-brand-600" />
        </button>
      </div>

      <div className="px-6 mt-8 max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 18,
            delay: 0.1,
          }}
          className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-[28px] bg-brand-100"
        >
          <Church className="h-12 w-12 text-brand-600" />
        </motion.div>

        <motion.h1
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="ios-large-title text-center"
        >
          Rejoindre une église
        </motion.h1>

        <motion.p
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-2 text-center text-[17px] text-ios-gray tracking-sf-tight leading-snug"
        >
          Saisissez le code d'invitation transmis par votre pasteur.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10"
        >
          <input
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EBAC25"
            maxLength={8}
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
            className="w-full h-20 bg-ios-gray6 rounded-ios-xl text-center text-[34px] font-bold tracking-[12px] text-ios-label-light outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/40 transition-all uppercase"
            style={{ fontFamily: 'SF Mono, monospace' }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6"
        >
          <IOSButton fullWidth size="lg" onClick={handleValidate} isLoading={loading}>
            Valider
          </IOSButton>
        </motion.div>
      </div>
    </main>
  );
}
