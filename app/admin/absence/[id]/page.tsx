'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Phone, CalendarX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { Avatar } from '@/components/ui/Avatar';
import { formatDateLong, cn } from '@/lib/utils';

interface AbsentMember {
  user_id?: string;
  name: string;
  phone?: string;
  reason?: string;
}

interface Absence {
  id: string;
  family_name: string;
  date: string;
  absent_count: number;
  absent_members: AbsentMember[];
  actor_name: string | null;
}

interface UserInfo {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export default function AbsenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [absence, setAbsence] = useState<Absence | null>(null);
  const [userInfos, setUserInfos] = useState<Record<string, UserInfo>>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('absences')
        .select('id, family_name, date, absent_count, absent_members, actor_name')
        .eq('id', id)
        .maybeSingle();
      if (!data) return;
      const abs = data as Absence;
      setAbsence(abs);

      const ids = (abs.absent_members ?? [])
        .map((m) => m.user_id)
        .filter((x): x is string => !!x);
      if (ids.length) {
        const { data: users } = await supabase
          .from('users')
          .select('id, first_name, last_name, avatar_url')
          .in('id', ids);
        const map: Record<string, UserInfo> = {};
        ((users as any[]) ?? []).forEach((u) => {
          map[u.id] = {
            first_name: u.first_name,
            last_name: u.last_name,
            avatar_url: u.avatar_url,
          };
        });
        setUserInfos(map);
      }
    })();
  }, [id]);

  const splitName = (full: string): [string, string] => {
    const parts = (full || '').trim().split(/\s+/);
    if (parts.length === 0) return ['', ''];
    if (parts.length === 1) return [parts[0], ''];
    return [parts[0], parts.slice(1).join(' ')];
  };

  if (!absence) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ios-bg-light">
        <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <NavBar title={absence.family_name} back />

      <div className="px-4 pt-2 pb-8">
        {/* Résumé */}
        <div className="bg-white rounded-ios-lg p-4 shadow-ios-sm flex items-center gap-3">
          <div className="h-12 w-12 rounded-ios bg-ios-red/10 flex items-center justify-center text-ios-red">
            <CalendarX className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-semibold tracking-sf-tight truncate">
              {absence.family_name}
            </p>
            <p className="text-[13px] text-ios-gray">
              {absence.absent_count} absent{absence.absent_count > 1 ? 's' : ''} ·{' '}
              {formatDateLong(absence.date)}
            </p>
          </div>
        </div>

        {absence.actor_name && (
          <p className="mt-3 text-[12px] text-ios-gray text-center">
            Appel fait par <strong>{absence.actor_name}</strong>
          </p>
        )}

        <p className="mt-6 px-1 mb-2 text-[13px] font-semibold uppercase tracking-wider text-ios-gray">
          Membres absents
        </p>

        {(absence.absent_members ?? []).length === 0 ? (
          <div className="bg-white rounded-ios-lg p-6 text-center shadow-ios-sm">
            <p className="text-ios-gray">Aucun absent enregistré</p>
          </div>
        ) : (
          <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm">
            {absence.absent_members.map((m, i) => {
              const info = m.user_id ? userInfos[m.user_id] : undefined;
              const [splitFirst, splitLast] = splitName(m.name);
              const firstName = info?.first_name ?? splitFirst;
              const lastName = info?.last_name ?? splitLast;
              const avatarUrl = info?.avatar_url ?? null;
              const isLast = i === absence.absent_members.length - 1;

              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3',
                    !isLast && 'border-b border-ios-separator/10'
                  )}
                >
                  <Avatar
                    firstName={firstName}
                    lastName={lastName}
                    src={avatarUrl}
                    size={40}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium tracking-sf-tight truncate">
                      {m.name}
                    </p>
                    {m.reason && (
                      <p className="text-[12px] text-ios-gray truncate">{m.reason}</p>
                    )}
                  </div>
                  {m.phone && (
                    <a
                      href={`tel:${m.phone}`}
                      className="h-9 w-9 rounded-ios bg-ios-green/15 flex items-center justify-center text-ios-green active:opacity-70"
                      aria-label={`Appeler ${m.name}`}
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
