'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, BookOpen, MessageCircle, UsersRound, Headphones, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import { DailyVerse } from '@/components/ui/DailyVerse';
import { cn, formatDateLong } from '@/lib/utils';

export default function MemberDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [churchName, setChurchName] = useState('');
  const [latestSermon, setLatestSermon] = useState<any>(null);
  const [nextService, setNextService] = useState<any>(null);
  const [unread, setUnread] = useState(0);
  const [myFamiliesCount, setMyFamiliesCount] = useState(0);
  const [isResponsible, setIsResponsible] = useState(false);

  useEffect(() => {
    if (!user?.church_id) return;
    const churchId = user.church_id;

    const loadAll = async () => {
      const [
        { data: church },
        { data: sermon },
        { data: service },
        { count: unreadCount },
        { count: fams },
      ] = await Promise.all([
        supabase.from('churches').select('name').eq('id', churchId).maybeSingle(),
        supabase
          .from('sermons')
          .select('*')
          .eq('church_id', churchId)
          .order('sermon_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('services')
          .select('*')
          .eq('church_id', churchId)
          .gte('date', new Date().toISOString())
          .order('date')
          .limit(1)
          .maybeSingle(),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false),
        supabase
          .from('family_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      setChurchName((church?.name as string) ?? '');
      setLatestSermon(sermon);
      setNextService(service);
      setUnread(unreadCount ?? 0);
      setMyFamiliesCount(fams ?? 0);

      // Tous les membres d'une famille (non-institutionnelle) peuvent faire l'appel
      const { data: famLinks } = await supabase
        .from('family_members')
        .select('family_id, families!inner(is_institutional)')
        .eq('user_id', user.id);
      const canCall =
        (famLinks as any[] | null)?.some((l) => l.families && !l.families.is_institutional) ?? false;
      setIsResponsible(canCall);
    };

    loadAll();

    const channel = supabase
      .channel(`member_dashboard_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sermons', filter: `church_id=eq.${churchId}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services', filter: `church_id=eq.${churchId}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `receiver_id=eq.${user.id}` }, loadAll)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  if (!user) return null;

  return (
    <div>
      {/* Header */}
      <div className="relative pt-safe overflow-hidden rounded-b-[36px]">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500" />
        <div className="absolute -top-10 -left-10 h-60 w-60 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 h-60 w-60 rounded-full bg-brand-800/40 blur-3xl" />

        <div className="relative px-5 pt-4 pb-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-[13px] font-medium uppercase tracking-wide">{churchName}</p>
              <h1 className="mt-1 text-white text-[28px] font-bold tracking-sf-tighter">
                Bonjour, {user.first_name}
              </h1>
              <p className="mt-0.5 text-white/85 text-[15px] tracking-sf-tight">
                Que la paix de Dieu soit avec toi.
              </p>
            </div>
            <button onClick={() => router.push('/member/profile')} className="active:opacity-70">
              <Avatar
                firstName={user.first_name}
                lastName={user.last_name}
                src={user.avatar_url}
                size={56}
                className="ring-2 ring-white/50"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Pastel cards SOUS le gradient */}
      <div className="mt-5 px-4 grid grid-cols-2 gap-3">
        <PastelCard
          delay={0.05}
          icon={<BookOpen className="h-5 w-5" />}
          color="text-ios-blue"
          bg="from-blue-50 to-blue-100/60"
          label="Prédications"
          value={latestSermon?.theme ?? '—'}
          sub={latestSermon ? formatDateLong(latestSermon.sermon_date) : 'Aucune'}
          onClick={() => router.push('/member/sermons')}
        />
        <PastelCard
          delay={0.1}
          icon={<Calendar className="h-5 w-5" />}
          color="text-ios-teal"
          bg="from-teal-50 to-teal-100/60"
          label="Prochain culte"
          value={
            nextService
              ? `${new Date(nextService.date).getDate()}/${new Date(nextService.date).getMonth() + 1}`
              : '—'
          }
          sub={nextService?.title ?? 'À venir'}
          onClick={() => router.push('/member/services')}
        />
        <PastelCard
          delay={0.15}
          icon={<MessageCircle className="h-5 w-5" />}
          color="text-ios-red"
          bg="from-red-50 to-red-100/60"
          label="Messages"
          value={`${unread}`}
          sub={unread > 0 ? `Non lu${unread > 1 ? 's' : ''}` : 'À jour'}
          onClick={() => router.push('/member/messages')}
        />
        <PastelCard
          delay={0.2}
          icon={<UsersRound className="h-5 w-5" />}
          color="text-ios-purple"
          bg="from-purple-50 to-purple-100/60"
          label="Mes familles"
          value={`${myFamiliesCount}`}
          sub={myFamiliesCount > 1 ? 'groupes' : 'groupe'}
          onClick={() => router.push('/member/families')}
        />
      </div>

      {/* Verset du jour */}
      <DailyVerse />

      {/* Carte "Faire l'appel" pour les responsables */}
      {isResponsible && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mx-4 mt-5"
        >
          <button
            onClick={() => router.push('/member/attendance')}
            className="w-full rounded-ios-xl bg-gradient-to-br from-ios-orange to-orange-400 p-5 shadow-ios-lg text-white text-left active:opacity-90"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-ios bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ClipboardCheck className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold tracking-[1.5px] text-white/80">APPEL D'ABSENCE</p>
                <p className="text-[17px] font-semibold mt-0.5">Faire l'appel de ma famille</p>
              </div>
              <span className="text-2xl text-white/80">›</span>
            </div>
          </button>
        </motion.div>
      )}

      {/* Hero dernière prédication */}
      {latestSermon?.audio_url && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mx-4 mt-5 rounded-ios-xl bg-gradient-to-br from-brand-600 to-brand-500 p-5 shadow-ios-lg text-white"
        >
          <p className="text-[11px] font-bold tracking-[1.5px] text-white/80">PRÉDICATION DU DIMANCHE</p>
          <h2
            className="mt-2 text-[26px] font-semibold leading-tight"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            {latestSermon.theme}
          </h2>
          {latestSermon.verses && (
            <p className="mt-1 text-white/90 text-[14px] italic">{latestSermon.verses}</p>
          )}
          <button
            onClick={() => router.push('/member/sermons')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-ios bg-white text-brand-600 text-[15px] font-semibold active:opacity-80"
          >
            <Headphones className="h-4 w-4" />
            Écouter
          </button>
        </motion.div>
      )}
    </div>
  );
}

function PastelCard({
  delay,
  icon,
  color,
  bg,
  label,
  value,
  sub,
  onClick,
}: {
  delay: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  label: string;
  value: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'rounded-ios-xl p-4 text-left shadow-ios-sm active:shadow-ios',
        'bg-gradient-to-br',
        bg
      )}
    >
      <div className={cn('inline-flex h-9 w-9 items-center justify-center rounded-ios bg-white shadow-ios-sm', color)}>
        {icon}
      </div>
      <p className="mt-2.5 text-[12px] font-medium text-ios-label-light/70 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-[22px] font-bold tracking-sf-tighter text-ios-label-light truncate">{value}</p>
      <p className="text-[12px] text-ios-label-light/60 truncate">{sub}</p>
    </motion.button>
  );
}
