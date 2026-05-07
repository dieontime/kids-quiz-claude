import { describe, it, expect, beforeEach } from 'vitest';
import { fetchQuizQuestions } from './questionService.ts';
import { mockBackend } from './mockBackend.ts';
import { useProfileStore } from '../stores/profileStore.ts';

beforeEach(() => {
  mockBackend.reset();
  useProfileStore.setState({ token: null, profile: null });
});

async function setUp56() {
  const { profile, token } = await mockBackend.signup({
    username: 'PizzaDragon', pin: ['🐱','⚡','🍕','🌈'], avatar: 'avatar_cat', age_band: '5-6',
  });
  useProfileStore.getState().login(token, profile);
  return profile;
}

async function setUp79() {
  const { profile, token } = await mockBackend.signup({
    username: 'StarRocket', pin: ['🚀','⭐','🌙','☀️'], avatar: 'avatar_dog', age_band: '7-9',
  });
  useProfileStore.getState().login(token, profile);
  return profile;
}

describe('fetchQuizQuestions', () => {
  it('math returns N procedural questions', async () => {
    await setUp56();
    const out = await fetchQuizQuestions({ moduleId: 'math', count: 10 });
    expect(out).toHaveLength(10);
    expect(out.every(q => q.module_id === 'math')).toBe(true);
  });

  it('vehicles returns from bundled JSON, filtered for band', async () => {
    await setUp56();
    const out = await fetchQuizQuestions({ moduleId: 'vehicles', count: 5 });
    expect(out.length).toBe(5);
    expect(out.every(q => q.module_id === 'vehicles')).toBe(true);
    expect(out.every(q => q.age_band === '5-6' || q.age_band === 'both')).toBe(true);
  });

  it('vehicles excludes already-answered questions', async () => {
    const profile = await setUp56();
    const first = await fetchQuizQuestions({ moduleId: 'vehicles', count: 5 });
    for (const q of first) {
      await mockBackend.logAnswered(profile.id, q.external_id, true);
    }
    const second = await fetchQuizQuestions({ moduleId: 'vehicles', count: 5 });
    const firstIds = new Set(first.map(q => q.external_id));
    expect(second.every(q => !firstIds.has(q.external_id))).toBe(true);
  });

  it('animals returns empty for 5-6 (no 5-6 entries in pool)', async () => {
    await setUp56();
    const out = await fetchQuizQuestions({ moduleId: 'animals', count: 10 });
    expect(out).toEqual([]);
  });

  it('animals returns from bundled JSON, filtered for 7-9', async () => {
    await setUp79();
    const out = await fetchQuizQuestions({ moduleId: 'animals', count: 5 });
    expect(out).toHaveLength(5);
    expect(out.every(q => q.module_id === 'animals')).toBe(true);
    expect(out.every(q => q.age_band === '7-9' || q.age_band === 'both')).toBe(true);
  });

  it('science returns from bundled JSON, filtered for 7-9', async () => {
    await setUp79();
    const out = await fetchQuizQuestions({ moduleId: 'science', count: 5 });
    expect(out).toHaveLength(5);
    expect(out.every(q => q.module_id === 'science')).toBe(true);
    expect(out.every(q => q.age_band === '7-9' || q.age_band === 'both')).toBe(true);
  });

  it('random mixes math + static questions for 5-6', async () => {
    await setUp56();
    const out = await fetchQuizQuestions({ moduleId: 'random', count: 10 });
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThanOrEqual(10);
    const sources = new Set(out.map(q => q.source));
    // Should include both procedural math and at least one static source
    expect(sources.has('procedural:math')).toBe(true);
  });

  it('throws if no profile is logged in', async () => {
    await expect(fetchQuizQuestions({ moduleId: 'math', count: 10 })).rejects.toThrow(/no profile/);
  });
});
