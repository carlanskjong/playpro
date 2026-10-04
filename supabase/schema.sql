-- =====================================================================
-- Playpro database setup
--
-- HOW TO USE: In your NEW Playpro Supabase project (never in your other
-- project!), open "SQL Editor" -> "New query", paste this whole file,
-- change the invite code on the line marked  <-- CHANGE ME  and press Run.
--
-- UPDATING: when Playpro gets new features, paste and run this whole file
-- again. It only adds what is missing; your data and invite code stay as
-- they are. (Supabase warns about "destructive operations" because the
-- file replaces its own rules; choose "Run this query".)
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

-- Words that may not appear in usernames. "false" = blocked anywhere in the
-- name ("xfuckx"); "true" = blocked only as a whole word, because it hides
-- inside ordinary words ("ass" in "classic"). Look-alike spellings are
-- caught too: "a55", "BigAss", "fuuuck". Add a word anytime:
--   insert into private.blocked_words (word, whole_word) values ('word', false);
-- Anyone whose username then breaks the rules must choose a new one the
-- next time they open the app.
create table if not exists private.blocked_words (
  word       text primary key check (word ~ '^[a-z]+$'),
  whole_word boolean not null default false
);
alter table private.blocked_words enable row level security;
insert into private.blocked_words (word, whole_word) values
  ('fuck', false),
  ('shit', false),
  ('cunt', false),
  ('nigger', false),
  ('nigga', false),
  ('faggot', false),
  ('whore', false),
  ('slut', false),
  ('bitch', false),
  ('bastard', false),
  ('asshole', false),
  ('dickhead', false),
  ('penis', false),
  ('vagina', false),
  ('pussy', false),
  ('porn', false),
  ('hitler', false),
  ('nazi', false),
  ('retard', false),
  ('wanker', false),
  ('dildo', false),
  ('blowjob', false),
  ('handjob', false),
  ('pedophile', false),
  ('paedophile', false),
  ('molest', false),
  ('incest', false),
  ('tranny', false),
  ('jizz', false),
  ('piss', false),
  ('faen', false),
  ('fitte', false),
  ('fitta', false),
  ('kuken', false),
  ('pikken', false),
  ('horunge', false),
  ('neger', false),
  ('javla', false),
  ('jaevla', false),
  ('jevla', false),
  ('helvete', false),
  ('helvette', false),
  ('dritt', false),
  ('rasshol', false),
  ('tispe', false),
  ('knull', false),
  ('homse', false),
  ('mongoloid', false),
  ('ass', true),
  ('arse', true),
  ('dick', true),
  ('cock', true),
  ('rape', true),
  ('rapist', true),
  ('crap', true),
  ('cum', true),
  ('tits', true),
  ('anal', true),
  ('sex', true),
  ('pedo', true),
  ('paedo', true),
  ('kkk', true),
  ('heil', true),
  ('kike', true),
  ('spic', true),
  ('chink', true),
  ('gook', true),
  ('coon', true),
  ('dyke', true),
  ('homo', true),
  ('twat', true),
  ('kuk', true),
  ('pikk', true),
  ('hore', true),
  ('hora', true),
  ('rava', true),
  ('raeva', true),
  ('satan', true),
  ('kodd', true),
  ('koedd', true),
  ('pule', true),
  ('soper', true),
  ('mongo', true),
  ('admin', true),
  ('administrator', true),
  ('playpro', true),
  ('moderator', true),
  ('mod', true),
  ('support', true),
  ('root', true),
  ('system', true),
  ('staff', true),
  ('official', true)
on conflict (word) do nothing;


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

-- Optional profile picture: a small square photo (about 15 KB), stored as
-- text so it is deleted and exported together with the rest of the profile.
alter table public.profiles add column if not exists avatar text
  check (avatar is null or (char_length(avatar) <= 100000 and avatar like 'data:image/%'));

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
-- IMDb id of the title (saves a lookup) and when you watched it (statistics).
alter table public.entries add column if not exists imdb_id text check (imdb_id ~ '^tt[0-9]+$');
alter table public.entries add column if not exists watched_at timestamptz;
update public.entries set watched_at = updated_at where status = 'seen' and watched_at is null;
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


