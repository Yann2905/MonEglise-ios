'use client';

export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ios-bg-light dark:bg-black z-30 pointer-events-none">
      <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
    </div>
  );
}
