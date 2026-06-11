'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Star, Info, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { Avatar } from '@/components/ui/Avatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { IOSAlert } from '@/components/ui/IOSAlert';
import { labelOfChurchRole, cn } from '@/lib/utils';
import type { Family, User } from '@/lib/types';

export default function FamilyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [available, setAvailable] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [showConfirmRemove, setShowConfirmRemove] = useState<{ u: User; mode: 'remove' | 'demote' } | null>(null);

  const loadAll = async () => {
    setLoading(true);
    // Famille
    const { data: fam } = await supabase
      .from('v_families_enriched')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    setFamily(fam as Family);

    // Membres de cette famille
    const { data: links } = await supabase
      .from('family_members')
      .select('user_id')
      .eq('family_id', id);
    const memberIds = (links as { user_id: string }[] | null)?.map((l) => l.user_id) ?? [];
    if (memberIds.length) {
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .in('id', memberIds)
        .order('first_name');
      setMembers((users as User[]) ?? []);
    } else {
      setMembers([]);
    }

    // Disponibles (non encore dans la famille)
    if (user?.church_id) {
      const { data: all } = await supabase
        .from('users')
        .select('*')
        .eq('church_id', user.church_id)
        .order('first_name');
      setAvailable(((all as User[]) ?? []).filter((u) => !memberIds.includes(u.id)));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!id || !user) return;
    loadAll();

    const ch = supabase
      .channel(`family_detail_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_members', filter: `family_id=eq.${id}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'families', filter: `id=eq.${id}` }, loadAll)
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const addMember = async (uid: string) => {
    const { error } = await supabase.from('family_members').insert({ family_id: id, user_id: uid });
    if (error) toast.error(error.message);
    else toast.success('Membre ajouté');
  };

  const removeMember = async () => {
    if (!showConfirmRemove) return;
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('family_id', id)
      .eq('user_id', showConfirmRemove.u.id);
    if (error) toast.error(error.message);
    else toast.success('Membre retiré');
    setShowConfirmRemove(null);
  };

  const setResponsible = async (uid: string) => {
    const { error } = await supabase.from('families').update({ responsible_id: uid }).eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Responsable mis à jour');
    setSelectedMember(null);
  };

  if (loading || !family) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ios-bg-light">
        <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <NavBar
        title={family.name}
        back
        trailing={
          !family.is_institutional && (
            <button
              onClick={() => setShowAddSheet(true)}
              className="p-2 -mr-2 active:opacity-60"
              aria-label="Ajouter"
            >
              <Plus className="h-6 w-6 text-brand-600" strokeWidth={2.5} />
            </button>
          )
        }
      />

      <div className="px-4 pt-2">
        {/* Banner Comité institutionnel */}
        {family.is_institutional && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-ios-lg bg-orange-50">
            <Info className="h-5 w-5 text-ios-orange flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-ios-label-light leading-snug">
              Liste officielle des responsables. La composition est gérée automatiquement
              selon le rôle de chaque membre, mais le pasteur peut aussi ajouter manuellement.
            </p>
          </div>
        )}

        <p className="px-1 mb-2 text-[13px] font-semibold uppercase tracking-wider text-ios-gray">
          Membres ({members.length})
        </p>

        {members.length === 0 ? (
          <div className="bg-white rounded-ios-lg p-8 text-center shadow-ios-sm">
            <p className="text-ios-gray">Aucun membre</p>
            {!family.is_institutional && (
              <button
                onClick={() => setShowAddSheet(true)}
                className="mt-3 text-brand-600 font-semibold"
              >
                + Ajouter
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm">
            {members.map((u, i) => {
              const isResp = family.responsible_id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedMember(u)}
                  className={cn(
                    'w-full px-4 py-3 flex items-center gap-3 active:bg-ios-gray6 transition-colors',
                    i < members.length - 1 && 'border-b border-ios-separator/10'
                  )}
                >
                  <Avatar firstName={u.first_name} lastName={u.last_name} src={u.avatar_url} size={44} />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[16px] font-medium tracking-sf-tight truncate">
                      {u.first_name} {u.last_name}
                    </p>
                    <p
                      className={cn(
                        'text-[13px] truncate',
                        isResp ? 'text-ios-orange font-semibold' : 'text-ios-gray'
                      )}
                    >
                      {isResp ? 'Responsable · ' : ''}
                      {labelOfChurchRole(u.church_role)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ios-gray3 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom sheet ajout membres */}
      <BottomSheet open={showAddSheet} onClose={() => setShowAddSheet(false)} title="Ajouter des membres">
        <div className="px-5 pb-6 pt-2">
          {available.length === 0 ? (
            <p className="text-center py-8 text-ios-gray">Tous les membres sont déjà ajoutés</p>
          ) : (
            <div className="bg-ios-gray6 rounded-ios-lg overflow-hidden">
              {available.map((u, i) => (
                <button
                  key={u.id}
                  onClick={async () => {
                    await addMember(u.id);
                  }}
                  className={cn(
                    'w-full px-4 py-3 flex items-center gap-3 active:bg-ios-gray5',
                    i < available.length - 1 && 'border-b border-ios-separator/10'
                  )}
                >
                  <Avatar firstName={u.first_name} lastName={u.last_name} src={u.avatar_url} size={36} />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[15px] font-medium tracking-sf-tight truncate">
                      {u.first_name} {u.last_name}
                    </p>
                    <p className="text-[12px] text-ios-gray">{labelOfChurchRole(u.church_role)}</p>
                  </div>
                  <Plus className="h-5 w-5 text-brand-600" />
                </button>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Bottom sheet actions sur un membre */}
      <BottomSheet
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title={selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : ''}
      >
        {selectedMember && (
          <div className="px-5 pb-6 pt-2 space-y-2">
            <a
              href={`tel:${selectedMember.phone}`}
              className="w-full block px-4 py-3.5 rounded-ios-lg bg-ios-green/10 text-ios-green font-semibold text-left active:bg-ios-green/20"
            >
              <svg className="h-5 w-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Appeler
            </a>
            {family.responsible_id !== selectedMember.id && !family.is_institutional && (
              <button
                onClick={() => setResponsible(selectedMember.id)}
                className="w-full px-4 py-3.5 rounded-ios-lg bg-brand-50 text-brand-600 font-semibold text-left active:bg-brand-100"
              >
                <Star className="h-5 w-5 inline mr-2" />
                Désigner comme responsable
              </button>
            )}
            {family.responsible_id === selectedMember.id && !family.is_institutional && (
              <button
                onClick={async () => {
                  const uid = selectedMember.id;
                  setSelectedMember(null);
                  const { error } = await supabase
                    .from('families')
                    .update({ responsible_id: null })
                    .eq('id', id);
                  if (error) toast.error(error.message);
                  else toast.success('Responsable retiré');
                }}
                className="w-full px-4 py-3.5 rounded-ios-lg bg-ios-orange/10 text-ios-orange font-semibold text-left active:bg-ios-orange/20"
              >
                <Star className="h-5 w-5 inline mr-2" />
                Retirer du poste de responsable
              </button>
            )}
            <button
              onClick={() => {
                const u = selectedMember;
                setSelectedMember(null);
                setShowConfirmRemove({ u, mode: 'remove' });
              }}
              className="w-full px-4 py-3.5 rounded-ios-lg bg-ios-red/10 text-ios-red font-semibold text-left active:bg-ios-red/20"
            >
              Retirer de la famille
            </button>
          </div>
        )}
      </BottomSheet>

      <IOSAlert
        open={!!showConfirmRemove}
        onClose={() => setShowConfirmRemove(null)}
        title={`Retirer ${showConfirmRemove?.u.first_name} ?`}
        message={`Voulez-vous vraiment retirer ${showConfirmRemove?.u.first_name} ${showConfirmRemove?.u.last_name} de "${family.name}" ?`}
        actions={[
          { label: 'Annuler', variant: 'cancel' },
          { label: 'Retirer', variant: 'destructive', onClick: removeMember },
        ]}
      />
    </div>
  );
}
