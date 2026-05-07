import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { MockBackendError } from './mockBackend.ts';
import type { supabaseBackend as SupabaseBackendType } from './supabaseBackend.ts';

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js
// ---------------------------------------------------------------------------

const rpcMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: rpcMock,
    from: fromMock,
  })),
}));

// We import supabaseBackend lazily inside beforeAll AFTER stubbing env so its
// lazy client init succeeds. Env stubs are cleared in afterAll so they don't
// leak into other test files (which would reroute backend.ts to supabase).
let supabaseBackend: typeof SupabaseBackendType;

beforeAll(async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon');
  ({ supabaseBackend } = await import('./supabaseBackend.ts'));
});

afterAll(() => {
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// Per-test fluent-API mocks
// ---------------------------------------------------------------------------

interface InsertSpy { fn: ReturnType<typeof vi.fn>; calls: Array<unknown[]> }

beforeEach(() => {
  rpcMock.mockReset();
  fromMock.mockReset();
});

/**
 * Build a fresh chainable query-builder for a single from() call. The shape
 * used by supabaseBackend is one of:
 *   from(t).insert(row)                                 → { error }
 *   from(t).select(cols).eq('profile_id', x)            → { data, error }
 *   from(t).select(cols).eq(...).eq(...).maybeSingle()  → { data, error }
 *   from(t).update(row).eq(...).eq(...)                 → { error }
 */
function makeQueryBuilder(opts: {
  insertResult?: { data?: unknown; error?: unknown };
  selectEqResult?: { data?: unknown; error?: unknown };
  selectEqEqMaybeSingleResult?: { data?: unknown; error?: unknown };
  updateResult?: { data?: unknown; error?: unknown };
}) {
  const insert = vi.fn().mockResolvedValue(opts.insertResult ?? { data: null, error: null });
  const update = vi.fn().mockImplementation(() => ({
    eq: vi.fn().mockImplementation(() => ({
      eq: vi.fn().mockResolvedValue(opts.updateResult ?? { data: null, error: null }),
    })),
  }));
  const select = vi.fn().mockImplementation(() => {
    const eqInner = vi.fn().mockImplementation(() => ({
      eq: vi.fn().mockImplementation(() => ({
        maybeSingle: vi.fn().mockResolvedValue(
          opts.selectEqEqMaybeSingleResult ?? { data: null, error: null },
        ),
      })),
    }));
    // First-level eq returns either a thenable resolution OR another chain.
    // For getAnsweredExternalIds the call is select().eq() (single eq).
    // For module_progress lookup, it is select().eq().eq().maybeSingle().
    // We wrap so eqInner result is awaitable AND has .eq.
    const wrapped = (...args: unknown[]) => {
      const chainResult = eqInner(...args);
      // Make the returned object also awaitable (resolves to selectEqResult).
      return new Proxy(chainResult, {
        get(target, prop, recv) {
          if (prop === 'then') {
            // Allow `await select(...).eq(...)` to resolve to selectEqResult
            const promise = Promise.resolve(opts.selectEqResult ?? { data: null, error: null });
            return promise.then.bind(promise);
          }
          return Reflect.get(target, prop, recv);
        },
      });
    };
    return { eq: wrapped };
  });
  return { insert, update, select };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('supabaseBackend', () => {
  it('checkUsernameAvailable calls rpc_check_username_available', async () => {
    rpcMock.mockResolvedValueOnce({ data: true, error: null });
    const result = await supabaseBackend.checkUsernameAvailable('alice');
    expect(rpcMock).toHaveBeenCalledWith('rpc_check_username_available', { p_username: 'alice' });
    expect(result).toBe(true);
  });

  it('signup calls rpc_signup with joined pin and maps the row', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        profile_id: 'p1',
        username: 'alice',
        avatar: 'avatar_cat',
        age_band: '5-6',
        recovery_code: 'BRAVE-FOX-1234',
        token: 'tok-1',
      },
      error: null,
    });
    const out = await supabaseBackend.signup({
      username: 'alice',
      pin: ['🐱', '⚡', '🍕', '🌈'],
      avatar: 'avatar_cat',
      age_band: '5-6',
    });
    expect(rpcMock).toHaveBeenCalledWith('rpc_signup', {
      p_username: 'alice',
      p_pin: '🐱⚡🍕🌈',
      p_avatar: 'avatar_cat',
      p_age_band: '5-6',
    });
    expect(out.profile.id).toBe('p1');
    expect(out.token).toBe('tok-1');
    expect(out.recoveryCode).toBe('BRAVE-FOX-1234');
  });

  it('signup maps TAKEN error', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'Username "alice" is already taken', hint: 'TAKEN' },
    });
    try {
      await supabaseBackend.signup({
        username: 'alice', pin: ['a','b','c','d'], avatar: 'x', age_band: '5-6',
      });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(MockBackendError);
      expect((e as MockBackendError).code).toBe('TAKEN');
    }
  });

  it('signup maps PROFANITY error', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'Username contains a profanity', hint: 'PROFANITY' },
    });
    try {
      await supabaseBackend.signup({
        username: 'badword', pin: ['a','b','c','d'], avatar: 'x', age_band: '5-6',
      });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(MockBackendError);
      expect((e as MockBackendError).code).toBe('PROFANITY');
    }
  });

  it('login calls rpc_login and maps WRONG_CREDENTIALS', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'Invalid username or PIN', hint: 'WRONG_CREDENTIALS' },
    });
    try {
      await supabaseBackend.login('alice', ['🐱','⚡','🍕','🌈']);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(MockBackendError);
      expect((e as MockBackendError).code).toBe('WRONG_CREDENTIALS');
    }
    expect(rpcMock).toHaveBeenCalledWith('rpc_login', {
      p_username: 'alice',
      p_pin: '🐱⚡🍕🌈',
    });
  });

  it('login returns mapped profile + token on success', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{
        profile_id: 'p2',
        username: 'bob',
        avatar: 'avatar_dog',
        age_band: '7-9',
        token: 'tok-2',
      }],
      error: null,
    });
    const out = await supabaseBackend.login('bob', ['a','b','c','d']);
    expect(out.profile.id).toBe('p2');
    expect(out.profile.age_band).toBe('7-9');
    expect(out.token).toBe('tok-2');
  });

  it('login maps LOCKED error', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'Account is locked until 2099-01-01T00:00:00Z', hint: 'LOCKED' },
    });
    try {
      await supabaseBackend.login('alice', ['a','b','c','d']);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(MockBackendError);
      expect((e as MockBackendError).code).toBe('LOCKED');
    }
  });

  it('recoverPin calls rpc_recover_pin with joined new pin', async () => {
    rpcMock.mockResolvedValueOnce({
      data: { recovery_code: 'NEW-CODE-9999' },
      error: null,
    });
    const out = await supabaseBackend.recoverPin('alice', 'OLD-CODE-1111', ['x','y','z','w']);
    expect(rpcMock).toHaveBeenCalledWith('rpc_recover_pin', {
      p_username: 'alice',
      p_recovery_code: 'OLD-CODE-1111',
      p_new_pin: 'xyzw',
    });
    expect(out.recoveryCode).toBe('NEW-CODE-9999');
  });

  it('recoverPin maps WRONG_RECOVERY error', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'Username or recovery code is incorrect', hint: 'WRONG_RECOVERY' },
    });
    try {
      await supabaseBackend.recoverPin('alice', 'BAD', ['a','b','c','d']);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(MockBackendError);
      expect((e as MockBackendError).code).toBe('WRONG_RECOVERY');
    }
  });

  it('logAnswered inserts into answered_questions', async () => {
    const qb = makeQueryBuilder({ insertResult: { data: null, error: null } });
    fromMock.mockReturnValueOnce(qb);
    await supabaseBackend.logAnswered('p1', 'q-ext-1', true);
    expect(fromMock).toHaveBeenCalledWith('answered_questions');
    expect(qb.insert).toHaveBeenCalledWith(expect.objectContaining({
      profile_id: 'p1',
      question_external_id: 'q-ext-1',
      correct: true,
    }));
  });

  it('getAnsweredExternalIds reads answered_questions filtered by profile', async () => {
    const qb = makeQueryBuilder({
      selectEqResult: {
        data: [
          { question_external_id: 'a' },
          { question_external_id: 'b' },
        ],
        error: null,
      },
    });
    fromMock.mockReturnValueOnce(qb);
    const ids = await supabaseBackend.getAnsweredExternalIds('p1', ['math']);
    expect(fromMock).toHaveBeenCalledWith('answered_questions');
    expect(qb.select).toHaveBeenCalledWith('question_external_id');
    expect(ids).toEqual(['a', 'b']);
  });

  it('recordQuiz inserts history then inserts new progress when none exists', async () => {
    // 1st from() = quiz_history (insert)
    const histQb = makeQueryBuilder({});
    // 2nd from() = module_progress (select for existing row → none)
    const progReadQb = makeQueryBuilder({ selectEqEqMaybeSingleResult: { data: null, error: null } });
    // 3rd from() = module_progress (insert new row)
    const progInsQb = makeQueryBuilder({});
    fromMock
      .mockReturnValueOnce(histQb)
      .mockReturnValueOnce(progReadQb)
      .mockReturnValueOnce(progInsQb);

    await supabaseBackend.recordQuiz('p1', 'math', 9, 10, 60);

    expect(fromMock).toHaveBeenNthCalledWith(1, 'quiz_history');
    expect(fromMock).toHaveBeenNthCalledWith(2, 'module_progress');
    expect(fromMock).toHaveBeenNthCalledWith(3, 'module_progress');
    expect(histQb.insert).toHaveBeenCalledWith(expect.objectContaining({
      profile_id: 'p1', module_id: 'math', score: 9, total: 10, duration_s: 60,
    }));
    expect(progInsQb.insert).toHaveBeenCalledWith(expect.objectContaining({
      profile_id: 'p1',
      module_id: 'math',
      questions_seen: 10,
      correct_count: 9,
      best_score: 9,
      current_streak: 1, // score >= 8
    }));
  });

  it('recordQuiz updates existing progress row when one is found', async () => {
    const histQb = makeQueryBuilder({});
    const progReadQb = makeQueryBuilder({
      selectEqEqMaybeSingleResult: {
        data: { questions_seen: 20, correct_count: 15, best_score: 8, current_streak: 2 },
        error: null,
      },
    });
    const progUpdQb = makeQueryBuilder({});
    fromMock
      .mockReturnValueOnce(histQb)
      .mockReturnValueOnce(progReadQb)
      .mockReturnValueOnce(progUpdQb);

    await supabaseBackend.recordQuiz('p1', 'math', 9, 10, 30);

    expect(progUpdQb.update).toHaveBeenCalledWith(expect.objectContaining({
      questions_seen: 30,    // 20 + 10
      correct_count: 24,     // 15 + 9
      best_score: 9,         // max(8, 9)
      current_streak: 3,     // 2 + 1 (score >= 8)
    }));
  });
});

// Suppress unused-type-import warning for InsertSpy (kept for clarity if extended).
export type _Unused = InsertSpy;
