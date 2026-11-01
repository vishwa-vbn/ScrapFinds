import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCached, getStale, setCached, clearCache, TTL } from '../lib/cache';

describe('cache', () => {
  beforeEach(() => {
    localStorage.clear();
    clearCache();
  });

  it('stores and retrieves items within TTL', () => {
    setCached('test-key', { message: 'hello' });
    const cached = getCached<{ message: string }>('test-key', TTL.list);
    expect(cached).toEqual({ message: 'hello' });
  });

  it('returns null when TTL has expired', () => {
    const originalNow = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(originalNow);

    setCached('expired-key', 'data');
    expect(getCached('expired-key', 5000)).toBe('data');

    // Advance time beyond TTL
    vi.spyOn(Date, 'now').mockReturnValue(originalNow + 6000);
    expect(getCached('expired-key', 5000)).toBeNull();

    vi.restoreAllMocks();
  });

  it('getStale returns value even after TTL has expired', () => {
    const originalNow = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(originalNow);

    setCached('stale-key', 'stale-data');

    // Advance time beyond TTL
    vi.spyOn(Date, 'now').mockReturnValue(originalNow + 100000);
    expect(getCached('stale-key', 5000)).toBeNull();
    expect(getStale('stale-key')).toBe('stale-data');

    vi.restoreAllMocks();
  });

  it('clearCache removes items', () => {
    setCached('k1', 'v1');
    clearCache();
    expect(getCached('k1', TTL.list)).toBeNull();
    expect(getStale('k1')).toBeNull();
  });
});
