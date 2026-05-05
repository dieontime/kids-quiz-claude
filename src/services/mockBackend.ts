import { containsProfanity } from '../lib/profanity.ts';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  username: string;
  avatar: string;
  age_band: '5-6' | '7-9';
}

export interface SignupArgs {
  username: string;       // 3-20 chars
  pin: string[];          // 4 emoji icons
  avatar: string;
  age_band: '5-6' | '7-9';
}

export interface SignupResult {
  profile: Profile;
  token: string;
  recoveryCode: string;
}

export interface LoginResult {
  profile: Profile;
  token: string;
}

export class MockBackendError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'MockBackendError';
  }
}

// ---------------------------------------------------------------------------
// Internal storage types
// ---------------------------------------------------------------------------

interface StoredProfile {
  id: string;
  username: string;
  username_lower: string;
  avatar: string;
  age_band: '5-6' | '7-9';
  pin_hash: string;
  salt: string;
  recovery_hash: string;
  failed_attempts: number;
  locked_until: string | null;
}

interface AnsweredRow {
  profile_id: string;
  question_external_id: string;
  correct: boolean;
}

interface HistoryRow {
  profile_id: string;
  module_id: string;
  score: number;
  total: number;
  duration_s: number;
  played_at: string;
}

interface ProgressRow {
  profile_id: string;
  module_id: string;
  questions_seen: number;
  correct_count: number;
  best_score: number;
  current_streak: number;
  last_played_at: string | null;
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const KEY_PROFILES = 'mockBackend.profiles';
const KEY_ANSWERED = 'mockBackend.answered';
const KEY_HISTORY  = 'mockBackend.history';
const KEY_PROGRESS = 'mockBackend.progress';

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function readKey<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeKey<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Recovery code word lists
// ---------------------------------------------------------------------------

const ADJECTIVES = [
  'BRAVE', 'COOL', 'EPIC', 'FAST', 'GLAD', 'HAPPY', 'HUGE', 'JOLLY',
  'KIND', 'LUSH', 'MEGA', 'NEON', 'PROUD', 'QUICK', 'RADIANT', 'SHARP',
  'SWIFT', 'TALL', 'ULTRA', 'VIVID', 'WILD', 'ZESTY',
];

const NOUNS = [
  'BEAR', 'BIRD', 'CAT', 'CLOUD', 'DRAGON', 'EAGLE', 'FOX', 'FROG',
  'HAWK', 'HORSE', 'LION', 'MOON', 'PANDA', 'PLANET', 'RABBIT', 'ROCKET',
  'SHARK', 'STAR', 'TIGER', 'UNICORN', 'WOLF', 'ZEBRA',
];

function generateRecoveryCode(): string {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${adj}-${noun}-${num}`;
}

// ---------------------------------------------------------------------------
// Hashing (Web Crypto)
// ---------------------------------------------------------------------------

async function sha256hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPin(pin: string[], salt: string): Promise<string> {
  return sha256hex(pin.join('') + salt);
}

async function hashRecovery(code: string, salt: string): Promise<string> {
  return sha256hex(code + salt);
}

function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Token generation
// ---------------------------------------------------------------------------

function generateToken(profileId: string): string {
  const random = Math.random().toString(36).slice(2);
  return `mock-${profileId}-${random}`;
}

// ---------------------------------------------------------------------------
// Lockout thresholds
// ---------------------------------------------------------------------------
// 5 wrong  → +1 min
// 8 wrong  → +5 min
// 10 wrong → +24 h

function lockoutDurationMs(failedAttempts: number): number | null {
  if (failedAttempts >= 10) return 24 * 60 * 60 * 1000;
  if (failedAttempts >= 8)  return 5 * 60 * 1000;
  if (failedAttempts >= 5)  return 1 * 60 * 1000;
  return null;
}

// ---------------------------------------------------------------------------
// mockBackend object
// ---------------------------------------------------------------------------

export const mockBackend = {
  reset(): void {
    localStorage.removeItem(KEY_PROFILES);
    localStorage.removeItem(KEY_ANSWERED);
    localStorage.removeItem(KEY_HISTORY);
    localStorage.removeItem(KEY_PROGRESS);
  },

  async checkUsernameAvailable(username: string): Promise<boolean> {
    const profiles = readKey<StoredProfile>(KEY_PROFILES);
    const lower = username.toLowerCase();
    return !profiles.some(p => p.username_lower === lower);
  },

  async signup(args: SignupArgs): Promise<SignupResult> {
    const { username, pin, avatar, age_band } = args;

    // Validate username length
    if (!username || username.length < 3 || username.length > 20) {
      throw new MockBackendError('INVALID', 'Username must be 3-20 characters');
    }

    // Validate pin
    if (!Array.isArray(pin) || pin.length !== 4) {
      throw new MockBackendError('INVALID', 'PIN must be exactly 4 emoji icons');
    }

    // Profanity check
    if (containsProfanity(username)) {
      throw new MockBackendError('PROFANITY', 'Username contains a profanity or blocked word');
    }

    // Duplicate check (case-insensitive)
    const profiles = readKey<StoredProfile>(KEY_PROFILES);
    const lower = username.toLowerCase();
    if (profiles.some(p => p.username_lower === lower)) {
      throw new MockBackendError('TAKEN', `Username "${username}" is already taken`);
    }

    // Hash PIN and recovery code
    const id = crypto.randomUUID();
    const salt = generateSalt();
    const pin_hash = await hashPin(pin, salt);

    const recoveryCode = generateRecoveryCode();
    const recovery_hash = await hashRecovery(recoveryCode, salt);

    const profile: StoredProfile = {
      id,
      username,
      username_lower: lower,
      avatar,
      age_band,
      pin_hash,
      salt,
      recovery_hash,
      failed_attempts: 0,
      locked_until: null,
    };

    profiles.push(profile);
    writeKey(KEY_PROFILES, profiles);

    return {
      profile: { id, username, avatar, age_band },
      token: generateToken(id),
      recoveryCode,
    };
  },

  async login(username: string, pin: string[]): Promise<LoginResult> {
    const profiles = readKey<StoredProfile>(KEY_PROFILES);
    const lower = username.toLowerCase();
    const idx = profiles.findIndex(p => p.username_lower === lower);

    // Not found — same generic error as wrong PIN to avoid enumeration
    if (idx === -1) {
      throw new MockBackendError('WRONG_CREDENTIALS', 'Invalid username or PIN');
    }

    const stored = profiles[idx];

    // Check lockout
    if (stored.locked_until) {
      const lockedUntil = new Date(stored.locked_until);
      if (lockedUntil > new Date()) {
        throw new MockBackendError('LOCKED', `Account is locked until ${stored.locked_until}`);
      }
      // Lockout expired — clear it
      stored.locked_until = null;
      stored.failed_attempts = 0;
    }

    // Verify PIN
    const attemptHash = await hashPin(pin, stored.salt);
    if (attemptHash !== stored.pin_hash) {
      stored.failed_attempts += 1;
      const durationMs = lockoutDurationMs(stored.failed_attempts);
      if (durationMs !== null) {
        stored.locked_until = new Date(Date.now() + durationMs).toISOString();
      }
      writeKey(KEY_PROFILES, profiles);
      throw new MockBackendError('WRONG_CREDENTIALS', 'Invalid username or PIN');
    }

    // Success — reset failed attempts
    stored.failed_attempts = 0;
    stored.locked_until = null;
    writeKey(KEY_PROFILES, profiles);

    return {
      profile: {
        id: stored.id,
        username: stored.username,
        avatar: stored.avatar,
        age_band: stored.age_band,
      },
      token: generateToken(stored.id),
    };
  },

  async recoverPin(
    username: string,
    recoveryCode: string,
    newPin: string[],
  ): Promise<{ recoveryCode: string }> {
    const profiles = readKey<StoredProfile>(KEY_PROFILES);
    const lower = username.toLowerCase();
    const idx = profiles.findIndex(p => p.username_lower === lower);

    if (idx === -1) {
      throw new MockBackendError('NOT_FOUND', 'Username not found');
    }

    const stored = profiles[idx];

    // Validate recovery code
    const attemptHash = await hashRecovery(recoveryCode, stored.salt);
    if (attemptHash !== stored.recovery_hash) {
      throw new MockBackendError('WRONG_RECOVERY', 'Recovery code is incorrect');
    }

    // Validate new PIN
    if (!Array.isArray(newPin) || newPin.length !== 4) {
      throw new MockBackendError('INVALID', 'New PIN must be exactly 4 emoji icons');
    }

    // Update PIN and generate a new recovery code
    const newRecoveryCode = generateRecoveryCode();
    stored.pin_hash = await hashPin(newPin, stored.salt);
    stored.recovery_hash = await hashRecovery(newRecoveryCode, stored.salt);
    stored.failed_attempts = 0;
    stored.locked_until = null;

    writeKey(KEY_PROFILES, profiles);

    return { recoveryCode: newRecoveryCode };
  },

  async logAnswered(
    profileId: string,
    questionExternalId: string,
    correct: boolean,
  ): Promise<void> {
    const answered = readKey<AnsweredRow>(KEY_ANSWERED);
    answered.push({ profile_id: profileId, question_external_id: questionExternalId, correct });
    writeKey(KEY_ANSWERED, answered);
  },

  async getAnsweredExternalIds(profileId: string, _moduleIds: string[]): Promise<string[]> {
    // moduleIds is for forward compat; in mock mode we return all answered for the profile
    const answered = readKey<AnsweredRow>(KEY_ANSWERED);
    return answered
      .filter(r => r.profile_id === profileId)
      .map(r => r.question_external_id);
  },

  async recordQuiz(
    profileId: string,
    moduleId: string,
    score: number,
    total: number,
    durationS: number,
  ): Promise<void> {
    const now = new Date().toISOString();

    // Append to history
    const history = readKey<HistoryRow>(KEY_HISTORY);
    history.push({ profile_id: profileId, module_id: moduleId, score, total, duration_s: durationS, played_at: now });
    writeKey(KEY_HISTORY, history);

    // Update progress
    const progress = readKey<ProgressRow>(KEY_PROGRESS);
    const idx = progress.findIndex(p => p.profile_id === profileId && p.module_id === moduleId);

    if (idx === -1) {
      progress.push({
        profile_id: profileId,
        module_id: moduleId,
        questions_seen: total,
        correct_count: score,
        best_score: score,
        current_streak: score >= 8 ? 1 : 0,
        last_played_at: now,
      });
    } else {
      const row = progress[idx];
      row.questions_seen += total;
      row.correct_count += score;
      row.best_score = Math.max(row.best_score, score);
      row.current_streak = score >= 8 ? row.current_streak + 1 : 0;
      row.last_played_at = now;
    }

    writeKey(KEY_PROGRESS, progress);
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
    const progress = readKey<ProgressRow>(KEY_PROGRESS);
    return progress
      .filter(p => p.profile_id === profileId)
      .map(p => ({
        module_id: p.module_id,
        questions_seen: p.questions_seen,
        correct_count: p.correct_count,
        best_score: p.best_score,
        current_streak: p.current_streak,
        last_played_at: p.last_played_at,
      }));
  },
};
