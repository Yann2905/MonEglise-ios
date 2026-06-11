'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { IOSAlert } from '@/components/ui/IOSAlert';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatDateTime, cn } from '@/lib/utils';
import type { Service } from '@/lib/types';

export default function AdminServicesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<Service | null>(null);
  const [actions, setActions] = useState<Service | null>(null);

  useEffect(() => {
    if (!user?.church_id) return;
    const churchId = user.church_id;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('church_id', churchId)
        .order('date', { ascending: false });
      setItems((data as Service[]) ?? []);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`admin_services_${churchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services', filter: `church_id=eq.${churchId}` }, load)
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user]);

  const doDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('services').delete().eq('id', toDelete.id);
    if (error) toast.error(error.message);
    else toast.success('Programme supprimé');
    setToDelete(null);
  };

  const now = new Date();
  const upcoming = items.filter((s) => new Date(s.date) >= now);
  const past = items.filter((s) => new Date(s.date) < now);

  return (
    <div>
      <NavBar
        title="Programmes"
        back
        trailing={
          <button
            onClick={() => router.push('/admin/services/new')}
            className="p-2 -mr-2 active:opacity-60"
            aria-label="Ajouter"
          >
            <Plus className="h-6 w-6 text-brand-600" strokeWidth={2.5} />
          </button>
        }
      />

      <div className="px-4 pt-2 pb-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-14 w-14 text-ios-gray3 mx-auto mb-3" />
            <p className="text-ios-gray">Aucun programme</p>
            <button
              onClick={() => router.push('/admin/services/new')}
              className="mt-4 text-brand-600 font-semibold"
            >
              + Créer le premier
            </button>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <Section title="À venir" items={upcoming} onOpen={setActions} highlight />
            )}
            {past.length > 0 && <Section title="Passés" items={past} onOpen={setActions} />}
          </>
        )}
      </div>

      <BottomSheet
        open={!!actions}
        onClose={() => setActions(null)}
        title={actions?.title || actions?.type}
      >
        {actions && (
          <div className="px-5 pb-6 pt-2 space-y-2">
            <button
              onClick={() => {
                const s = actions;
                setActions(null);
                router.push(`/admin/services/new?id=${s.id}`);
              }}
              className="w-full px-4 py-3.5 rounded-ios-lg bg-brand-50 text-brand-600 font-semibold text-left active:bg-brand-100 flex items-center gap-2"
            >
              <Pencil className="h-5 w-5" />
              Modifier
            </button>
            <button
              onClick={() => {
                const s = actions;
                setActions(null);
                setToDelete(s);
              }}
              className="w-full px-4 py-3.5 rounded-ios-lg bg-ios-red/10 text-ios-red font-semibold text-left active:bg-ios-red/20 flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" />
              Supprimer
            </button>
          </div>
        )}
      </BottomSheet>

      <IOSAlert
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={`Supprimer "${toDelete?.title ?? toDelete?.type}" ?`}
        message="Voulez-vous vraiment supprimer ce programme ?"
        actions={[
          { label: 'Annuler', variant: 'cancel' },
          { label: 'Supprimer', variant: 'destructive', onClick: doDelete },
        ]}
      />
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
              className={cn(
                'w-full px-4 py-3 flex items-center gap-3 active:bg-ios-gray6 text-left',
                i < items.length - 1 && 'border-b border-ios-separator/10'
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 flex-col items-center justify-center rounded-ios flex-shrink-0',
                  highlight ? 'bg-brand-100 text-brand-600' : 'bg-ios-gray5 text-ios-gray'
                )}
              >
                <span className="text-[10px] uppercase font-semibold">
                  {d.toLocaleDateString('fr-FR', { month: 'short' })}
                </span>
                <span className="text-[18px] font-bold leading-none">{d.getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium tracking-sf-tight truncate">
                  {s.title || (s.type === 'dimanche' ? 'Culte de dimanche' : s.type === 'midweek' ? 'Réunion de semaine' : 'Événement spécial')}
                </p>
                <p className="text-[12px] text-ios-gray">{formatDateTime(s.date)}</p>
              </div>
              <span className="text-ios-gray3 text-xl">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
