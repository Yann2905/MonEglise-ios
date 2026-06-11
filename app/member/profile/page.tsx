'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Phone, MapPin, ShieldCheck, Moon, Sun, Pencil } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { AvatarEditor } from '@/components/ui/AvatarEditor';
import { IOSAlert } from '@/components/ui/IOSAlert';
import { NavBar } from '@/components/ui/NavBar';
import { labelOfChurchRole } from '@/lib/utils';

export default function MemberProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  return (
    <div>
      <NavBar largeTitle="Mon profil" />

      <div className="px-5 pt-2">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center pt-4 pb-6"
        >
          <AvatarEditor size={96} />
          <h2 className="mt-4 text-[22px] font-bold tracking-sf-tighter">
            {user.first_name} {user.last_name}
          </h2>
          <p className="mt-1 text-[14px] text-ios-gray">{labelOfChurchRole(user.church_role)}</p>
          <button
            onClick={() => router.push('/member/profile/edit')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-50 text-brand-600 text-[13px] font-semibold active:opacity-70"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier le profil
          </button>
        </motion.div>

        <SectionLabel>Informations</SectionLabel>
        <Card>
          <Row icon={<Phone className="h-5 w-5" />} label="Téléphone" value={user.phone} />
          <Row icon={<MapPin className="h-5 w-5" />} label="Quartier" value={user.quartier || '—'} />
          {user.admin_code && (
            <Row icon={<ShieldCheck className="h-5 w-5" />} label="Code église" value={user.admin_code} />
          )}
        </Card>

        <SectionLabel className="mt-6">Apparence</SectionLabel>
        <Card>
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-ios-gray6"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-ios bg-brand-50 text-brand-600">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-[16px] font-medium tracking-sf-tight">Mode sombre</p>
              <p className="text-[13px] text-ios-gray">
                {theme === 'dark' ? 'Activé' : 'Désactivé'}
              </p>
            </div>
            <Switch on={theme === 'dark'} />
          </button>
        </Card>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="mt-8 w-full h-14 rounded-ios-lg bg-white text-ios-red font-semibold text-[16px] flex items-center justify-center gap-2 shadow-ios-sm active:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Se déconnecter
        </button>

        <p className="mt-6 mb-32 text-center text-[12px] text-ios-gray">MonÉglise — v1.0</p>
      </div>

      <IOSAlert
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Se déconnecter ?"
        message="Vous devrez vous reconnecter pour accéder à l'application."
        actions={[
          { label: 'Annuler', variant: 'cancel' },
          {
            label: 'Déconnexion',
            variant: 'destructive',
            onClick: () => {
              logout();
              router.replace('/');
            },
          },
        ]}
      />
    </div>
  );
}

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1 ${className}`}>
      {children}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm divide-y divide-ios-separator/10">
      {children}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-ios bg-brand-50 text-brand-600">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-ios-gray">{label}</p>
        <p className="text-[16px] font-medium tracking-sf-tight truncate">{value}</p>
      </div>
    </div>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <div
      className={`w-12 h-7 rounded-full p-0.5 transition-colors flex items-center ${
        on ? 'bg-ios-green justify-end' : 'bg-ios-gray3 justify-start'
      }`}
    >
      <div className="h-6 w-6 rounded-full bg-white shadow-ios-sm" />
    </div>
  );
}
