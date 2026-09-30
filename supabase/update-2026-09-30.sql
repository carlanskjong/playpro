-- =====================================================================
-- Playpro database update (30 September 2026)
--  - fixes "permission denied for table profiles" on newer Supabase
--    projects, which don't give the app access to tables by default
--  - adds the profile picture column
--
-- HOW TO USE: Supabase (your playpro project) -> SQL Editor -> New query,
-- paste this whole file, press Run. Safe to run more than once.
-- (You don't need this if you ran supabase/schema.sql after this date.)
-- =====================================================================

alter table public.profiles add column if not exists avatar text
  check (avatar is null or (char_length(avatar) <= 100000 and avatar like 'data:image/%'));

grant usage on schema public to anon, authenticated;
revoke all on public.profiles, public.entries, public.friendships from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, services, avatar) on public.profiles to authenticated;
grant select, insert, update, delete on public.entries to authenticated;
grant select, insert, delete on public.friendships to authenticated;
grant update (status) on public.friendships to authenticated;
