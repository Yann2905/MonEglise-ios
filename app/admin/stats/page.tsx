'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, UsersRound, CalendarX, Award } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { Avatar } from '@/components/ui/Avatar';
import { formatDateLong, cn } from '@/lib/utils';
import { StatCardSkeleton, ListSkeleton } from '@/components/ui/Skeleton';

interface FamilyAbsenceStats {
  family_id: string;
  family_name: string;
  total_appels: number;
  total_absents: number;
  avg_absents: number; // moyenne par appel
}

interface MemberAbsenceStats {
  user_id: string;
  name: string;
  avatar_url: string | null;
  absences_count: number;
}

export default function AdminStatsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [totalMembers, setTotalMembers] = useState(0);
  const [totalFamilies, setTotalFamilies] = useState(0);
  const [totalSermons, setTotalSermons] = useState(0);
  const [totalAbsences30d, setTotalAbsences30d] = useState(0);

  const [growth, setGrowth] = useState<{ month: string; count: number }[]>([]);
  const [worstFamilies, setWorstFamilies] = useState<FamilyAbsenceStats[]>([]);
  const [worstMembers, setWorstMembers] = useState<MemberAbsenceStats[]>([]);

  useEffect(() => {
    if (!user?.church_id) return;
    const churchId = user.church_id;

    (async () => {
      setLoading(true);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);

      // ─── Compteurs globaux ───
      const [{ count: mCount }, { count: fCount }, { count: sCount }] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('church_id', churchId),
        supabase
          .from('families')
          .select('*', { count: 'exact', head: true })
          .eq('church_id', churchId)
          .eq('is_institutional', false),
        supabase.from('sermons').select('*', { count: 'exact', head: true }).eq('church_id', churchId),
      ]);
      setTotalMembers(mCount ?? 0);
      setTotalFamilies(fCount ?? 0);
      setTotalSermons(sCount ?? 0);

      // ─── Membres par mois (croissance 6 derniers mois) ───
      const { data: allUsers } = await supabase
        .from('users')
        .select('created_at')
        .eq('church_id', churchId);
      const monthCounts: Record<string, number> = {};
      const months: { key: string; label: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.push({ key, label: d.toLocaleDateString('fr-FR', { month: 'short' }) });
        monthCounts[key] = 0;
      }
      // Cumulé : combien d'utilisateurs créés ≤ fin de chaque mois
      const sorted = ((allUsers as { created_at: string }[] | null) ?? [])
        .map((u) => new Date(u.created_at).getTime())
        .sort((a, b) => a - b);
      const growthData = months.map((m) => {
        const [y, mo] = m.key.split('-').map(Number);
        const endOfMonth = new Date(y, mo, 0, 23, 59, 59).getTime();
        return { month: m.label, count: sorted.filter((t) => t <= endOfMonth).length };
      });
      setGrowth(growthData);

      // ─── Absences sur 30 jours ───
      const { data: recentAbsences } = await supabase
        .from('absences')
        .select('id, family_id, family_name, absent_count, absent_members, date')
        .gte('date', thirtyDaysAgo.toISOString())
        .order('date', { ascending: false });
      const abs = (recentAbsences as any[]) ?? [];
      const totalAbs = abs.reduce((sum, a) => sum + (a.absent_count ?? 0), 0);
      setTotalAbsences30d(totalAbs);

      // ─── Top familles avec le + d'absents ───
      const famAgg: Record<string, FamilyAbsenceStats> = {};
      for (const a of abs) {
        const k = a.family_id as string;
        if (!famAgg[k]) {
          famAgg[k] = {
            family_id: k,
            family_name: a.family_name,
            total_appels: 0,
            total_absents: 0,
            avg_absents: 0,
          };
        }
        famAgg[k].total_appels++;
        famAgg[k].total_absents += a.absent_count ?? 0;
      }
      Object.values(famAgg).forEach((s) => {
        s.avg_absents = s.total_appels > 0 ? s.total_absents / s.total_appels : 0;
      });
      const top = Object.values(famAgg)
        .sort((a, b) => b.total_absents - a.total_absents)
        .slice(0, 5);
      setWorstFamilies(top);

      // ─── Top membres avec le + d'absences ───
      const memAgg: Record<string, MemberAbsenceStats> = {};
      for (const a of abs) {
        for (const m of (a.absent_members as any[]) ?? []) {
          if (!m.user_id) continue;
          if (!memAgg[m.user_id]) {
            memAgg[m.user_id] = {
              user_id: m.user_id,
              name: m.name,
              avatar_url: null,
              absences_count: 0,
            };
          }
          memAgg[m.user_id].absences_count++;
        }
      }
      // Récupère les avatars
      const ids = Object.keys(memAgg);
      if (ids.length) {
        const { data: users } = await supabase
          .from('users')
          .select('id, avatar_url')
          .in('id', ids);
        for (const u of (users as any[]) ?? []) {
          if (memAgg[u.id]) memAgg[u.id].avatar_url = u.avatar_url;
        }
      }
      const topMembers = Object.values(memAgg)
        .sort((a, b) => b.absences_count - a.absences_count)
        .slice(0, 5);
      setWorstMembers(topMembers);

      setLoading(false);
    })();
  }, [user]);

  const maxGrowth = Math.max(...growth.map((g) => g.count), 1);

  return (
    <div>
      <NavBar title="Statistiques" back />

      <div className="px-4 pt-2 pb-8 space-y-5">
        {/* Compteurs */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <BigStat icon={<Users className="h-5 w-5" />} color="bg-blue-50 text-ios-blue" label="Membres" value={totalMembers} />
            <BigStat icon={<UsersRound className="h-5 w-5" />} color="bg-purple-50 text-ios-purple" label="Familles" value={totalFamilies} />
            <BigStat icon={<CalendarX className="h-5 w-5" />} color="bg-red-50 text-ios-red" label="Absences (30j)" value={totalAbsences30d} />
            <BigStat icon={<TrendingUp className="h-5 w-5" />} color="bg-green-50 text-ios-green" label="Prédications" value={totalSermons} />
          </div>
        )}

        {/* Courbe croissance */}
        <Card title="Croissance des membres" subtitle="6 derniers mois">
          {loading ? (
            <div className="h-32 animate-pulse bg-ios-gray5 rounded" />
          ) : (
            <div className="flex items-end justify-between h-32 gap-2 px-2">
              {growth.map((g, i) => {
                const heightPct = (g.count / maxGrowth) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[10px] text-ios-gray font-semibold">{g.count}</div>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-brand-600 to-brand-400"
                        style={{ height: `${Math.max(4, heightPct)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-ios-gray">{g.month}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Top familles d'absents */}
        <Card title="Familles à surveiller" subtitle="Top 5 sur 30 jours">
          {loading ? (
            <ListSkeleton count={3} />
          ) : worstFamilies.length === 0 ? (
            <p className="text-ios-gray text-[14px] py-4 text-center">Aucune absence enregistrée</p>
          ) : (
            <div className="divide-y divide-ios-separator/10">
              {worstFamilies.map((f, i) => (
                <div key={f.family_id} className="px-4 py-3 flex items-center gap-3">
                  <div className="h-7 w-7 flex items-center justify-center rounded-full bg-ios-red/10 text-ios-red text-[12px] font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium truncate">{f.family_name}</p>
                    <p className="text-[12px] text-ios-gray">
                      {f.total_absents} absents · {f.total_appels} appel{f.total_appels > 1 ? 's' : ''} · {f.avg_absents.toFixed(1)} par appel
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top membres absents */}
        <Card title="Membres souvent absents" subtitle="Top 5 sur 30 jours">
          {loading ? (
            <ListSkeleton count={3} />
          ) : worstMembers.length === 0 ? (
            <p className="text-ios-gray text-[14px] py-4 text-center">Aucune absence enregistrée</p>
          ) : (
            <div className="divide-y divide-ios-separator/10">
              {worstMembers.map((m, i) => {
                const [first, ...rest] = m.name.split(' ');
                const last = rest.join(' ');
                return (
                  <div key={m.user_id} className="px-4 py-3 flex items-center gap-3">
                    <div className="h-7 w-7 flex items-center justify-center rounded-full bg-ios-orange/10 text-ios-orange text-[12px] font-bold">
                      {i + 1}
                    </div>
                    <Avatar firstName={first} lastName={last} src={m.avatar_url} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium truncate">{m.name}</p>
                      <p className="text-[12px] text-ios-gray">
                        {m.absences_count} absence{m.absences_count > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function BigStat({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: number }) {
  return (
    <div className="rounded-ios-xl bg-white p-4 shadow-ios-sm">
      <div className={cn('inline-flex h-9 w-9 items-center justify-center rounded-ios', color)}>{icon}</div>
      <p className="mt-2.5 text-[12px] font-medium text-ios-gray uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-[28px] font-bold tracking-sf-tighter">{value}</p>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-ios-xl shadow-ios-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <p className="text-[15px] font-bold tracking-sf-tight">{title}</p>
        {subtitle && <p className="text-[12px] text-ios-gray mt-0.5">{subtitle}</p>}
      </div>
      <div className="pb-2">{children}</div>
    </div>
  );
}
