'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Phone, MapPin, Calendar, ShieldCheck, UsersRound, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { Avatar } from '@/components/ui/Avatar';
import { labelOfChurchRole, formatDateLong } from '@/lib/utils';
import type { User, Family } from '@/lib/types';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<User | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [absences, setAbsences] = useState<Array<{ date: string; family_name: string }>>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: u } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
      setMember(u as User);

      const { data: links } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', id);
      const famIds = (links as { family_id: string }[] | null)?.map((l) => l.family_id) ?? [];
      if (famIds.length) {
        const { data: fams } = await supabase
          .from('v_families_enriched')
          .select('*')
          .in('id', famIds);
        setFamilies((fams as Family[]) ?? []);
      }

      // Absences où le user apparaît dans absent_members (JSONB)
      const { data: abs } = await supabase
        .from('absences')
        .select('date, family_name, absent_members')
        .order('date', { ascending: false })
        .limit(50);
      const filtered = ((abs as any[]) ?? [])
        .filter((a) => Array.isArray(a.absent_members) && a.absent_members.some((m: any) => m.user_id === id))
        .map((a) => ({ date: a.date, family_name: a.family_name }));
      setAbsences(filtered);
    })();
  }, [id]);

  if (!member) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ios-bg-light">
        <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <NavBar title={`${member.first_name} ${member.last_name}`} back />

      <div className="px-5 pt-2 pb-8">
        <div className="flex flex-col items-center pt-2 pb-6">
          <Avatar firstName={member.first_name} lastName={member.last_name} src={member.avatar_url} size={96} />
          <h2 className="mt-4 text-[22px] font-bold tracking-sf-tighter">
            {member.first_name} {member.last_name}
          </h2>
          <span className="mt-2 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-[12px] font-semibold">
            {labelOfChurchRole(member.church_role)}
          </span>
        </div>

        <SectionLabel>Informations</SectionLabel>
        <Card>
          <Row icon={<Phone className="h-5 w-5" />} label="Téléphone" value={member.phone} />
          <Row icon={<MapPin className="h-5 w-5" />} label="Quartier" value={member.quartier || '—'} />
          {member.gender && <Row icon={<ShieldCheck className="h-5 w-5" />} label="Genre" value={member.gender} />}
          {member.birth_date && (
            <Row icon={<Calendar className="h-5 w-5" />} label="Date de naissance" value={formatDateLong(member.birth_date)} />
          )}
        </Card>

        <SectionLabel className="mt-6">Familles ({families.length})</SectionLabel>
        {families.length === 0 ? (
          <p className="text-ios-gray text-center py-4">Aucune famille</p>
        ) : (
          <Card>
            {families.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-9 w-9 rounded-ios bg-green-50 flex items-center justify-center text-ios-green">
                  <UsersRound className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium">{f.name}</p>
                  {f.responsible_id === member.id && (
                    <p className="text-[12px] text-ios-orange font-semibold">Responsable</p>
                  )}
                </div>
              </div>
            ))}
          </Card>
        )}

        <SectionLabel className="mt-6">Historique d'absences ({absences.length})</SectionLabel>
        {absences.length === 0 ? (
          <p className="text-ios-gray text-center py-4">Aucune absence enregistrée</p>
        ) : (
          <Card>
            {absences.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-9 w-9 rounded-ios bg-orange-50 flex items-center justify-center text-ios-orange">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-medium">{a.family_name}</p>
                  <p className="text-[12px] text-ios-gray">{formatDateLong(a.date)}</p>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1 ${className}`}>
      {children}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-ios-lg overflow-hidden shadow-ios-sm divide-y divide-ios-separator/10">
      {children}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-ios bg-brand-50 text-brand-600">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-ios-gray">{label}</p>
        <p className="text-[16px] font-medium tracking-sf-tight truncate">{value}</p>
      </div>
    </div>
  );
}
