import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  MockBackendError,
  type SignupArgs,
  type SignupResult,
  type LoginResult,
} from './mockBackend.ts';

// ---------------------------------------------------------------------------
// Lazy client
// ---------------------------------------------------------------------------

let _client: SupabaseClient | null = null;

function client(): SupabaseClient {
  if (_client) return _client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'supabaseBackend: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set',
    );
  }
  _client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

// ---------------------------------------------------------------------------
// Error mapping
// ---------------------------------------------------------------------------

interface PostgresLikeError {
  message?: string;
  code?: string;
  hint?: string | null;
  details?: string | null;
}

function mapError(err: PostgresLikeError | null | undefined): never {
  const raw = (err?.message ?? '') + ' ' + (err?.hint ?? '') + ' ' + (err?.details ?? '');
  const upper = raw.toUpperCase();

  if (upper.includes('LOCKED') || /LOCKED UNTIL/i.test(raw)) {
    throw new MockBackendError('LOCKED', err?.message || 'Account is locked');
  }
  if (upper.includes('WRONG_CREDENTIALS') || /INVALID USERNAME OR PIN/i.test(raw)) {
    throw new MockBackendError('WRONG_CREDENTIALS', err?.message || 'Invalid username or PIN');
  }
  if (upper.includes('WRONG_RECOVERY')) {
    throw new MockBackendError(
      'WRONG_RECOVERY',
      err?.message || 'Username or recovery code is incorrect',
    );
  }
  if (upper.includes('PROFANITY')) {
    throw new MockBackendError(
      'PROFANITY',
      err?.message || 'Username contains a profanity or blocked word',
    );
  }
  if (upper.includes('TAKEN')) {
    throw new MockBackendError('TAKEN', err?.message || 'Username is already taken');
  }
  if (
    upper.includes('INVALID') ||
    /USERNAME MUST BE/i.test(raw) ||
    /PIN MUST BE/i.test(raw)
  ) {
    throw new MockBackendError('INVALID', err?.message || 'Invalid input');
  }
  // Unknown — rethrow original-ish error
  const e = new Error(err?.message || 'Unknown error from supabase');
  throw e;
}

// ---------------------------------------------------------------------------
// supabaseBackend
// ---------------------------------------------------------------------------

export const supabaseBackend = {
  async checkUsernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await client().rpc('rpc_check_username_available', {
      p_username: username,
    });
    if (error) mapError(error);
    return Boolean(data);
  },

  async signup(args: SignupArgs): Promise<SignupResult> {
    const { username, pin, avatar, age_band } = args;
    const { data, error } = await client().rpc('rpc_signup', {
      p_username: username,
      p_pin: pin.join(''),
      p_avatar: avatar,
      p_age_band: age_band,
    });
    if (error) mapError(error);
    // RPC returns either an object or a single-row array depending on Postgres function shape.
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      throw new Error('rpc_signup returned no row');
    }
    return {
      profile: {
        id: row.profile_id,
        username: row.username,
        avatar: row.avatar,
        age_band: row.age_band,
      },
      token: row.token,
      recoveryCode: row.recovery_code,
    };
  },

  async login(username: string, pin: string[]): Promise<LoginResult> {
    const { data, error } = await client().rpc('rpc_login', {
      p_username: username,
      p_pin: pin.join(''),
    });
    if (error) mapError(error);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      throw new MockBackendError('WRONG_CREDENTIALS', 'Invalid username or PIN');
    }
    return {
      profile: {
        id: row.profile_id,
        username: row.username,
        avatar: row.avatar,
        age_band: row.age_band,
      },
      token: row.token,
    };
  },

  async recoverPin(
    username: string,
    recoveryCode: string,
    newPin: string[],
  ): Promise<{ recoveryCode: string }> {
    const { data, error } = await client().rpc('rpc_recover_pin', {
      p_username: username,
      p_recovery_code: recoveryCode,
      p_new_pin: newPin.join(''),
    });
    if (error) mapError(error);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      throw new Error('rpc_recover_pin returned no row');
    }
    return { recoveryCode: row.recovery_code };
  },

  async logAnswered(
    profileId: string,
    questionExternalId: string,
    correct: boolean,
  ): Promise<void> {
    const { error } = await client()
      .from('answered_questions')
      .insert({
        profile_id: profileId,
        question_external_id: questionExternalId,
        correct,
        answered_at: new Date().toISOString(),
      });
    if (error) mapError(error);
  },

  async getAnsweredExternalIds(
    profileId: string,
    _moduleIds: string[],
  ): Promise<string[]> {
    const { data, error } = await client()
      .from('answered_questions')
      .select('question_external_id')
      .eq('profile_id', profileId);
    if (error) mapError(error);
    if (!data) return [];
    return (data as Array<{ question_external_id: string }>).map(r => r.question_external_id);
  },

  async recordQuiz(
    profileId: string,
    moduleId: string,
    score: number,
    total: number,
    durationS: number,
  ): Promise<void> {
    const now = new Date().toISOString();
    const supabase = client();

    // 1) Append to history
    const { error: histErr } = await supabase.from('quiz_history').insert({
      profile_id: profileId,
      module_id: moduleId,
      score,
      total,
      duration_s: durationS,
      played_at: now,
    });
    if (histErr) mapError(histErr);

    // 2) Look up existing progress row
    const { data: existing, error: progReadErr } = await supabase
      .from('module_progress')
      .select('questions_seen, correct_count, best_score, current_streak')
      .eq('profile_id', profileId)
      .eq('module_id', moduleId)
      .maybeSingle();
    if (progReadErr) mapError(progReadErr);

    if (!existing) {
      const { error: insErr } = await supabase.from('module_progress').insert({
        profile_id: profileId,
        module_id: moduleId,
        questions_seen: total,
        correct_count: score,
        best_score: score,
        current_streak: score >= 8 ? 1 : 0,
        last_played_at: now,
      });
      if (insErr) mapError(insErr);
    } else {
      const row = existing as {
        questions_seen: number;
        correct_count: number;
        best_score: number;
        current_streak: number;
      };
      const { error: updErr } = await supabase
        .from('module_progress')
        .update({
          questions_seen: row.questions_seen + total,
          correct_count: row.correct_count + score,
          best_score: Math.max(row.best_score, score),
          current_streak: score >= 8 ? row.current_streak + 1 : 0,
          last_played_at: now,
        })
        .eq('profile_id', profileId)
        .eq('module_id', moduleId);
      if (updErr) mapError(updErr);
    }
  },

  async getProgress(
    profileId: string,
  ): Promise<Array<{
    module_id: string;
    questions_seen: number;
    correct_count: number;
    best_score: number;
    current_streak: number;
    last_played_at: string | null;
  }>> {
    const { data, error } = await client()
      .from('module_progress')
      .select('module_id, questions_seen, correct_count, best_score, current_streak, last_played_at')
      .eq('profile_id', profileId);
    if (error) mapError(error);
    if (!data) return [];
    return data as Array<{
      module_id: string;
      questions_seen: number;
      correct_count: number;
      best_score: number;
      current_streak: number;
      last_played_at: string | null;
    }>;
  },

  async reset(): Promise<void> {
    // Dev-only — call rpc_reset_all if it exists; otherwise a no-op + warn.
    try {
      const { error } = await client().rpc('rpc_reset_all', {});
      if (error) {
        // eslint-disable-next-line no-console
        console.warn('supabaseBackend.reset: rpc_reset_all unavailable —', error.message);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('supabaseBackend.reset: rpc_reset_all threw —', e);
    }
  },
};
