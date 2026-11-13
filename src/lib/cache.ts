type Entry<T> = { v: T; t: number };
const mem = new Map<string, Entry<unknown>>();
const P = 'sh:v2:';

// Auto-purge any stale legacy sh:v1: items from previous versions
try {
  if (typeof localStorage !== 'undefined') {
    Object.keys(localStorage)
      .filter(k => k.startsWith('sh:v1:'))
      .forEach(k => localStorage.removeItem(k));
  }
} catch {
  /* storage unavailable */
}

// 2 minutes for item lists, 5 minutes for individual item details
export const TTL = { list: 2 * 60_000, item: 5 * 60_000 };

export function getCached<T>(key: string, ttl: number): T | null {
  const now = Date.now();
  const m = mem.get(key) as Entry<T> | undefined;
  if (m && now - m.t < ttl) return m.v;
  try {
    const raw = localStorage.getItem(P + key);
    if (raw) {
      const e = JSON.parse(raw) as Entry<T>;
      if (now - e.t < ttl) {
        mem.set(key, e);
        return e.v;
      }
    }
  } catch {
    /* storage unavailable */
  }
  return null;
}

/** Ignores TTL – used when the network or quota fails. */
export function getStale<T>(key: string): T | null {
  const m = mem.get(key) as Entry<T> | undefined;
  if (m) return m.v;
  try {
    const raw = localStorage.getItem(P + key);
    return raw ? (JSON.parse(raw) as Entry<T>).v : null;
  } catch {
    return null;
  }
}

export function setCached<T>(key: string, v: T) {
  const e: Entry<T> = { v, t: Date.now() };
  mem.set(key, e);
  try {
    localStorage.setItem(P + key, JSON.stringify(e));
  } catch {
    /* quota */
  }
}

export function invalidateListCache() {
  for (const k of Array.from(mem.keys())) {
    if (k.startsWith('items:list:')) {
      mem.delete(k);
    }
  }
  try {
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage)
        .filter(k => k.startsWith(P + 'items:list:'))
        .forEach(k => localStorage.removeItem(k));
    }
  } catch {
    /* */
  }
}

export function clearCache() {
  mem.clear();
  try {
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage)
        .filter(k => k.startsWith(P) || k.startsWith('sh:v1:'))
        .forEach(k => localStorage.removeItem(k));
    }
  } catch {
    /* */
  }
}
