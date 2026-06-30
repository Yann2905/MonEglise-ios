'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, UsersRound, MessageCircle, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { TabBar } from '@/components/ui/TabBar';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/');
  }, [user, loading, router]);

  // Compteur non lus en realtime (pour badge tab bar + favicon)
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      setUnread(count ?? 0);
    };
    load();
    const ch = supabase
      .channel(`unread_member_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `receiver_id=eq.${user.id}` },
        load
      )
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user]);

  // Met aussi le badge sur l'icône PWA (App Badging API)
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const nav = navigator as any;
    if (unread > 0 && nav.setAppBadge) nav.setAppBadge(unread).catch(() => {});
    else if (nav.clearAppBadge) nav.clearAppBadge().catch(() => {});
  }, [unread]);

  if (loading || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ios-bg-light">
        <div className="h-12 w-12 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { key: '/member', label: 'Accueil', icon: <Home className="h-6 w-6" /> },
    { key: '/member/families', label: 'Familles', icon: <UsersRound className="h-6 w-6" /> },
    {
      key: '/member/messages',
      label: 'Messages',
      icon: <MessageCircle className="h-6 w-6" />,
      badge: unread,
    },
    { key: '/member/profile', label: 'Profil', icon: <User className="h-6 w-6" /> },
  ];

  return (
    <div className="min-h-[100dvh] bg-ios-bg-light pb-[140px]">
      {children}

      <TabBar
        items={tabs}
        activeKey={resolveActiveTab(pathname, tabs.map((t) => t.key))}
        onChange={(key) => router.push(key)}
      />
    </div>
  );
}

function resolveActiveTab(pathname: string, keys: string[]): string {
  const sorted = [...keys].sort((a, b) => b.length - a.length);
  for (const k of sorted) {
    if (pathname === k || pathname.startsWith(k + '/')) return k;
  }
  return keys[0];
}
