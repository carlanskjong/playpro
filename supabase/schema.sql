-- =====================================================================
-- Playpro database setup
--
-- HOW TO USE: In your NEW Playpro Supabase project (never in your other
-- project!), open "SQL Editor" -> "New query", paste this whole file,
-- change the invite code on the line marked  <-- CHANGE ME  and press Run.
--
-- It is safe to run this file again later; it only adds what is missing.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Private settings (not reachable from the app / internet)
-- ---------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.settings (
  key   text primary key,
  value text not null
);
-- Extra lock: nobody but the database itself may read it.
alter table private.settings enable row level security;

-- Friends need this code to create an account. Leave it empty ('') to let
-- anyone who finds your site sign up (not recommended).
insert into private.settings (key, value)
values ('invite_code', 'popcorn-2026')           -- <-- CHANGE ME
on conflict (key) do nothing;

-- Tip: to change the code later, run:
--   update private.settings set value = 'new-code' where key = 'invite_code';


-- ---------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------

-- One row per user. Only a username is public to other members; no real
-- names, birthdays or photos are stored (data minimisation, GDPR art. 5).
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  services   integer[] not null default '{}',   -- Norwegian streaming services you have (TMDB ids)
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower
  on public.profiles (lower(username));

-- Watchlist items and seen/rated titles.
create table if not exists public.entries (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  media_type  text not null check (media_type in ('movie', 'tv')),
  tmdb_id     integer not null,
  title       text not null check (char_length(title) <= 300),
  poster_path text check (char_length(poster_path) <= 100),
  year        text check (char_length(year) <= 4),
  status      text not null check (status in ('watchlist', 'seen')),
  rating      smallint check (rating between 1 and 10),
  review      text check (char_length(review) <= 500),
  updated_at  timestamptz not null default now(),
  primary key (user_id, media_type, tmdb_id)
);
create index if not exists entries_title_idx   on public.entries (media_type, tmdb_id);
create index if not exists entries_updated_idx on public.entries (updated_at desc);

-- Friend requests. A friendship is "accepted" once the other person says yes.
create table if not exists public.friendships (
  requester  uuid not null references public.profiles (id) on delete cascade,
  addressee  uuid not null references public.profiles (id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);
create unique index if not exists friendships_pair_idx
  on public.friendships (least(requester, addressee), greatest(requester, addressee));
create index if not exists friendships_addressee_idx on public.friendships (addressee);


-- Ratings copied in by the weekly import job (scripts/import-ratings.mjs).
-- Not personal data: one row per title, shared by everyone.
create table if not exists public.imdb_ratings (
  imdb_id    text primary key check (imdb_id ~ '^tt[0-9]+$'),
  rating     numeric(3, 1) not null,
  votes      integer not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.rt_scores (
  imdb_id    text primary key check (imdb_id ~ '^tt[0-9]+$'),
  score      smallint not null check (score between 0 and 100),
  as_of      date,                 -- when Wikidata recorded the score
  rt_id      text,                 -- e.g. "m/parasite_2019", for the link
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 3. Helper functions
-- ---------------------------------------------------------------------

-- true when the signed-in user and `other` are accepted friends
create or replace function public.is_friend(other uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester = (select auth.uid()) and f.addressee = other)
        or (f.addressee = (select auth.uid()) and f.requester = other))
  );
$$;

-- lets the sign-up form check whether a username is free
create or replace function public.username_available(name text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(name));
$$;

-- "Delete my account" button: removes the login and, through the
-- "on delete cascade" rules above, every row that belongs to the user.
create or replace function public.delete_my_account()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.is_friend(uuid)          from public, anon;
revoke execute on function public.delete_my_account()      from public, anon;
grant  execute on function public.is_friend(uuid)          to authenticated;
grant  execute on function public.delete_my_account()      to authenticated;
grant  execute on function public.username_available(text) to anon, authenticated;


-- ---------------------------------------------------------------------
-- 4. Sign-up rules: require the invite code, then create the profile
-- ---------------------------------------------------------------------
create or replace function public.playpro_check_invite()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  expected text;
begin
  select value into expected from private.settings where key = 'invite_code';
  if coalesce(expected, '') <> ''
     and coalesce(new.raw_user_meta_data ->> 'invite_code', '') <> expected then
    raise exception 'Invalid invite code';
  end if;
  -- don't keep the invite code stored on the user
  new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'invite_code';
  return new;
end;
$$;

create or replace function public.playpro_create_profile()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

revoke execute on function public.playpro_check_invite()   from public, anon, authenticated;
revoke execute on function public.playpro_create_profile() from public, anon, authenticated;

drop trigger if exists playpro_check_invite on auth.users;
create trigger playpro_check_invite
  before insert on auth.users
  for each row execute function public.playpro_check_invite();

drop trigger if exists playpro_create_profile on auth.users;
create trigger playpro_create_profile
  after insert on auth.users
  for each row execute function public.playpro_create_profile();


-- ---------------------------------------------------------------------
-- 5. Row Level Security: who may read/write what
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.entries     enable row level security;
alter table public.friendships enable row level security;

-- Users may only change these profile columns (not their id).
revoke update on public.profiles from anon, authenticated;
grant  update (username, services) on public.profiles to authenticated;
-- The only thing you can change on a friendship is accepting it.
revoke update on public.friendships from anon, authenticated;
grant  update (status) on public.friendships to authenticated;
-- Visitors who are not logged in get nothing.
revoke all on public.profiles, public.entries, public.friendships from anon;

-- ratings: signed-in members can read; only the import job (which uses the
-- secret key and skips these rules) can write
alter table public.imdb_ratings enable row level security;
alter table public.rt_scores    enable row level security;
revoke all on public.imdb_ratings, public.rt_scores from anon, authenticated;
grant  select on public.imdb_ratings, public.rt_scores to authenticated;

drop policy if exists "imdb_ratings: members can read" on public.imdb_ratings;
create policy "imdb_ratings: members can read" on public.imdb_ratings
  for select to authenticated using (true);

drop policy if exists "rt_scores: members can read" on public.rt_scores;
create policy "rt_scores: members can read" on public.rt_scores
  for select to authenticated using (true);

-- profiles: members can see usernames (to find friends); edit only your own
drop policy if exists "profiles: members can read" on public.profiles;
create policy "profiles: members can read" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- entries: you and your accepted friends can read; only you can write
drop policy if exists "entries: read own or friends" on public.entries;
create policy "entries: read own or friends" on public.entries
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_friend(user_id));

drop policy if exists "entries: insert own" on public.entries;
create policy "entries: insert own" on public.entries
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "entries: update own" on public.entries;
create policy "entries: update own" on public.entries
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "entries: delete own" on public.entries;
create policy "entries: delete own" on public.entries
  for delete to authenticated using (user_id = (select auth.uid()));

-- friendships: visible to the two people involved
drop policy if exists "friendships: read own" on public.friendships;
create policy "friendships: read own" on public.friendships
  for select to authenticated
  using ((select auth.uid()) in (requester, addressee));

drop policy if exists "friendships: send request" on public.friendships;
create policy "friendships: send request" on public.friendships
  for insert to authenticated
  with check (requester = (select auth.uid()) and status = 'pending');

drop policy if exists "friendships: accept request" on public.friendships;
create policy "friendships: accept request" on public.friendships
  for update to authenticated
  using (addressee = (select auth.uid()))
  with check (addressee = (select auth.uid()) and status = 'accepted');

drop policy if exists "friendships: remove" on public.friendships;
create policy "friendships: remove" on public.friendships
  for delete to authenticated
  using ((select auth.uid()) in (requester, addressee));
