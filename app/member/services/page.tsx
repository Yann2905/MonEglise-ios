'use client';
import { NavBar } from '@/components/ui/NavBar';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function MemberServicesPage() {
  return (
    <div>
      <NavBar title="Programmes" back />
      <ComingSoon title="Cultes & événements" description="Bientôt disponible." />
    </div>
  );
}
