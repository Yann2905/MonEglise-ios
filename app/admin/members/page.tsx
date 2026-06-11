'use client';
import { NavBar } from '@/components/ui/NavBar';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function AdminMembersPage() {
  return (
    <div>
      <NavBar largeTitle="Membres" />
      <ComingSoon title="Liste des membres" description="Bientôt disponible dans la prochaine mise à jour." />
    </div>
  );
}
