'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/** Bloc gris animé avec shimmer */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-ios-gray5 rounded-md overflow-hidden relative',
        'before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r',
        'before:from-transparent before:via-white/40 before:to-transparent',
        'before:animate-[shimmer_1.5s_infinite]',
        className
      )}
    />
  );
}

/** Skeleton pour une ligne de liste (avatar + 2 lignes texte) */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

/** Skeleton pour une carte stat (icone + label + valeur) */
export function StatCardSkeleton() {
  return (
    <div className="rounded-ios-xl bg-white p-4 shadow-ios-sm">
      <Skeleton className="h-9 w-9 rounded-ios" />
      <Skeleton className="h-2.5 w-1/2 mt-3" />
      <Skeleton className="h-7 w-12 mt-2" />
    </div>
  );
}

/** Liste de N ListItemSkeleton encartés */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm divide-y divide-ios-separator/10">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}
