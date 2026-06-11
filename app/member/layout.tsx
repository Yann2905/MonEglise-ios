'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Home, UsersRound, MessageCircle, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { TabBar } from '@/components/ui/TabBar';

const tabs = [
  { key: '/member', label: 'Accueil', icon: <Home className="h-6 w-6" /> },
  { key: '/member/families', label: 'Familles', icon: <UsersRound className="h-6 w-6" /> },
  { key: '/member/messages', label: 'Messages', icon: <MessageCircle className="h-6 w-6" /> },
  { key: '/member/profile', label: 'Profil', icon: <User className="h-6 w-6" /> },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ios-bg-light">
        <div className="h-12 w-12 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-ios-bg-light pb-[100px]">
      {children}

      <TabBar
        items={tabs}
        activeKey={tabs.find((t) => pathname === t.key || pathname.startsWith(t.key + '/'))?.key ?? '/member'}
        onChange={(key) => router.push(key)}
      />
    </div>
  );
}
