'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, UsersRound, BellRing, Calendar, Headphones, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { DashboardHeader } from '@/components/ui/DashboardHeader';
import { cn } from '@/lib/utils';

interface Stats {
  members: number;
  families: number;
  unread: number;
  absencesWeek: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ members: 0, families: 0, unread: 0, absencesWeek: 0 });
  const [latestSermon, setLatestSermon] = useState<any>(null);
  const [churchName, setChurchName] = useState('');

  useEffect(() => {
    if (!user?.church_id) return;
    const churchId = user.church_id;

    const loadAll = async () => {
      const [{ count: members }, { count: families }, { count: unread }] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('church_id', churchId),
        supabase.from('families').select('*', { count: 'exact', head: true }).eq('church_id', churchId).eq('is_institutional', false),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false),
      ]);

      const monday = new Date();
      monday.setDate(monday.getDate() - monday.getDay() + 1);
      monday.setHours(0, 0, 0, 0);
      const { count: absencesWeek } = await supabase
        .from('absences')
        .select('*', { count: 'exact', head: true })
        .gte('date', monday.toISOString());

      const { data: church } = await supabase
        .from('churches')
        .select('name')
        .eq('id', churchId)
        .maybeSingle();
      setChurchName((church?.name as string) ?? 'Mon église');

      const { data: sermon } = await supabase
        .from('sermons')
        .select('*')
        .eq('church_id', churchId)
        .order('sermon_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLatestSermon(sermon);

      setStats({
        members: members ?? 0,
        families: families ?? 0,
        unread: unread ?? 0,
        absencesWeek: absencesWeek ?? 0,
      });
    };

    loadAll();

    // Realtime
    const channel = supabase
      .channel(`admin_dashboard_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `church_id=eq.${churchId}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'families', filter: `church_id=eq.${churchId}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sermons', filter: `church_id=eq.${churchId}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `receiver_id=eq.${user.id}` }, loadAll)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  // Préfetch les routes accessibles depuis le dashboard pour navigation instantanée
  useEffect(() => {
    const routes = [
      '/admin/members',
      '/admin/families',
      '/admin/attendance',
      '/admin/notifications',
      '/admin/sermons',
      '/admin/services',
      '/admin/profile',
    ];
    routes.forEach((r) => router.prefetch(r));
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-[100dvh]">
      <DashboardHeader
        firstName={user.first_name}
        lastName={user.last_name}
        avatarUrl={user.avatar_url}
        prefix="Pasteur"
        churchName={churchName}
        unread={stats.unread}
        onAvatarClick={() => router.push('/admin/profile')}
        onBellClick={() => router.push('/admin/notifications')}
      />

      {/* Stats cards SOUS le gradient */}
      <div className="mt-5 px-4 grid grid-cols-2 gap-3">
        <StatCard
          delay={0.05}
          icon={<Users className="h-5 w-5" />}
          color="bg-blue-50 text-ios-blue"
          label="Membres"
          value={stats.members}
          onClick={() => router.push('/admin/members')}
        />
        <StatCard
          delay={0.1}
          icon={<UsersRound className="h-5 w-5" />}
          color="bg-purple-50 text-ios-purple"
          label="Familles"
          value={stats.families}
          onClick={() => router.push('/admin/families')}
        />
        <StatCard
          delay={0.15}
          icon={<Calendar className="h-5 w-5" />}
          color="bg-orange-50 text-ios-orange"
          label="Absences (semaine)"
          value={stats.absencesWeek}
          onClick={() => router.push('/admin/attendance')}
        />
        <StatCard
          delay={0.2}
          icon={<BellRing className="h-5 w-5" />}
          color="bg-red-50 text-ios-red"
          label="Non lus"
          value={stats.unread}
          onClick={() => router.push('/admin/notifications')}
        />
      </div>

      {/* Dernière prédication */}
      {latestSermon && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mx-4 mt-5 rounded-ios-xl bg-gradient-to-br from-brand-600 to-brand-500 p-5 shadow-ios-lg text-white"
        >
          <p className="text-[11px] font-bold tracking-[1.5px] text-white/80">DERNIÈRE PRÉDICATION</p>
          <h2
            className="mt-2 text-[26px] font-semibold leading-tight"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            {latestSermon.theme}
          </h2>
          {latestSermon.verses && (
            <p className="mt-1 text-white/90 text-[14px] italic">{latestSermon.verses}</p>
          )}
          {latestSermon.audio_url && (
            <button
              onClick={() => router.push('/admin/sermons')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-ios bg-white/20 backdrop-blur-md text-white text-[15px] font-semibold active:bg-white/30"
            >
              <Headphones className="h-4 w-4" />
              Écouter
            </button>
          )}
        </motion.div>
      )}

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mx-4 mt-5 space-y-3"
      >
        <button
          onClick={() => router.push('/admin/sermons')}
          className="w-full h-14 rounded-ios-lg bg-white shadow-ios-sm text-brand-600 font-semibold text-[15px] flex items-center justify-between px-5 active:bg-ios-gray6"
        >
          <span className="flex items-center gap-2"><Headphones className="h-5 w-5" /> Mes prédications</span>
          <span className="text-ios-gray3">›</span>
        </button>
        <button
          onClick={() => router.push('/admin/services')}
          className="w-full h-14 rounded-ios-lg bg-white shadow-ios-sm text-brand-600 font-semibold text-[15px] flex items-center justify-between px-5 active:bg-ios-gray6"
        >
          <span className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Programmes & cultes</span>
          <span className="text-ios-gray3">›</span>
        </button>
        <button
          onClick={() => router.push('/admin/stats')}
          className="w-full h-14 rounded-ios-lg bg-white shadow-ios-sm text-brand-600 font-semibold text-[15px] flex items-center justify-between px-5 active:bg-ios-gray6"
        >
          <span className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Statistiques</span>
          <span className="text-ios-gray3">›</span>
        </button>
        <button
          onClick={() => router.push('/admin/sermons/new')}
          className="w-full h-14 rounded-ios-lg border-2 border-dashed border-brand-300 text-brand-600 font-semibold text-[15px] flex items-center justify-center gap-2 active:bg-brand-50"
        >
          + Ajouter une prédication
        </button>
      </motion.div>
    </div>
  );
}

function StatCard({
  delay,
  icon,
  color,
  label,
  value,
  onClick,
}: {
  delay: number;
  icon: React.ReactNode;
  color: string;
  label: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn('rounded-ios-xl bg-white p-4 shadow-ios-sm text-left active:shadow-ios')}
    >
      <div className={cn('inline-flex h-9 w-9 items-center justify-center rounded-ios', color)}>
        {icon}
      </div>
      <p className="mt-2.5 text-[12px] font-medium text-ios-gray uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-[28px] font-bold tracking-sf-tighter text-ios-label-light">{value}</p>
    </motion.button>
  );
}
