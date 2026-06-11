// Helper centralisé pour créer des notifications.
// - Insert dans `notifications` table (alimente la cloche + Realtime)
// - Invoque l'Edge Function `send-push` (envoi FCM aux device_tokens)
//
// Best-effort sur le push : si l'edge fonction est down, la notif reste
// quand même créée en DB et visible quand l'app s'ouvre.

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
}

export async function notify(p: NotifyParams) {
  const ids = Array.from(new Set(p.recipients.filter((id) => id && id !== p.senderId)));
  if (ids.length === 0) return { inserted: 0 };

  // 1. Insert en DB pour la cloche / l'historique
  const rows = ids.map((rid) => ({
    title: p.title,
    message: p.message,
    type: p.type,
    sender_id: p.senderId,
    receiver_id: rid,
    actor_name: p.actorName ?? null,
    is_read: false,
    metadata: p.metadata ?? null,
  }));
  const { error } = await supabase.from('notifications').insert(rows);
  if (error) {
    console.warn('notify: insert failed', error);
    // On continue quand même pour le push
  }

  // 2. Push (FCM) best-effort
  try {
    await supabase.functions.invoke('send-push', {
      body: {
        title: p.title,
        message: p.message,
        user_ids: ids,
        data: { type: p.type, ...(p.metadata ?? {}) },
      },
    });
  } catch (e) {
    console.warn('notify: send-push failed', e);
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
