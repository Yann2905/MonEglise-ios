'use client';
import { NavBar } from '@/components/ui/NavBar';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function AdminNotificationsPage() {
  return (
    <div>
      <NavBar largeTitle="Alertes" />
      <ComingSoon title="Envoi de notifications" description="Bientôt disponible dans la prochaine mise à jour." />
    </div>
  );
}
