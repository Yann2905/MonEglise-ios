'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { IOSButton } from '@/components/ui/IOSButton';
import { uploadRaw } from '@/lib/cloudinary';
import { generateAnnualReportPdf } from '@/lib/annual-report-pdf';
import { notify } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import type { Family, User } from '@/lib/types';

interface AbsenceItem {
  user_id: string;
  name: string;
  count: number;
}

export default function AnnualReportPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-ios-bg-light">
          <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      }
    >
      <AnnualReportContent />
    </Suspense>
  );
}

function AnnualReportContent() {
  const router = useRouter();
  const search = useSearchParams();
  const { user } = useAuth();

  const queryFamilyId = search.get('family_id');
  const [myFamilies, setMyFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(queryFamilyId);
  const [absencesSummary, setAbsencesSummary] = useState<AbsenceItem[]>([]);
  const [totalAbsences, setTotalAbsences] = useState(0);
  const [growthNotes, setGrowthNotes] = useState('');
  const [highlights, setHighlights] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [churchName, setChurchName] = useState('');

  const year = new Date().getFullYear();

  // Charge les familles dont l'user est responsable
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('v_families_enriched')
        .select('*')
        .eq('responsible_id', user.id)
        .eq('is_institutional', false);
      const list = (data as Family[]) ?? [];
      setMyFamilies(list);
      if (!selectedFamilyId && list.length === 1) {
        setSelectedFamilyId(list[0].id);
      }
      // Récup nom église
      if (user.church_id) {
        const { data: c } = await supabase
          .from('churches')
          .select('name')
          .eq('id', user.church_id)
          .maybeSingle();
        setChurchName((c?.name as string) ?? '');
      }
      setLoading(false);
    })();
  }, [user, selectedFamilyId]);

  // Quand on choisit une famille, calcule les absences de l'année
  useEffect(() => {
    if (!selectedFamilyId) return;
    (async () => {
      const start = new Date(year, 0, 1).toISOString();
      const end = new Date(year + 1, 0, 1).toISOString();
      const { data: abs } = await supabase
        .from('absences')
        .select('absent_members')
        .eq('family_id', selectedFamilyId)
        .gte('date', start)
        .lt('date', end);

      const counts: Record<string, AbsenceItem> = {};
      let total = 0;
      for (const a of (abs as any[]) ?? []) {
        for (const m of (a.absent_members as any[]) ?? []) {
          const key = m.user_id || m.name;
          if (!counts[key]) {
            counts[key] = { user_id: m.user_id || '', name: m.name, count: 0 };
          }
          counts[key].count++;
          total++;
        }
      }
      setAbsencesSummary(Object.values(counts).sort((a, b) => b.count - a.count));
      setTotalAbsences(total);
    })();
  }, [selectedFamilyId, year]);

  const selectedFamily = myFamilies.find((f) => f.id === selectedFamilyId);

  const handleSubmit = async () => {
    if (!user || !selectedFamily || !user.church_id) return;
    if (!growthNotes.trim() && !highlights.trim()) {
      return toast.error('Remplissez au moins la croissance ou les faits marquants.');
    }
    setSubmitting(true);
    const t = toast.loading('Génération du rapport…');

    try {
      // 1. Génère le PDF
      const pdfBlob = generateAnnualReportPdf({
        churchName,
        familyName: selectedFamily.name,
        year,
        submittedByName: `${user.first_name} ${user.last_name}`,
        totalAbsences,
        absencesSummary,
        growthNotes: growthNotes.trim(),
        highlights: highlights.trim(),
      });

      // 2. Upload PDF sur Cloudinary
      const filename = `rapport-${selectedFamily.name.replace(/\s+/g, '-')}-${year}-${Date.now()}.pdf`;
      const folder = `moneglise/${user.church_id}/reports/${year}`;
      const { url, publicId } = await uploadRaw(pdfBlob, folder, filename);

      // 3. Sauvegarde dans DB
      const { error } = await supabase.from('annual_reports').upsert(
        {
          church_id: user.church_id,
          family_id: selectedFamily.id,
          family_name: selectedFamily.name,
          year,
          submitted_by: user.id,
          submitted_by_name: `${user.first_name} ${user.last_name}`,
          absences_summary: absencesSummary,
          total_absences: totalAbsences,
          growth_notes: growthNotes.trim(),
          highlights: highlights.trim(),
          pdf_url: url,
          pdf_public_id: publicId,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'family_id,year' }
      );
      if (error) throw error;

      // 4. Notifie le pasteur
      const { data: church } = await supabase
        .from('churches')
        .select('admin_id')
        .eq('id', user.church_id)
        .maybeSingle();
      if (church?.admin_id && church.admin_id !== user.id) {
        await notify({
          recipients: [church.admin_id],
          title: '📋 Rapport annuel reçu',
          message: `${selectedFamily.name} a soumis son rapport annuel ${year}.`,
          type: 'system',
          senderId: user.id,
          actorName: `${user.first_name} ${user.last_name}`,
          link: '/admin/reports',
        });
      }

      toast.dismiss(t);
      toast.success('Rapport envoyé au pasteur !');
      setSubmitted(true);
    } catch (e: any) {
      toast.dismiss(t);
      toast.error('Échec : ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ios-bg-light">
        <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  if (myFamilies.length === 0) {
    return (
      <div>
        <NavBar title="Rapport annuel" back />
        <div className="text-center py-20 px-8">
          <FileText className="h-14 w-14 text-ios-gray3 mx-auto mb-3" />
          <p className="text-[17px] font-semibold mb-1">Accès réservé</p>
          <p className="text-[14px] text-ios-gray">
            Seuls les responsables de famille peuvent soumettre un rapport annuel.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div>
        <NavBar title="Rapport envoyé" back />
        <div className="text-center py-20 px-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-ios-green" />
          </div>
          <p className="text-[20px] font-semibold mb-2">Rapport envoyé</p>
          <p className="text-[14px] text-ios-gray max-w-xs mx-auto">
            Votre rapport annuel a été transmis au pasteur. Il en sera notifié.
          </p>
          <button
            onClick={() => router.push('/member')}
            className="mt-8 text-brand-600 font-semibold"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar title={`Rapport annuel ${year}`} back />

      <div className="px-4 pt-2 pb-12">
        {/* Sélecteur famille */}
        {myFamilies.length > 1 && !selectedFamilyId && (
          <>
            <p className="px-1 mb-2 text-[13px] font-semibold uppercase tracking-wider text-ios-gray">
              Pour quelle famille ?
            </p>
            <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm">
              {myFamilies.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFamilyId(f.id)}
                  className={cn(
                    'w-full px-4 py-3.5 text-left active:bg-ios-gray6',
                    i < myFamilies.length - 1 && 'border-b border-ios-separator/10'
                  )}
                >
                  <p className="text-[16px] font-medium">{f.name}</p>
                  <p className="text-[13px] text-ios-gray">
                    {f.member_count} membre{f.member_count > 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {selectedFamily && (
          <div className="space-y-5">
            <div className="bg-brand-50 rounded-ios-lg p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-brand-600">
                Famille
              </p>
              <p className="text-[18px] font-semibold mt-0.5">{selectedFamily.name}</p>
            </div>

            {/* Résumé absences (auto) */}
            <div>
              <p className="px-1 mb-2 text-[13px] font-semibold uppercase tracking-wider text-ios-gray">
                Absences {year} (auto-calculé)
              </p>
              <div className="bg-white rounded-ios-lg p-4 shadow-ios-sm">
                <p className="text-[24px] font-bold tracking-sf-tighter">
                  {totalAbsences} <span className="text-[14px] text-ios-gray font-normal">absences au total</span>
                </p>
                {absencesSummary.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {absencesSummary.slice(0, 5).map((a) => (
                      <div key={a.name} className="flex justify-between text-[14px]">
                        <span className="truncate">{a.name}</span>
                        <span className="text-ios-gray font-semibold">{a.count}×</span>
                      </div>
                    ))}
                    {absencesSummary.length > 5 && (
                      <p className="text-[12px] text-ios-gray mt-1">
                        +{absencesSummary.length - 5} autres
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Croissance */}
            <div>
              <label className="block text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
                Croissance de la famille
              </label>
              <textarea
                value={growthNotes}
                onChange={(e) => setGrowthNotes(e.target.value)}
                placeholder="Nouveaux membres accueillis, départs, évolutions notables…"
                rows={4}
                className="w-full bg-white text-ios-label-light rounded-ios-lg p-4 outline-none text-[17px] resize-none border border-ios-gray5 placeholder:text-ios-gray2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 tracking-sf-tight"
              />
            </div>

            {/* Faits marquants */}
            <div>
              <label className="block text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
                Faits marquants / Témoignages
              </label>
              <textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="Événements importants, témoignages, sujets de prière…"
                rows={5}
                className="w-full bg-white text-ios-label-light rounded-ios-lg p-4 outline-none text-[17px] resize-none border border-ios-gray5 placeholder:text-ios-gray2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 tracking-sf-tight"
              />
            </div>

            <IOSButton
              fullWidth
              size="lg"
              onClick={handleSubmit}
              isLoading={submitting}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Envoyer au pasteur
            </IOSButton>

            <p className="text-[12px] text-ios-gray text-center">
              Un PDF sera généré et envoyé automatiquement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
