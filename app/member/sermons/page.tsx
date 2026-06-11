'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Headphones } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { formatDateLong } from '@/lib/utils';
import type { Sermon } from '@/lib/types';

export default function MemberSermonsPage() {
  const { user } = useAuth();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [playing, setPlaying] = useState<Sermon | null>(null);

  useEffect(() => {
    if (!user?.church_id) return;
    const churchId = user.church_id;
    const load = async () => {
      const { data } = await supabase
        .from('sermons')
        .select('*')
        .eq('church_id', churchId)
        .order('sermon_date', { ascending: false });
      setSermons((data as Sermon[]) ?? []);
    };
    load();
    const ch = supabase
      .channel(`m_sermons_${churchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sermons', filter: `church_id=eq.${churchId}` }, load)
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user]);

  return (
    <div>
      <NavBar title="Prédications" back />

      <div className="px-4 pt-2 pb-8">
        {sermons.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-14 w-14 text-ios-gray3 mx-auto mb-3" />
            <p className="text-ios-gray">Aucune prédication</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sermons.map((s) => (
              <div key={s.id} className="bg-white rounded-ios-lg p-4 shadow-ios-sm">
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
                {s.audio_url && (
                  <button
                    onClick={() => setPlaying(s)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-ios bg-brand-50 text-brand-600 text-[13px] font-semibold active:bg-brand-100"
                  >
                    <Headphones className="h-4 w-4" />
                    Écouter
                  </button>
                )}
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
            <AudioPlayer src={playing.audio_url} />
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
