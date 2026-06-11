// Modèles TypeScript correspondant aux tables Supabase

export interface User {
  id: string;
  auth_id: string | null;
  church_id: string;
  role_global: 'admin' | 'membre';
  church_role:
    | 'pasteur_principal'
    | 'pasteur_secondaire'
    | 'responsable_famille'
    | 'diacre'
    | 'diaconesse'
    | 'fidele';
  gender: 'homme' | 'femme' | null;
  phone: string;
  first_name: string;
  last_name: string;
  quartier: string;
  avatar_url: string | null;
  avatar_public_id: string | null;
  is_responsible: boolean;
  member_code: string | null;
  admin_code: string | null;
  role: string | null;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Church {
  id: string;
  name: string;
  logo_url: string | null;
  logo_public_id: string | null;
  admin_id: string;
  created_at: string;
}

export interface Family {
  id: string;
  church_id: string;
  name: string;
  responsible_id: string | null;
  is_institutional: boolean;
  member_count: number; // depuis la vue v_families_enriched
  created_at: string;
  updated_at: string | null;
}

export interface Sermon {
  id: string;
  church_id: string;
  theme: string;
  verses: string | null;
  audio_url: string | null;
  audio_public_id: string | null;
  duration_sec: number | null;
  sermon_date: string;
  created_at: string;
}

export interface Service {
  id: string;
  church_id: string;
  type: 'dimanche' | 'midweek' | 'special';
  title: string | null;
  date: string;
  created_by: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'absence' | 'reminder' | 'alert' | 'custom' | 'sermon';
  sender_id: string;
  receiver_id: string | null;
  actor_name: string | null;
  is_read: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
}
