// Helper centralisé pour créer des notifications.
//
// PATTERN QUEUE :
// On insère uniquement dans `notifications` avec push_status='pending'.
// Le worker `process-push-queue` (cron toutes les minutes) draine la
// file et envoie les push FCM de façon asynchrone.
//
// Bénéfice : retour immédiat au client (~50ms) même pour 200 destinataires,
// retry auto en cas d'échec, pas de risque de timeout côté Edge Function.

import { supabase } from './supabase';

export type NotifType = 'system' | 'absence' | 'reminder' | 'alert' | 'custom' | 'sermon';

interface NotifyParams {
  /** IDs des destinataires (filtrés des doublons, du sender si présent) */
  recipients: string[];
  title: string;
  message: string;
  type: NotifType;
  senderId: string;
  actorName?: string | null;
  metadata?: Record<string, any>;
  /** URL (relative) vers laquelle la notif push doit deeplink quand cliquée */
  link?: string;
  /** Force l'envoi synchrone (bypass de la queue) — pour les cas critiques uniquement */
  bypassQueue?: boolean;
}

export async function notify(p: NotifyParams) {
  const ids = Array.from(new Set(p.recipients.filter((id) => id && id !== p.senderId)));
  if (ids.length === 0) return { inserted: 0 };

  // Metadata enrichie avec le link (le worker le lit pour le payload FCM)
  const metadata = {
    ...(p.metadata ?? {}),
    ...(p.link ? { link: p.link } : {}),
  };

  // Insert en DB — push_status='pending' par défaut.
  // Le worker process-push-queue les ramasse dans la minute.
  const rows = ids.map((rid) => ({
    title: p.title,
    message: p.message,
    type: p.type,
    sender_id: p.senderId,
    receiver_id: rid,
    actor_name: p.actorName ?? null,
    is_read: false,
    metadata,
    push_status: 'pending',
  }));

  const { error } = await supabase.from('notifications').insert(rows);
  if (error) {
    console.warn('notify: insert failed', error);
    return { inserted: 0, error: error.message };
  }

  // Mode bypass (synchrone) — pour notifs critiques type "code OTP"
  // qui demandent une livraison immédiate. Pas utilisé actuellement.
  if (p.bypassQueue) {
    try {
      await supabase.functions.invoke('send-push', {
        body: {
          title: p.title,
          message: p.message,
          user_ids: ids,
          link: p.link,
          data: { type: p.type, ...metadata },
        },
      });
    } catch (e) {
      console.warn('notify: bypass send-push failed', e);
    }
  }

  return { inserted: ids.length };
}

/** Récupère tous les user_ids d'une église (sauf le sender) */
export async function allChurchMemberIds(churchId: string, except?: string): Promise<string[]> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('church_id', churchId);
  return ((data as { id: string }[] | null) ?? [])
    .map((u) => u.id)
    .filter((id) => id !== except);
}
