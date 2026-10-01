// Checks supabase/schema.sql in a real (in-memory) Postgres: sign-up rules,
// who can see and change what, account deletion, and that the file can be
// run twice. The roles mimic a new Supabase project, which grants nothing
// by default.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8").replace("'popcorn-2026'", "'kino-42'");
const db = new PGlite();
let failed = 0;

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create role service_role nologin bypassrls; create role supabase_auth_admin nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.uid', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, supabase_auth_admin;
  grant execute on function auth.uid() to anon, authenticated;
  grant insert, select on auth.users to supabase_auth_admin;
  grant usage on schema public to anon, authenticated, service_role;
`);
await db.exec(schema);
await db.exec(schema); // running it again must work

const A = "00000000-0000-0000-0000-00000000000a"; // carlan
const B = "00000000-0000-0000-0000-00000000000b"; // friend
const C = "00000000-0000-0000-0000-00000000000c"; // stranger (not a friend)

async function as(role, uid, sql) {
  await db.exec(`reset role; select set_config('request.uid', '${uid || ""}', false); set role ${role};`);
  try {
    const res = await db.query(sql);
    return Object.assign(res.rows, { affected: res.affectedRows ?? 0 });
  } finally { await db.exec("reset role"); }
}
async function ok(name, role, uid, sql, check) {
  try {
    const rows = await as(role, uid, sql);
    if (check && !check(rows)) throw new Error("unexpected result " + JSON.stringify(rows));
    console.log("  ok   ", name);
  } catch (err) { failed++; console.log("  FAIL ", name, "-", err.message); }
}
async function refused(name, role, uid, sql) {
  try {
    const rows = await as(role, uid, sql);
    if (rows.length === 0 && !rows.affected) return console.log("  ok   ", name, "(nothing changed)");
    failed++; console.log("  FAIL ", name, "- was allowed");
  } catch { console.log("  ok   ", name, "(refused)"); }
}
const user = (id, name, code = "kino-42") => `insert into auth.users (id, email, raw_user_meta_data) values ('${id}', '${name}@x', '{"username":"${name}","invite_code":"${code}"}')`;

console.log("Sign-up");
await refused("wrong invite code", "supabase_auth_admin", null, user("00000000-0000-0000-0000-0000000000ff", "intruder", "nope"));
await ok("sign up with invite code", "supabase_auth_admin", null, user(A, "carlan"));
await ok("second and third person sign up", "supabase_auth_admin", null, `insert into auth.users (id, email, raw_user_meta_data) values ('${B}', 'f@x', '{"username":"friend","invite_code":"kino-42"}'), ('${C}', 's@x', '{"username":"stranger","invite_code":"kino-42"}')`);
await refused("same username, other case", "supabase_auth_admin", null, user("00000000-0000-0000-0000-0000000000fe", "CARLAN"));
await ok("invite code not kept on the user", "postgres", null, "select raw_user_meta_data from auth.users", (r) => r.every((u) => !("invite_code" in u.raw_user_meta_data)));
await ok("username check works logged out", "anon", null, "select public.username_available('newbie') as free", (r) => r[0].free === true);
await refused("logged-out visitor reads profiles", "anon", null, "select * from public.profiles");
await refused("logged-out visitor reads invite code", "anon", null, "select * from private.settings");

console.log("Profiles");
await ok("change own username, services, picture", "authenticated", A, `update public.profiles set username = 'Carlan', services = '{8}', avatar = 'data:image/jpeg;base64,xx' where id = '${A}' returning id`, (r) => r.length === 1);
await refused("edit someone else's profile", "authenticated", C, `update public.profiles set username = 'hacked' where id = '${A}' returning id`);
await refused("change own id", "authenticated", A, `update public.profiles set id = '${C}' where id = '${A}'`);

console.log("Lists and ratings");
const entry = (u, id, status, rating = "null") => `insert into public.entries (user_id, media_type, tmdb_id, title, status, rating, imdb_id, watched_at) values ('${u}', 'movie', ${id}, 'Film ${id}', '${status}', ${rating}, 'tt${id}', now()) on conflict (user_id, media_type, tmdb_id) do update set status = excluded.status, rating = excluded.rating returning status`;
await ok("add to watchlist", "authenticated", A, entry(A, 1, "watchlist"));
await ok("rate it (update via upsert)", "authenticated", A, entry(A, 1, "seen", 9));
await ok("friend adds to watchlist", "authenticated", B, entry(B, 2, "watchlist"));
await refused("write into someone else's list", "authenticated", A, entry(B, 3, "seen", 1));
await refused("stranger sees ratings", "authenticated", C, "select * from public.entries");

console.log("Friends");
await ok("send friend request", "authenticated", B, `insert into public.friendships (requester, addressee) values ('${B}', '${A}')`);
await refused("accept your own request", "authenticated", B, `update public.friendships set status = 'accepted' where requester = '${B}' returning status`);
await refused("rewrite who a request is from", "authenticated", A, `update public.friendships set requester = '${C}' where addressee = '${A}'`);
await ok("accept a request", "authenticated", A, `update public.friendships set status = 'accepted' where requester = '${B}' returning status`, (r) => r.length === 1);
await ok("friend sees ratings", "authenticated", B, "select rating from public.entries where user_id = '" + A + "'", (r) => r[0]?.rating === 9);
await ok("both watchlists visible (tonight matcher)", "authenticated", A, "select user_id from public.entries where status = 'watchlist'", (r) => r.length === 1);

console.log("Comments and reactions");
await ok("friend comments on a rating", "authenticated", B, `insert into public.comments (entry_user, media_type, tmdb_id, body) values ('${A}', 'movie', 1, 'Agree!') returning author`, (r) => r[0].author === B);
await ok("friend reacts", "authenticated", B, `insert into public.reactions (entry_user, media_type, tmdb_id, kind) values ('${A}', 'movie', 1, 'love')`);
await refused("stranger comments", "authenticated", C, `insert into public.comments (entry_user, media_type, tmdb_id, body) values ('${A}', 'movie', 1, 'spam')`);
await refused("stranger reads comments", "authenticated", C, "select * from public.comments");
await refused("comment as someone else", "authenticated", B, `insert into public.comments (entry_user, media_type, tmdb_id, author, body) values ('${A}', 'movie', 1, '${A}', 'fake')`);
await ok("owner removes a comment on their rating", "authenticated", A, "delete from public.comments returning id", (r) => r.length === 1);

console.log("Custom lists");
await ok("create a list", "authenticated", A, "insert into public.lists (name) values ('Christmas films') returning owner", (r) => r[0].owner === A);
await ok("add a title to it", "authenticated", A, "insert into public.list_items (list_id, media_type, tmdb_id, title) select id, 'movie', 7, 'Elf' from public.lists returning tmdb_id");
await ok("friend sees shared list", "authenticated", B, "select i.title from public.list_items i", (r) => r.length === 1);
await refused("friend adds to my list", "authenticated", B, "insert into public.list_items (list_id, media_type, tmdb_id, title) select id, 'movie', 8, 'x' from public.lists");
await refused("stranger sees my list", "authenticated", C, "select * from public.lists");
await ok("make list private", "authenticated", A, "update public.lists set shared = false returning id", (r) => r.length === 1);
await refused("friend sees private list", "authenticated", B, "select * from public.lists");

console.log("Ratings import job");
await ok("job saves IMDb ratings", "service_role", null, "insert into public.imdb_ratings (imdb_id, rating, votes) values ('tt1', 8.5, 1000) on conflict (imdb_id) do update set rating = excluded.rating");
await ok("job saves RT scores", "service_role", null, "insert into public.rt_scores (imdb_id, score) values ('tt1', 92) on conflict (imdb_id) do update set score = excluded.score");
await ok("job removes old rows", "service_role", null, "delete from public.imdb_ratings where updated_at < now() - interval '1 day'");
await ok("members read ratings", "authenticated", A, "select rating from public.imdb_ratings", (r) => r.length === 1);
await refused("members change ratings", "authenticated", A, "update public.imdb_ratings set rating = 1 returning imdb_id");

console.log("Delete account");
await refused("logged-out visitor deletes", "anon", null, "select public.delete_my_account()");
await ok("delete my account", "authenticated", A, "select public.delete_my_account()");
await ok("everything of mine is gone", "postgres", null,
  `select (select count(*) from public.profiles where id = '${A}') + (select count(*) from public.entries where user_id = '${A}')
        + (select count(*) from public.lists) + (select count(*) from public.list_items) + (select count(*) from public.reactions)
        + (select count(*) from public.friendships where '${A}' in (requester, addressee)) as left`,
  (r) => Number(r[0].left) === 0);

console.log(failed ? `\n${failed} database check(s) FAILED` : "\nAll database checks passed");
process.exit(failed ? 1 : 0);
