'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { IOSButton } from '@/components/ui/IOSButton';
import { IOSTextField } from '@/components/ui/IOSTextField';
import { cn } from '@/lib/utils';

const TYPES = [
  { key: 'dimanche', label: 'Culte de dimanche' },
  { key: 'midweek', label: 'Réunion de semaine' },
  { key: 'special', label: 'Événement spécial' },
] as const;

export default function NewServicePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [type, setType] = useState<'dimanche' | 'midweek' | 'special'>('dimanche');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState(true);

  const handleSubmit = async () => {
    if (!user?.church_id) return;
    if (!date) return toast.error('Date obligatoire');

    setSaving(true);
    try {
      const finalTitle =
        title.trim() ||
        (type === 'dimanche' ? 'Culte de dimanche' : type === 'midweek' ? 'Réunion de semaine' : 'Événement');

      const { error } = await supabase.from('services').insert({
        church_id: user.church_id,
        type,
        title: finalTitle,
        date: new Date(date).toISOString(),
        created_by: user.id,
      });
      if (error) throw error;

      if (notify) {
        const { data: members } = await supabase
          .from('users')
          .select('id')
          .eq('church_id', user.church_id)
          .neq('id', user.id);
        const ids = (members as { id: string }[] | null)?.map((m) => m.id) ?? [];
        if (ids.length) {
          await supabase.from('notifications').insert(
            ids.map((rid) => ({
              title: 'Nouveau programme',
              message: `${finalTitle} — ${new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`,
              type: 'system',
              sender_id: user.id,
              receiver_id: rid,
              is_read: false,
            }))
          );
        }
      }

      toast.success('Programme ajouté');
      router.replace('/admin/services');
    } catch (e: any) {
      toast.error('Échec : ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <NavBar title="Nouveau programme" back />

      <div className="px-4 pt-2 pb-8 space-y-4">
        <div>
          <label className="block text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
            Type
          </label>
          <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm divide-y divide-ios-separator/10">
            {TYPES.map((t) => {
              const active = type === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className="w-full px-4 py-3.5 flex items-center justify-between active:bg-ios-gray6"
                >
                  <span className="text-[16px] tracking-sf-tight">{t.label}</span>
                  {active && (
                    <div className="h-5 w-5 rounded-full bg-brand-600 flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <IOSTextField
          label="Titre (optionnel)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex : Culte de Pâques"
        />

        <IOSTextField
          label="Date & heure"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <button
          onClick={() => setNotify(!notify)}
          className="w-full bg-white rounded-ios-lg p-4 flex items-center gap-3 shadow-ios-sm active:bg-ios-gray6"
        >
          <div className="flex-1 text-left">
            <p className="text-[15px] font-medium">Notifier les membres</p>
            <p className="text-[12px] text-ios-gray">Envoyer une notification à toute l'église</p>
          </div>
          <div
            className={cn(
              'w-12 h-7 rounded-full p-0.5 transition-colors flex items-center',
              notify ? 'bg-ios-green justify-end' : 'bg-ios-gray3 justify-start'
            )}
          >
            <div className="h-6 w-6 rounded-full bg-white shadow-ios-sm" />
          </div>
        </button>

        <IOSButton fullWidth size="lg" onClick={handleSubmit} isLoading={saving}>
          Créer le programme
        </IOSButton>
      </div>
    </div>
  );
}
