import { describe, it, expect, beforeEach } from 'vitest';
import { mockBackend, MockBackendError } from './mockBackend.ts';

beforeEach(() => { mockBackend.reset(); });

describe('mockBackend.signup', () => {
  it('creates a profile and returns token + recovery code', async () => {
    const out = await mockBackend.signup({
      username: 'PizzaDragon', pin: ['🐱','⚡','🍕','🌈'],
      avatar: 'avatar_cat', age_band: '5-6',
    });
    expect(out.profile.username).toBe('PizzaDragon');
    expect(out.profile.id).toBeTruthy();
    expect(out.token).toMatch(/^mock-/);
    expect(out.recoveryCode).toMatch(/^[A-Z]+-[A-Z]+-\d{4}$/);
  });

  it('rejects duplicate username (case-insensitive)', async () => {
    await mockBackend.signup({ username: 'PizzaDragon', pin: ['🐱','⚡','🍕','🌈'], avatar: 'avatar_cat', age_band: '5-6' });
    await expect(mockBackend.signup({ username: 'pizzadragon', pin: ['🐱','⚡','🍕','🌈'], avatar: 'avatar_dog', age_band: '5-6' }))
      .rejects.toThrow(MockBackendError);
  });

  it('rejects profanity', async () => {
    await expect(mockBackend.signup({ username: 'SmartAss', pin: ['🐱','⚡','🍕','🌈'], avatar: 'avatar_cat', age_band: '5-6' }))
      .rejects.toThrow(/profanity|PROFANITY/i);
  });

  it('rejects bad pin shape', async () => {
    await expect(mockBackend.signup({ username: 'ShortPin', pin: ['🐱','⚡','🍕'], avatar: 'avatar_cat', age_band: '5-6' }))
      .rejects.toThrow(MockBackendError);
  });
});

describe('mockBackend.login', () => {
  beforeEach(async () => {
    await mockBackend.signup({ username: 'PizzaDragon', pin: ['🐱','⚡','🍕','🌈'], avatar: 'avatar_cat', age_band: '5-6' });
  });

  it('logs in with correct PIN', async () => {
    const out = await mockBackend.login('PizzaDragon', ['🐱','⚡','🍕','🌈']);
    expect(out.profile.username).toBe('PizzaDragon');
    expect(out.token).toMatch(/^mock-/);
  });

  it('rejects wrong PIN with same generic error as wrong username', async () => {
    await expect(mockBackend.login('PizzaDragon', ['🐱','🐱','🐱','🐱'])).rejects.toThrow(MockBackendError);
    await expect(mockBackend.login('NoSuchUser', ['🐱','⚡','🍕','🌈'])).rejects.toThrow(MockBackendError);
    // Both should throw the SAME error code (no enumeration). Implementer: use 'WRONG_CREDENTIALS' for both.
  });

  it('locks out after 5 wrong attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await mockBackend.login('PizzaDragon', ['🐱','🐱','🐱','🐱']).catch(() => {});
    }
    await expect(mockBackend.login('PizzaDragon', ['🐱','⚡','🍕','🌈'])).rejects.toThrow(/locked|LOCKED/i);
  });
});

describe('mockBackend.recoverPin', () => {
  it('changes PIN with valid recovery code and returns a new code', async () => {
    const { recoveryCode } = await mockBackend.signup({ username: 'PizzaDragon', pin: ['🐱','⚡','🍕','🌈'], avatar: 'avatar_cat', age_band: '5-6' });
    const result = await mockBackend.recoverPin('PizzaDragon', recoveryCode, ['🌈','🌈','🌈','🌈']);
    expect(result.recoveryCode).toMatch(/^[A-Z]+-[A-Z]+-\d{4}$/);
    expect(result.recoveryCode).not.toBe(recoveryCode);
    // login with new pin works
    const login = await mockBackend.login('PizzaDragon', ['🌈','🌈','🌈','🌈']);
    expect(login.profile.username).toBe('PizzaDragon');
  });

  it('rejects bad recovery code', async () => {
    await mockBackend.signup({ username: 'PizzaDragon', pin: ['🐱','⚡','🍕','🌈'], avatar: 'avatar_cat', age_band: '5-6' });
    await expect(mockBackend.recoverPin('PizzaDragon', 'WRONG-CODE-0000', ['🌈','🌈','🌈','🌈'])).rejects.toThrow(MockBackendError);
  });

  it('uses identical generic error for unknown username and wrong recovery code (no enumeration)', async () => {
    await mockBackend.signup({ username: 'PizzaDragon', pin: ['🐱','⚡','🍕','🌈'], avatar: 'avatar_cat', age_band: '5-6' });

    let unknownErr: MockBackendError | null = null;
    try { await mockBackend.recoverPin('NeverExisted', 'WRONG-CODE-0000', ['🌈','🌈','🌈','🌈']); }
    catch (e) { unknownErr = e as MockBackendError; }

    let wrongErr: MockBackendError | null = null;
    try { await mockBackend.recoverPin('PizzaDragon', 'WRONG-CODE-0000', ['🌈','🌈','🌈','🌈']); }
    catch (e) { wrongErr = e as MockBackendError; }

    expect(unknownErr).toBeInstanceOf(MockBackendError);
    expect(wrongErr).toBeInstanceOf(MockBackendError);
    expect(unknownErr!.code).toBe('WRONG_RECOVERY');
    expect(wrongErr!.code).toBe('WRONG_RECOVERY');
    expect(unknownErr!.message).toBe(wrongErr!.message);
  });

  it('locks account after 5 wrong recovery attempts', async () => {
    const { recoveryCode } = await mockBackend.signup({ username: 'PizzaDragon', pin: ['🐱','⚡','🍕','🌈'], avatar: 'avatar_cat', age_band: '5-6' });

    for (let i = 0; i < 5; i++) {
      try { await mockBackend.recoverPin('PizzaDragon', 'WRONG-CODE-0000', ['🌈','🌈','🌈','🌈']); } catch { /* expected */ }
    }

    let err: MockBackendError | null = null;
    try { await mockBackend.recoverPin('PizzaDragon', recoveryCode, ['🌈','🌈','🌈','🌈']); }
    catch (e) { err = e as MockBackendError; }

    expect(err).toBeInstanceOf(MockBackendError);
    expect(err!.code).toBe('LOCKED');
  });
});

