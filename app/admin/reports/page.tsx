'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, Send, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { IOSButton } from '@/components/ui/IOSButton';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { notify } from '@/lib/notifications';
import { formatDateTime, cn } from '@/lib/utils';

interface AnnualReport {
  id: string;
  family_id: string;
  family_name: string;
  year: number;
  submitted_by_name: string;
  total_absences: number;
  pdf_url: string | null;
  submitted_at: string;
  growth_notes: string | null;
  highlights: string | null;
}

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<AnnualReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [sendingReminder, setSendingReminder] = useState(false);

  useEffect(() => {
    if (!user?.church_id) return;
    const churchId = user.church_id;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('annual_reports')
        .select('*')
        .eq('church_id', churchId)
        .eq('year', yearFilter)
        .order('submitted_at', { ascending: false });
      setReports((data as AnnualReport[]) ?? []);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`admin_reports_${churchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'annual_reports', filter: `church_id=eq.${churchId}` },
        load
      )
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user, yearFilter]);

  // Envoie une relance manuelle à tous les responsables qui n'ont pas encore soumis
  const sendReminder = async () => {
    if (!user?.church_id) return;
    setSendingReminder(true);
    try {
      // Toutes les familles dont l'user-resp n'a pas encore soumis pour l'année
      const { data: fams } = await supabase
        .from('families')
        .select('id, name, responsible_id')
        .eq('church_id', user.church_id)
        .eq('is_institutional', false)
        .not('responsible_id', 'is', null);

      const { data: existingReports } = await supabase
        .from('annual_reports')
        .select('family_id')
        .eq('church_id', user.church_id)
        .eq('year', yearFilter);

      const submittedFamilyIds = new Set(
        ((existingReports as { family_id: string }[]) ?? []).map((r) => r.family_id)
      );

      const toRemind = ((fams as any[]) ?? []).filter(
        (f) => !submittedFamilyIds.has(f.id)
      );

      if (toRemind.length === 0) {
        toast.success('Tous les rapports ont déjà été soumis 🎉');
        setSendingReminder(false);
        return;
      }

      for (const f of toRemind) {
        await notify({
          recipients: [f.responsible_id],
          title: '🗓️ Rapport annuel',
          message: `Le pasteur vous rappelle de soumettre le rapport annuel ${yearFilter} pour "${f.name}".`,
          type: 'reminder',
          senderId: user.id,
          actorName: `${user.first_name} ${user.last_name}`,
          link: `/member/annual-report?family_id=${f.id}`,
        });
      }
      toast.success(`Rappel envoyé à ${toRemind.length} responsable${toRemind.length > 1 ? 's' : ''}`);
    } catch (e: any) {
      toast.error('Erreur : ' + e.message);
    } finally {
      setSendingReminder(false);
    }
  };

  return (
    <div>
      <NavBar title="Rapports annuels" back />

      <div className="px-4 pt-2 pb-8">
        {/* Sélecteur d'année */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {[0, 1, 2].map((offset) => {
            const y = new Date().getFullYear() - offset;
            return (
              <button
                key={y}
                onClick={() => setYearFilter(y)}
                className={cn(
                  'flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap',
                  yearFilter === y ? 'bg-brand-600 text-white' : 'bg-ios-gray5 text-ios-label-light'
                )}
              >
                {y}
              </button>
            );
          })}
        </div>

        {/* Bouton relance */}
        <IOSButton
          fullWidth
          variant="secondary"
          size="md"
          onClick={sendReminder}
          isLoading={sendingReminder}
          leftIcon={<Send className="h-4 w-4" />}
        >
          Envoyer un rappel aux responsables
        </IOSButton>

        <p className="mt-5 px-1 text-[13px] font-semibold uppercase tracking-wider text-ios-gray">
          {reports.length} rapport{reports.length > 1 ? 's' : ''} reçu{reports.length > 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="mt-2">
            <ListSkeleton count={3} />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-14 w-14 text-ios-gray3 mx-auto mb-3" />
            <p className="text-ios-gray">Aucun rapport pour {yearFilter}</p>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="bg-white rounded-ios-lg p-4 shadow-ios-sm">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-ios bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-semibold tracking-sf-tight truncate">
                      {r.family_name}
                    </p>
                    <p className="text-[12px] text-ios-gray">
                      Par {r.submitted_by_name} · {formatDateTime(r.submitted_at)}
                    </p>
                    <p className="text-[13px] text-ios-label-light mt-2">
                      <strong>{r.total_absences}</strong> absences enregistrées
                    </p>
                  </div>
                  {r.pdf_url && (
                    <a
                      href={r.pdf_url}
                      target="_blank"
                      rel="noopener"
                      className="h-9 w-9 rounded-ios bg-brand-600/10 flex items-center justify-center text-brand-600 active:opacity-70"
                      aria-label="Télécharger le PDF"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
