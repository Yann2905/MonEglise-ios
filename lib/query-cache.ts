// Cache mémoire simple pour dédupliquer les requêtes Supabase et donner
// du feedback instantané (stale-while-revalidate).
//
// Pas besoin de react-query : juste un Map + getCached / setCached.

type Entry<T> = { data: T; ts: number };
const cache = new Map<string, Entry<any>>();

const TTL_MS = 5 * 60 * 1000; // 5 min

export function getCached<T>(key: string): T | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return e.data as T;
}

export function setCached<T>(key: string, data: T) {
  cache.set(key, { data, ts: Date.now() });
}

export function invalidate(prefix: string) {
  for (const k of Array.from(cache.keys())) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
}
