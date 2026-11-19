-- PTCGL Tracker sync: write-only credentials and the log columns a synced row
-- needs. See docs/tracker-sync.md.
-- Applied by hand today; the repo has no migration runner. Run it as one
-- transaction, before deploying the code that reads these columns.

create table if not exists public.tracker_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 64),
  default_format text not null check (char_length(default_format) between 1 and 64),
  token_hash text not null unique,
  token_hint text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  window_started_at timestamptz not null default now(),
  window_count integer not null default 0
);

create index if not exists tracker_credentials_user_id_idx
  on public.tracker_credentials (user_id);

-- The ten-token cap is enforced in the database. The advisory lock serialises
-- concurrent mints for one player, which a bare count under READ COMMITTED
-- would not.
create or replace function public.enforce_tracker_credential_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));

  if (
    select count(*)
      from public.tracker_credentials
     where user_id = new.user_id
       and revoked_at is null
  ) >= 10 then
    raise exception 'tracker_credential_limit' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists tracker_credential_limit on public.tracker_credentials;
create trigger tracker_credential_limit
  before insert on public.tracker_credentials
  for each row execute function public.enforce_tracker_credential_limit();

alter table public.tracker_credentials enable row level security;

-- Players only ever read their own credentials. Minting, rotation and
-- revocation happen server-side with the service role, which bypasses RLS.
drop policy if exists "Players can read their own tracker credentials" on public.tracker_credentials;
create policy "Players can read their own tracker credentials"
  on public.tracker_credentials
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- The policy is row-level; keep the token hash and rate-limit state out of
-- what the browser can select.
revoke select on public.tracker_credentials from authenticated;
grant select (id, label, default_format, token_hint, created_at, last_used_at, revoked_at)
  on public.tracker_credentials to authenticated;

-- `import_hash` may already exist in some environments (the paste path filters
-- on it). `add column if not exists` would keep a non-text column and every
-- delivery would then fail at runtime, so assert the type first.
do $$
begin
  if exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'logs'
       and column_name = 'import_hash'
       and data_type <> 'text'
  ) then
    raise exception
      'public.logs.import_hash exists with a non-text type; convert it before applying tracker sync';
  end if;
end
$$;

alter table public.logs
  add column if not exists import_hash text,
  add column if not exists source_credential_id uuid
    references public.tracker_credentials (id) on delete set null,
  add column if not exists decklist_text text;

-- `create unique index if not exists` would accept a same-named non-unique
-- index, so drop and recreate. The index covers tracker deliveries only:
-- pasted logs do not write `import_hash` yet. Fail *before* the drop if duplicate pairs exist,
-- otherwise a hand-applied file could leave logs without uniqueness.
do $$
begin
  if exists (
    select 1
      from public.logs
     where import_hash is not null
     group by "user", import_hash
    having count(*) > 1
  ) then
    raise exception
      'public.logs has duplicate (user, import_hash) pairs; resolve them before applying tracker sync';
  end if;
end
$$;

drop index if exists public.logs_user_import_hash_idx;
create unique index logs_user_import_hash_idx
  on public.logs ("user", import_hash)
  where import_hash is not null;

-- One atomic call does token lookup, revocation check and the fixed rate
-- window, so concurrent deliveries cannot race the counter. Vercel runs many
-- instances, so an in-process counter would not hold.
create or replace function public.claim_tracker_credential_request(
  p_token_hash text,
  p_limit integer,
  p_window interval default interval '1 hour'
)
returns table (
  credential_id uuid,
  user_id uuid,
  label text,
  default_format text,
  allowed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.tracker_credentials%rowtype;
  v_window_started_at timestamptz;
  v_window_count integer;
begin
  select * into v
    from public.tracker_credentials
   where tracker_credentials.token_hash = p_token_hash
     and tracker_credentials.revoked_at is null
     for update;

  if not found then
    return;
  end if;

  v_window_started_at := v.window_started_at;
  v_window_count := v.window_count;

  if v_window_started_at < now() - p_window then
    v_window_started_at := now();
    v_window_count := 0;
  end if;

  if v_window_count >= p_limit then
    -- Do not touch last_used_at: a refused delivery is not a sync.
    update public.tracker_credentials
       set window_started_at = v_window_started_at,
           window_count = v_window_count
     where id = v.id;

    return query select v.id, v.user_id, v.label, v.default_format, false;
    return;
  end if;

  -- `last_used_at` is stamped by the route only after the log is accepted, so
  -- "last sync" never advances for a rejected delivery.
  update public.tracker_credentials
     set window_started_at = v_window_started_at,
         window_count = v_window_count + 1
   where id = v.id;

  return query select v.id, v.user_id, v.label, v.default_format, true;
end;
$$;

revoke all on function public.claim_tracker_credential_request(text, integer, interval)
  from public, anon, authenticated;
grant execute on function public.claim_tracker_credential_request(text, integer, interval)
  to service_role;
