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
 * Header éditorial premium — Apple News + Hallow + Substack.
 * Disposition :
 *  - Top-left : Logo rond (56px) + nom église + date
 *  - Top-right : vide (pour l'épure)
 *  - Milieu : salutation italique + nom grand serif
 *  - Bas : filet doré + avatar rond (44px, ring or)
 */
export function DashboardHeader({
  firstName,
  lastName,
  avatarUrl,
  prefix,
  churchName,
  churchLogoUrl,
  // unread + onBellClick gardés dans l'API pour compat — non utilisés ici
  onAvatarClick,
}: DashboardHeaderProps) {
  const logoSrc = cldUrl(churchLogoUrl, { w: 128, h: 128 });
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

      <div className="relative px-5 pt-3 pb-6">
        {/* TOP-LEFT : Logo rond + nom + date */}
        <div className="flex items-center gap-3 mb-7">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={`Logo ${churchName ?? ''}`}
              className="h-14 w-14 rounded-full object-cover ring-[1.5px] ring-gold-400/50 shadow-lg flex-shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-white/12 ring-[1.5px] ring-gold-400/50 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-white/80" />
            </div>
          )}
          <div className="min-w-0">
            {churchName && (
              <p className="text-[15px] font-semibold tracking-sf-tight text-white truncate">
                {churchName}
              </p>
            )}
            <p className="text-[12px] text-white/65 capitalize">{today}</p>
          </div>
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

        {/* Filet doré + photo de profil */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gold-400/40" />
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
      </div>
    </header>
  );
}
