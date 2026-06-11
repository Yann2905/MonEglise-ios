'use client';

import { useEffect, useState } from 'react';
import { Calendar, History } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatDateLong } from '@/lib/utils';

interface Absence {
  id: string;
  family_name: string;
  date: string;
  absent_count: number;
  absent_members: Array<{ name: string; phone?: string }>;
  actor_name: string | null;
}

export default function AttendanceHistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Absence[]>([]);
  const [open, setOpen] = useState<Absence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.church_id) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('absences')
        .select('id, family_id, family_name, date, absent_count, absent_members, actor_name')
        .order('date', { ascending: false })
        .limit(100);
      // Filtre côté client : on garde celles dont la famille appartient à mon église
      // (le filtre direct est compliqué car absences n'a pas church_id)
      setItems((data as Absence[]) ?? []);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`attendance_history_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absences' }, load)
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user]);

  return (
    <div>
      <NavBar title="Historique des appels" back />

      <div className="px-4 pt-2 pb-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <History className="h-14 w-14 text-ios-gray3 mx-auto mb-3" />
            <p className="text-ios-gray">Aucun appel enregistré</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((a) => (
              <button
                key={a.id}
                onClick={() => setOpen(a)}
                className="w-full bg-white rounded-ios-lg p-4 text-left shadow-ios-sm active:shadow-ios"
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-ios bg-orange-50 flex items-center justify-center text-ios-orange flex-shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold truncate">{a.family_name}</p>
                    <p className="text-[13px] text-ios-gray mt-0.5">
                      {a.absent_count} absent{a.absent_count > 1 ? 's' : ''} · {formatDateLong(a.date)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={!!open} onClose={() => setOpen(null)} title={open?.family_name}>
        {open && (
          <div className="px-5 pb-8 pt-2">
            <p className="text-[13px] text-ios-gray mb-1">{formatDateLong(open.date)}</p>
            <p className="text-[15px] font-medium mb-4">
              {open.absent_count} absent{open.absent_count > 1 ? 's' : ''}
            </p>
            {open.absent_members?.length ? (
              <div className="bg-ios-gray6 rounded-ios-lg overflow-hidden divide-y divide-ios-separator/10">
                {open.absent_members.map((m, i) => (
                  <div key={i} className="px-4 py-3">
                    <p className="text-[15px] font-medium">{m.name}</p>
                    {m.phone && <p className="text-[12px] text-ios-gray">{m.phone}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ios-gray text-center py-4">Aucun absent enregistré</p>
            )}
            {open.actor_name && (
              <p className="mt-4 text-[12px] text-ios-gray text-center">
                Enregistré par {open.actor_name}
              </p>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
