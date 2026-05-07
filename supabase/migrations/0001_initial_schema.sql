-- =============================================================================
-- Kids Quiz Claude — initial schema
-- =============================================================================
--
-- Mirrors the localStorage mock backend (src/services/mockBackend.ts).
--
-- Auth model: custom username + 4-emoji PIN (NOT Supabase Auth).
-- Hashing: SHA-256(secret || salt) using pgcrypto's digest().
-- All credential validation, lockout enforcement, and token issuance
-- happens server-side inside SECURITY DEFINER RPC functions so the anon
-- key alone cannot read pin_hash / recovery_hash / salt.
--
-- RLS NOTE: tables have RLS enabled with permissive anon policies for now.
-- The PIN-gated RPCs are the real auth boundary. Tighten policies in a
-- future migration once we move to Supabase Auth or signed JWTs.
-- =============================================================================

-- pgcrypto provides digest() and gen_random_bytes(). On hosted Supabase
-- pgcrypto is pre-installed in the `extensions` schema; on a vanilla
-- Postgres / local CLI install it lands in `public`. The function
-- definitions below set search_path to include both so they resolve in
-- either environment.
create schema if not exists extensions;
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists profiles (
  id              uuid primary key default gen_random_uuid(),
  username        text not null,
  avatar          text not null,
  age_band        text not null check (age_band in ('5-6', '7-9')),
  pin_hash        text not null,
  salt            text not null,
  recovery_hash   text not null,
  failed_attempts integer not null default 0,
  locked_until    timestamptz,
  created_at      timestamptz not null default now()
);

-- Case-insensitive username uniqueness (also serves as lookup index).
create unique index if not exists profiles_username_lower_uniq
  on profiles (lower(username));

create table if not exists answered_questions (
  id                   bigserial primary key,
  profile_id           uuid not null references profiles(id) on delete cascade,
  question_external_id text not null,
  correct              boolean not null,
  answered_at          timestamptz not null default now()
);

create index if not exists answered_questions_profile_qext_idx
  on answered_questions (profile_id, question_external_id);

create table if not exists quiz_history (
  id          bigserial primary key,
  profile_id  uuid not null references profiles(id) on delete cascade,
  module_id   text not null,
  score       integer not null,
  total       integer not null,
  duration_s  integer not null,
  played_at   timestamptz not null default now()
);

create index if not exists quiz_history_profile_played_idx
  on quiz_history (profile_id, played_at desc);

create table if not exists module_progress (
  id              bigserial primary key,
  profile_id      uuid not null references profiles(id) on delete cascade,
  module_id       text not null,
  questions_seen  integer not null default 0,
  correct_count   integer not null default 0,
  best_score      integer not null default 0,
  current_streak  integer not null default 0,
  last_played_at  timestamptz,
  unique (profile_id, module_id)
);

-- -----------------------------------------------------------------------------
-- Helper: SHA-256 hex digest
-- -----------------------------------------------------------------------------
-- Matches the JS hashing scheme: SHA-256 of (secret || salt), hex-encoded.

