// Fake backend for the demo and the automatic tests.
// It answers the app's TMDB and Supabase requests from sample data kept in
// memory, following the same "who can see what" rules as supabase/schema.sql,
// so nothing leaves the browser. Loaded before the app (see build.mjs and
// tests/app.test.mjs).
import { TITLES, GENRES, PROVIDERS, RT, UPCOMING, byKey, tmdbListItem, tmdbDetails, providerList } from "./data.js";

// ---------- drawn artwork instead of real posters ----------

const art = new Map();
const xml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const uri = (svg) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

function wrap(text, max) {
  const lines = [];
  let line = "";
  for (const word of text.toUpperCase().split(/\s+/)) {
    if ((line + " " + word).trim().length > max && line) { lines.push(line); line = word; }
    else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}

function poster(t) {
  const h = t.hue;
  const lines = wrap(t.title, 11);
  const size = lines.length > 3 ? 30 : lines.length > 2 ? 34 : 40;
  const style = t.id % 3;
  const shape = style === 0
    ? `<circle cx="150" cy="120" r="78" fill="hsl(${h + 30} 90% 62%)" opacity=".85"/>`
    : style === 1
      ? `<path d="M0 210 L100 120 L160 170 L240 90 L300 150 L300 450 L0 450Z" fill="hsl(${h} 45% 8%)" opacity=".75"/><circle cx="220" cy="80" r="26" fill="hsl(${h + 40} 95% 70%)"/>`
      : `<g opacity=".5">${[0, 1, 2, 3, 4].map((k) => `<rect x="${-40 + k * 70}" y="-20" width="26" height="520" fill="hsl(${h + 20} 80% 60%)" transform="rotate(18 150 225)"/>`).join("")}</g>`;
  const text = lines.map((l, i) => `<text x="22" y="${420 - (lines.length - 1 - i) * (size + 4)}" font-size="${size}">${xml(l)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450">
    <defs><linearGradient id="g" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="hsl(${h} 65% 42%)"/><stop offset="1" stop-color="hsl(${h + 35} 70% 9%)"/></linearGradient>
    <linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></linearGradient></defs>
    <rect width="300" height="450" fill="url(#g)"/>${shape}<rect width="300" height="450" fill="url(#f)"/>
    <text x="22" y="40" font-family="system-ui,sans-serif" font-size="14" font-weight="700" letter-spacing="3" fill="#fff" opacity=".75">${t.year}</text>
    <g font-family="system-ui,-apple-system,'Segoe UI',sans-serif" font-weight="900" fill="#fff" letter-spacing="-0.5">${text}</g>
  </svg>`;
}

function backdrop(t) {
  const h = t.hue;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">
    <defs><radialGradient id="r" cx=".7" cy=".3" r=".8"><stop offset="0" stop-color="hsl(${h + 30} 85% 58%)"/><stop offset=".45" stop-color="hsl(${h} 60% 26%)"/><stop offset="1" stop-color="hsl(${h + 40} 60% 6%)"/></radialGradient></defs>
    <rect width="1280" height="720" fill="url(#r)"/>
    <circle cx="930" cy="230" r="170" fill="hsl(${h + 40} 95% 72%)" opacity=".35"/>
    <path d="M0 520 C200 440 380 560 620 480 S1000 400 1280 470 L1280 720 L0 720Z" fill="hsl(${h} 50% 8%)" opacity=".7"/>
    <path d="M0 600 C260 540 520 640 800 580 S1120 540 1280 580 L1280 720 L0 720Z" fill="hsl(${h + 20} 50% 5%)" opacity=".85"/>
  </svg>`;
}

function logo(p) {
  const initials = p.name.replace(/\+/g, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2);
  const bg = p.mono ? "#1d1d24" : `hsl(${p.hue} 70% 45%)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92 92"><rect width="92" height="92" rx="20" fill="${bg}"/>
    <text x="46" y="58" text-anchor="middle" font-family="system-ui,sans-serif" font-size="32" font-weight="800" fill="#fff">${xml(initials)}</text></svg>`;
}

function person(titleId, k) {
  const t = TITLES.find((x) => x.id === Number(titleId));
  const [name] = t?.cast[k] || ["?"];
  const h = (t?.hue || 0) + k * 40;
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 185 232"><rect width="185" height="232" fill="hsl(${h} 30% 22%)"/>
    <circle cx="92" cy="96" r="42" fill="hsl(${h} 30% 34%)"/><path d="M20 232 C28 168 156 168 165 232Z" fill="hsl(${h} 30% 34%)"/>
    <text x="92" y="108" text-anchor="middle" font-family="system-ui,sans-serif" font-size="32" font-weight="800" fill="hsl(${h} 40% 80%)">${xml(initials)}</text></svg>`;
}

const upcomingAsTitle = (u) => ({ ...u, type: "movie", year: u.date.slice(0, 4) });

globalThis.__playproImg = (path) => {
  if (art.has(path)) return art.get(path);
  const [, kind, a, b] = path.split("/");
  const title = (type, id) => byKey.get(`${type}:${id}`) || upcomingAsTitle(UPCOMING.find((u) => u.id === Number(id)) || { id: 0, title: "?", date: "2026", hue: 0 });
  let svg = "";
  if (kind === "poster") svg = poster(title(a, b));
  else if (kind === "backdrop") svg = backdrop(title(a, b));
  else if (kind === "logo") svg = logo(PROVIDERS.find((p) => p.id === Number(a)));
  else if (kind === "person") svg = person(a, Number(b));
  const url = uri(svg);
  art.set(path, url);
  return url;
};

// ---------- the sample database ----------

const ago = (h) => new Date(Date.now() - h * 3600e3).toISOString();
const ME = "00000000-0000-4000-8000-000000000001";
const ANNA = "00000000-0000-4000-8000-0000000000a1";
const JONAS = "00000000-0000-4000-8000-0000000000a2";
const MARI = "00000000-0000-4000-8000-0000000000a3";
const SOFIE = "00000000-0000-4000-8000-0000000000a4";
const authUser = { id: ME, email: "carl@example.com", aud: "authenticated", role: "authenticated", created_at: "2026-01-12T10:00:00Z", user_metadata: {}, app_metadata: {} };

const entry = (user, type, id, status, rating, review, hoursAgo) => {
  const t = byKey.get(`${type}:${id}`);
  return { user_id: user, media_type: type, tmdb_id: id, title: t.title, poster_path: `/poster/${type}/${id}`, year: String(t.year), imdb_id: t.imdbId, status, rating, review, watched_at: status === "seen" ? ago(hoursAgo) : null, updated_at: ago(hoursAgo) };
};

const db = {
  profiles: [
    { id: ME, username: "carl", services: [8, 1899, 2270], avatar: null, created_at: "2026-01-12T10:00:00Z" },
    { id: ANNA, username: "anna", services: [8, 337, 76], avatar: null, created_at: "2026-01-14T10:00:00Z" },
    { id: JONAS, username: "jonas_k", services: [1899], avatar: null, created_at: "2026-02-02T10:00:00Z" },
    { id: MARI, username: "mari", services: [], avatar: null, created_at: "2026-03-20T10:00:00Z" },
    { id: SOFIE, username: "sofie_b", services: [], avatar: null, created_at: "2026-04-01T10:00:00Z" },
  ],
  entries: [
    entry(ME, "movie", 872585, "seen", 9, "Three hours that felt like one.", 30),
    entry(ME, "tv", 64439, "seen", 10, null, 2000),
    entry(ME, "movie", 660120, "seen", 8, null, 4000),
    entry(ME, "tv", 136315, "seen", 9, null, 900),
    entry(ME, "movie", 496243, "seen", 9, null, 3000),
    entry(ME, "movie", 736769, "seen", 5, null, 5000),
    entry(ME, "tv", 126308, "watchlist", null, null, 5),
    entry(ME, "movie", 1124620, "watchlist", null, null, 20),
    entry(ME, "tv", 95396, "watchlist", null, null, 60),
    entry(ME, "movie", 693134, "watchlist", null, null, 70),
    entry(ME, "tv", 89901, "watchlist", null, null, 90),
    entry(ANNA, "movie", 693134, "seen", 9, "The sandworm scene alone is worth it. Watch it on the biggest screen you can find.", 1.5),
    entry(JONAS, "movie", 693134, "seen", 7, "Gorgeous, but slow in the middle.", 3),
    entry(ANNA, "tv", 136315, "seen", 10, "Season 1 episode 7. That's all I'm saying.", 8),
    entry(JONAS, "tv", 89901, "seen", 8, "Uncomfortably good. Very Oslo.", 26),
    entry(ANNA, "tv", 95396, "watchlist", null, null, 30),
    entry(ANNA, "movie", 545611, "watchlist", null, null, 31),
    entry(JONAS, "movie", 736769, "seen", 5, "Fun for one evening. Great Norwegian landscapes though.", 50),
    entry(ANNA, "movie", 660120, "seen", 9, null, 72),
    entry(JONAS, "tv", 126308, "seen", 9, null, 96),
    entry(ANNA, "movie", 1124620, "watchlist", null, null, 120),
  ],
  friendships: [
    { requester: ANNA, addressee: ME, status: "accepted", created_at: ago(900) },
    { requester: ME, addressee: JONAS, status: "accepted", created_at: ago(800) },
    { requester: MARI, addressee: ME, status: "pending", created_at: ago(10) },
  ],
  lists: [
    { id: "6f6f6f6f-0000-4000-8000-000000000001", owner: ME, name: "Norwegian gems", shared: true, created_at: ago(400) },
    { id: "6f6f6f6f-0000-4000-8000-000000000002", owner: ANNA, name: "Christmas films", shared: true, created_at: ago(300) },
  ],
  list_items: [],
  comments: [
    { id: "c0000000-0000-4000-8000-000000000001", entry_user: ANNA, media_type: "movie", tmdb_id: 693134, author: JONAS, body: "Agree about the sandworms.", created_at: ago(1) },
  ],
  reactions: [
    { entry_user: ANNA, media_type: "movie", tmdb_id: 693134, author: JONAS, kind: "love", created_at: ago(1) },
    { entry_user: ME, media_type: "movie", tmdb_id: 872585, author: ANNA, kind: "popcorn", created_at: ago(20) },
  ],
  imdb_ratings: TITLES.map((t) => ({ imdb_id: t.imdbId, rating: t.imdb, votes: t.popularity * 9137 })),
  rt_scores: TITLES.filter((t) => RT.has(t.id)).map((t) => ({ imdb_id: t.imdbId, ...RT.get(t.id), rt_id: null })),
};
for (const [list, ids] of [[0, ["movie:660120", "movie:81401", "tv:64439", "tv:89901", "movie:331781"]], [1, ["movie:840430", "movie:346698"]]]) {
  for (const key of ids) {
    const t = byKey.get(key);
    db.list_items.push({ list_id: db.lists[list].id, media_type: t.type, tmdb_id: t.id, title: t.title, poster_path: `/poster/${t.type}/${t.id}`, year: String(t.year), added_at: ago(100) });
  }
}

const friend = (other) => db.friendships.some((f) => f.status === "accepted" && ((f.requester === ME && f.addressee === other) || (f.addressee === ME && f.requester === other)));
const profileOf = (id) => db.profiles.find((p) => p.id === id);
const listVisible = (l) => l && (l.owner === ME || (l.shared && friend(l.owner)));

// Row Level Security, as in schema.sql
const canSee = {
  profiles: () => true,
  entries: (r) => r.user_id === ME || friend(r.user_id),
  friendships: (r) => r.requester === ME || r.addressee === ME,
  lists: listVisible,
  list_items: (r) => listVisible(db.lists.find((l) => l.id === r.list_id)),
  comments: (r) => r.entry_user === ME || friend(r.entry_user),
  reactions: (r) => r.entry_user === ME || friend(r.entry_user),
  imdb_ratings: () => true,
  rt_scores: () => true,
};
const canChange = {
  profiles: (r) => r.id === ME,
  entries: (r) => r.user_id === ME,
  friendships: (r) => r.requester === ME || r.addressee === ME,
  lists: (r) => r.owner === ME,
  list_items: (r) => db.lists.find((l) => l.id === r.list_id)?.owner === ME,
  comments: (r) => r.author === ME || r.entry_user === ME,
  reactions: (r) => r.author === ME || r.entry_user === ME,
};
const keys = {
  entries: ["user_id", "media_type", "tmdb_id"],
  list_items: ["list_id", "media_type", "tmdb_id"],
  reactions: ["entry_user", "media_type", "tmdb_id", "author"],
  friendships: ["requester", "addressee"],
  lists: ["id"], comments: ["id"], profiles: ["id"],
};

// Joined data the app asks for with select=...(...)
function embed(table, row) {
  const p = (id) => { const x = profileOf(id); return x && { id: x.id, username: x.username, services: x.services }; };
  if (table === "entries") return { ...row, profiles: p(row.user_id) };
  if (table === "friendships") return { ...row, from: p(row.requester), to: p(row.addressee) };
  if (table === "lists") return { ...row, profiles: p(row.owner), list_items: db.list_items.filter((i) => i.list_id === row.id) };
  if (table === "comments" || table === "reactions") return { ...row, profiles: p(row.author) };
  return { ...row };
}

function matches(row, col, raw) {
  const dot = raw.indexOf(".");
  let op = raw.slice(0, dot);
  let val = raw.slice(dot + 1);
  let negate = false;
  if (op === "not") { negate = true; op = val.slice(0, val.indexOf(".")); val = val.slice(val.indexOf(".") + 1); }
  const v = row[col];
  let ok = true;
  if (op === "eq") ok = String(v) === val;
  else if (op === "neq") ok = String(v) !== val;
  else if (op === "is") ok = val === "null" ? v == null : String(v) === val;
  else if (op === "in") ok = val.replace(/^\(|\)$/g, "").split(",").map((x) => x.replace(/"/g, "")).includes(String(v));
  else if (op === "ilike") ok = new RegExp("^" + val.replace(/\\(.)/g, "$1").replace(/[.*+?^${}()|[\]]/g, "\\$&").replace(/%/g, ".*") + "$", "i").test(String(v));
  return negate ? !ok : ok;
}

function select(table, params) {
  let rows = db[table].filter(canSee[table]);
  for (const [col, raw] of params) {
    if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(col)) continue;
    if (col === "or") {
      const pairs = [...raw.matchAll(/and\(([^)]*)\)/g)].map((m) => m[1].split(",").map((c) => c.split(/\.(.*)/s)));
      rows = rows.filter((r) => pairs.some((conds) => conds.every(([c, rest]) => matches(r, c, rest))));
      continue;
    }
    rows = rows.filter((r) => matches(r, col, raw));
  }
  const order = params.get("order");
  if (order) {
    const [col, dir] = order.split(".");
    rows = [...rows].sort((a, b) => String(a[col] ?? "").localeCompare(String(b[col] ?? "")) * (dir === "desc" ? -1 : 1));
  }
  const limit = params.get("limit");
  return limit ? rows.slice(0, Number(limit)) : rows;
}

function write(table, method, params, body) {
  if (method === "POST") {
    const list = [].concat(body);
    const saved = list.map((input) => {
      const row = { ...input };
      if (table === "lists") Object.assign(row, { id: row.id || crypto.randomUUID(), owner: ME, created_at: new Date().toISOString(), shared: row.shared ?? true });
      if (table === "comments") Object.assign(row, { id: crypto.randomUUID(), author: ME, created_at: new Date().toISOString() });
      if (table === "reactions") Object.assign(row, { author: ME, created_at: new Date().toISOString() });
      if (table === "list_items") row.added_at ??= new Date().toISOString();
      if (table === "friendships") {
        row.status = "pending";
        row.created_at = new Date().toISOString();
        // in the demo, new friends say yes after a moment
        setTimeout(() => { const f = db.friendships.find((x) => x.requester === ME && x.addressee === row.addressee); if (f) f.status = "accepted"; }, 4000);
      }
      const k = keys[table];
      const i = db[table].findIndex((r) => k.every((c) => String(r[c]) === String(row[c])));
      if (i >= 0) db[table][i] = { ...db[table][i], ...row };
      else db[table].push(row);
      return i >= 0 ? db[table][i] : row;
    });
    return saved.map((r) => embed(table, r));
  }
  const hit = select(table, params).filter(canChange[table] || (() => false));
  if (method === "PATCH") {
    hit.forEach((r) => Object.assign(db[table].find((x) => x === r || keys[table].every((c) => x[c] === r[c])), body));
    return select(table, params).map((r) => embed(table, r));
  }
  if (method === "DELETE") {
    db[table] = db[table].filter((r) => !hit.some((h) => keys[table].every((c) => h[c] === r[c])));
    if (table === "lists") db.list_items = db.list_items.filter((i) => db.lists.some((l) => l.id === i.list_id));
    return [];
  }
  return [];
}

// ---------- TMDB ----------

function discover(type, p) {
  let list = TITLES.filter((t) => t.type === type);
  const providers = p.get("with_watch_providers");
  if (providers) {
    const ids = providers.split("|").map(Number);
    list = list.filter((t) => t.stream.some((s) => ids.includes(s)));
  }
  const genre = p.get("with_genres");
  if (genre) list = list.filter((t) => t.genres.includes(Number(genre)));
  const sort = p.get("sort_by") || "popularity.desc";
  const key = sort.startsWith("vote") ? (t) => t.tmdb : sort.includes("date") ? (t) => t.year : (t) => t.popularity;
  list.sort((a, b) => key(b) - key(a));
  const page = Number(p.get("page") || 1);
  const per = 20;
  return { results: list.slice((page - 1) * per, page * per).map(tmdbListItem), total_pages: Math.max(1, Math.ceil(list.length / per)) };
}

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function tmdb(path, p) {
  let m;
  if ((m = path.match(/^\/trending\/(all|movie|tv)\/week$/))) {
    const list = TITLES.filter((t) => m[1] === "all" || t.type === m[1]).sort((a, b) => b.popularity - a.popularity);
    return { results: list.slice(0, 16).map(tmdbListItem) };
  }
  if ((m = path.match(/^\/discover\/(movie|tv)$/))) return discover(m[1], p);
  if (path === "/search/multi") {
    const q = norm(p.get("query") || "");
    return { results: TITLES.filter((t) => norm(t.title).includes(q) || t.cast.some(([n]) => norm(n).includes(q))).map(tmdbListItem), total_pages: 1 };
  }
  if ((m = path.match(/^\/search\/(movie|tv)$/))) {
    const q = norm(p.get("query") || "");
    return { results: TITLES.filter((t) => t.type === m[1] && norm(t.title).includes(q)).map(tmdbListItem) };
  }
  if ((m = path.match(/^\/find\/(tt\d+)$/))) {
    const t = TITLES.find((x) => x.imdbId === m[1]);
    return { movie_results: t?.type === "movie" ? [tmdbListItem(t)] : [], tv_results: t?.type === "tv" ? [tmdbListItem(t)] : [] };
  }
  if (path === "/movie/upcoming") {
    return { results: UPCOMING.map((u) => ({ id: u.id, title: u.title, release_date: u.date, poster_path: `/poster/movie/${u.id}`, backdrop_path: null, vote_average: 0, overview: "" })) };
  }
  if ((m = path.match(/^\/genre\/(movie|tv)\/list$/))) return { genres: GENRES[m[1]] };
  if (path.startsWith("/watch/providers/")) return { results: providerList() };
  if ((m = path.match(/^\/(movie|tv)\/(\d+)\/external_ids$/))) return { imdb_id: byKey.get(`${m[1]}:${m[2]}`)?.imdbId || null };
  if ((m = path.match(/^\/(movie|tv)\/(\d+)\/watch\/providers$/))) {
    const t = byKey.get(`${m[1]}:${m[2]}`);
    return t ? tmdbDetails(t)["watch/providers"] : { results: {} };
  }
  if ((m = path.match(/^\/(movie|tv)\/(\d+)\/recommendations$/))) {
    const t = byKey.get(`${m[1]}:${m[2]}`);
    return t ? tmdbDetails(t).recommendations : { results: [] };
  }
  if ((m = path.match(/^\/(movie|tv)\/(\d+)$/))) {
    const t = byKey.get(`${m[1]}:${m[2]}`);
    return t ? tmdbDetails(t) : null;
  }
  return {};
}

// ---------- fetch ----------

const json = (data, status = 200) => new Response(data === null ? null : JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
const session = () => ({
  access_token: "demo.eyJzdWIiOiJkZW1vIn0.demo", token_type: "bearer", expires_in: 360000,
  expires_at: Math.floor(Date.now() / 1000) + 360000, refresh_token: "demo", user: authUser,
});
const realFetch = globalThis.fetch.bind(globalThis);
const delay = globalThis.__playproMockDelay ?? 120;

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url, location.href);
  const method = (init.method || (typeof input === "object" && input.method) || "GET").toUpperCase();
  const headers = new Headers(init.headers || (typeof input === "object" ? input.headers : undefined));
  if (url.hostname === "api.themoviedb.org") {
    await new Promise((r) => setTimeout(r, delay * Math.random()));
    const data = tmdb(url.pathname.replace(/^\/3/, ""), url.searchParams);
    return data ? json(data) : json({ status_message: "Not found" }, 404);
  }
  if (!url.hostname.endsWith(".supabase.co")) return realFetch(input, init);
  await new Promise((r) => setTimeout(r, delay * Math.random()));
  const path = url.pathname;
  if (path.startsWith("/auth/v1/token") || path.startsWith("/auth/v1/signup")) return json(session());
  if (path.startsWith("/auth/v1/user")) return json(authUser);
  if (path.startsWith("/auth/v1/logout")) return new Response(null, { status: 204 });
  if (path.startsWith("/auth/v1/recover")) return json({});
  if (path === "/rest/v1/rpc/username_available") return json(true);
  if (path === "/rest/v1/rpc/delete_my_account") {
    db.entries = db.entries.filter((e) => e.user_id !== ME);
    db.friendships = db.friendships.filter((f) => f.requester !== ME && f.addressee !== ME);
    return json(null, 204);
  }
  const table = path.replace("/rest/v1/", "");
  if (!db[table]) return json({ message: `no table ${table}` }, 404);
  let body = null;
  try { body = init.body ? JSON.parse(init.body) : null; } catch { /* not JSON */ }
  // Like the real database: comments and reactions link entries to profiles a
  // second way, so an embed must say which link to follow (profiles!user_id).
  if (table === "entries" && /(^|[,\s])profiles\(/.test(url.searchParams.get("select") || "")) {
    return json({ code: "PGRST201", message: "Could not embed because more than one relationship was found for 'entries' and 'profiles'" }, 300);
  }
  const rows = method === "GET" ? select(table, url.searchParams).map((r) => embed(table, r)) : write(table, method, url.searchParams, body);
  const wantsObject = (headers.get("accept") || "").includes("vnd.pgrst.object");
  if (wantsObject) return rows[0] ? json(rows[0]) : json({ message: "No rows" }, 406);
  if (method !== "GET" && !(headers.get("prefer") || "").includes("return=representation")) return new Response(null, { status: 201 });
  return json(rows);
};

// A ready-made sign-in for the sample account.
export const demoSession = session;
