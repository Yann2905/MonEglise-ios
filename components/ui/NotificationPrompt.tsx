'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { subscribePush } from '@/lib/push-notifications';

const DISMISSED_KEY = 'notif_prompt_dismissed_v1';

/**
 * Bandeau affiché sur le dashboard quand l'utilisateur n'a pas encore
 * autorisé les notifications. Disparaît automatiquement quand :
 * - Notification.permission === 'granted' (déjà autorisé)
 * - Notification.permission === 'denied' (refusé par l'OS)
 * - L'utilisateur clique sur la croix (sauvegardé dans localStorage)
 *
 * iOS PWA installée requise pour que les notifs marchent (Web Push iOS 16.4+).
 */
export function NotificationPrompt() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    // Déjà autorisé, refusé, ou dismissé manuellement → ne rien afficher
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Délai léger pour ne pas s'afficher en même temps que le dashboard
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, []);

  const enable = async () => {
    if (!user) return;
    setLoading(true);
    const r = await subscribePush(user.id);
    setLoading(false);
    if (r.ok) {
      toast.success('Notifications activées');
      setShow(false);
    } else if (r.reason === 'denied') {
      toast.error('Permission refusée. Activez dans Réglages.');
      setShow(false);
    } else if (r.reason === 'unsupported') {
      toast.error('Installez l\'app sur l\'écran d\'accueil d\'abord');
    } else {
      toast.error('Erreur : ' + (r.reason ?? 'inconnue'));
    }
  };

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
          <div className="relative rounded-ios-lg bg-gradient-to-br from-brand-600 to-brand-700 p-4 shadow-ios-md">
            <button
              onClick={dismiss}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-white/70 active:bg-white/10"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3 pr-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-white tracking-sf-tight">
                  Activer les notifications
                </p>
                <p className="mt-0.5 text-[13px] text-white/80">
                  Recevoir les alertes même quand l'app est fermée
                </p>
                <button
                  onClick={enable}
                  disabled={loading}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-brand-700 active:opacity-80 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="h-3 w-3 rounded-full border-2 border-brand-200 border-t-brand-700 animate-spin" />
                      Configuration…
                    </>
                  ) : (
                    'Activer maintenant'
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