create or replace function sha256_hex(p_input text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(digest(p_input, 'sha256'), 'hex');
$$;

-- -----------------------------------------------------------------------------
-- Helper: random hex salt (16 bytes → 32 hex chars)
-- -----------------------------------------------------------------------------

create or replace function generate_salt()
returns text
language sql
volatile
set search_path = public, extensions
as $$
  select encode(gen_random_bytes(16), 'hex');
$$;

-- -----------------------------------------------------------------------------
-- Helper: recovery code generator — `${ADJ}-${NOUN}-${4-digit}`
-- -----------------------------------------------------------------------------

create or replace function generate_recovery_code()
returns text
language plpgsql
volatile
as $$
declare
  adjs text[] := array[
    'BRAVE','COOL','EPIC','FAST','GLAD','HAPPY','HUGE','JOLLY',
    'KIND','LUSH','MEGA','NEON','PROUD','QUICK','RADIANT','SHARP',
    'SWIFT','TALL','ULTRA','VIVID','WILD','ZESTY'
  ];
  nouns text[] := array[
    'BEAR','BIRD','CAT','CLOUD','DRAGON','EAGLE','FOX','FROG',
    'HAWK','HORSE','LION','MOON','PANDA','PLANET','RABBIT','ROCKET',
    'SHARK','STAR','TIGER','UNICORN','WOLF','ZEBRA'
  ];
begin
  return adjs[1 + floor(random() * array_length(adjs, 1))::int]
    || '-' || nouns[1 + floor(random() * array_length(nouns, 1))::int]
    || '-' || lpad(floor(random() * 10000)::text, 4, '0');
end;
$$;

-- -----------------------------------------------------------------------------
-- Helper: profanity check
-- -----------------------------------------------------------------------------
-- Minimal port of src/lib/profanity.ts. Tokenises on non-letter runs AND
-- lower→upper CamelCase boundaries; blocks if any token (lowercased) is in
-- the blocklist. NOT a substring match — legit names like "Cassidy" pass.
-- Kept simple; the client-side check is the primary defense.

create or replace function contains_profanity(p_input text)
returns boolean
language plpgsql
immutable
as $$
declare
  blocked text[] := array[
    'ass','damn','hell','crap','shit','fuck','bitch','piss',
    'butt','sex','porn','kill','nazi','dick','cock','tit'
  ];
  -- Insert a separator before any lower→upper transition, then split on
  -- any non-letter run. Mirrors the JS tokenizer.
  separated text;
  tok text;
begin
  if p_input is null or length(p_input) = 0 then
    return false;
  end if;

  separated := regexp_replace(p_input, '([a-z])([A-Z])', '\1 \2', 'g');

  for tok in
    select lower(t) from regexp_split_to_table(separated, '[^a-zA-Z]+') as t
    where t <> ''
  loop
    if tok = any(blocked) then
      return true;
    end if;
  end loop;

  return false;
end;
$$;

-- -----------------------------------------------------------------------------
-- Helper: lockout duration (minutes) for a given failed_attempts count
-- -----------------------------------------------------------------------------
-- Ladder: 5 → 1 min, 8 → 5 min, 10 → 24 h. Returns NULL below 5.

create or replace function lockout_interval(p_failed_attempts integer)
returns interval
language sql
immutable
as $$
  select case
    when p_failed_attempts >= 10 then interval '24 hours'
    when p_failed_attempts >= 8  then interval '5 minutes'
    when p_failed_attempts >= 5  then interval '1 minute'
    else null
  end;
$$;

-- -----------------------------------------------------------------------------
-- Helper: random token issuance
-- -----------------------------------------------------------------------------
-- Token shape mirrors mockBackend's "mock-<id>-<rand>" but prefixed "sb-".
-- This is an opaque session marker the client stores; the real auth
-- boundary is the RPC, not the token.

create or replace function issue_token(p_profile_id uuid)
returns text
language sql
volatile
as $$
  select 'sb-' || p_profile_id::text || '-' || md5(random()::text);
$$;

-- =============================================================================
-- RPCs
-- =============================================================================
--
-- Error contract: we raise standard PG exceptions whose MESSAGE starts with
-- a hint code in square brackets, e.g. "[TAKEN] Username already in use".
-- Clients pattern-match on the prefix. Codes used:
--   [INVALID]            — bad input shape (length, age_band, etc.)
--   [PROFANITY]          — username failed profanity check
--   [TAKEN]              — username already exists
--   [WRONG_CREDENTIALS]  — login failed (generic; covers unknown user too)
--   [WRONG_RECOVERY]     — recovery code wrong (generic; covers unknown user)
--   [LOCKED]             — account is in lockout window; ISO ts in message
-- =============================================================================

-- -----------------------------------------------------------------------------
-- rpc_check_username_available
-- -----------------------------------------------------------------------------

create or replace function rpc_check_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select not exists (
    select 1 from profiles where lower(username) = lower(p_username)
  );
$$;

-- -----------------------------------------------------------------------------
-- rpc_signup
-- -----------------------------------------------------------------------------

create or replace function rpc_signup(
  p_username text,
  p_pin      text,
  p_avatar   text,
  p_age_band text
)
returns json
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_id            uuid;
  v_salt          text;
  v_pin_hash      text;
  v_recovery_code text;
  v_recovery_hash text;
  v_token         text;
begin
  -- Validate basics
  if p_username is null or length(p_username) < 3 or length(p_username) > 20 then
    raise exception '[INVALID] Username must be 3-20 characters';
  end if;

  if p_age_band not in ('5-6', '7-9') then
    raise exception '[INVALID] Age band must be 5-6 or 7-9';
  end if;

  if p_pin is null or length(p_pin) = 0 then
    raise exception '[INVALID] PIN is required';
  end if;

  if contains_profanity(p_username) then
    raise exception '[PROFANITY] Username contains a blocked word';
  end if;

  if exists (select 1 from profiles where lower(username) = lower(p_username)) then
    raise exception '[TAKEN] Username "%" is already taken', p_username;
  end if;

  -- Build credentials
  v_id            := gen_random_uuid();
  v_salt          := generate_salt();
  v_pin_hash      := sha256_hex(p_pin || v_salt);
  v_recovery_code := generate_recovery_code();
  v_recovery_hash := sha256_hex(v_recovery_code || v_salt);

  insert into profiles (
    id, username, avatar, age_band,
    pin_hash, salt, recovery_hash,
    failed_attempts, locked_until
  ) values (
    v_id, p_username, p_avatar, p_age_band,
    v_pin_hash, v_salt, v_recovery_hash,
    0, null
  );

  v_token := issue_token(v_id);

  return json_build_object(
    'profile_id',    v_id,
    'username',      p_username,
    'avatar',        p_avatar,
    'age_band',      p_age_band,
    'recovery_code', v_recovery_code,
    'token',         v_token
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- rpc_login
-- -----------------------------------------------------------------------------

create or replace function rpc_login(
  p_username text,
  p_pin      text
)
returns json
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_row     profiles%rowtype;
  v_attempt text;
  v_lock    interval;
  v_token   text;
begin
  select * into v_row from profiles where lower(username) = lower(p_username) limit 1;

  -- Unknown user → same generic error as wrong PIN (no enumeration)
  if not found then
    raise exception '[WRONG_CREDENTIALS] Invalid username or PIN';
  end if;

  -- Active lockout?
  if v_row.locked_until is not null and v_row.locked_until > now() then
    raise exception '[LOCKED] Account is locked until %',
      to_char(v_row.locked_until at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  end if;

  -- Expired lockout → clear before evaluating
  if v_row.locked_until is not null and v_row.locked_until <= now() then
    update profiles
       set locked_until = null,
           failed_attempts = 0
     where id = v_row.id;
    v_row.locked_until := null;
    v_row.failed_attempts := 0;
  end if;

  v_attempt := sha256_hex(p_pin || v_row.salt);

  if v_attempt <> v_row.pin_hash then
    -- Wrong PIN: bump counter + apply ladder
    v_row.failed_attempts := v_row.failed_attempts + 1;
    v_lock := lockout_interval(v_row.failed_attempts);

    update profiles
       set failed_attempts = v_row.failed_attempts,
           locked_until    = case when v_lock is not null then now() + v_lock else locked_until end
     where id = v_row.id;

    raise exception '[WRONG_CREDENTIALS] Invalid username or PIN';
  end if;

  -- Success: reset counters, issue token
  update profiles
     set failed_attempts = 0,
         locked_until    = null
   where id = v_row.id;

  v_token := issue_token(v_row.id);

  return json_build_object(
    'profile_id', v_row.id,
    'username',   v_row.username,
    'avatar',     v_row.avatar,
    'age_band',   v_row.age_band,
    'token',      v_token
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- rpc_recover_pin
-- -----------------------------------------------------------------------------

create or replace function rpc_recover_pin(
  p_username      text,
  p_recovery_code text,
  p_new_pin       text
)
returns json
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_row              profiles%rowtype;
  v_attempt          text;
  v_lock             interval;
  v_new_recovery     text;
  v_new_recovery_h   text;
  v_new_pin_hash     text;
begin
  if p_new_pin is null or length(p_new_pin) = 0 then
    raise exception '[INVALID] New PIN is required';
  end if;

  select * into v_row from profiles where lower(username) = lower(p_username) limit 1;

  if not found then
    raise exception '[WRONG_RECOVERY] Username or recovery code is incorrect';
  end if;

  -- Active lockout?
  if v_row.locked_until is not null and v_row.locked_until > now() then
    raise exception '[LOCKED] Account is locked until %',
      to_char(v_row.locked_until at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  end if;

  -- Expired lockout → clear
  if v_row.locked_until is not null and v_row.locked_until <= now() then
    update profiles
       set locked_until = null,
           failed_attempts = 0
     where id = v_row.id;
    v_row.locked_until := null;
    v_row.failed_attempts := 0;
  end if;

  v_attempt := sha256_hex(p_recovery_code || v_row.salt);

  if v_attempt <> v_row.recovery_hash then
    v_row.failed_attempts := v_row.failed_attempts + 1;
    v_lock := lockout_interval(v_row.failed_attempts);

    update profiles
       set failed_attempts = v_row.failed_attempts,
           locked_until    = case when v_lock is not null then now() + v_lock else locked_until end
     where id = v_row.id;

    raise exception '[WRONG_RECOVERY] Username or recovery code is incorrect';
  end if;

  -- Success: rotate PIN + recovery code
  v_new_recovery   := generate_recovery_code();
  v_new_pin_hash   := sha256_hex(p_new_pin || v_row.salt);
  v_new_recovery_h := sha256_hex(v_new_recovery || v_row.salt);

  update profiles
     set pin_hash        = v_new_pin_hash,
         recovery_hash   = v_new_recovery_h,
         failed_attempts = 0,
         locked_until    = null
   where id = v_row.id;

  return json_build_object('recovery_code', v_new_recovery);
end;
$$;

-- -----------------------------------------------------------------------------
-- rpc_log_answered
-- -----------------------------------------------------------------------------

create or replace function rpc_log_answered(
  p_profile_id           uuid,
  p_question_external_id text,
  p_correct              boolean
)
returns void
language sql
volatile
security definer
set search_path = public, extensions
as $$
  insert into answered_questions (profile_id, question_external_id, correct)
  values (p_profile_id, p_question_external_id, p_correct);
$$;

-- -----------------------------------------------------------------------------
-- rpc_get_answered_external_ids
-- -----------------------------------------------------------------------------
-- Returns distinct external IDs answered by a profile. p_module_ids is a
-- forward-compat hint; ignored for now (mock parity).

create or replace function rpc_get_answered_external_ids(
  p_profile_id uuid,
  p_module_ids text[] default null
)
returns setof text
language sql
stable
security definer
set search_path = public, extensions
as $$
  select distinct question_external_id
    from answered_questions
   where profile_id = p_profile_id;
$$;

-- -----------------------------------------------------------------------------
-- rpc_record_quiz
-- -----------------------------------------------------------------------------
-- Appends a history row AND upserts module_progress in one call so the
-- client doesn't need a transaction.

create or replace function rpc_record_quiz(
  p_profile_id uuid,
  p_module_id  text,
  p_score      integer,
  p_total      integer,
  p_duration_s integer
)
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  insert into quiz_history (profile_id, module_id, score, total, duration_s)
  values (p_profile_id, p_module_id, p_score, p_total, p_duration_s);

  insert into module_progress (
    profile_id, module_id,
    questions_seen, correct_count, best_score, current_streak, last_played_at
  ) values (
    p_profile_id, p_module_id,
    p_total, p_score, p_score,
    case when p_score >= 8 then 1 else 0 end,
    now()
  )
  on conflict (profile_id, module_id) do update
    set questions_seen = module_progress.questions_seen + excluded.questions_seen,
        correct_count  = module_progress.correct_count  + excluded.correct_count,
        best_score     = greatest(module_progress.best_score, excluded.best_score),
        current_streak = case
          when p_score >= 8 then module_progress.current_streak + 1
          else 0
        end,
        last_played_at = now();
end;
$$;

-- -----------------------------------------------------------------------------
-- rpc_get_progress
-- -----------------------------------------------------------------------------

create or replace function rpc_get_progress(p_profile_id uuid)
returns table (
  module_id       text,
  questions_seen  integer,
  correct_count   integer,
  best_score      integer,
  current_streak  integer,
  last_played_at  timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select module_id, questions_seen, correct_count, best_score, current_streak, last_played_at
    from module_progress
   where profile_id = p_profile_id;
$$;

-- -----------------------------------------------------------------------------
-- rpc_reset_all (dev/test only)
-- -----------------------------------------------------------------------------
-- Truncates every app table. SECURITY DEFINER so it can run with elevated
-- privileges, but execute is REVOKED from anon/authenticated below — only
-- the postgres role (or someone explicitly granted) may call it.

create or replace function rpc_reset_all()
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  truncate profiles, answered_questions, quiz_history, module_progress
    restart identity cascade;
end;
$$;

-- =============================================================================
-- RLS
-- =============================================================================
--
-- Permissive policies for now: the PIN-gated SECURITY DEFINER RPCs are the
-- real auth boundary, and the anon key needs CRUD-ish access on the
-- non-credential tables for direct reads (progress, history) when desired.
-- The `profiles` table still exposes pin_hash / salt / recovery_hash via
-- direct SELECT, which is the main reason this is flagged as TEMPORARY.
-- Tighten once real auth lands.

alter table profiles            enable row level security;
alter table answered_questions  enable row level security;
alter table quiz_history        enable row level security;
alter table module_progress     enable row level security;

drop policy if exists anon_all on profiles;
drop policy if exists anon_all on answered_questions;
drop policy if exists anon_all on quiz_history;
drop policy if exists anon_all on module_progress;

create policy anon_all on profiles            for all to anon, authenticated using (true) with check (true);
create policy anon_all on answered_questions  for all to anon, authenticated using (true) with check (true);
create policy anon_all on quiz_history        for all to anon, authenticated using (true) with check (true);
create policy anon_all on module_progress     for all to anon, authenticated using (true) with check (true);

-- =============================================================================
-- Grants
-- =============================================================================

grant execute on function rpc_check_username_available(text)               to anon, authenticated;
grant execute on function rpc_signup(text, text, text, text)               to anon, authenticated;
grant execute on function rpc_login(text, text)                            to anon, authenticated;
grant execute on function rpc_recover_pin(text, text, text)                to anon, authenticated;
grant execute on function rpc_log_answered(uuid, text, boolean)            to anon, authenticated;
grant execute on function rpc_get_answered_external_ids(uuid, text[])      to anon, authenticated;
grant execute on function rpc_record_quiz(uuid, text, integer, integer, integer) to anon, authenticated;
grant execute on function rpc_get_progress(uuid)                           to anon, authenticated;

-- rpc_reset_all is intentionally NOT granted to anon/authenticated.
revoke all on function rpc_reset_all() from public, anon, authenticated;
