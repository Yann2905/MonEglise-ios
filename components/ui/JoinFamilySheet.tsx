'use client';

import { useEffect, useState } from 'react';
import { UsersRound, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { BottomSheet } from './BottomSheet';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface Family {
  id: string;
  name: string;
  is_institutional: boolean;
  responsible_id: string | null;
}

interface JoinFamilySheetProps {
  open: boolean;
  onClose: () => void;
  /** Callback appelé quand l'utilisateur a rejoint une famille (pour refresh) */
  onJoined?: () => void;
}

/**
 * BottomSheet listant les familles disponibles (celles où l'user n'est
 * pas encore membre). Clic sur une famille = rejoint immédiatement.
 * L'user reste responsable de sa famille principale, il devient juste
 * membre supplémentaire de celle-ci.
 */
export function JoinFamilySheet({ open, onClose, onJoined }: JoinFamilySheetProps) {
  const { user } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user?.church_id) return;
    (async () => {
      setLoading(true);
      try {
        const [allRes, myRes] = await Promise.all([
          supabase
            .from('families')
            .select('id, name, is_institutional, responsible_id')
            .eq('church_id', user.church_id)
            .order('name'),
          supabase
            .from('family_members')
            .select('family_id')
            .eq('user_id', user.id),
        ]);

        const all = (allRes.data as Family[]) ?? [];
        const myIds = new Set(((myRes.data as { family_id: string }[]) ?? []).map((l) => l.family_id));
        setFamilies(all.filter((f) => !myIds.has(f.id)));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, user]);

  const join = async (family: Family) => {
    if (!user) return;
    setJoining(family.id);
    const { error } = await supabase.from('family_members').insert({
      family_id: family.id,
      user_id: user.id,
      joined_at: new Date().toISOString(),
    });
    setJoining(null);
    if (error) {
      toast.error('Impossible de rejoindre : ' + error.message);
      return;
    }
    toast.success(`Vous avez rejoint "${family.name}"`);
    onJoined?.();
    // Enlève la famille rejointe de la liste (permet d'en rejoindre d'autres sans refermer)
    setFamilies((prev) => prev.filter((f) => f.id !== family.id));
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Rejoindre une famille">
      <div className="px-4 pb-8 pt-2 min-h-[200px]">
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="h-8 w-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
          </div>
        ) : families.length === 0 ? (
          <p className="text-center text-ios-gray py-8 text-[14px]">
            Vous êtes déjà membre de toutes les familles disponibles.
          </p>
        ) : (
          <div className="space-y-2">
            {families.map((f) => (
              <button
                key={f.id}
                onClick={() => join(f)}
                disabled={joining !== null}
                className="w-full bg-white rounded-ios-lg p-4 flex items-center gap-3 shadow-ios-sm active:bg-ios-gray6 disabled:opacity-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-ios bg-brand-50 text-brand-600">
                  {f.is_institutional ? (
                    <Building2 className="h-5 w-5" />
                  ) : (
                    <UsersRound className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[16px] font-medium tracking-sf-tight">{f.name}</p>
                  {f.is_institutional && (
                    <p className="text-[12px] text-ios-gray">Groupe / Comité</p>
                  )}
                </div>
                {joining === f.id ? (
                  <div className="h-5 w-5 rounded-full border-[2px] border-brand-200 border-t-brand-600 animate-spin" />
                ) : (
                  <span className="text-brand-600 text-[13px] font-semibold">Rejoindre</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
