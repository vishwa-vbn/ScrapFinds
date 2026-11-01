const KEY = 'sh:reads';
const MAX_PER_DAY = 150;
const today = () => new Date().toDateString();

export function canRead(n: number): boolean {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { d: string; n: number } | null;
    return !s || s.d !== today() || s.n + n <= MAX_PER_DAY;
  } catch {
    return true;
  }
}

export function recordReads(n: number) {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { d: string; n: number } | null;
    localStorage.setItem(KEY, JSON.stringify(s && s.d === today() ? { d: s.d, n: s.n + n } : { d: today(), n }));
  } catch {
    /* */
  }
}