-- Your own lists ("Christmas films"). Friends can see lists marked shared.
create table if not exists public.lists (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  shared     boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists lists_owner_idx on public.lists (owner);

create table if not exists public.list_items (
  list_id     uuid not null references public.lists (id) on delete cascade,
  media_type  text not null check (media_type in ('movie', 'tv')),
  tmdb_id     integer not null,
  title       text not null check (char_length(title) <= 300),
  poster_path text check (char_length(poster_path) <= 100),
  year        text check (char_length(year) <= 4),
  added_at    timestamptz not null default now(),
  primary key (list_id, media_type, tmdb_id)
);

-- Comments and reactions on a rating/review (an entry).
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  entry_user  uuid not null,
  media_type  text not null,
  tmdb_id     integer not null,
  author      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 500),
  created_at  timestamptz not null default now(),
  foreign key (entry_user, media_type, tmdb_id)
    references public.entries (user_id, media_type, tmdb_id) on delete cascade
);
create index if not exists comments_entry_idx on public.comments (entry_user, media_type, tmdb_id);

create table if not exists public.reactions (
  entry_user  uuid not null,
  media_type  text not null,
  tmdb_id     integer not null,
  author      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind        text not null check (kind in ('like', 'love', 'laugh', 'wow', 'popcorn')),
  created_at  timestamptz not null default now(),
  primary key (entry_user, media_type, tmdb_id, author),
  foreign key (entry_user, media_type, tmdb_id)
    references public.entries (user_id, media_type, tmdb_id) on delete cascade
);


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

-- What's wrong with a username, if anything: 'format' (not 3 to 20 letters,
-- numbers or _), 'blocked' (a word from private.blocked_words), or null.
create or replace function public.username_problem(name text)
returns text
language plpgsql stable security definer set search_path = ''
as $$
declare
  spaced   text;
  flat     text;
  squeezed text;
  tokens   text[];
  w        record;
begin
  if name is null or name !~ '^[A-Za-z0-9_]{3,20}$' then
    return 'format';
  end if;
  -- "BigA55_x" -> words "big", "ass", "x"; flat "bigassx"; squeezed drops repeats ("fuuuck" -> "fuck")
  spaced   := lower(regexp_replace(name, '([a-z])([A-Z])', '\1_\2', 'g'));
  spaced   := regexp_replace(translate(spaced, '013457', 'oieast'), '[0-9]', '', 'g');
  tokens   := array_remove(string_to_array(spaced, '_'), '');
  flat     := replace(spaced, '_', '');
  squeezed := regexp_replace(flat, '(.)\1+', '\1', 'g');
  for w in select word, whole_word from private.blocked_words loop
    if w.whole_word then
      if w.word = any (tokens) or w.word = flat then return 'blocked'; end if;
    elsif position(w.word in flat) > 0
       or (char_length(regexp_replace(w.word, '(.)\1+', '\1', 'g')) >= 4
           and position(regexp_replace(w.word, '(.)\1+', '\1', 'g') in squeezed) > 0) then
      return 'blocked';
    end if;
  end loop;
  return null;
end;
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
grant  execute on function public.username_problem(text)   to anon, authenticated;


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

-- Usernames must follow the rules when they're chosen or changed. (Names
-- chosen before a rule existed are left alone; the app asks those people
-- to pick a new one.)
create or replace function public.playpro_check_username()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  problem text := public.username_problem(new.username);
begin
  if problem is not null then
    raise exception 'Username not allowed (%)', problem using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke execute on function public.playpro_check_username() from public, anon, authenticated;

drop trigger if exists playpro_check_username on public.profiles;
create trigger playpro_check_username
  before insert or update of username on public.profiles
  for each row execute function public.playpro_check_username();


-- ---------------------------------------------------------------------
-- 5. Row Level Security: who may read/write what
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.entries     enable row level security;
alter table public.friendships enable row level security;
alter table public.lists       enable row level security;
alter table public.list_items  enable row level security;
alter table public.comments    enable row level security;
alter table public.reactions   enable row level security;

-- Grant exactly what the app needs. (Newer Supabase projects grant nothing
-- by default, older ones grant everything; this works the same for both.)
-- Visitors who are not logged in get nothing.
grant usage on schema public to anon, authenticated;
revoke all on public.profiles, public.entries, public.friendships,
  public.lists, public.list_items, public.comments, public.reactions from anon, authenticated;
