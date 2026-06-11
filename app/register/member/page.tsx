'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { IOSButton } from '@/components/ui/IOSButton';
import { IOSTextField } from '@/components/ui/IOSTextField';
import { IOSAlert } from '@/components/ui/IOSAlert';
import { SIGNUP_CHURCH_ROLES, labelOfChurchRole, impliedGenderForRole, cn } from '@/lib/utils';

interface FamilyOption {
  id: string;
  name: string;
}

export default function RegisterMemberPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { registerMember } = useAuth();

  const code = params.get('code') ?? '';
  const churchId = params.get('churchId') ?? '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+225 ');
  const [quartier, setQuartier] = useState('');
  const [gender, setGender] = useState<'homme' | 'femme' | ''>('');
  const [churchRole, setChurchRole] = useState<string>('fidele');
  const [familyIds, setFamilyIds] = useState<string[]>([]);
  const [families, setFamilies] = useState<FamilyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsData, setCongratsData] = useState({ article: '', familyName: '' });

  // Genre auto-déduit pour Diacre/Diaconesse
  useEffect(() => {
    const implied = impliedGenderForRole(churchRole);
    if (implied) setGender(implied);
  }, [churchRole]);

  // Charge les familles depuis la vue (filtre is_institutional=false)
  useEffect(() => {
    if (!churchId) return;
    (async () => {
      const { data } = await supabase
        .from('v_families_enriched')
        .select('id, name')
        .eq('church_id', churchId)
        .eq('is_institutional', false)
        .order('name');
      setFamilies((data as FamilyOption[]) ?? []);
    })();
  }, [churchId]);

  const toggleFamily = (id: string) => {
    setFamilyIds((prev) => {
      if (prev.includes(id)) return prev.filter((f) => f !== id);
      // Si responsable_famille : une seule famille
      if (churchRole === 'responsable_famille') return [id];
      return [...prev, id];
    });
  };

  const validate = (): string | null => {
    if (!firstName.trim()) return 'Le prénom est obligatoire.';
    if (!lastName.trim()) return 'Le nom est obligatoire.';
    if (!quartier.trim()) return 'Le quartier est obligatoire.';
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!/^\+\d{10,15}$/.test(cleanPhone)) return 'Numéro invalide. Format +225XXXXXXXXXX.';
    if (!gender) return 'Veuillez sélectionner votre genre.';
    if (churchRole === 'responsable_famille' && familyIds.length !== 1)
      return 'Un responsable doit être affecté à exactement une famille.';
    return null;
  };

  const doSubmit = async () => {
    setLoading(true);
    const cleanPhone = phone.replace(/\s+/g, '');
    const { ok, error } = await registerMember({
      memberCode: code,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: cleanPhone,
      quartier: quartier.trim(),
      gender: gender as 'homme' | 'femme',
      churchRole,
      familyIds,
    });
    setLoading(false);

    if (ok) {
      toast.success('Inscription réussie !');
      router.replace('/welcome/member');
    } else {
      toast.error(error ?? "Impossible de s'inscrire");
    }
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    // Si responsable + famille choisie → modal félicitations
    if (churchRole === 'responsable_famille' && familyIds.length === 1) {
      const fam = families.find((f) => f.id === familyIds[0]);
      setCongratsData({
        article: gender === 'femme' ? 'la responsable' : 'le responsable',
        familyName: fam?.name ?? '',
      });
      setShowCongrats(true);
      return;
    }

    doSubmit();
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

      <div className="px-6 mt-4 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="ios-large-title">Inscription</h1>
          <p className="mt-2 text-[17px] text-ios-gray tracking-sf-tight">
            Renseignez vos informations pour rejoindre l'église.
          </p>
        </motion.div>

        {/* Bandeau code validé */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-4 flex items-center gap-2 px-4 py-3 rounded-ios-lg bg-green-50 text-ios-green"
        >
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-[14px] font-medium">Code validé : {code}</span>
        </motion.div>

        {/* Formulaire */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <IOSTextField
              label="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jean"
            />
            <IOSTextField
              label="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Kouassi"
            />
          </div>

          <IOSTextField
            label="Téléphone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+225 07 12 34 56 78"
          />

          <IOSTextField
            label="Quartier"
            value={quartier}
            onChange={(e) => setQuartier(e.target.value)}
            placeholder="Cocody"
          />

          {/* Genre */}
          <div>
            <label className="block text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
              Genre
            </label>
            <div className="flex gap-2">
              {(['homme', 'femme'] as const).map((g) => {
                const isActive = gender === g;
                const locked = !!impliedGenderForRole(churchRole) && impliedGenderForRole(churchRole) !== g;
                return (
                  <button
                    key={g}
                    disabled={locked}
                    onClick={() => setGender(g)}
                    className={cn(
                      'flex-1 h-14 rounded-ios-lg font-semibold text-[16px] tracking-sf-tight',
                      'transition-all active:scale-[0.98]',
                      isActive
                        ? 'bg-brand-600 text-white shadow-ios'
                        : 'bg-ios-gray6 text-ios-label-light',
                      locked && 'opacity-30 cursor-not-allowed'
                    )}
                  >
                    {g === 'homme' ? 'Homme' : 'Femme'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
              Rôle dans l'église
            </label>
            <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm">
              {SIGNUP_CHURCH_ROLES.map((role, i) => {
                const isActive = churchRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => setChurchRole(role)}
                    className="w-full px-4 py-3.5 flex items-center justify-between active:bg-ios-gray6 transition-colors"
                  >
                    <span className="text-[16px] tracking-sf-tight">
                      {labelOfChurchRole(role)}
                    </span>
                    {isActive && (
                      <div className="h-5 w-5 rounded-full bg-brand-600 flex items-center justify-center">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="3"
                        >
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    {i < SIGNUP_CHURCH_ROLES.length - 1 && (
                      <span className="absolute bottom-0 left-4 right-0 h-px bg-ios-separator/10" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Familles */}
          {families.length > 0 && (
            <div>
              <label className="block text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
                Famille{families.length > 1 ? 's' : ''}
              </label>
              {churchRole === 'responsable_famille' && (
                <div className="mb-2 px-3 py-2 rounded-ios bg-ios-orange/10 text-[13px] text-ios-orange">
                  En tant que responsable, vous ne pouvez choisir qu'une seule famille.
                </div>
              )}
              <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm">
                {families.map((f, i) => {
                  const checked = familyIds.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleFamily(f.id)}
                      className={cn(
                        'w-full px-4 py-3.5 flex items-center gap-3 active:bg-ios-gray6 transition-colors',
                        i < families.length - 1 && 'border-b border-ios-separator/10'
                      )}
                    >
                      <div
                        className={cn(
                          'h-6 w-6 rounded-md flex items-center justify-center transition-all',
                          checked
                            ? 'bg-brand-600 border-2 border-brand-600'
                            : 'border-2 border-ios-gray3'
                        )}
                      >
                        {checked && (
                          <svg
                            className="h-4 w-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth="3"
                          >
                            <path
                              d="M5 13l4 4L19 7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-[16px] tracking-sf-tight flex-1 text-left">
                        {f.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pb-8">
          <IOSButton fullWidth size="lg" onClick={handleSubmit} isLoading={loading}>
            S'inscrire
          </IOSButton>
        </div>
      </div>

      <IOSAlert
        open={showCongrats}
        onClose={() => setShowCongrats(false)}
        title="Félicitations !"
        message={`Vous êtes ${congratsData.article}${
          congratsData.familyName ? ` de "${congratsData.familyName}"` : ''
        }.`}
        actions={[
          { label: 'Annuler', variant: 'cancel' },
          {
            label: 'Continuer',
            onClick: () => {
              setShowCongrats(false);
              doSubmit();
            },
            closeOnTap: false,
          },
        ]}
      />
    </main>
  );
}
