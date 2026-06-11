'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { useModal } from '@/lib/modal-context';

export interface TabItem {
  key: string;
  label: string;
  icon: ReactNode;
  iconActive?: ReactNode;
  badge?: number;
}

interface TabBarProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

/**
 * Tab bar flottante style iOS 18 — pill arrondi avec backdrop-blur.
 * Disparaît automatiquement quand un BottomSheet/modal est ouvert.
 */
export function TabBar({ items, activeKey, onChange }: TabBarProps) {
  const { modalOpen } = useModal();

  return (
    <AnimatePresence>
      {!modalOpen && (
        <motion.div
          key="tabbar"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 pb-safe pointer-events-none"
        >
          <div className="px-4 pb-2 pointer-events-auto">
            <div className="mx-auto max-w-md">
              <div
                className={cn(
                  'ios-glass rounded-[28px]',
                  'shadow-ios-xl',
                  'border border-black/5 dark:border-white/5',
                  'flex items-center justify-around px-2 py-2'
                )}
              >
                {items.map((item) => {
                  const active = item.key === activeKey;
                  return (
                    <button
                      key={item.key}
                      onClick={() => onChange(item.key)}
                      className="relative flex flex-1 items-center justify-center"
                    >
                      <motion.div
                        animate={{
                          backgroundColor: active ? '#234A87' : 'rgba(0,0,0,0)',
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="flex h-11 w-11 items-center justify-center rounded-[14px]"
                      >
                        <div
                          className={cn(
                            'transition-colors',
                            active ? 'text-white' : 'text-ios-gray'
                          )}
                        >
                          {active && item.iconActive ? item.iconActive : item.icon}
                        </div>
                      </motion.div>

                      {item.badge && item.badge > 0 ? (
                        <span
                          className={cn(
                            'absolute top-0.5 right-2',
                            'flex h-4 min-w-[16px] items-center justify-center rounded-full px-1',
                            'bg-ios-red text-white text-[10px] font-bold'
                          )}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
