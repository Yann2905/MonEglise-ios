'use client';
import { NavBar } from '@/components/ui/NavBar';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function AdminNewSermonPage() {
  return (
    <div>
      <NavBar title="Nouvelle prédication" back />
      <ComingSoon title="Ajouter une prédication" description="Bientôt disponible." />
    </div>
  );
}
