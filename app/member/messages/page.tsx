'use client';
import { NavBar } from '@/components/ui/NavBar';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function MemberMessagesPage() {
  return (
    <div>
      <NavBar largeTitle="Messages" />
      <ComingSoon title="Messages du pasteur" description="Bientôt disponible." />
    </div>
  );
}
