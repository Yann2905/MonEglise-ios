'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useModal } from '@/lib/modal-context';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Hauteur max (par défaut 90vh) */
  maxHeight?: string;
}

/** Bottom sheet style iOS avec drag handle + backdrop fadein + spring anim */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  maxHeight = '90dvh',
}: BottomSheetProps) {
  const { open: openModal, close: closeModal } = useModal();

  // Empêche le scroll body + signale au modal context (pour cacher tab bar)
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      openModal();
      return () => {
        document.body.style.overflow = '';
        closeModal();
      };
    }
  }, [open, openModal, closeModal]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 280,
              mass: 0.6,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-[101]',
              'bg-white dark:bg-ios-bg-darkSecondary rounded-t-[24px]',
              'shadow-ios-xl',
              'pb-safe'
            )}
            style={{ maxHeight }}
          >
            <div className="ios-handle" />

            {title && (
              <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-ios-separator/10 dark:border-white/10">
                <h2 className="text-[17px] font-semibold tracking-sf-tight text-ios-label-light dark:text-white">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="text-[15px] text-brand-600 font-medium active:opacity-60"
                >
                  OK
                </button>
              </div>
            )}

            <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(90dvh - 80px)' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
