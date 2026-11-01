import { describe, it, expect, beforeEach } from 'vitest';
import { canRead, recordReads } from '../lib/readBudget';

describe('readBudget', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('allows reads under the daily limit', () => {
    expect(canRead(12)).toBe(true);
    expect(canRead(150)).toBe(true);
  });

  it('tracks recorded reads and enforces daily limit of 150', () => {
    recordReads(100);
    expect(canRead(50)).toBe(true);
    expect(canRead(51)).toBe(false);

    recordReads(50);
    expect(canRead(1)).toBe(false);
  });
});
