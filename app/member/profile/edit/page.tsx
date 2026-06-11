'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { IOSButton } from '@/components/ui/IOSButton';
import { IOSTextField } from '@/components/ui/IOSTextField';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [quartier, setQuartier] = useState(user?.quartier ?? '');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!firstName.trim() || !lastName.trim()) {
      return toast.error('Prénom et nom sont obligatoires');
    }
    if (!/^\+\d{10,15}$/.test(cleanPhone)) {
      return toast.error('Numéro invalide');
    }

    setSaving(true);
    if (cleanPhone !== user.phone) {
      const dup = await supabase.from('users').select('id').eq('phone', cleanPhone).maybeSingle();
      if (dup.data && dup.data.id !== user.id) {
        setSaving(false);
        return toast.error('Ce numéro est déjà utilisé');
      }
    }

    const { error } = await supabase
      .from('users')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: cleanPhone,
        quartier: quartier.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success('Profil mis à jour');
    router.back();
  };

  return (
    <div>
      <NavBar title="Modifier le profil" back />

      <div className="px-5 pt-2 pb-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <IOSTextField label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <IOSTextField label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <IOSTextField label="Téléphone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <IOSTextField label="Quartier" value={quartier} onChange={(e) => setQuartier(e.target.value)} />

        <IOSButton fullWidth size="lg" onClick={handleSave} isLoading={saving}>
          Enregistrer
        </IOSButton>
      </div>
    </div>
  );
}
