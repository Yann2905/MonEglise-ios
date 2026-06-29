'use client';

import { Bell } from 'lucide-react';
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

/**
 * Header éditorial premium — inspiré Apple News, Hallow, Substack.
 * Approche "magazine cover" : un grand statement typographique +
 * métadonnées discrètes + détails luxueux (trait doré, gradient mesh).
 */
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

  const displayName = prefix ? `${prefix} ${firstName}` : firstName;

  return (
    <header className="relative pt-safe overflow-hidden bg-brand-700">
      {/* Gradient mesh subtil pour profondeur */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(ellipse 70% 50% at 0% 100%, rgba(10,19,37,0.5), transparent 60%)',
        }}
      />
      {/* Liseré lumineux supérieur (glass reflection) */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-white/15" />

      <div className="relative px-5 pt-3 pb-7">
        {/* Top bar : cloche à gauche, avatar à droite */}
        <div className="flex items-center justify-between mb-7">
          <button
            onClick={onBellClick}
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-white/[0.08] ring-1 ring-white/15 backdrop-blur-md active:scale-95 transition"
          >
            <Bell className="h-[18px] w-[18px] text-white" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-ios-red px-1 text-[10px] font-bold text-white ring-2 ring-brand-700">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          <button
            onClick={onAvatarClick}
            aria-label="Profil"
            className="active:opacity-80 flex-shrink-0"
          >
            <Avatar
              firstName={firstName}
              lastName={lastName}
              src={avatarUrl}
              size={44}
              className="ring-[1.5px] ring-gold-400/50 shadow-lg"
            />
          </button>
        </div>

        {/* Bloc éditorial : salutation italique + nom grand serif */}
        <div>
          <p
            className="text-[19px] italic text-white/85 leading-tight"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            {greeting},
          </p>
          <h1
            className="mt-0.5 text-[40px] font-semibold leading-[1.02] text-white"
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              letterSpacing: '-0.025em',
            }}
          >
            {displayName}.
          </h1>
        </div>

        {/* Filet doré + métadonnées discrètes */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px w-8 bg-gold-400/80" />
          <p className="text-[10.5px] font-semibold uppercase tracking-[2.2px] text-white/65">
            {churchName ? `${churchName} · ${today}` : today}
          </p>
        </div>
      </div>

    </header>
  );
}
