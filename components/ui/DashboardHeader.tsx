'use client';

import { Building2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cldUrl } from '@/lib/cloudinary';

interface DashboardHeaderProps {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  /** ex. "Pasteur" pour l'admin, undefined pour un membre */
  prefix?: string;
  churchName?: string;
  churchLogoUrl?: string | null;
  unread?: number;
  onAvatarClick?: () => void;
  onBellClick?: () => void;
}

/**
 * Header éditorial premium.
 * Disposition :
 *  - Top : nom église · date (texte simple, petit)
 *  - Milieu : greeting + nom à gauche, GROS LOGO à droite (~80px)
 *  - Bas : avatar agrandi (~56px) sous le nom du pasteur
 */
export function DashboardHeader({
  firstName,
  lastName,
  avatarUrl,
  prefix,
  churchName,
  churchLogoUrl,
  onAvatarClick,
}: DashboardHeaderProps) {
  const logoSrc = cldUrl(churchLogoUrl, { w: 224, h: 224 });
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
      {/* Liseré lumineux supérieur */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-white/15" />

      <div className="relative px-5 pt-2 pb-4">
        {/* TOP : nom église + date (petit, simple) */}
        <p className="text-[11px] font-semibold uppercase tracking-[2.2px] text-white/70 truncate mb-3">
          {churchName ? `${churchName} · ${today}` : today}
        </p>

        {/* Bloc principal : texte + avatar à gauche, GROS LOGO à droite */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p
              className="text-[19px] italic text-white/85 leading-tight"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              {greeting},
            </p>
            <h1
              className="mt-0.5 text-[38px] font-semibold leading-[1.02] text-white"
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                letterSpacing: '-0.025em',
              }}
            >
              {displayName}.
            </h1>
            {/* AVATAR directement sous le nom, gap minimal */}
            <button
              onClick={onAvatarClick}
              aria-label="Profil"
              className="active:opacity-80 inline-block mt-2"
            >
              <Avatar
                firstName={firstName}
                lastName={lastName}
                src={avatarUrl}
                size={64}
                className="ring-[1.5px] ring-gold-400/50 shadow-lg"
              />
            </button>
          </div>

          {/* GROS LOGO à droite */}
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={`Logo ${churchName ?? ''}`}
              className="h-28 w-28 rounded-full object-cover ring-2 ring-gold-400/60 shadow-xl flex-shrink-0"
            />
          ) : (
            <div className="h-28 w-28 rounded-full bg-white/12 ring-2 ring-gold-400/60 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <Building2 className="h-12 w-12 text-white/80" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
