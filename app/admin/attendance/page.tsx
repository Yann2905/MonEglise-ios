'use client';
import { NavBar } from '@/components/ui/NavBar';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function AdminAttendancePage() {
  return (
    <div>
      <NavBar largeTitle="Appel" />
      <ComingSoon title="Faire l'appel" description="Bientôt disponible dans la prochaine mise à jour." />
    </div>
  );
}
