'use client';

import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatDateTime } from '@/lib/utils';
import type { Notification } from '@/lib/types';

export default function MemberMessagesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState<Notification | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });
      setItems((data as Notification[]) ?? []);
    };
    load();
    const ch = supabase
      .channel(`msgs_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `receiver_id=eq.${user.id}` }, load)
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  return (
    <div>
      <NavBar largeTitle="Messages" />

      <div className="px-4 pt-2">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <BellRing className="h-14 w-14 text-ios-gray3 mx-auto mb-3" />
            <p className="text-ios-gray">Aucun message</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setOpen(n);
                  if (!n.is_read) markRead(n.id);
                }}
                className="w-full bg-white rounded-ios-lg p-4 text-left shadow-ios-sm active:shadow-ios"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-ios bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
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
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={!!open} onClose={() => setOpen(null)} title={open?.title}>
        {open && (
          <div className="px-5 pb-6 pt-2">
            <p className="text-[12px] text-ios-gray mb-3">{formatDateTime(open.created_at)}</p>
            <p className="text-[16px] leading-relaxed whitespace-pre-wrap">{open.message}</p>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
