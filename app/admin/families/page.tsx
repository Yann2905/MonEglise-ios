'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronRight, Star, UsersRound, MoreHorizontal, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { IOSAlert } from '@/components/ui/IOSAlert';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { IOSButton } from '@/components/ui/IOSButton';
import { IOSTextField } from '@/components/ui/IOSTextField';
import { cn } from '@/lib/utils';
import type { Family } from '@/lib/types';
import { ListSkeleton } from '@/components/ui/Skeleton';

export default function AdminFamiliesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState<Family | null>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionsFamily, setActionsFamily] = useState<Family | null>(null);
  const [renameFamily, setRenameFamily] = useState<Family | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.church_id) return;
    const churchId = user.church_id;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('v_families_enriched')
        .select('*')
        .eq('church_id', churchId)
        .order('is_institutional', { ascending: false })
        .order('name');
      setFamilies((data as Family[]) ?? []);
      setLoading(false);
    };

    load();
    const ch = supabase
      .channel(`admin_families_${churchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'families', filter: `church_id=eq.${churchId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_members' }, load)
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user]);

  const createFamily = async () => {
    if (!newName.trim() || !user) return;
    setCreating(true);
    // responsible_id = NULL par defaut : le pasteur n'est PAS respo
    // des familles ordinaires. Il est respo uniquement du Comite des
    // responsables (institutional). Une famille sans respo est en
    // attente qu'un user s'inscrive comme responsable OU que l'admin
    // designe un respo via l UI.
    const { error } = await supabase.from('families').insert({
      name: newName.trim(),
      church_id: user.church_id,
      responsible_id: null,
    });
    setCreating(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Famille créée');
      setNewName('');
      setShowCreate(false);
    }
  };

  const deleteFamily = async () => {
    if (!showDelete) return;
    const { error } = await supabase.from('families').delete().eq('id', showDelete.id);
    if (error) toast.error(error.message);
    else toast.success('Famille supprimée');
    setShowDelete(null);
  };

  const doRename = async () => {
    if (!renameFamily || !renameValue.trim()) return;
    setRenaming(true);
    const { error } = await supabase
      .from('families')
      .update({ name: renameValue.trim() })
      .eq('id', renameFamily.id);
    setRenaming(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Famille renommée');
      setRenameFamily(null);
      setRenameValue('');
    }
  };

  return (
    <div>
      <NavBar
        largeTitle="Familles"
        trailing={
          <button
            onClick={() => setShowCreate(true)}
            className="p-2 -mr-2 active:opacity-60"
            aria-label="Ajouter"
          >
            <Plus className="h-6 w-6 text-brand-600" strokeWidth={2.5} />
          </button>
        }
      />

      <div className="px-4">
        {!loading && families.length > 3 && (
          <div className="relative mb-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ios-gray" />
            <input
              type="search"
              placeholder="Rechercher une famille…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-ios-lg bg-ios-gray5 text-[16px] outline-none placeholder:text-ios-gray"
            />
          </div>
        )}
        {loading ? (
          <div className="mt-2">
            <ListSkeleton count={5} />
          </div>
        ) : families.length === 0 ? (
          <div className="text-center py-16">
            <UsersRound className="h-14 w-14 text-ios-gray3 mx-auto mb-3" />
            <p className="text-ios-gray">Aucune famille</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-brand-600 font-semibold"
            >
              + Créer la première
            </button>
          </div>
        ) : (
          <div className="mt-2 bg-white rounded-ios-lg overflow-hidden shadow-ios-sm">
            {families
              .filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()))
              .map((f, i, arr) => (
              <div
                key={f.id}
                className={cn(
                  'w-full flex items-center active:bg-ios-gray6 transition-colors',
                  i < arr.length - 1 && 'border-b border-ios-separator/10'
                )}
              >
                <button
                  onClick={() => router.push(`/admin/families/${f.id}`)}
                  className="flex-1 flex items-center gap-3 px-4 py-3 text-left min-w-0"
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-ios flex-shrink-0',
                      f.is_institutional ? 'bg-orange-100 text-ios-orange' : 'bg-green-100 text-ios-green'
                    )}
                  >
                    {f.is_institutional ? <Star className="h-5 w-5" /> : <UsersRound className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[16px] font-medium tracking-sf-tight truncate">{f.name}</p>
                      {f.is_institutional && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ios-orange/15 text-ios-orange flex-shrink-0">
                          Officiel
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-ios-gray">
                      {f.member_count} membre{f.member_count > 1 ? 's' : ''}
                    </p>
                  </div>
                </button>
                {!f.is_institutional && (
                  <button
                    onClick={() => setActionsFamily(f)}
                    className="px-3 py-3 text-ios-gray active:opacity-60"
                    aria-label="Actions"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                )}
                <span className="pr-3">
                  <ChevronRight className="h-4 w-4 text-ios-gray3" />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal créer famille */}
      <BottomSheet open={showCreate} onClose={() => setShowCreate(false)} title="Nouvelle famille">
        <div className="px-5 pb-6 pt-2">
          <p className="text-[14px] text-ios-gray mb-3">
            Donnez un nom à votre groupe (Chorale, Jeunes, etc.)
          </p>
          <IOSTextField
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom de la famille"
            autoFocus
          />
          <IOSButton
            fullWidth
            size="lg"
            className="mt-4"
            onClick={createFamily}
            isLoading={creating}
          >
            Créer
          </IOSButton>
        </div>
      </BottomSheet>

      {/* Actions sheet (Renommer / Supprimer) */}
      <BottomSheet
        open={!!actionsFamily}
        onClose={() => setActionsFamily(null)}
        title={actionsFamily?.name}
      >
        {actionsFamily && (
          <div className="px-5 pb-6 pt-2 space-y-2">
            <button
              onClick={() => {
                const f = actionsFamily;
                setRenameValue(f.name);
                setRenameFamily(f);
                setActionsFamily(null);
              }}
              className="w-full px-4 py-3.5 rounded-ios-lg bg-brand-50 text-brand-600 font-semibold text-left active:bg-brand-100 flex items-center gap-2"
            >
              <Pencil className="h-5 w-5" />
              Renommer
            </button>
            <button
              onClick={() => {
                const f = actionsFamily;
                setActionsFamily(null);
                setShowDelete(f);
              }}
              className="w-full px-4 py-3.5 rounded-ios-lg bg-ios-red/10 text-ios-red font-semibold text-left active:bg-ios-red/20 flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" />
              Supprimer
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Rename sheet */}
      <BottomSheet open={!!renameFamily} onClose={() => setRenameFamily(null)} title="Renommer la famille">
        <div className="px-5 pb-6 pt-2">
          <IOSTextField
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Nouveau nom"
            autoFocus
          />
          <IOSButton fullWidth size="lg" className="mt-4" onClick={doRename} isLoading={renaming}>
            Enregistrer
          </IOSButton>
        </div>
      </BottomSheet>

      <IOSAlert
        open={!!showDelete}
        onClose={() => setShowDelete(null)}
        title={`Supprimer "${showDelete?.name}" ?`}
        message="Tous les membres seront retirés. Cette action est irréversible."
        actions={[
          { label: 'Annuler', variant: 'cancel' },
          { label: 'Supprimer', variant: 'destructive', onClick: deleteFamily },
        ]}
      />
    </div>
  );
}
