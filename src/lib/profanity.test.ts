import { describe, it, expect } from 'vitest';
import { containsProfanity } from './profanity.ts';

describe('containsProfanity', () => {
  it('returns false for clean usernames', () => {
    expect(containsProfanity('PizzaDragon')).toBe(false);
    expect(containsProfanity('SunnyDay42')).toBe(false);
  });

  it('catches obvious bad words', () => {
    expect(containsProfanity('damnit')).toBe(true);
    expect(containsProfanity('SmartAss')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(containsProfanity('DAMNCOOL')).toBe(true);
  });

  it('handles empty input', () => {
    expect(containsProfanity('')).toBe(false);
  });
});
