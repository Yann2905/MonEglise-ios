'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, BookOpen, Trash2, Headphones } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { IOSAlert } from '@/components/ui/IOSAlert';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { formatDateLong, cn } from '@/lib/utils';
import type { Sermon } from '@/lib/types';

export default function AdminSermonsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<Sermon | null>(null);
  const [toDelete, setToDelete] = useState<Sermon | null>(null);

  useEffect(() => {
    if (!user?.church_id) return;
    const churchId = user.church_id;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('sermons')
        .select('*')
        .eq('church_id', churchId)
        .order('sermon_date', { ascending: false });
      setSermons((data as Sermon[]) ?? []);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`admin_sermons_${churchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sermons', filter: `church_id=eq.${churchId}` }, load)
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user]);

  const doDelete = async () => {
    if (!toDelete) return;
    const id = toDelete.id;
    const audioPublicId = toDelete.audio_public_id;

    // Optimistic UI : on retire immédiatement de la liste
    setSermons((prev) => prev.filter((s) => s.id !== id));
    setToDelete(null);

    // Delete DB en premier (rapide, ~50 ms)
    const { error } = await supabase.from('sermons').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return; // L'item reviendra via Realtime quand il sera re-fetch
    }
    toast.success('Prédication supprimée');

    // Delete Cloudinary en arrière-plan (peut être lent, pas bloquant)
    if (audioPublicId) {
      supabase.functions
        .invoke('delete-cloudinary', {
          body: { public_id: audioPublicId, resource_type: 'video' },
        })
        .catch(() => {});
    }
  };

  return (
    <div>
      <NavBar
        title="Prédications"
        back
        trailing={
          <button
            onClick={() => router.push('/admin/sermons/new')}
            className="p-2 -mr-2 active:opacity-60"
          >
            <Plus className="h-6 w-6 text-brand-600" strokeWidth={2.5} />
          </button>
        }
      />

      <div className="px-4 pt-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
          </div>
        ) : sermons.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-14 w-14 text-ios-gray3 mx-auto mb-3" />
            <p className="text-ios-gray">Aucune prédication</p>
            <button
              onClick={() => router.push('/admin/sermons/new')}
              className="mt-4 text-brand-600 font-semibold"
            >
              + Ajouter la première
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sermons.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-ios-lg p-4 shadow-ios-sm"
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-ios-gray">
                  {formatDateLong(s.sermon_date)}
                </p>
                <h3
                  className="mt-1 text-[20px] font-semibold leading-snug"
                  style={{ fontFamily: '"Cormorant Garamond", serif' }}
                >
                  {s.theme}
                </h3>
                {s.verses && (
                  <p className="mt-1 text-[13px] text-ios-gray italic">{s.verses}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  {s.audio_url && (
                    <button
                      onClick={() => setPlaying(s)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-ios bg-brand-50 text-brand-600 text-[13px] font-semibold active:bg-brand-100"
                    >
                      <Headphones className="h-4 w-4" />
                      Écouter
                    </button>
                  )}
                  <button
                    onClick={() => setToDelete(s)}
                    className="ml-auto p-2 rounded-ios text-ios-red active:bg-ios-red/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={!!playing} onClose={() => setPlaying(null)} title={playing?.theme}>
        {playing?.audio_url && (
          <div className="px-5 pb-8 pt-2">
            {playing.verses && (
              <p className="text-[14px] text-ios-gray italic mb-4">{playing.verses}</p>
            )}
            <AudioPlayer src={playing.audio_url} title={playing.theme} />
          </div>
        )}
      </BottomSheet>

      <IOSAlert
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={`Supprimer "${toDelete?.theme}" ?`}
        message="Le fichier audio sera également supprimé. Cette action est irréversible."
        actions={[
          { label: 'Annuler', variant: 'cancel' },
          { label: 'Supprimer', variant: 'destructive', onClick: doDelete },
        ]}
      />
    </div>
  );
}
