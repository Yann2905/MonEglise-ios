'use client';

import { Bell, Church } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface DashboardHeaderProps {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  /** ex. "Pasteur" pour l'admin, undefined pour un membre */
  prefix?: string;
  churchName?: string;
  unread?: number;
  onAvatarClick?: () => void;
  onBellClick?: () => void;
}

export function DashboardHeader({
  firstName,
  lastName,
  avatarUrl,
  prefix,
  churchName,
  unread = 0,
  onAvatarClick,
  onBellClick,
}: DashboardHeaderProps) {
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  })();

  return (
    <header className="relative overflow-hidden rounded-b-[32px] pt-safe shadow-ios-lg">
      {/* Fond : dégradé profond + halo lumineux */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500" />
      <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/20" />

      <div className="relative px-5 pt-3 pb-6">
        {/* Ligne du haut : église + cloche */}
        <div className="flex items-center justify-between">
          {churchName ? (
            <div className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 backdrop-blur-md ring-1 ring-white/15">
              <Church className="h-3.5 w-3.5 text-white/90" />
              <span className="max-w-[160px] truncate text-[12px] font-semibold tracking-wide text-white">
                {churchName}
              </span>
            </div>
          ) : (
            <span />
          )}

          <button
            onClick={onBellClick}
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-white/12 backdrop-blur-md ring-1 ring-white/15 active:scale-95 transition"
          >
            <Bell className="h-5 w-5 text-white" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-ios-red px-1 text-[10px] font-bold text-white ring-2 ring-brand-600">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>
        </div>

        {/* Salutation + identité */}
        <div className="mt-5 flex items-center gap-4">
          <button onClick={onAvatarClick} className="active:opacity-70 flex-shrink-0">
            <Avatar
              firstName={firstName}
              lastName={lastName}
              src={avatarUrl}
              size={52}
              className="ring-2 ring-white/40 shadow-lg"
            />
          </button>
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[1.5px] text-white/70">
              {greeting}
            </p>
            <h1
              className="truncate text-[26px] font-semibold leading-tight text-white"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              {prefix ? `${prefix} ${firstName}` : firstName}
            </h1>
          </div>
        </div>

        {/* Date */}
        <p className="mt-4 text-[12.5px] font-medium capitalize text-white/65">{today}</p>
      </div>
    </header>
  );
}
