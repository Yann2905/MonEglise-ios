'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatDateTime } from '@/lib/utils';
import type { Service } from '@/lib/types';

export default function MemberServicesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Service[]>([]);
  const [open, setOpen] = useState<Service | null>(null);

  useEffect(() => {
    if (!user?.church_id) return;
    const churchId = user.church_id;
    const load = async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('church_id', churchId)
        .order('date', { ascending: false });
      setItems((data as Service[]) ?? []);
    };
    load();
    const ch = supabase
      .channel(`m_services_${churchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services', filter: `church_id=eq.${churchId}` }, load)
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user]);

  const now = new Date();
  const upcoming = items.filter((s) => new Date(s.date) >= now);
  const past = items.filter((s) => new Date(s.date) < now);

  return (
    <div>
      <NavBar title="Programmes" back />

      <div className="px-4 pt-2 pb-8">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="h-14 w-14 text-ios-gray3 mx-auto mb-3" />
            <p className="text-ios-gray">Aucun programme</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <Section title="À venir" items={upcoming} onOpen={setOpen} highlight />
            )}
            {past.length > 0 && <Section title="Passés" items={past} onOpen={setOpen} />}
          </>
        )}
      </div>

      <BottomSheet open={!!open} onClose={() => setOpen(null)} title={open?.title || open?.type}>
        {open && (
          <div className="px-5 pb-8 pt-2">
            <p className="text-[13px] text-ios-gray uppercase tracking-wider font-semibold mb-2">
              {open.type === 'dimanche' ? 'Culte de dimanche' : open.type === 'midweek' ? 'Réunion de semaine' : 'Événement spécial'}
            </p>
            <h2
              className="text-[24px] font-semibold leading-tight"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              {open.title || (open.type === 'dimanche' ? 'Culte' : open.type)}
            </h2>
            <p className="mt-3 text-[15px] text-ios-label-light">{formatDateTime(open.date)}</p>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function Section({
  title,
  items,
  onOpen,
  highlight,
}: {
  title: string;
  items: Service[];
  onOpen: (s: Service) => void;
  highlight?: boolean;
}) {
  return (
    <div className="mb-5">
      <p className="px-1 mb-2 text-[13px] font-semibold uppercase tracking-wider text-ios-gray">
        {title}
      </p>
      <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm">
        {items.map((s, i) => {
          const d = new Date(s.date);
          return (
            <button
              key={s.id}
              onClick={() => onOpen(s)}
              className={`w-full px-4 py-3 flex items-center gap-3 active:bg-ios-gray6 ${
                i < items.length - 1 ? 'border-b border-ios-separator/10' : ''
              }`}
            >
              <div
                className={`flex h-12 w-12 flex-col items-center justify-center rounded-ios ${
                  highlight ? 'bg-brand-100 text-brand-600' : 'bg-ios-gray5 text-ios-gray'
                }`}
              >
                <span className="text-[10px] uppercase font-semibold">
                  {d.toLocaleDateString('fr-FR', { month: 'short' })}
                </span>
                <span className="text-[18px] font-bold leading-none">{d.getDate()}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[15px] font-medium tracking-sf-tight truncate">
                  {s.title || (s.type === 'dimanche' ? 'Culte de dimanche' : s.type)}
                </p>
                <p className="text-[12px] text-ios-gray">{formatDateTime(s.date)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
