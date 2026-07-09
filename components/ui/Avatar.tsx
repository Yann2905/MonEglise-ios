'use client';

import { cn, getInitials } from '@/lib/utils';
import { cldUrl } from '@/lib/cloudinary';
import Image from 'next/image';
import { memo, useState } from 'react';

interface AvatarProps {
  firstName: string;
  lastName: string;
  src?: string | null;
  size?: number;
  className?: string;
}

/**
 * Avatar memoise : evite les re-renders inutiles dans les longues listes
 * (membres, familles, notifications). Rendu 3-5x moins souvent lors des
 * scroll ou state changes non-related.
 */
function AvatarInner({ firstName, lastName, src, size = 44, className }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  // Demande à Cloudinary la version optimisée (taille × densité écran 2x)
  // → réduit le poids réseau de ~95% sur les listes de membres
  const optimizedSrc = cldUrl(src, { w: size * 2, h: size * 2, face: true });
  const showImage = optimizedSrc && !errored;
  const initials = getInitials(firstName, lastName);
  const fontSize = Math.round(size * 0.36);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full',
        'bg-brand-100',
        className
      )}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image
          src={optimizedSrc}
          alt={`${firstName} ${lastName}`}
          fill
          sizes={`${size * 2}px`}
          className="object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span
          className="font-bold text-brand-600 tracking-sf-tight select-none"
          style={{ fontSize }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

export const Avatar = memo(AvatarInner);
