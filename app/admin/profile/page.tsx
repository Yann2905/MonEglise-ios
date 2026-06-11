'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Phone, MapPin, ShieldCheck, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from '@/components/ui/Avatar';
import { IOSAlert } from '@/components/ui/IOSAlert';
import { NavBar } from '@/components/ui/NavBar';
import { labelOfChurchRole } from '@/lib/utils';

export default function AdminProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  const copyCode = () => {
    if (!user.member_code) return;
    navigator.clipboard.writeText(user.member_code);
    toast.success('Code copié !');
  };

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

        {/* Code église à partager */}
        {user.member_code && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-6 rounded-ios-xl bg-gradient-to-br from-brand-50 to-brand-100/60 p-5 shadow-ios-sm"
          >
            <p className="text-[12px] font-semibold uppercase tracking-wider text-brand-600">
              Code d'invitation
            </p>
            <p className="mt-1 text-[13px] text-ios-gray">
              Partagez ce code à vos fidèles pour qu'ils rejoignent l'app.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span
                className="text-[32px] font-bold tracking-[8px] text-brand-600"
                style={{ fontFamily: 'SF Mono, monospace' }}
              >
                {user.member_code}
              </span>
              <button
                onClick={copyCode}
                className="ml-auto p-2.5 rounded-ios bg-white shadow-ios-sm active:opacity-60"
                aria-label="Copier"
              >
                <Copy className="h-5 w-5 text-brand-600" />
              </button>
            </div>
          </motion.div>
        )}

        <p className="text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
          Informations
        </p>
        <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm divide-y divide-ios-separator/10">
          <Row icon={<Phone className="h-5 w-5" />} label="Téléphone" value={user.phone} />
          <Row icon={<MapPin className="h-5 w-5" />} label="Quartier" value={user.quartier || '—'} />
          <Row icon={<ShieldCheck className="h-5 w-5" />} label="Rôle" value="Pasteur principal" />
        </div>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="mt-8 w-full h-14 rounded-ios-lg bg-white text-ios-red font-semibold text-[16px] flex items-center justify-center gap-2 shadow-ios-sm active:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Se déconnecter
        </button>

        <p className="mt-6 text-center text-[12px] text-ios-gray pb-4">MonÉglise — v1.0</p>
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