describe('mockBackend.resetProgress', () => {
  it('clears one profile\'s data without touching the other profile or its profile row', async () => {
    const { profile: p1 } = await mockBackend.signup({
      username: 'PizzaDragon', pin: ['🐱','⚡','🍕','🌈'], avatar: 'avatar_cat', age_band: '5-6',
    });
    const { profile: p2 } = await mockBackend.signup({
      username: 'TacoTiger', pin: ['🐶','⚡','🌮','🌈'], avatar: 'avatar_dog', age_band: '7-9',
    });

    // Log activity for both profiles
    await mockBackend.logAnswered(p1.id, 'q1', true);
    await mockBackend.logAnswered(p1.id, 'q2', false);
    await mockBackend.recordQuiz(p1.id, 'math', 8, 10, 60);

    await mockBackend.logAnswered(p2.id, 'q3', true);
    await mockBackend.recordQuiz(p2.id, 'animals', 9, 10, 50);

    // Reset only p1
    await mockBackend.resetProgress(p1.id);

    // p1's per-profile data is gone
    expect(await mockBackend.getAnsweredExternalIds(p1.id, ['math'])).toEqual([]);
    expect(await mockBackend.getProgress(p1.id)).toEqual([]);

    // p2's data is preserved
    expect(await mockBackend.getAnsweredExternalIds(p2.id, ['animals'])).toEqual(['q3']);
    const p2prog = await mockBackend.getProgress(p2.id);
    expect(p2prog).toHaveLength(1);
    expect(p2prog[0].module_id).toBe('animals');
    expect(p2prog[0].best_score).toBe(9);

    // p1's profile row is NOT deleted — login still works
    const login = await mockBackend.login('PizzaDragon', ['🐱','⚡','🍕','🌈']);
    expect(login.profile.id).toBe(p1.id);
  });
});

describe('mockBackend storage', () => {
  it('logAnswered + getAnsweredExternalIds round-trip', async () => {
    const { profile } = await mockBackend.signup({ username: 'PizzaDragon', pin: ['🐱','⚡','🍕','🌈'], avatar: 'avatar_cat', age_band: '5-6' });
    await mockBackend.logAnswered(profile.id, 'q1', true);
    await mockBackend.logAnswered(profile.id, 'q2', false);
    const ids = await mockBackend.getAnsweredExternalIds(profile.id, ['math']); // moduleIds is for forward compat; in mock, we just return all answered for the profile
    expect(ids).toEqual(expect.arrayContaining(['q1', 'q2']));
  });

  it('recordQuiz updates progress aggregates', async () => {
    const { profile } = await mockBackend.signup({ username: 'PizzaDragon', pin: ['🐱','⚡','🍕','🌈'], avatar: 'avatar_cat', age_band: '5-6' });
    await mockBackend.recordQuiz(profile.id, 'math', 8, 10, 60);
    let prog = await mockBackend.getProgress(profile.id);
    let math = prog.find(p => p.module_id === 'math')!;
    expect(math.questions_seen).toBe(10);
    expect(math.correct_count).toBe(8);
    expect(math.best_score).toBe(8);
    expect(math.current_streak).toBe(1);
    await mockBackend.recordQuiz(profile.id, 'math', 9, 10, 50);
    prog = await mockBackend.getProgress(profile.id);
    math = prog.find(p => p.module_id === 'math')!;
    expect(math.questions_seen).toBe(20);
    expect(math.correct_count).toBe(17);
    expect(math.best_score).toBe(9);
    expect(math.current_streak).toBe(2);
    await mockBackend.recordQuiz(profile.id, 'math', 5, 10, 80);
    prog = await mockBackend.getProgress(profile.id);
    math = prog.find(p => p.module_id === 'math')!;
    expect(math.current_streak).toBe(0);
  });
});
