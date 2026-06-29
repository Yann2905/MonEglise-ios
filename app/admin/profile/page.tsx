'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Phone, MapPin, ShieldCheck, Copy, Moon, Sun, Pencil, Bell } from 'lucide-react';
import { subscribePush } from '@/lib/push-notifications';
import { LogoEditor } from '@/components/ui/LogoEditor';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { AvatarEditor } from '@/components/ui/AvatarEditor';
import { IOSAlert } from '@/components/ui/IOSAlert';
import { NavBar } from '@/components/ui/NavBar';
import { labelOfChurchRole } from '@/lib/utils';

export default function AdminProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
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
          <AvatarEditor size={96} />
          <h2 className="mt-4 text-[22px] font-bold tracking-sf-tighter">
            {user.first_name} {user.last_name}
          </h2>
          <p className="mt-1 text-[14px] text-ios-gray">{labelOfChurchRole(user.church_role)}</p>
          <button
            onClick={() => router.push('/admin/profile/edit')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-50 text-brand-600 text-[13px] font-semibold active:opacity-70"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier le profil
          </button>
        </motion.div>

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

        {/* Logo de l'église */}
        {user.church_id && (
          <>
            <SectionLabel>Logo de l'église</SectionLabel>
            <div className="mb-6 rounded-ios-lg bg-white p-5 shadow-ios-sm flex items-center gap-4">
              <LogoEditor churchId={user.church_id} size={80} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium">Logo</p>
                <p className="text-[12px] text-ios-gray mt-1 leading-snug">
                  Visible par tous les membres de l'église dans le header et le welcome.
                </p>
              </div>
            </div>
          </>
        )}

        <SectionLabel>Informations</SectionLabel>
        <Card>
          <Row icon={<Phone className="h-5 w-5" />} label="Téléphone" value={user.phone} />
          <Row icon={<MapPin className="h-5 w-5" />} label="Quartier" value={user.quartier || '—'} />
          <Row icon={<ShieldCheck className="h-5 w-5" />} label="Rôle" value="Pasteur principal" />
        </Card>

        <SectionLabel className="mt-6">Notifications</SectionLabel>
        <Card>
          <button
            onClick={async () => {
              const t = toast.loading('Configuration des notifications…');
              const r = await subscribePush(user.id);
              toast.dismiss(t);
              if (r.ok) toast.success('Notifications activées');
              else if (r.reason === 'denied') toast.error('Permission refusée');
              else if (r.reason === 'unsupported') toast.error('Non supporté sur ce navigateur. Installez l\'app sur l\'écran d\'accueil.');
              else if (r.reason === 'no-vapid') toast.error('Configuration manquante (VAPID).');
              else toast.error('Erreur : ' + r.reason);
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-ios-gray6"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-ios bg-brand-50 text-brand-600">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[16px] font-medium tracking-sf-tight">Activer les notifications</p>
              <p className="text-[13px] text-ios-gray">Recevoir les alertes même app fermée</p>
            </div>
            <span className="text-ios-gray3 text-xl">›</span>
          </button>
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

        <button
          onClick={() => router.push('/legal')}
          className="mt-4 w-full text-center text-[13px] text-brand-600 font-medium active:opacity-60"
        >
          CGU & Confidentialité
        </button>

        <p className="mt-3 mb-32 text-center text-[12px] text-ios-gray">MonÉglise — v1.0</p>
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
