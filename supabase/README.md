# Supabase backend for kids-quiz-claude

This directory contains the SQL schema and RPC functions that back the
"cloud" mode of the app. By default the app runs against a localStorage
mock backend (`src/services/mockBackend.ts`); when valid Supabase
credentials are present in `.env.local`, the client adapter switches over
to the RPCs defined here.

> **Auth model:** custom username + 4-emoji PIN, NOT Supabase Auth.
> Credentials are validated server-side inside SECURITY DEFINER RPCs, so
> the anon key alone cannot read PIN/recovery hashes when RLS is tightened
> in a follow-up migration.

---

## 1. Local dev path (Supabase CLI)

This gives you a fully local Postgres + Supabase stack on Docker.

```bash
# install once
brew install supabase/tap/supabase
# or: npm i -g supabase

# from the repo root
cd /path/to/kids-quiz-claude
supabase start                 # boots the local stack
supabase db reset              # applies migrations in supabase/migrations/

# grab the local URL + anon key
supabase status
# → API URL:        http://127.0.0.1:54321
# → anon key:       eyJ...
```

Copy those values into `.env.local`:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJ...
```

Restart `npm run dev` and the app will use the local Supabase backend.

## 2. Hosted dev path (supabase.com free tier)

1. Go to <https://supabase.com> and create a new project (free tier is
   plenty for this).
2. Open **SQL Editor** → **New query**, paste the contents of
   `supabase/migrations/0001_initial_schema.sql`, and click **Run**.
3. Open **Project Settings → API**:
   - Copy **Project URL** → `VITE_SUPABASE_URL`
   - Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`
4. Put both into `.env.local` (see `.env.example` at the repo root).
5. Restart `npm run dev`.

## 3. Mock fallback

If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing or empty,
the client adapter silently falls back to the localStorage `mockBackend`.
No console warning, no UI difference — it just keeps working offline.
This is intentional so the app is usable without a Supabase project.

---

## Schema overview

| Table | Purpose |
|-------|---------|
| `profiles` | One row per kid. Holds `username`, `avatar`, `age_band` (`5-6`/`7-9`), and credential material (`pin_hash`, `salt`, `recovery_hash`) plus lockout state (`failed_attempts`, `locked_until`). Unique index on `lower(username)`. |
| `answered_questions` | Per-question answer log. Keyed by `(profile_id, question_external_id)` so the client can dedupe seen questions. |
| `quiz_history` | One row per completed quiz attempt: `score / total / duration_s / played_at`. Indexed on `(profile_id, played_at desc)` for "recent runs" queries. |
| `module_progress` | Per-module aggregates: `questions_seen`, `correct_count`, `best_score`, `current_streak`, `last_played_at`. Unique on `(profile_id, module_id)` for upserts. |

All tables `cascade` on profile delete.

## RPC overview

All RPCs are `security definer`. Errors are raised as Postgres exceptions
whose message starts with a bracketed hint code like `[TAKEN]` or
`[WRONG_CREDENTIALS]` so the client adapter can map them to typed errors.

| RPC | Args | Returns | Notes |
|-----|------|---------|-------|
| `rpc_check_username_available` | `p_username text` | `boolean` | True if no profile uses that username (case-insensitive). |
| `rpc_signup` | `p_username, p_pin, p_avatar, p_age_band` | `json` with `profile_id, username, avatar, age_band, recovery_code, token` | Validates length 3-20, profanity-checks, rejects duplicates. Generates salt + hashes PIN and recovery code. |
| `rpc_login` | `p_username, p_pin` | `json` with `profile_id, username, avatar, age_band, token` | Generic `[WRONG_CREDENTIALS]` for both unknown user and bad PIN. Applies lockout ladder 5/8/10 → 1m/5m/24h. |
| `rpc_recover_pin` | `p_username, p_recovery_code, p_new_pin` | `json` with new `recovery_code` | Same lockout ladder. Rotates the recovery code on success. |
| `rpc_log_answered` | `p_profile_id, p_question_external_id, p_correct` | `void` | Append-only. |
| `rpc_get_answered_external_ids` | `p_profile_id, p_module_ids text[]` | `setof text` | `p_module_ids` is forward-compat — currently returns all distinct external IDs for the profile. |
| `rpc_record_quiz` | `p_profile_id, p_module_id, p_score, p_total, p_duration_s` | `void` | Inserts into `quiz_history` AND upserts `module_progress` in one call. Streak increments when `score >= 8`, otherwise resets to 0. |
| `rpc_get_progress` | `p_profile_id` | table of `(module_id, questions_seen, correct_count, best_score, current_streak, last_played_at)` | |
| `rpc_reset_all` | — | `void` | Dev/test only. `execute` is revoked from `anon` / `authenticated`. |

### Hashing

All hashes are `encode(digest(secret || salt, 'sha256'), 'hex')` via
pgcrypto, matching the JS `sha256(pin.join('') + salt)` scheme exactly.

### Lockout ladder

`failed_attempts` increments on every wrong PIN / recovery-code attempt
and resets to 0 on success or when an existing lockout expires.

| failed_attempts | extra lockout |
|---|---|
| 5  | + 1 minute |
| 8  | + 5 minutes |
| 10 | + 24 hours |

---

## Known limitations

- **RLS is permissive.** All four tables have `enable row level security`
  but the policies allow `anon` full CRUD. The PIN-gated RPCs are the
  real auth boundary today. With the current policies, an attacker with
  the anon key can `select * from profiles` and read `pin_hash`, `salt`,
  and `recovery_hash`. That's still SHA-256 hashed and salted, so it's
  brute-forceable rather than plaintext, but it is a known gap. Tighten
  in a follow-up once we have signed-JWT or Supabase Auth integration.
- **Profanity check is minimal.** It ports the JS algorithm but uses a
  ~16-word blocklist. The client-side check in `src/lib/profanity.ts` is
  the primary defense — the server check is a backstop for direct RPC
  calls.
- **Tokens are opaque.** `issue_token()` returns a random string; the
  server does not validate it on subsequent calls. The RPCs currently
  accept `profile_id` as a function argument and trust it. Future work:
  swap to short-lived signed JWTs and verify in each RPC.
- **No rate limiting beyond the lockout ladder.** A determined attacker
  could rotate usernames; consider Supabase Edge Functions or a WAF if
  this app ever gets real traffic.

## Re-running migrations

`supabase db reset` rebuilds the local DB from scratch and re-applies
every file in `supabase/migrations/`. **It wipes all data**, including
any profiles you created during testing. There is no in-place upgrade
path until we add a second migration file.

For the hosted project, paste the migration into the SQL editor again —
it uses `create ... if not exists` and `create or replace` everywhere, so
re-running is idempotent for schema definitions, but data is not wiped
unless you call `rpc_reset_all()` as a superuser.
