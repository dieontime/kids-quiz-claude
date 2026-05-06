import { describe, it, expect } from 'vitest';
import { containsProfanity } from './profanity.ts';

describe('containsProfanity', () => {
  it('returns false for clean usernames', () => {
    expect(containsProfanity('PizzaDragon')).toBe(false);
    expect(containsProfanity('SunnyDay42')).toBe(false);
  });

  it('does NOT falsely match substrings inside ordinary words', () => {
    // 'ass' appears inside these
    expect(containsProfanity('grasshopper')).toBe(false);
    expect(containsProfanity('Cassidy')).toBe(false);
    expect(containsProfanity('class')).toBe(false);
    expect(containsProfanity('passenger')).toBe(false);
    expect(containsProfanity('classroom')).toBe(false);
    // 'hell' appears inside these
    expect(containsProfanity('hello')).toBe(false);
    expect(containsProfanity('shell')).toBe(false);
    expect(containsProfanity('Michelle')).toBe(false);
    // 'tit' appears inside these
    expect(containsProfanity('title')).toBe(false);
    expect(containsProfanity('attitude')).toBe(false);
  });

  it('blocks standalone profanity', () => {
    expect(containsProfanity('damn')).toBe(true);
    expect(containsProfanity('Hell')).toBe(true);
  });

  it('blocks profanity at CamelCase boundaries', () => {
    expect(containsProfanity('SmartAss')).toBe(true);
    expect(containsProfanity('BigButt')).toBe(true);
    expect(containsProfanity('SuperHell')).toBe(true);
  });

  it('blocks profanity separated by punctuation', () => {
    expect(containsProfanity('big_ass')).toBe(true);
    expect(containsProfanity('damn-it')).toBe(true);
    expect(containsProfanity('damn it')).toBe(true);
    expect(containsProfanity('damn.cool')).toBe(true);
  });

  it('is case-insensitive on the matched token', () => {
    expect(containsProfanity('DAMN')).toBe(true);
    expect(containsProfanity('Damn')).toBe(true);
  });

  it('handles empty input', () => {
    expect(containsProfanity('')).toBe(false);
  });
});
