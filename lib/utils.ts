import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes intelligently (gère conflicts comme bg-blue-500 + bg-red-500) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Récupère les initiales d'un prénom + nom (max 2 lettres) */
export function getInitials(firstName: string, lastName: string): string {
  const f = firstName?.[0] ?? '';
  const l = lastName?.[0] ?? '';
  return (f + l).toUpperCase();
}

/** Format date FR : "21 mai 2026" */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Format date + heure : "21/05/2026 à 14:32" */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dd = d.toLocaleDateString('fr-FR');
  const hh = d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dd} à ${hh}`;
}

/** Format date relative : "il y a 5 min", "hier", "il y a 3 jours" */
export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  if (h < 24) return `il y a ${h} h`;
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} jours`;
  return formatDateLong(d);
}

/** Labels des rôles d'église (snake_case → labels propres) */
export const CHURCH_ROLE_LABELS: Record<string, string> = {
  pasteur_principal: 'Pasteur principal',
  pasteur_secondaire: 'Pasteur secondaire',
  responsable_famille: 'Responsable de famille',
  diacre: 'Diacre',
  diaconesse: 'Diaconesse',
  fidele: 'Fidèle',
};

export const SIGNUP_CHURCH_ROLES = [
  'fidele',
  'responsable_famille',
  'diacre',
  'diaconesse',
  'pasteur_secondaire',
] as const;

export function labelOfChurchRole(role: string): string {
  return CHURCH_ROLE_LABELS[role] ?? role;
}

export function impliedGenderForRole(role: string): 'homme' | 'femme' | null {
  if (role === 'diacre') return 'homme';
  if (role === 'diaconesse') return 'femme';
  return null;
}
