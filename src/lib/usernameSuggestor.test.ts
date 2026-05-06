import { describe, it, expect } from 'vitest';
import { suggestUsernames } from './usernameSuggestor.ts';

describe('suggestUsernames', () => {
  it('returns N variants of the base', () => {
    const out = suggestUsernames('PizzaDragon', 3);
    expect(out).toHaveLength(3);
    out.forEach(v => expect(v.startsWith('PizzaDragon')).toBe(true));
  });

  it('variants are distinct', () => {
    const out = suggestUsernames('PizzaDragon', 5);
    expect(new Set(out).size).toBe(5);
  });

  it('strips trailing digits before re-suffixing', () => {
    const out = suggestUsernames('PizzaDragon7', 3);
    out.forEach(v => expect(v.startsWith('PizzaDragon')).toBe(true));
  });
});
