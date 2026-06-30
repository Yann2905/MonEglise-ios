'use client';

import { useEffect, useState } from 'react';
import { Battery, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DISMISSED_KEY = 'android_battery_onboarding_dismissed_v1';

/**
 * Bandeau affiché UNE fois aux users Android pour expliquer comment
 * désactiver l'optimisation batterie. Sans ça, Android tue Chrome en
 * background → pushes manqués même app fermée.
 *
 * Détecte Android via user-agent. iOS ne voit pas ce bandeau.
 * Disparait après clic "Compris" ou croix (localStorage persistant).
 */
export function AndroidBatteryOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Detect Android only
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(ua);
    if (!isAndroid) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (Notification.permission !== 'granted') return; // Only after they enabled notifs

    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {}
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mx-4 mt-3"
        >
          <div className="relative rounded-ios-lg bg-gradient-to-br from-amber-500 to-orange-600 p-4 shadow-ios-md">
            <button
              onClick={dismiss}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-white/80 active:bg-white/10"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3 pr-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                <Battery className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-white tracking-sf-tight">
                  Réglage Android nécessaire
                </p>
                <p className="mt-1 text-[13px] text-white/95 leading-relaxed">
                  Pour recevoir les notifs même app fermée :
                  <br />
                  <span className="font-medium">Réglages → Apps → Chrome → Batterie → "Sans restrictions"</span>
                </p>
                <p className="mt-1 text-[12px] text-white/80">
                  Sans ça, Android peut bloquer les pushes après quelques minutes.
                </p>
                <button
                  onClick={dismiss}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-amber-700 active:opacity-80"
                >
                  J'ai compris
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
