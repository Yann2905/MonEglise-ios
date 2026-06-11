'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Building2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { IOSButton } from '@/components/ui/IOSButton';
import { IOSTextField } from '@/components/ui/IOSTextField';
import { IOSAlert } from '@/components/ui/IOSAlert';
import { cn } from '@/lib/utils';

export default function RegisterAdminPage() {
  const router = useRouter();
  const { registerAdmin, user, refresh } = useAuth();

  const [step, setStep] = useState<'admin' | 'church' | 'success'>('admin');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+225 ');
  const [quartier, setQuartier] = useState('');
  const [gender, setGender] = useState<'homme' | 'femme' | ''>('');
  const [churchName, setChurchName] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [loading, setLoading] = useState(false);

  const validateStep1 = (): string | null => {
    if (!firstName.trim()) return 'Le prénom est obligatoire.';
    if (!lastName.trim()) return 'Le nom est obligatoire.';
    if (!quartier.trim()) return 'Le quartier est obligatoire.';
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!/^\+\d{10,15}$/.test(cleanPhone)) return 'Numéro invalide. Format +225XXXXXXXXXX.';
    if (!gender) return 'Sélectionnez votre genre.';
    return null;
  };

  const handleStep1 = async () => {
    const err = validateStep1();
    if (err) return toast.error(err);

    setLoading(true);
    const cleanPhone = phone.replace(/\s+/g, '');
    const res = await registerAdmin({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: cleanPhone,
      quartier: quartier.trim(),
      gender: gender as 'homme' | 'femme',
    });
    setLoading(false);

    if (!res.ok || !res.memberCode) {
      return toast.error(res.error ?? 'Inscription impossible');
    }
    setMemberCode(res.memberCode);
    setStep('church');
  };

  const handleStep2 = async () => {
    if (!churchName.trim()) return toast.error("Saisissez le nom de l'église.");
    if (!user) return toast.error('Erreur : utilisateur non connecté.');

    setLoading(true);
    try {
      // Crée l'église
      const { data: churchRow, error } = await supabase
        .from('churches')
        .insert({
          name: churchName.trim(),
          admin_id: user.id,
        })
        .select('id')
        .single();
      if (error) throw error;

      // Lie l'admin à l'église
      await supabase.from('users').update({ church_id: churchRow.id }).eq('id', user.id);
      await refresh();

      setStep('success');
    } catch (e: any) {
      toast.error('Erreur création église : ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(memberCode);
    toast.success('Code copié !');
  };

  return (
    <main className="min-h-[100dvh] bg-ios-bg-light pt-safe pb-safe">
      <div className="px-4 pt-4">
        <button
          onClick={() => (step === 'admin' ? router.back() : null)}
          className={cn(
            'flex items-center -ml-2 px-2 py-2 transition-opacity',
            step === 'admin' ? 'active:opacity-60' : 'opacity-0 pointer-events-none'
          )}
        >
          <ChevronLeft className="h-7 w-7 text-brand-600" />
        </button>
      </div>

      <div className="px-6 mt-4 max-w-md mx-auto">
        {step === 'admin' && (
          <Step1
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            phone={phone}
            setPhone={setPhone}
            quartier={quartier}
            setQuartier={setQuartier}
            gender={gender}
            setGender={setGender}
            loading={loading}
            onNext={handleStep1}
          />
        )}

        {step === 'church' && (
          <Step2
            churchName={churchName}
            setChurchName={setChurchName}
            loading={loading}
            onNext={handleStep2}
          />
        )}

        {step === 'success' && (
          <Step3 memberCode={memberCode} onCopy={copyCode} onContinue={() => router.replace('/welcome/admin')} />
        )}
      </div>
    </main>
  );
}

function Step1({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  quartier,
  setQuartier,
  gender,
  setGender,
  loading,
  onNext,
}: any) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="ios-large-title">Créer une église</h1>
        <p className="mt-2 text-[17px] text-ios-gray tracking-sf-tight">
          Renseignez vos informations en tant que pasteur principal.
        </p>
      </motion.div>

      <div className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <IOSTextField
            label="Prénom"
            value={firstName}
            onChange={(e: any) => setFirstName(e.target.value)}
            placeholder="Jean"
          />
          <IOSTextField
            label="Nom"
            value={lastName}
            onChange={(e: any) => setLastName(e.target.value)}
            placeholder="Kouassi"
          />
        </div>

        <IOSTextField
          label="Téléphone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e: any) => setPhone(e.target.value)}
          placeholder="+225 07 12 34 56 78"
        />

        <IOSTextField
          label="Quartier"
          value={quartier}
          onChange={(e: any) => setQuartier(e.target.value)}
          placeholder="Cocody"
        />

        <div>
          <label className="block text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
            Genre
          </label>
          <div className="flex gap-2">
            {(['homme', 'femme'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={cn(
                  'flex-1 h-14 rounded-ios-lg font-semibold transition-all active:scale-[0.98]',
                  gender === g
                    ? 'bg-brand-600 text-white shadow-ios'
                    : 'bg-ios-gray6 text-ios-label-light'
                )}
              >
                {g === 'homme' ? 'Homme' : 'Femme'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <IOSButton fullWidth size="lg" onClick={onNext} isLoading={loading}>
          Continuer
        </IOSButton>
      </div>
    </>
  );
}

function Step2({ churchName, setChurchName, loading, onNext }: any) {
  return (
    <>
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[28px] bg-brand-100"
      >
        <Building2 className="h-12 w-12 text-brand-600" />
      </motion.div>

      <motion.h1
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="ios-large-title text-center"
      >
        Nom de l'église
      </motion.h1>

      <motion.p
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="mt-2 text-center text-[17px] text-ios-gray tracking-sf-tight"
      >
        Ce nom sera visible par vos fidèles.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-10"
      >
        <IOSTextField
          value={churchName}
          onChange={(e) => setChurchName(e.target.value)}
          placeholder="Église Évangélique..."
          onKeyDown={(e) => e.key === 'Enter' && onNext()}
        />
      </motion.div>

      <div className="mt-8">
        <IOSButton fullWidth size="lg" onClick={onNext} isLoading={loading}>
          Créer l'église
        </IOSButton>
      </div>
    </>
  );
}

function Step3({ memberCode, onCopy, onContinue }: any) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.1 }}
        className="mx-auto mb-7 flex h-28 w-28 items-center justify-center rounded-full bg-green-100"
      >
        <svg
          className="h-14 w-14 text-ios-green"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="3"
        >
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="ios-large-title"
      >
        Bienvenue !
      </motion.h1>

      <motion.p
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-3 text-[17px] text-ios-gray tracking-sf-tight"
      >
        Votre église est créée. Partagez ce code à vos fidèles pour qu'ils rejoignent l'app :
      </motion.p>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.55, type: 'spring' }}
        className="mt-7 mx-auto inline-flex items-center gap-3 px-6 py-4 rounded-ios-xl bg-brand-50"
      >
        <span
          className="text-[44px] font-bold tracking-[10px] text-brand-600"
          style={{ fontFamily: 'SF Mono, monospace' }}
        >
          {memberCode}
        </span>
        <button
          onClick={onCopy}
          className="ml-2 p-2 rounded-ios bg-white shadow-ios-sm active:opacity-60"
          aria-label="Copier"
        >
          <Copy className="h-5 w-5 text-brand-600" />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-12"
      >
        <IOSButton fullWidth size="lg" onClick={onContinue}>
          Entrer dans l'application
        </IOSButton>
      </motion.div>
    </div>
  );
}
