'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Send, CheckCircle2, Sparkles, TrendingDown, TrendingUp, Award, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { IOSButton } from '@/components/ui/IOSButton';
import { uploadRaw } from '@/lib/cloudinary';
import {
  generateAnnualReportPdf,
  type AbsenceItem,
  type NewMemberItem,
  type TopAssiduousItem,
} from '@/lib/annual-report-pdf';
import { notify } from '@/lib/notifications';
import { cn, labelOfChurchRole } from '@/lib/utils';
import type { Family } from '@/lib/types';

interface AutoReport {
  year: number;
  totalMembers: number;
  membersList: { name: string; role: string }[];
  newMembers: NewMemberItem[];
  totalCalls: number;
  totalAbsences: number;
  attendanceRate: number;
  absencesPerMember: AbsenceItem[];
  topAssiduous: TopAssiduousItem[];
  prevYearAbsences: number | null;
  deltaAbsences: number | null;
}

export default function AnnualReportPage() {
  return (
    <Suspense fallback={<Loader />}>
      <Content />
    </Suspense>
  );
}

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ios-bg-light">
      <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
    </div>
  );
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function Content() {
  const router = useRouter();
  const search = useSearchParams();
  const { user } = useAuth();
  const year = new Date().getFullYear();

  const queryFamilyId = search.get('family_id');
  const [myFamilies, setMyFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(queryFamilyId);
  const [report, setReport] = useState<AutoReport | null>(null);
  const [churchName, setChurchName] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      if (!selectedFamilyId && list.length === 1) setSelectedFamilyId(list[0].id);

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

  // Quand on choisit une famille → auto-génère tout
  useEffect(() => {
    if (!selectedFamilyId) return;
    (async () => {
      setGenerating(true);
      try {
        const data = await buildReport(selectedFamilyId, year);
        setReport(data);
      } catch (e: any) {
        toast.error('Génération impossible : ' + e.message);
      } finally {
        setGenerating(false);
      }
    })();
  }, [selectedFamilyId, year]);

  const selectedFamily = myFamilies.find((f) => f.id === selectedFamilyId);

  const handleSubmit = async () => {
    if (!user || !selectedFamily || !user.church_id || !report) return;
    setSubmitting(true);
    const t = toast.loading('Envoi du rapport…');
    try {
      // 1. PDF
      const pdfBlob = generateAnnualReportPdf({
        churchName,
        familyName: selectedFamily.name,
        year: report.year,
        submittedByName: `${user.first_name} ${user.last_name}`,
        totalMembers: report.totalMembers,
        membersList: report.membersList,
        newMembers: report.newMembers,
        totalCalls: report.totalCalls,
        totalAbsences: report.totalAbsences,
        attendanceRate: report.attendanceRate,
        absencesPerMember: report.absencesPerMember,
        topAssiduous: report.topAssiduous,
        prevYearAbsences: report.prevYearAbsences,
        deltaAbsences: report.deltaAbsences,
      });

      // 2. Upload Cloudinary
      const filename = `rapport-${selectedFamily.name.replace(/\s+/g, '-')}-${year}-${Date.now()}.pdf`;
      const folder = `moneglise/${user.church_id}/reports/${year}`;
      const { url, publicId } = await uploadRaw(pdfBlob, folder, filename);

      // 3. Sauvegarde DB
      const { error } = await supabase.from('annual_reports').upsert(
        {
          church_id: user.church_id,
          family_id: selectedFamily.id,
          family_name: selectedFamily.name,
          year,
          submitted_by: user.id,
          submitted_by_name: `${user.first_name} ${user.last_name}`,
          absences_summary: report.absencesPerMember,
          total_absences: report.totalAbsences,
          growth_notes: JSON.stringify({
            newMembers: report.newMembers,
            topAssiduous: report.topAssiduous,
            attendanceRate: report.attendanceRate,
          }),
          highlights: null,
          pdf_url: url,
          pdf_public_id: publicId,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'family_id,year' }
      );
      if (error) throw error;

      // 4. Notif pasteur
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

  const previewPdf = () => {
    if (!user || !selectedFamily || !report) return;
    const blob = generateAnnualReportPdf({
      churchName,
      familyName: selectedFamily.name,
      year: report.year,
      submittedByName: `${user.first_name} ${user.last_name}`,
      totalMembers: report.totalMembers,
      membersList: report.membersList,
      newMembers: report.newMembers,
      totalCalls: report.totalCalls,
      totalAbsences: report.totalAbsences,
      attendanceRate: report.attendanceRate,
      absencesPerMember: report.absencesPerMember,
      topAssiduous: report.topAssiduous,
      prevYearAbsences: report.prevYearAbsences,
      deltaAbsences: report.deltaAbsences,
    });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (loading) return <Loader />;

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
          <button onClick={() => router.push('/member')} className="mt-8 text-brand-600 font-semibold">
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
        {/* Sélecteur famille si plusieurs */}
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
                </button>
              ))}
            </div>
          </>
        )}

        {selectedFamily && generating && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <Sparkles className="h-12 w-12 text-brand-600 animate-pulse" />
              <div className="absolute inset-0 h-12 w-12 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
            </div>
            <p className="mt-5 text-[15px] font-semibold">Génération en cours…</p>
            <p className="mt-1 text-[13px] text-ios-gray">L'app analyse vos données</p>
          </div>
        )}

        {selectedFamily && !generating && report && (
          <div className="space-y-4">
            {/* Banner famille */}
            <div className="rounded-ios-xl bg-gradient-to-br from-brand-600 to-brand-500 p-5 text-white shadow-ios-lg">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">Rapport {year}</p>
              <h2 className="mt-1 text-[24px] font-bold tracking-sf-tighter">{selectedFamily.name}</h2>
              <p className="mt-1 text-[13px] text-white/90">{churchName}</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-2">
              <StatCard icon={<Users className="h-4 w-4" />} label="Membres" value={report.totalMembers} sub={`+${report.newMembers.length}`} color="bg-blue-50 text-ios-blue" />
              <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Assiduité" value={`${report.attendanceRate}%`} sub={`${report.totalCalls - report.totalAbsences}/${report.totalCalls}`} color="bg-green-50 text-ios-green" />
              <StatCard
                icon={report.deltaAbsences != null && report.deltaAbsences < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                label="Absences"
                value={report.totalAbsences}
                sub={report.deltaAbsences != null ? (report.deltaAbsences > 0 ? `+${report.deltaAbsences}` : `${report.deltaAbsences}`) : 'cette année'}
                color={report.deltaAbsences != null && report.deltaAbsences > 0 ? 'bg-red-50 text-ios-red' : 'bg-green-50 text-ios-green'}
              />
            </div>

            {/* Nouveaux membres */}
            <Section icon={<UserPlus className="h-4 w-4" />} title={`Nouveaux membres (${report.newMembers.length})`}>
              {report.newMembers.length === 0 ? (
                <p className="text-[13px] text-ios-gray">Aucun nouveau membre cette année</p>
              ) : (
                <div className="space-y-1.5">
                  {report.newMembers.map((m, i) => (
                    <div key={i} className="flex justify-between items-center text-[14px]">
                      <span>{m.name}</span>
                      <span className="text-ios-gray text-[12px]">{m.monthLabel}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Top 3 assidus */}
            {report.topAssiduous.length > 0 && (
              <Section icon={<Award className="h-4 w-4" />} title="Top 3 des plus assidus">
                <div className="space-y-2">
                  {report.topAssiduous.map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[14px] font-bold text-gold-500 w-6">#{i + 1}</span>
                      <span className="flex-1 text-[14px]">{t.name}</span>
                      <span className="text-[14px] font-bold text-ios-green">{t.attendanceRate}%</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Détail absences */}
            <Section icon={<FileText className="h-4 w-4" />} title={`Détail absences (${report.absencesPerMember.length})`}>
              {report.absencesPerMember.length === 0 ? (
                <p className="text-[13px] text-ios-gray">Aucune absence cette année 🎉</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
                  {report.absencesPerMember.map((a) => (
                    <div key={a.user_id || a.name} className="flex justify-between text-[14px]">
                      <span className="truncate">{a.name}</span>
                      <span className="text-ios-gray font-semibold">{a.count}×</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Actions */}
            <button
              onClick={previewPdf}
              className="w-full h-12 rounded-ios-lg bg-ios-gray6 text-brand-600 font-semibold text-[15px] active:opacity-70"
            >
              👀 Aperçu PDF
            </button>

            <IOSButton fullWidth size="lg" onClick={handleSubmit} isLoading={submitting} leftIcon={<Send className="h-4 w-4" />}>
              Envoyer au pasteur
            </IOSButton>

            <p className="text-[12px] text-ios-gray text-center">
              Rapport généré 100% automatiquement à partir des données de l'année.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-ios-lg p-4 shadow-ios-sm">
      <div className="flex items-center gap-2 mb-3 text-brand-600">
        {icon}
        <p className="text-[12px] font-bold uppercase tracking-wider">{title}</p>
      </div>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-ios-lg p-3 shadow-ios-sm">
      <div className={cn('inline-flex h-7 w-7 items-center justify-center rounded-ios', color)}>{icon}</div>
      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-ios-gray">{label}</p>
      <p className="text-[20px] font-bold tracking-sf-tighter">{value}</p>
      <p className="text-[10px] text-ios-gray truncate">{sub}</p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Construction du rapport (toute la logique métier)
// ───────────────────────────────────────────────────────────
async function buildReport(familyId: string, year: number): Promise<AutoReport> {
  const startOfYear = new Date(year, 0, 1).toISOString();
  const startOfNextYear = new Date(year + 1, 0, 1).toISOString();
  const startOfPrevYear = new Date(year - 1, 0, 1).toISOString();

  // 1. Membres actuels
  const { data: links } = await supabase
    .from('family_members')
    .select('user_id, joined_at')
    .eq('family_id', familyId);

  const memberIds = ((links as any[]) ?? []).map((l) => l.user_id);
  const joinedMap: Record<string, string> = {};
  ((links as any[]) ?? []).forEach((l) => {
    if (l.joined_at) joinedMap[l.user_id] = l.joined_at;
  });

  const { data: users } = memberIds.length
    ? await supabase
        .from('users')
        .select('id, first_name, last_name, church_role')
        .in('id', memberIds)
    : { data: [] };

  const membersList = ((users as any[]) ?? []).map((u) => ({
    name: `${u.first_name} ${u.last_name}`,
    role: labelOfChurchRole(u.church_role),
  }));

  // 2. Nouveaux membres (joined_at dans l'année courante)
  const newMembers: NewMemberItem[] = [];
  for (const u of (users as any[]) ?? []) {
    const joined = joinedMap[u.id];
    if (!joined) continue;
    const d = new Date(joined);
    if (d.getFullYear() === year) {
      newMembers.push({
        name: `${u.first_name} ${u.last_name}`,
        monthLabel: MONTHS[d.getMonth()],
      });
    }
  }
  newMembers.sort((a, b) => MONTHS.indexOf(a.monthLabel) - MONTHS.indexOf(b.monthLabel));

  // 3. Absences de l'année
  const { data: absences } = await supabase
    .from('absences')
    .select('absent_members, date')
    .eq('family_id', familyId)
    .gte('date', startOfYear)
    .lt('date', startOfNextYear);

  const absencesArr = (absences as any[]) ?? [];
  const totalCalls = absencesArr.length;

  const counts: Record<string, AbsenceItem> = {};
  let totalAbsences = 0;
  for (const a of absencesArr) {
    for (const m of (a.absent_members as any[]) ?? []) {
      const key = m.user_id || m.name;
      if (!counts[key]) counts[key] = { user_id: m.user_id || '', name: m.name, count: 0 };
      counts[key].count++;
      totalAbsences++;
    }
  }
  const absencesPerMember = Object.values(counts).sort((a, b) => b.count - a.count);

  // 4. Attendance rate global
  const attendanceRate =
    totalCalls > 0 && membersList.length > 0
      ? Math.round(((totalCalls * membersList.length - totalAbsences) / (totalCalls * membersList.length)) * 100)
      : 100;

  // 5. Top 3 plus assidus
  const topAssiduous: TopAssiduousItem[] = [];
  if (totalCalls > 0) {
    const ranking = membersList.map((m) => {
      const abs = absencesPerMember.find((a) => a.name === m.name)?.count ?? 0;
      const rate = Math.round(((totalCalls - abs) / totalCalls) * 100);
      return { name: m.name, attendanceRate: rate };
    });
    ranking.sort((a, b) => b.attendanceRate - a.attendanceRate);
    topAssiduous.push(...ranking.slice(0, 3));
  }

  // 6. Comparaison année précédente
  const { count: prevYearAbsenceCount } = await supabase
    .from('absences')
    .select('absent_count', { count: 'exact', head: false })
    .eq('family_id', familyId)
    .gte('date', startOfPrevYear)
    .lt('date', startOfYear);

  let prevYearAbsences: number | null = null;
  let deltaAbsences: number | null = null;
  if (prevYearAbsenceCount != null && prevYearAbsenceCount > 0) {
    const { data: prevYearAbs } = await supabase
      .from('absences')
      .select('absent_count')
      .eq('family_id', familyId)
      .gte('date', startOfPrevYear)
      .lt('date', startOfYear);
    const sumPrev = ((prevYearAbs as any[]) ?? []).reduce(
      (s, a) => s + (a.absent_count ?? 0),
      0
    );
    prevYearAbsences = sumPrev;
    deltaAbsences = totalAbsences - sumPrev;
  }

  return {
    year,
    totalMembers: membersList.length,
    membersList,
    newMembers,
    totalCalls,
    totalAbsences,
    attendanceRate,
    absencesPerMember,
    topAssiduous,
    prevYearAbsences,
    deltaAbsences,
  };
}
