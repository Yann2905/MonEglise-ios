'use client';
import { NavBar } from '@/components/ui/NavBar';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function AdminFamiliesPage() {
  return (
    <div>
      <NavBar largeTitle="Familles" />
      <ComingSoon title="Gestion des familles" description="Bientôt disponible dans la prochaine mise à jour." />
    </div>
  );
}
