'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Phone, MapPin, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from '@/components/ui/Avatar';
import { IOSAlert } from '@/components/ui/IOSAlert';
import { NavBar } from '@/components/ui/NavBar';
import { labelOfChurchRole } from '@/lib/utils';

export default function MemberProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  return (
    <div>
      <NavBar largeTitle="Mon profil" />

      <div className="px-5 pt-2">
        {/* Header avatar */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center pt-4 pb-6"
        >
          <Avatar
            firstName={user.first_name}
            lastName={user.last_name}
            src={user.avatar_url}
            size={96}
          />
          <h2 className="mt-4 text-[22px] font-bold tracking-sf-tighter">
            {user.first_name} {user.last_name}
          </h2>
          <p className="mt-1 text-[14px] text-ios-gray">{labelOfChurchRole(user.church_role)}</p>
        </motion.div>

        {/* Section infos */}
        <p className="text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
          Informations
        </p>
        <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm divide-y divide-ios-separator/10">
          <Row icon={<Phone className="h-5 w-5" />} label="Téléphone" value={user.phone} />
          <Row icon={<MapPin className="h-5 w-5" />} label="Quartier" value={user.quartier || '—'} />
          {user.admin_code && (
            <Row icon={<ShieldCheck className="h-5 w-5" />} label="Code église" value={user.admin_code} />
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="mt-8 w-full h-14 rounded-ios-lg bg-white text-ios-red font-semibold text-[16px] flex items-center justify-center gap-2 shadow-ios-sm active:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Se déconnecter
        </button>

        <p className="mt-6 text-center text-[12px] text-ios-gray pb-4">
          MonÉglise — v1.0
        </p>
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
