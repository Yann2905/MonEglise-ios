'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { supabase } from './supabase';
import type { User } from './types';

const LS_KEY = 'moneglise_current_user_id';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  /** Refresh le user courant depuis la DB */
  refresh: () => Promise<void>;
  /** Login par téléphone (no OTP, identique à l'Android) */
  loginByPhone: (phone: string) => Promise<{ ok: boolean; error?: string }>;
  /** Crée un user membre direct (no OTP) */
  registerMember: (params: RegisterMemberParams) => Promise<{ ok: boolean; error?: string }>;
  /** Crée un user admin direct (church_id sera défini après par le modal église) */
  registerAdmin: (params: RegisterAdminParams) => Promise<{ ok: boolean; memberCode?: string; error?: string }>;
  /** Déconnexion : vide le user en RAM + localStorage */
  logout: () => void;
  /** Met à jour l'avatar localement (UI feedback immédiat) */
  updateLocalAvatar: (url: string | null, publicId: string | null) => void;
}

export interface RegisterMemberParams {
  memberCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  quartier: string;
  gender: 'homme' | 'femme';
  churchRole: string;
  familyIds: string[];
  birthDate?: string;
}

export interface RegisterAdminParams {
  firstName: string;
  lastName: string;
  phone: string;
  quartier: string;
  gender?: 'homme' | 'femme';
  birthDate?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function generateMemberCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /** Persiste l'ID en localStorage */
  const persist = useCallback((id: string | null) => {
    if (typeof window === 'undefined') return;
    if (id) localStorage.setItem(LS_KEY, id);
    else localStorage.removeItem(LS_KEY);
  }, []);

  /** Charge un user depuis la DB par ID */
  const loadById = useCallback(async (id: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return data as User;
  }, []);

