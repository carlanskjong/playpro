// Movie & series data from TMDB (themoviedb.org).
// Answers are remembered in the browser (Cache Storage) between visits, so
// opening the app again is quick and uses less data.
import config from "../config.js";
import { tmdbLanguage } from "./i18n.js";

const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/";
const CACHE = "playpro-tmdb-v1";
const HOUR = 3600e3;
const DAY = 24 * HOUR;

// How long each kind of answer stays fresh.
const TTL = [
  [/^\/(trending|discover|movie\/upcoming|movie\/now_playing)/, 6 * HOUR],
  [/\/external_ids$|^\/find\//, 365 * DAY],
  [/^\/(genre|watch\/providers)\//, 7 * DAY],
  [/./, DAY],
];

const memory = new Map();
let cachePromise = null;

function openCache() {
  if (!("caches" in globalThis)) return Promise.resolve(null);
  cachePromise ??= caches.open(CACHE).then((c) => { prune(c); return c; }).catch(() => null);
  return cachePromise;
}

// Keep the cache small: drop answers older than a month, and the oldest
// ones beyond 1,500.
async function prune(cache) {
  try {
    const keys = await cache.keys();
    const dated = await Promise.all(keys.map(async (k) => [k, Number((await cache.match(k))?.headers.get("x-saved") || 0)]));
    dated.sort((a, b) => a[1] - b[1]);
    const old = dated.filter(([, at], i) => Date.now() - at > 30 * DAY || i < dated.length - 1500);
    await Promise.all(old.map(([k]) => cache.delete(k)));
  } catch { /* not important */ }
}

async function get(path, params = {}) {
  const url = new URL(API + path);
  url.searchParams.set("api_key", config.TMDB_API_KEY);
  url.searchParams.set("language", params.language || tmdbLanguage);
  for (const [k, v] of Object.entries(params)) {
    if (k !== "language" && v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }
  const key = url.toString();
  if (memory.has(key)) return memory.get(key);
  const ttl = TTL.find(([re]) => re.test(path))[1];
  const promise = (async () => {
    const cache = await openCache();
    const hit = cache && (await cache.match(key));
    if (hit && Date.now() - Number(hit.headers.get("x-saved")) < ttl) return hit.json();
    const res = await fetch(key);
    if (!res.ok) throw new Error(res.status === 401 ? "TMDB key is missing or wrong (see js/config.js)" : `TMDB error ${res.status}`);
    const data = await res.json();
    cache?.put(key, new Response(JSON.stringify(data), { headers: { "content-type": "application/json", "x-saved": String(Date.now()) } })).catch(() => {});
    return data;
  })();
  memory.set(key, promise);
  promise.catch(() => memory.delete(key));
  return promise;
}

// Forget remembered lists (pull-to-refresh). Title details are kept.
export async function refreshLists() {
  for (const key of memory.keys()) if (/\/(trending|discover|movie\/upcoming)/.test(key)) memory.delete(key);
  const cache = await openCache();
  if (!cache) return;
  for (const req of await cache.keys()) if (/\/(trending|discover|movie\/upcoming)/.test(req.url)) await cache.delete(req);
}

// Image address. (The demo and the tests swap in drawn posters via __playproImg.)
export function img(path, size = "w342") {
  if (!path) return "";
  return globalThis.__playproImg?.(path, size) ?? IMG + size + path;
}

// "url 185w, url 342w" so phones download the smallest image that looks sharp.
export function srcset(path, sizes) {
  return sizes.map((s) => `${img(path, s)} ${s.slice(1)}w`).join(", ");
}

// Turn TMDB's movie and tv shapes into one simple shape.
export function normalize(raw, type) {
  const mediaType = type || raw.media_type;
  const day = raw.release_date || raw.first_air_date || "";
  return {
    type: mediaType,
    id: raw.id,
    title: raw.title || raw.name || "Untitled",
    originalTitle: raw.original_title || raw.original_name || "",
    year: day.slice(0, 4),
    date: day,
    poster: raw.poster_path || null,
    backdrop: raw.backdrop_path || null,
    vote: raw.vote_average || 0,
    votes: raw.vote_count || 0,
    overview: raw.overview || "",
    genres: raw.genre_ids || (raw.genres || []).map((g) => g.id),
  };
}

const list = (data, type) =>
  (data.results || [])
    .filter((r) => (type || r.media_type) === "movie" || (type || r.media_type) === "tv")
    .map((r) => normalize(r, type));

export async function trending(type = "all") {
  return list(await get(`/trending/${type}/week`), type === "all" ? undefined : type);
}

// Movies and series. An actor or director who comes before any title (you
// searched for them) is shown as the titles they're known for.
export async function search(query, page = 1) {
  const data = await get("/search/multi", { query, page, include_adult: "false" });
  const results = data.results || [];
  const firstTitle = results.findIndex((r) => r.media_type === "movie" || r.media_type === "tv");
  const people = results.slice(0, firstTitle < 0 ? results.length : firstTitle).filter((r) => r.media_type === "person");
  const known = people.flatMap((p) => p.known_for || []);
  const seen = new Set();
  const items = list({ results: [...known, ...results] }).filter((i) => !seen.has(`${i.type}:${i.id}`) && seen.add(`${i.type}:${i.id}`));
  return { items, totalPages: data.total_pages || 1 };
}

// Movies and series only, without people (used for close matches, where
// people with similar names would crowd out the titles).
export async function searchTitles(query, language) {
  const [movies, series] = await Promise.all(["movie", "tv"].map(async (type) => list(await get(`/search/${type}`, { query, include_adult: "false", language }), type)));
  return [...movies, ...series];
}

export async function discover(type, { providers = [], region, genre, sort = "popularity.desc", page = 1, minVotes } = {}) {
  const params = { page, sort_by: sort, with_genres: genre, include_adult: "false", "vote_count.gte": minVotes };
  if (providers.length) {
    params.with_watch_providers = providers.join("|");
    params.watch_region = region;
    params.with_watch_monetization_types = "flatrate|free|ads";
  }
  if (sort === "vote_average.desc") params["vote_count.gte"] = type === "movie" ? 500 : 200;
  if (sort.startsWith("primary_release_date") || sort.startsWith("first_air_date")) {
    params[type === "movie" ? "primary_release_date.lte" : "first_air_date.lte"] = new Date().toISOString().slice(0, 10);
    params["vote_count.gte"] ??= 20;
  }
  const data = await get(`/discover/${type}`, params);
  return { items: list(data, type), totalPages: data.total_pages || 1 };
}

// Everything for a title page in one request.
export async function details(type, id) {
  const extra = type === "movie" ? ",release_dates" : "";
  return get(`/${type}/${id}`, { append_to_response: `credits,watch/providers,recommendations,videos,external_ids${extra}` });
}

// Just the basics (runtime, genres) – used for statistics.
export async function basics(type, id, language) {
  return get(`/${type}/${id}`, { language });
}

export async function recommendations(type, id) {
  return list(await get(`/${type}/${id}/recommendations`), type);
}

// Where a title streams, per country.
export async function watchProviders(type, id) {
  return (await get(`/${type}/${id}/watch/providers`)).results || {};
}

// A day as "2026-10-09", counted from today.
export const day = (offset = 0) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);

// Run lookups six at a time: quick, without flooding TMDB.
export async function sixAtATime(items, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const k = next++;
      out[k] = await fn(items[k]).catch(() => null);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return out;
}

// Any TMDB "discover" search, over several pages.
export async function discoverAll(type, params, pages = 1) {
  const items = [];
  for (let page = 1; page <= pages; page++) {
    const data = await get(`/discover/${type}`, { include_adult: "false", ...params, page });
    items.push(...list(data, type));
    if (page >= (data.total_pages || 1)) break;
  }
  return items;
}

// Movies opening in a country's cinemas ("cinema") or coming to stream or
// rent there ("digital") between two days.
export function releasesIn(region, kind, from, to, sort = "popularity.desc", pages = 2) {
  return discoverAll("movie", { region, with_release_type: kind === "cinema" ? "2|3" : "4", "release_date.gte": from, "release_date.lte": to, sort_by: sort }, pages);
}

// The day a movie opens in a country's cinemas (or comes to stream or rent),
// from TMDB's release dates. Film festival screenings don't count.
export function pickRelease(releaseDates, region, kind = "cinema") {
  const types = kind === "cinema" ? [2, 3] : [4];
  const dates = (releaseDates?.results || []).find((r) => r.iso_3166_1 === region)?.release_dates || [];
  return dates.filter((d) => types.includes(d.type)).map((d) => d.release_date.slice(0, 10)).sort()[0] || "";
}

export async function releaseDate(id, region, kind = "cinema") {
  return pickRelease(await get(`/movie/${id}/release_dates`), region, kind);
}

// A series with its next episode and where it streams (for "coming soon").
export function seriesNext(id) {
  return get(`/tv/${id}`, { append_to_response: "watch/providers" });
}


export async function genres(type) {
  const data = await get(`/genre/${type}/list`);
  return data.genres || [];
}

// Streaming services available in a country, most popular first.
export async function providers(region) {
  const [movie, tv] = await Promise.all([
    get("/watch/providers/movie", { watch_region: region }),
    get("/watch/providers/tv", { watch_region: region }),
  ]);
  const byId = new Map();
  for (const p of [...(movie.results || []), ...(tv.results || [])]) {
    if (!byId.has(p.provider_id)) byId.set(p.provider_id, p);
  }
  const rank = (p) => (p.display_priorities && p.display_priorities[region]) ?? p.display_priority ?? 999;
  return [...byId.values()].sort((a, b) => rank(a) - rank(b));
}

// The IMDb id of a title (e.g. "tt15239678").
export async function imdbId(type, id) {
  return (await get(`/${type}/${id}/external_ids`)).imdb_id || null;
}

// Find a TMDB title from an IMDb id (used when importing ratings).
export async function findByImdb(id) {
  const data = await get(`/find/${id}`, { external_source: "imdb_id" });
  const movie = data.movie_results?.[0];
  const tv = data.tv_results?.[0];
  return movie ? normalize(movie, "movie") : tv ? normalize(tv, "tv") : null;
}

// Find a movie by title and year (used when importing from Letterboxd).
export async function findMovie(title, year) {
  const data = await get("/search/movie", { query: title, year, include_adult: "false" });
  const hit = (data.results || [])[0];
  return hit ? normalize(hit, "movie") : null;
}
