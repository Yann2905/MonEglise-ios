'use client';
import { NavBar } from '@/components/ui/NavBar';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function MemberFamiliesPage() {
  return (
    <div>
      <NavBar largeTitle="Familles" />
      <ComingSoon title="Mes familles" description="Bientôt disponible." />
    </div>
  );
}
