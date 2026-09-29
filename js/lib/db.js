// Everything that talks to Supabase (accounts + your own database).
import config from "../config.js";
import { state, entryKey } from "./state.js";

export const sb = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
  auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const uid = () => state.session?.user?.id;

function check({ data, error }) {
  if (error) throw error;
  return data;
}

// ---------- account ----------

export async function signUp({ email, password, username, inviteCode }) {
  const available = check(await sb.rpc("username_available", { name: username }));
  if (!available) throw new Error("That username is taken. Try another one.");
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { username, invite_code: inviteCode },
      emailRedirectTo: location.origin + location.pathname,
    },
  });
  if (error) {
    if (/database error/i.test(error.message)) throw new Error("Sign-up refused. Check the invite code.");
    throw error;
  }
  return data;
}

export async function signIn(email, password) {
  return check(await sb.auth.signInWithPassword({ email, password }));
}

export async function sendPasswordReset(email) {
  return check(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }));
}

export async function setPassword(password) {
  return check(await sb.auth.updateUser({ password }));
}

export async function signOut() {
  await sb.auth.signOut();
}

export async function deleteAccount() {
  check(await sb.rpc("delete_my_account"));
  await sb.auth.signOut({ scope: "local" });
}

// ---------- profile ----------

export async function loadProfile() {
  state.profile = check(await sb.from("profiles").select("*").eq("id", uid()).maybeSingle());
  return state.profile;
}

export async function updateProfile(patch) {
  const row = check(await sb.from("profiles").update(patch).eq("id", uid()).select().single());
  state.profile = row;
  return row;
}

export async function profileByUsername(username) {
  return check(await sb.from("profiles").select("id, username, created_at").eq("username", username).maybeSingle());
}

export async function searchUsers(query) {
  const safe = query.replace(/[\\%_]/g, (c) => "\\" + c);
  return check(
    await sb.from("profiles").select("id, username").ilike("username", `${safe}%`).neq("id", uid()).order("username").limit(20),
  );
}

// ---------- my list ----------

export async function loadMyEntries() {
  const rows = check(await sb.from("entries").select("*").eq("user_id", uid()).order("updated_at", { ascending: false }));
  state.entries = new Map(rows.map((r) => [entryKey(r.media_type, r.tmdb_id), r]));
  return rows;
}

export async function saveEntry(item, { status, rating = null, review = null }) {
  const row = check(
    await sb
      .from("entries")
      .upsert({
        user_id: uid(),
        media_type: item.type,
        tmdb_id: item.id,
        title: item.title.slice(0, 300),
        poster_path: item.poster,
        year: item.year || null,
        status,
        rating: status === "seen" ? rating : null,
        review: status === "seen" && review ? review.slice(0, 500) : null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single(),
  );
  state.entries.set(entryKey(row.media_type, row.tmdb_id), row);
  return row;
}

export async function removeEntry(type, id) {
  check(await sb.from("entries").delete().eq("user_id", uid()).eq("media_type", type).eq("tmdb_id", id));
  state.entries.delete(entryKey(type, id));
}

// ---------- friends ----------

// The database only returns rows you are allowed to see (your own and your
// friends'), so "everyone except me" here means "my friends".
export async function friendsOnTitle(type, id) {
  return check(
    await sb
      .from("entries")
      .select("status, rating, review, updated_at, profiles(username)")
      .eq("media_type", type)
      .eq("tmdb_id", id)
      .neq("user_id", uid())
      .order("updated_at", { ascending: false }),
  );
}

export async function friendFeed(limit = 30) {
  return check(
    await sb
      .from("entries")
      .select("*, profiles(username)")
      .neq("user_id", uid())
      .order("updated_at", { ascending: false })
      .limit(limit),
  );
}

export async function entriesOf(userId) {
  return check(await sb.from("entries").select("*").eq("user_id", userId).order("updated_at", { ascending: false }));
}

export async function friendships() {
  const rows = check(
    await sb
      .from("friendships")
      .select(
        "requester, addressee, status, created_at, from:profiles!friendships_requester_fkey(id, username), to:profiles!friendships_addressee_fkey(id, username)",
      )
      .order("created_at", { ascending: false }),
  );
  const me = uid();
  return rows.map((r) => ({
    ...r,
    other: r.requester === me ? r.to : r.from,
    incoming: r.addressee === me,
  }));
}

export async function requestFriend(otherId) {
  check(await sb.from("friendships").insert({ requester: uid(), addressee: otherId }));
}

export async function acceptFriend(requesterId) {
  check(await sb.from("friendships").update({ status: "accepted" }).eq("requester", requesterId).eq("addressee", uid()));
}

export async function removeFriendship(otherId) {
  const me = uid();
  check(
    await sb
      .from("friendships")
      .delete()
      .or(`and(requester.eq.${me},addressee.eq.${otherId}),and(requester.eq.${otherId},addressee.eq.${me})`),
  );
}

// ---------- GDPR: download everything we store about you ----------

export async function exportMyData() {
  const [profile, entries, friends] = await Promise.all([loadProfile(), entriesOf(uid()), friendships()]);
  const user = state.session.user;
  return {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at },
    profile,
    entries,
    friendships: friends.map((f) => ({
      with: f.other?.username,
      status: f.status,
      direction: f.incoming ? "received" : "sent",
      created_at: f.created_at,
    })),
  };
}