  /** Auto-login au mount */
  useEffect(() => {
    (async () => {
      try {
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }
        const id = localStorage.getItem(LS_KEY);
        if (!id) {
          setLoading(false);
          return;
        }
        const u = await loadById(id);
        if (u) setUser(u);
        else persist(null); // user supprimé en base
      } finally {
        setLoading(false);
      }
    })();
  }, [loadById, persist]);

  /**
   * Realtime sub : si les infos du user changent en DB, mise à jour live.
   *
   * IMPORTANT : dépendance sur user.id (primitif), PAS user (objet).
   * Si on dépendait de `user`, chaque setUser recréerait le channel.
   *
   * On ignore aussi les updates qui ne changent QUE last_seen (heartbeat) —
   * sinon chaque ping toutes les 30 sec déclenche un re-fetch user qui
   * propage des re-renders dans toute l'app (sermons reload, audio reset).
   */
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`current_user_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        async (payload) => {
          const newRec = payload.new as Record<string, unknown> | null;
          const oldRec = payload.old as Record<string, unknown> | null;
          // Skip heartbeat-only updates
          if (newRec && oldRec) {
            const changed = Object.keys(newRec).filter(
              (k) => JSON.stringify(newRec[k]) !== JSON.stringify(oldRec[k])
            );
            if (changed.length === 1 && changed[0] === 'last_seen') return;
            if (changed.length === 0) return;
          }
          const fresh = await loadById(userId);
          if (fresh) setUser(fresh);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, loadById]);

  /**
   * Heartbeat last_seen : update toutes les 30 sec quand l'app est en
   * foreground. Le worker process-push-queue lit ce champ pour skip
   * les pushes des users actifs (déjà notifiés via Realtime).
   *
   * Dépend de userId primitif uniquement → pas de redémarrage à chaque
   * setUser.
   */
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;
    let cancelled = false;

    const ping = async () => {
      if (cancelled) return;
      if (document.visibilityState !== 'visible') return;
      try {
        await supabase
          .from('users')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', userId);
      } catch {}
    };

    /**
     * Quand l'app passe en background ou est fermée :
     * marque last_seen comme "vieux" (5 min ago) pour que le worker
     * envoie immédiatement les pushes en attente sans attendre la
     * fenêtre d'expiration naturelle.
     */
    const markOffline = () => {
      if (cancelled) return;
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?id=eq.${userId}`;
      const fakeOld = new Date(Date.now() - 5 * 60_000).toISOString();
      try {
        // fetch keepalive = équivalent navigator.sendBeacon pour PATCH
        fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ last_seen: fakeOld }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };

    const onVisChange = () => {
      if (document.visibilityState === 'visible') ping();
      else markOffline();
    };

    ping();
    const interval = setInterval(ping, 30_000);
    document.addEventListener('visibilitychange', onVisChange);
    window.addEventListener('pagehide', markOffline);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisChange);
      window.removeEventListener('pagehide', markOffline);
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const fresh = await loadById(user.id);
    if (fresh) setUser(fresh);
  }, [user, loadById]);

  const loginByPhone = useCallback(
    async (phone: string): Promise<{ ok: boolean; error?: string }> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();
      if (error) return { ok: false, error: error.message };
      if (!data) return { ok: false, error: 'Numéro non reconnu.' };
      setUser(data as User);
      persist(data.id);
      return { ok: true };
    },
    [persist]
  );

  const registerMember = useCallback(
    async (p: RegisterMemberParams): Promise<{ ok: boolean; error?: string }> => {
      // 1. Vérifie unicité du téléphone
      const dup = await supabase.from('users').select('id').eq('phone', p.phone).maybeSingle();
      if (dup.data) return { ok: false, error: 'Ce numéro est déjà enregistré.' };

      // 2. Résout church_id depuis le member_code admin
      const adminLookup = await supabase
        .from('users')
        .select('church_id')
        .eq('member_code', p.memberCode.toUpperCase())
        .eq('role_global', 'admin')
        .maybeSingle();
      if (!adminLookup.data?.church_id) {
        return { ok: false, error: 'Code église introuvable.' };
      }
      const churchId = adminLookup.data.church_id as string;

      // 3. Insert user
      const insertRes = await supabase
        .from('users')
        .insert({
          auth_id: null,
          phone: p.phone,
          first_name: p.firstName,
          last_name: p.lastName,
          quartier: p.quartier,
          role_global: 'membre',
          role: p.churchRole,
          church_role: p.churchRole,
          gender: p.gender,
          church_id: churchId,
          admin_code: p.memberCode.toUpperCase(),
          birth_date: p.birthDate || null,
        })
        .select()
        .single();
      if (insertRes.error) return { ok: false, error: insertRes.error.message };

      const newUser = insertRes.data as User;

      // 4. Liaison familles
      if (p.familyIds.length) {
        await supabase
          .from('family_members')
          .insert(p.familyIds.map((fid) => ({ family_id: fid, user_id: newUser.id })));
        // Si responsable, on désigne sur la 1ère famille
        if (p.churchRole === 'responsable_famille') {
          await supabase
            .from('families')
            .update({ responsible_id: newUser.id })
            .eq('id', p.familyIds[0]);
        }
      }

      setUser(newUser);
      persist(newUser.id);
      return { ok: true };
    },
    [persist]
  );

  const registerAdmin = useCallback(
    async (p: RegisterAdminParams) => {
      const dup = await supabase.from('users').select('id').eq('phone', p.phone).maybeSingle();
      if (dup.data) return { ok: false, error: 'Ce numéro est déjà enregistré.' };

      const memberCode = generateMemberCode();
      const insertRes = await supabase
        .from('users')
        .insert({
          auth_id: null,
          phone: p.phone,
          first_name: p.firstName,
          last_name: p.lastName,
          quartier: p.quartier,
          role_global: 'admin',
          church_role: 'pasteur_principal',
          gender: p.gender || null,
          member_code: memberCode,
          is_responsible: true,
          birth_date: p.birthDate || null,
        })
        .select()
        .single();
      if (insertRes.error) return { ok: false, error: insertRes.error.message };

      setUser(insertRes.data as User);
      persist(insertRes.data.id);
      return { ok: true, memberCode };
    },
    [persist]
  );

  const logout = useCallback(() => {
    setUser(null);
    persist(null);
  }, [persist]);

  const updateLocalAvatar = useCallback((url: string | null, publicId: string | null) => {
    setUser((u) => (u ? { ...u, avatar_url: url, avatar_public_id: publicId } : u));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role_global === 'admin',
        refresh,
        loginByPhone,
        registerMember,
        registerAdmin,
        logout,
        updateLocalAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
