'use client';
import { NavBar } from '@/components/ui/NavBar';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function MemberSermonsPage() {
  return (
    <div>
      <NavBar title="Prédications" back />
      <ComingSoon title="Lecteur de prédications" description="Bientôt disponible." />
    </div>
  );
}
