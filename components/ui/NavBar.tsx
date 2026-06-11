'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NavBarProps {
  title?: string;
  largeTitle?: string;
  back?: boolean;
  onBack?: () => void;
  trailing?: ReactNode;
  transparent?: boolean;
  className?: string;
}

/**
 * NavBar style iOS avec backdrop-blur quand on scroll.
 * Utilise `largeTitle` pour le titre Large iOS (grand titre qui se rétracte).
 */
export function NavBar({
  title,
  largeTitle,
  back,
  onBack,
  trailing,
  transparent,
  className,
}: NavBarProps) {
  const router = useRouter();

  return (
    <>
      <div
        className={cn(
          'sticky top-0 z-40 w-full pt-safe',
          !transparent && 'ios-glass border-b border-ios-separator/10',
          className
        )}
      >
        <div className="flex h-11 items-center justify-between px-3">
          <div className="w-16 flex items-center">
            {back && (
              <button
                onClick={() => (onBack ? onBack() : router.back())}
                className="flex items-center -ml-2 px-2 py-2 active:opacity-60 transition-opacity"
                aria-label="Retour"
              >
                <ChevronLeft className="h-6 w-6 text-brand-600" />
              </button>
            )}
          </div>

          {title && !largeTitle && (
            <h1 className="text-[17px] font-semibold text-ios-label-light tracking-sf-tight">
              {title}
            </h1>
          )}

          <div className="w-16 flex items-center justify-end">{trailing}</div>
        </div>
      </div>

      {largeTitle && (
        <div className="px-5 pt-2 pb-3">
          <h1 className="text-[34px] font-bold text-ios-label-light tracking-sf-tighter">
            {largeTitle}
          </h1>
        </div>
      )}
    </>
  );
}