grant select on public.profiles to authenticated;
-- Users may only change these profile columns (not their id).
grant update (username, services, avatar) on public.profiles to authenticated;
grant select, insert, update, delete on public.entries to authenticated;
grant select, insert, delete on public.friendships to authenticated;
-- The only thing you can change on a friendship is accepting it.
grant update (status) on public.friendships to authenticated;
grant select, insert, delete on public.lists, public.list_items, public.comments to authenticated;
grant update (name, shared) on public.lists to authenticated;
grant select, insert, delete on public.reactions to authenticated;
grant update (kind) on public.reactions to authenticated;

-- ratings: signed-in members can read; only the import job (which uses the
-- secret key and skips these rules) can write
alter table public.imdb_ratings enable row level security;
alter table public.rt_scores    enable row level security;
revoke all on public.imdb_ratings, public.rt_scores from anon, authenticated;
grant  select on public.imdb_ratings, public.rt_scores to authenticated;
grant  select, insert, update, delete on public.imdb_ratings, public.rt_scores to service_role;

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

-- lists: yours, plus shared lists of your friends; only you change yours
drop policy if exists "lists: read own or friends' shared" on public.lists;
create policy "lists: read own or friends' shared" on public.lists
  for select to authenticated
  using (owner = (select auth.uid()) or (shared and public.is_friend(owner)));

drop policy if exists "lists: insert own" on public.lists;
create policy "lists: insert own" on public.lists
  for insert to authenticated with check (owner = (select auth.uid()));

drop policy if exists "lists: update own" on public.lists;
create policy "lists: update own" on public.lists
  for update to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));

drop policy if exists "lists: delete own" on public.lists;
create policy "lists: delete own" on public.lists
  for delete to authenticated using (owner = (select auth.uid()));

-- list items follow their list (the lists rules above decide what you see)
drop policy if exists "list_items: read visible lists" on public.list_items;
create policy "list_items: read visible lists" on public.list_items
  for select to authenticated
  using (exists (select 1 from public.lists l where l.id = list_id));

drop policy if exists "list_items: change own lists" on public.list_items;
drop policy if exists "list_items: add to own lists" on public.list_items;
create policy "list_items: add to own lists" on public.list_items
  for insert to authenticated
  with check (exists (select 1 from public.lists l where l.id = list_id and l.owner = (select auth.uid())));

drop policy if exists "list_items: remove from own lists" on public.list_items;
create policy "list_items: remove from own lists" on public.list_items
  for delete to authenticated
  using (exists (select 1 from public.lists l where l.id = list_id and l.owner = (select auth.uid())));

-- comments and reactions: visible to whoever can see the rating; you can
-- add your own on your ratings or your friends'; remove your own, or any
-- on your own rating
drop policy if exists "comments: read" on public.comments;
create policy "comments: read" on public.comments
  for select to authenticated
  using (entry_user = (select auth.uid()) or public.is_friend(entry_user));

drop policy if exists "comments: write own" on public.comments;
create policy "comments: write own" on public.comments
  for insert to authenticated
  with check (author = (select auth.uid()) and (entry_user = (select auth.uid()) or public.is_friend(entry_user)));

drop policy if exists "comments: delete" on public.comments;
create policy "comments: delete" on public.comments
  for delete to authenticated
  using ((select auth.uid()) in (author, entry_user));

drop policy if exists "reactions: read" on public.reactions;
create policy "reactions: read" on public.reactions
  for select to authenticated
  using (entry_user = (select auth.uid()) or public.is_friend(entry_user));

drop policy if exists "reactions: write own" on public.reactions;
create policy "reactions: write own" on public.reactions
  for insert to authenticated
  with check (author = (select auth.uid()) and (entry_user = (select auth.uid()) or public.is_friend(entry_user)));

drop policy if exists "reactions: change own" on public.reactions;
create policy "reactions: change own" on public.reactions
  for update to authenticated
  using (author = (select auth.uid())) with check (author = (select auth.uid()));

drop policy if exists "reactions: delete" on public.reactions;
create policy "reactions: delete" on public.reactions
  for delete to authenticated
  using ((select auth.uid()) in (author, entry_user));
