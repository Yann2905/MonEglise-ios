'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { Avatar } from '@/components/ui/Avatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { IOSAlert } from '@/components/ui/IOSAlert';
import { CHURCH_ROLE_LABELS, labelOfChurchRole, cn } from '@/lib/utils';
import type { User } from '@/lib/types';

export default function AdminMembersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [showDelete, setShowDelete] = useState<User | null>(null);

  useEffect(() => {
    if (!user?.church_id) return;
    const churchId = user.church_id;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('church_id', churchId)
        .order('first_name');
      setMembers((data as User[]) ?? []);
      setLoading(false);
    };

    load();

    const ch = supabase
      .channel(`admin_members_${churchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `church_id=eq.${churchId}` },
        load
      )
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user]);

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.first_name?.toLowerCase().includes(q) ||
      m.last_name?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      m.quartier?.toLowerCase().includes(q)
    );
  });

  const promoteTo = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from('users')
      .update({ church_role: newRole, updated_at: new Date().toISOString() })
      .eq('id', memberId);
    if (error) toast.error(error.message);
    else toast.success('Rôle modifié');
    setSelectedMember(null);
  };

  const removeMember = async () => {
    if (!showDelete) return;
    const { error } = await supabase.from('users').delete().eq('id', showDelete.id);
    if (error) toast.error(error.message);
    else toast.success('Membre supprimé');
    setShowDelete(null);
  };

  return (
    <div>
      <NavBar largeTitle="Membres" />

      <div className="px-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ios-gray" />
          <input
            type="search"
            placeholder="Rechercher un membre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-ios-lg bg-ios-gray5 text-[16px] outline-none placeholder:text-ios-gray"
          />
        </div>

        <p className="mt-4 px-1 text-[13px] text-ios-gray">
          {filtered.length} membre{filtered.length > 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-ios-gray mt-10">Aucun membre trouvé</p>
        ) : (
          <div className="mt-2 bg-white rounded-ios-lg overflow-hidden shadow-ios-sm">
            {filtered.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className={cn(
                  'w-full px-4 py-3 flex items-center gap-3 active:bg-ios-gray6 transition-colors',
                  i < filtered.length - 1 && 'border-b border-ios-separator/10'
                )}
              >
                <Avatar firstName={m.first_name} lastName={m.last_name} src={m.avatar_url} size={44} />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[16px] font-medium tracking-sf-tight truncate">
                    {m.first_name} {m.last_name}
                  </p>
                  <p className="text-[13px] text-ios-gray truncate">
                    {labelOfChurchRole(m.church_role)} · {m.quartier || 'Sans quartier'}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-ios-gray3 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom sheet actions sur un membre */}
      <BottomSheet
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title={selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : ''}
      >
        {selectedMember && (
          <div className="px-5 pb-6">
            <div className="flex flex-col items-center mb-5">
              <Avatar
                firstName={selectedMember.first_name}
                lastName={selectedMember.last_name}
                src={selectedMember.avatar_url}
                size={88}
              />
              <p className="mt-3 text-[14px] text-ios-gray">{selectedMember.phone}</p>
              <p className="text-[13px] text-ios-gray">{selectedMember.quartier || '—'}</p>
              <span className="mt-2 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-[12px] font-semibold">
                {labelOfChurchRole(selectedMember.church_role)}
              </span>
            </div>

            <a
              href={`tel:${selectedMember.phone}`}
              className="w-full mb-2 px-4 py-3.5 rounded-ios-lg bg-ios-green/10 text-ios-green font-semibold text-left active:bg-ios-green/20 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Appeler {selectedMember.first_name}
            </a>

            <button
              onClick={() => {
                const id = selectedMember.id;
                setSelectedMember(null);
                router.push(`/admin/members/${id}`);
              }}
              className="w-full mb-4 px-4 py-3.5 rounded-ios-lg bg-brand-50 text-brand-600 font-semibold text-left active:bg-brand-100 flex items-center gap-2"
            >
              <UserIcon className="h-5 w-5" />
              Voir le profil complet
            </button>

            <p className="text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
              Promouvoir au rang de
            </p>
            <div className="bg-ios-gray6 rounded-ios-lg overflow-hidden">
              {Object.entries(CHURCH_ROLE_LABELS)
                .filter(([k]) => k !== 'pasteur_principal' && k !== selectedMember.church_role)
                .map(([key, label], i, arr) => (
                  <button
                    key={key}
                    onClick={() => promoteTo(selectedMember.id, key)}
                    className={cn(
                      'w-full px-4 py-3 text-left text-[16px] tracking-sf-tight active:bg-ios-gray5 transition-colors',
                      i < arr.length - 1 && 'border-b border-ios-separator/10'
                    )}
                  >
                    {label}
                  </button>
                ))}
            </div>

            <button
              onClick={() => {
                const m = selectedMember;
                setSelectedMember(null);
                setShowDelete(m);
              }}
              className="mt-4 w-full h-12 rounded-ios-lg bg-ios-red/10 text-ios-red font-semibold active:bg-ios-red/20"
            >
              Supprimer ce membre
            </button>
          </div>
        )}
      </BottomSheet>

      <IOSAlert
        open={!!showDelete}
        onClose={() => setShowDelete(null)}
        title={`Supprimer ${showDelete?.first_name} ${showDelete?.last_name} ?`}
        message="Voulez-vous vraiment supprimer ce membre ? Cette action est irréversible."
        actions={[
          { label: 'Annuler', variant: 'cancel' },
          { label: 'Supprimer', variant: 'destructive', onClick: removeMember },
        ]}
      />
    </div>
  );
}
