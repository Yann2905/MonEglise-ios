'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const CURRENT_BUILD = process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev';
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Détecte qu'une nouvelle version est en ligne et déclenche une mise à jour.
 *
 * Stratégie :
 *  - Quand l'app revient au premier plan (visibilitychange) → check + reload immédiat
 *    si mismatch (l'utilisateur vient d'ouvrir l'app, pas de risque de perdre du travail).
 *  - Toutes les 5 min en arrière-plan → si mismatch détecté pendant l'usage,
 *    on affiche un toast discret au lieu de forcer le reload.
 *  - Si SW Firebase Messaging est enregistré, on l'unregister avant reload
 *    pour qu'il télécharge la nouvelle version au prochain démarrage.
 */
export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const reloadedRef = useRef(false);
  const initialCheckDone = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (CURRENT_BUILD === 'dev') return; // skip en dev

    let cancelled = false;

    const checkVersion = async (): Promise<'same' | 'different' | 'error'> => {
      try {
        const ts = Date.now();
        const res = await fetch(`/api/version?_=${ts}`, { cache: 'no-store' });
        if (!res.ok) return 'error';
        const data = (await res.json()) as { buildId?: string };
        if (cancelled) return 'error';
        if (!data.buildId) return 'error';
        return data.buildId === CURRENT_BUILD ? 'same' : 'different';
      } catch {
        return 'error';
      }
    };

    const reloadApp = async () => {
      if (reloadedRef.current) return;
      reloadedRef.current = true;
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const r of regs) await r.update().catch(() => {});
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {}
      window.location.reload();
    };

    const handleFocus = async () => {
      if (document.visibilityState !== 'visible') return;
      const status = await checkVersion();
      if (status === 'different') {
        // On vient juste de revenir au premier plan : reload immédiat
        await reloadApp();
      }
    };

    const handleInterval = async () => {
      const status = await checkVersion();
      if (status === 'different' && !updateAvailable) {
        setUpdateAvailable(true);
        toast(
          (t) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Mise à jour disponible</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  reloadApp();
                }}
                style={{
                  background: '#234A87',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Recharger
              </button>
            </span>
          ),
          { duration: Infinity, id: 'update-available' }
        );
      }
    };

    // Check initial (après 2 sec pour laisser l'app se charger)
    const initialTimer = setTimeout(() => {
      if (!initialCheckDone.current) {
        initialCheckDone.current = true;
        handleFocus();
      }
    }, 2000);

    // Check à chaque retour de l'app au premier plan
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    // Check périodique
    const interval = setInterval(handleInterval, CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [updateAvailable]);

  return null;
}
