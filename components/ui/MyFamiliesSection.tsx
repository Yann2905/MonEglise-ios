'use client';

import { useEffect, useState, useCallback } from 'react';
import { UsersRound, Building2, Crown, Plus, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { JoinFamilySheet } from './JoinFamilySheet';

interface Membership {
  family_id: string;
  family_name: string;
  is_institutional: boolean;
  is_responsible: boolean;
}

/**
 * Section "Mes familles" dans le profil.
 * Affiche les familles de l user avec role (Responsable / Membre)
 * + bouton pour rejoindre une famille supplementaire.
 */
export function MyFamiliesSection() {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('family_members')
      .select('family_id, families!inner(id, name, is_institutional, responsible_id)')
      .eq('user_id', user.id);

    const rows = ((data as any[]) ?? []).map((r) => ({
      family_id: r.family_id as string,
      family_name: r.families.name as string,
      is_institutional: r.families.is_institutional as boolean,
      is_responsible: (r.families.responsible_id as string | null) === user.id,
    })) as Membership[];

    // Trier : ma famille principale (responsable) en premier, puis alpha
    rows.sort((a, b) => {
      if (a.is_responsible && !b.is_responsible) return -1;
      if (!a.is_responsible && b.is_responsible) return 1;
      return a.family_name.localeCompare(b.family_name);
    });
    setMemberships(rows);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return null;

  return (
    <>
      <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm divide-y divide-ios-separator/10">
        {memberships.map((m) => (
          <div key={m.family_id} className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-ios bg-brand-50 text-brand-600">
              {m.is_institutional ? (
                <Building2 className="h-5 w-5" />
              ) : (
                <UsersRound className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-[16px] font-medium tracking-sf-tight">{m.family_name}</p>
              <p className="text-[12px] text-ios-gray flex items-center gap-1">
                {m.is_responsible ? (
                  <>
                    <Crown className="h-3 w-3 text-amber-500" />
                    Responsable
                  </>
                ) : (
                  'Membre'
                )}
              </p>
            </div>
          </div>
        ))}

        {/* Bouton "Rejoindre une autre famille" */}
        <button
          onClick={() => setShowJoin(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-ios-gray6"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-ios bg-brand-50 text-brand-600">
            <Plus className="h-5 w-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[16px] font-medium tracking-sf-tight text-brand-600">
              Rejoindre une autre famille
            </p>
            <p className="text-[13px] text-ios-gray">Faire partie d'un autre groupe</p>
          </div>
          <ChevronRight className="h-5 w-5 text-ios-gray3" />
        </button>
      </div>

      <JoinFamilySheet open={showJoin} onClose={() => setShowJoin(false)} onJoined={load} />
    </>
  );
}
