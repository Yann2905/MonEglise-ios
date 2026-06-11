'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useModal } from '@/lib/modal-context';

interface IOSAlertAction {
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'cancel';
  /** Si true, fermeture auto après onClick */
  closeOnTap?: boolean;
}

interface IOSAlertProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message?: string | ReactNode;
  actions: IOSAlertAction[];
}

/** Dialog iOS style — petit modal centré avec actions séparées par des lignes */
export function IOSAlert({ open, onClose, title, message, actions }: IOSAlertProps) {
  const { open: openModal, close: closeModal } = useModal();
  useEffect(() => {
    if (open) {
      openModal();
      return () => {
        closeModal();
      };
    }
  }, [open, openModal, closeModal]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 24,
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[300px] rounded-[14px] overflow-hidden bg-white/95 backdrop-blur-xl shadow-ios-xl"
            >
              <div className="px-4 pt-5 pb-4 text-center">
                <h3 className="text-[17px] font-semibold text-ios-label-light tracking-sf-tight">
                  {title}
                </h3>
                {message && (
                  <div className="mt-1.5 text-[13px] text-ios-label-light/80 leading-snug">
                    {typeof message === 'string' ? <p>{message}</p> : message}
                  </div>
                )}
              </div>

              <div className="border-t border-ios-separator/30">
                {actions.length <= 2 ? (
                  <div className="flex divide-x divide-ios-separator/30">
                    {actions.map((a, i) => (
                      <ActionButton key={i} action={a} onClose={onClose} />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-ios-separator/30">
                    {actions.map((a, i) => (
                      <ActionButton key={i} action={a} onClose={onClose} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ActionButton({
  action,
  onClose,
}: {
  action: IOSAlertAction;
  onClose: () => void;
}) {
  const onClick = () => {
    action.onClick?.();
    if (action.closeOnTap !== false) onClose();
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 h-11 text-[17px] tracking-sf-tight',
        'active:bg-ios-gray6 transition-colors',
        action.variant === 'destructive' && 'text-ios-red font-semibold',
        action.variant === 'cancel' && 'font-semibold text-brand-600',
        (!action.variant || action.variant === 'default') && 'text-brand-600'
      )}
    >
      {action.label}
    </button>
  );
}
