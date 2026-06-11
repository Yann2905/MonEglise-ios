'use client';

import { useEffect, useState } from 'react';
import { UsersRound } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Avatar } from '@/components/ui/Avatar';
import { cn, labelOfChurchRole } from '@/lib/utils';
import type { Family, User } from '@/lib/types';

export default function MemberFamiliesPage() {
  const { user } = useAuth();
  const [myFamilies, setMyFamilies] = useState<Family[]>([]);
  const [openFamily, setOpenFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<User[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: links } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id);
      const ids = (links as { family_id: string }[] | null)?.map((l) => l.family_id) ?? [];
      if (!ids.length) {
        setMyFamilies([]);
        return;
      }
      const { data } = await supabase
        .from('v_families_enriched')
        .select('*')
        .in('id', ids);
      setMyFamilies((data as Family[]) ?? []);
    };
    load();
    const ch = supabase
      .channel(`m_fams_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_members', filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!openFamily) {
      setMembers([]);
      return;
    }
    (async () => {
      const { data: links } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_id', openFamily.id);
      const ids = (links as { user_id: string }[] | null)?.map((l) => l.user_id) ?? [];
      if (!ids.length) {
        setMembers([]);
        return;
      }
      const { data } = await supabase.from('users').select('*').in('id', ids).order('first_name');
      setMembers((data as User[]) ?? []);
    })();
  }, [openFamily]);

  return (
    <div>
      <NavBar largeTitle="Mes familles" />

      <div className="px-4 pt-2 pb-8">
        {myFamilies.length === 0 ? (
          <div className="text-center py-20">
            <UsersRound className="h-14 w-14 text-ios-gray3 mx-auto mb-3" />
            <p className="text-ios-gray">Vous n'êtes dans aucune famille</p>
          </div>
        ) : (
          <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm">
            {myFamilies.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setOpenFamily(f)}
                className={cn(
                  'w-full px-4 py-3 flex items-center gap-3 active:bg-ios-gray6',
                  i < myFamilies.length - 1 && 'border-b border-ios-separator/10'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-ios',
                    f.is_institutional ? 'bg-orange-100 text-ios-orange' : 'bg-green-100 text-ios-green'
                  )}
                >
                  <UsersRound className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[16px] font-medium tracking-sf-tight truncate">{f.name}</p>
                  <p className="text-[13px] text-ios-gray">
                    {f.member_count} membre{f.member_count > 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={!!openFamily} onClose={() => setOpenFamily(null)} title={openFamily?.name}>
        {openFamily && (
          <div className="px-5 pb-8 pt-2">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2">
              Membres ({members.length})
            </p>
            <div className="bg-ios-gray6 rounded-ios-lg overflow-hidden">
              {members.map((m, i) => (
                <div
                  key={m.id}
                  className={cn(
                    'px-4 py-3 flex items-center gap-3',
                    i < members.length - 1 && 'border-b border-ios-separator/10'
                  )}
                >
                  <Avatar firstName={m.first_name} lastName={m.last_name} src={m.avatar_url} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium truncate">
                      {m.first_name} {m.last_name}
                    </p>
                    <p className="text-[12px] text-ios-gray">{labelOfChurchRole(m.church_role)}</p>
                  </div>
                  {openFamily.responsible_id === m.id && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-ios-orange/15 text-ios-orange">
                      Responsable
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
