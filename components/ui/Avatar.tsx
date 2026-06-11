'use client';

import { cn, getInitials } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';

interface AvatarProps {
  firstName: string;
  lastName: string;
  src?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ firstName, lastName, src, size = 44, className }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = src && !errored;
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
          src={src}
          alt={`${firstName} ${lastName}`}
          fill
          sizes={`${size}px`}
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
