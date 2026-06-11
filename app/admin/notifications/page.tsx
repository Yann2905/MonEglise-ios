'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, BellRing } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { IOSButton } from '@/components/ui/IOSButton';
import { IOSTextField } from '@/components/ui/IOSTextField';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatDateTime, cn } from '@/lib/utils';
import type { Notification, Family } from '@/lib/types';

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<'received' | 'send'>('received');
  const [received, setReceived] = useState<Notification[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [showFamilyPicker, setShowFamilyPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [openNotif, setOpenNotif] = useState<Notification | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });
      setReceived((data as Notification[]) ?? []);
    };
    load();
    const ch = supabase
      .channel(`admin_notifs_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `receiver_id=eq.${user.id}` }, load)
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!user?.church_id) return;
    supabase
      .from('v_families_enriched')
      .select('*')
      .eq('church_id', user.church_id)
      .eq('is_institutional', false)
      .order('name')
      .then(({ data }) => setFamilies((data as Family[]) ?? []));
  }, [user]);

  const send = async () => {
    if (!user || !title.trim() || !message.trim()) {
      toast.error('Titre et message obligatoires');
      return;
    }
    if (!sendToAll && selectedFamilyIds.length === 0) {
      toast.error('Sélectionnez au moins une famille');
      return;
    }
    setSending(true);

    try {
      const recipients = new Set<string>();
      if (sendToAll) {
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('church_id', user.church_id);
        (data as { id: string }[] | null)?.forEach((u) => recipients.add(u.id));
      } else {
        const { data } = await supabase
          .from('family_members')
          .select('user_id')
          .in('family_id', selectedFamilyIds);
        (data as { user_id: string }[] | null)?.forEach((r) => recipients.add(r.user_id));
      }
      recipients.delete(user.id);

      if (recipients.size === 0) {
        toast.error('Aucun destinataire');
        setSending(false);
        return;
      }

      const rows = Array.from(recipients).map((rid) => ({
        title: title.trim(),
        message: message.trim(),
        type: 'custom',
        sender_id: user.id,
        receiver_id: rid,
        is_read: false,
      }));
      const { error } = await supabase.from('notifications').insert(rows);
      if (error) throw error;

      // Edge function push (best-effort)
      try {
        await supabase.functions.invoke('send-push', {
          body: {
            title: title.trim(),
            message: message.trim(),
            user_ids: Array.from(recipients),
            data: { type: 'custom' },
          },
        });
      } catch {}

      toast.success(`Envoyée à ${recipients.size} membre${recipients.size > 1 ? 's' : ''}`);
      setTitle('');
      setMessage('');
      setSelectedFamilyIds([]);
      setSendToAll(true);
      setTab('received');
    } catch (e: any) {
      toast.error("Impossible d'envoyer : " + e.message);
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  return (
    <div>
      <NavBar largeTitle="Alertes" />

      {/* Segmented control */}
      <div className="px-4 mt-1">
        <div className="bg-ios-gray5 rounded-ios-lg p-1 flex">
          {(['received', 'send'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 rounded-ios text-[14px] font-semibold transition-all',
                tab === t ? 'bg-white text-ios-label-light shadow-ios-sm' : 'text-ios-gray'
              )}
            >
              {t === 'received' ? 'Reçues' : 'Envoyer'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-5">
        {tab === 'received' ? (
          received.length === 0 ? (
            <div className="text-center py-16">
              <BellRing className="h-14 w-14 text-ios-gray3 mx-auto mb-3" />
              <p className="text-ios-gray">Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-2">
              {received.map((n) => {
                const isAbsenceNotif = n.type === 'absence';
                const absenceId = (n.metadata as any)?.absence_id;
                const handleTap = () => {
                  if (!n.is_read) markAsRead(n.id);
                  if (isAbsenceNotif && absenceId) {
                    router.push(`/admin/absence/${absenceId}`);
                  } else {
                    setOpenNotif(n);
                  }
                };
                return (
                  <button
                    key={n.id}
                    onClick={handleTap}
                    className="w-full bg-white rounded-ios-lg p-4 text-left shadow-ios-sm active:shadow-ios"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-ios flex items-center justify-center flex-shrink-0',
                          isAbsenceNotif ? 'bg-ios-red/10 text-ios-red' : 'bg-brand-50 text-brand-600'
                        )}
                      >
                        <BellRing className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-semibold truncate">{n.title}</p>
                          {!n.is_read && <span className="h-2 w-2 rounded-full bg-ios-blue flex-shrink-0" />}
                        </div>
                        <p className="text-[13px] text-ios-gray mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-ios-gray3 mt-1">{formatDateTime(n.created_at)}</p>
                      </div>
                      {isAbsenceNotif && absenceId && (
                        <span className="text-ios-gray3 text-xl">›</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          <SendForm
            title={title}
            setTitle={setTitle}
            message={message}
            setMessage={setMessage}
            sendToAll={sendToAll}
            setSendToAll={setSendToAll}
            selectedFamilyIds={selectedFamilyIds}
            families={families}
            onPickRecipients={() => setShowFamilyPicker(true)}
            onSend={send}
            sending={sending}
          />
        )}
      </div>

      {/* Recipients picker */}
      <BottomSheet open={showFamilyPicker} onClose={() => setShowFamilyPicker(false)} title="Destinataires">
        <div className="px-5 pb-6 pt-2 space-y-1">
          <button
            onClick={() => {
              setSendToAll(true);
              setSelectedFamilyIds([]);
            }}
            className={cn(
              'w-full px-4 py-3 rounded-ios-lg text-left text-[15px] flex items-center justify-between',
              sendToAll ? 'bg-brand-50 text-brand-600 font-semibold' : 'bg-ios-gray6'
            )}
          >
            Tous les membres
            {sendToAll && <Checkmark />}
          </button>
          <p className="px-2 pt-2 text-[12px] font-semibold uppercase tracking-wider text-ios-gray">
            Ou par famille
          </p>
          {families.map((f) => {
            const checked = selectedFamilyIds.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => {
                  setSendToAll(false);
                  setSelectedFamilyIds((prev) =>
                    checked ? prev.filter((x) => x !== f.id) : [...prev, f.id]
                  );
                }}
                className={cn(
                  'w-full px-4 py-3 rounded-ios-lg text-left text-[15px] flex items-center justify-between',
                  checked ? 'bg-brand-50 text-brand-600 font-semibold' : 'bg-ios-gray6'
                )}
              >
                {f.name}
                {checked && <Checkmark />}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Détail notif */}
      <BottomSheet open={!!openNotif} onClose={() => setOpenNotif(null)} title={openNotif?.title}>
        {openNotif && (
          <div className="px-5 pb-6 pt-2">
            <p className="text-[12px] text-ios-gray mb-3">{formatDateTime(openNotif.created_at)}</p>
            <p className="text-[16px] leading-relaxed whitespace-pre-wrap">{openNotif.message}</p>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function SendForm({
  title,
  setTitle,
  message,
  setMessage,
  sendToAll,
  selectedFamilyIds,
  families,
  onPickRecipients,
  onSend,
  sending,
}: any) {
  const recipientsLabel = sendToAll
    ? 'Tous les membres'
    : selectedFamilyIds.length === 0
    ? 'Choisir…'
    : selectedFamilyIds.length === 1
    ? families.find((f: Family) => f.id === selectedFamilyIds[0])?.name ?? ''
    : `${selectedFamilyIds.length} familles`;

  return (
    <div className="space-y-4">
      <IOSTextField
        label="Titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre de la notification"
      />
      <div>
        <label className="block text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Votre message…"
          rows={5}
          className="w-full bg-ios-gray6 rounded-ios-lg p-4 outline-none text-[16px] tracking-sf-tight resize-none focus:bg-white focus:ring-2 focus:ring-brand-500/40"
        />
      </div>
      <div>
        <label className="block text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
          Destinataires
        </label>
        <button
          onClick={onPickRecipients}
          className="w-full h-14 bg-ios-gray6 rounded-ios-lg px-4 flex items-center justify-between text-[16px] font-medium text-ios-label-light"
        >
          <span>{recipientsLabel}</span>
          <svg className="h-4 w-4 text-ios-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <IOSButton fullWidth size="lg" onClick={onSend} isLoading={sending} leftIcon={<Send className="h-4 w-4" />}>
        Envoyer
      </IOSButton>
    </div>
  );
}

function Checkmark() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
