'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Calendar, History, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { IOSButton } from '@/components/ui/IOSButton';
import { Avatar } from '@/components/ui/Avatar';
import { notify } from '@/lib/notifications';
import { cn, labelOfChurchRole } from '@/lib/utils';
import type { Family, User } from '@/lib/types';

/**
 * Page Appel pour les responsables de famille.
 * Seul un user dont le rôle est 'responsable_famille' ET qui est responsable
 * d'au moins une famille peut accéder. Sinon écran vide explicatif.
 */
export default function MemberAttendancePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [myFamilies, setMyFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [absentIds, setAbsentIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [loadingFams, setLoadingFams] = useState(true);

  // Charge TOUTES les familles dont l'user est membre (et pas le Comité)
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingFams(true);
      const { data: links } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id);
      const ids = (links as { family_id: string }[] | null)?.map((l) => l.family_id) ?? [];
      if (!ids.length) {
        setMyFamilies([]);
        setLoadingFams(false);
        return;
      }
      const { data } = await supabase
        .from('v_families_enriched')
        .select('*')
        .in('id', ids)
        .eq('is_institutional', false);
      const list = (data as Family[]) ?? [];
      setMyFamilies(list);
      // Auto-sélection si une seule
      if (list.length === 1) setSelectedFamily(list[0]);
      setLoadingFams(false);
    })();
  }, [user]);

  // Charge les membres de la famille sélectionnée
  useEffect(() => {
    if (!selectedFamily) {
      setMembers([]);
      return;
    }
    (async () => {
      const { data: links } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_id', selectedFamily.id);
      const ids = (links as { user_id: string }[] | null)?.map((l) => l.user_id) ?? [];
      if (!ids.length) {
        setMembers([]);
        return;
      }
      const { data } = await supabase.from('users').select('*').in('id', ids).order('first_name');
      setMembers((data as User[]) ?? []);
    })();
  }, [selectedFamily]);

  const toggle = (uid: string) => {
    setAbsentIds((prev) => {
      const n = new Set(prev);
      if (n.has(uid)) n.delete(uid);
      else n.add(uid);
      return n;
    });
  };

  const submit = async () => {
    if (!selectedFamily || !user) return;
    setSubmitting(true);
    const absentList = members
      .filter((m) => absentIds.has(m.id))
      .map((m) => ({ user_id: m.id, name: `${m.first_name} ${m.last_name}`, phone: m.phone }));

    try {
      const today = new Date().toISOString();
      let serviceId: string | null = null;
      try {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        const tomorrow = new Date(day.getTime() + 86_400_000);
        const { data: ex } = await supabase
          .from('services')
          .select('id')
          .eq('church_id', user.church_id)
          .gte('date', day.toISOString())
          .lt('date', tomorrow.toISOString())
          .maybeSingle();
        if (ex) serviceId = ex.id as string;
      } catch {}

      const { data: absRow } = await supabase
        .from('absences')
        .insert({
          family_id: selectedFamily.id,
          family_name: selectedFamily.name,
          date: today,
          created_by: user.id,
          absent_count: absentList.length,
          absent_members: absentList,
          service_id: serviceId,
          actor_name: `${user.first_name} ${user.last_name}`,
        })
        .select('id')
        .single();
      const absenceId = absRow?.id as string | undefined;

      // Notifie l'admin (DB + push) avec metadata.absence_id pour navigation
      try {
        const { data: church } = await supabase
          .from('churches')
          .select('admin_id')
          .eq('id', user.church_id)
          .maybeSingle();
        if (church?.admin_id && church.admin_id !== user.id) {
          await notify({
            recipients: [church.admin_id],
            title: `Appel : ${selectedFamily.name}`,
            message: `${user.first_name} ${user.last_name} a enregistré ${absentList.length} absent${absentList.length > 1 ? 's' : ''} sur ${members.length}`,
            type: 'absence',
            senderId: user.id,
            actorName: `${user.first_name} ${user.last_name}`,
            metadata: absenceId ? { absence_id: absenceId } : undefined,
            link: absenceId ? `/admin/absence/${absenceId}` : '/admin/notifications',
          });
        }
      } catch {}

      toast.success(`Appel enregistré : ${absentList.length} absent${absentList.length > 1 ? 's' : ''}`);
      setAbsentIds(new Set());
    } catch (e: any) {
      toast.error('Erreur : ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingFams) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ios-bg-light">
        <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  // Pas dans une famille → message
  if (myFamilies.length === 0) {
    return (
      <div>
        <NavBar title="Appel" back />
        <div className="text-center py-20 px-8">
          <ShieldAlert className="h-14 w-14 text-ios-gray3 mx-auto mb-3" />
          <p className="text-[17px] font-semibold mb-1">Aucune famille</p>
          <p className="text-[14px] text-ios-gray">
            Demandez à votre pasteur de vous ajouter à une famille pour pouvoir faire l'appel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar
        title="Appel"
        back
        trailing={
          <button
            onClick={() => router.push('/member/attendance/history')}
            className="p-2 -mr-2 active:opacity-60"
            aria-label="Historique"
          >
            <History className="h-6 w-6 text-brand-600" />
          </button>
        }
      />

      <div className="px-4 pt-2 pb-4">
        {!selectedFamily ? (
          <>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
              Choisir une famille
            </p>
            <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm">
              {myFamilies.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFamily(f)}
                  className={cn(
                    'w-full px-4 py-3.5 text-left active:bg-ios-gray6',
                    i < myFamilies.length - 1 && 'border-b border-ios-separator/10'
                  )}
                >
                  <p className="text-[16px] font-medium">{f.name}</p>
                  <p className="text-[13px] text-ios-gray">
                    {f.member_count} membre{f.member_count > 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {myFamilies.length > 1 && (
              <button
                onClick={() => setSelectedFamily(null)}
                className="text-brand-600 text-[14px] font-medium mb-2"
              >
                ← Changer de famille
              </button>
            )}
            <h2 className="text-[22px] font-bold tracking-sf-tighter mb-1">{selectedFamily.name}</h2>
            <p className="text-[13px] text-ios-gray mb-4">
              Cochez les <strong>absents</strong> ({absentIds.size}/{members.length})
            </p>

            <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm">
              {members.map((m, i) => {
                const isAbsent = absentIds.has(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggle(m.id)}
                    className={cn(
                      'w-full px-4 py-3 flex items-center gap-3 active:bg-ios-gray6',
                      i < members.length - 1 && 'border-b border-ios-separator/10'
                    )}
                  >
                    <div
                      className={cn(
                        'h-6 w-6 rounded-md flex items-center justify-center transition-all',
                        isAbsent ? 'bg-ios-red border-2 border-ios-red' : 'border-2 border-ios-gray3'
                      )}
                    >
                      {isAbsent && <CheckCircle2 className="h-4 w-4 text-white" />}
                    </div>
                    <Avatar firstName={m.first_name} lastName={m.last_name} src={m.avatar_url} size={36} />
                    <div className="flex-1 text-left min-w-0">
                      <p className={cn('text-[15px] font-medium truncate', isAbsent && 'line-through text-ios-gray')}>
                        {m.first_name} {m.last_name}
                      </p>
                      <p className="text-[12px] text-ios-gray">{labelOfChurchRole(m.church_role)}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <IOSButton fullWidth size="lg" className="mt-5" onClick={submit} isLoading={submitting}>
              Enregistrer l'appel
            </IOSButton>
          </>
        )}
      </div>
    </div>
  );
}
