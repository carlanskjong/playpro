// Movie & series data from TMDB (themoviedb.org) and, optionally,
// IMDb ratings through OMDb (omdbapi.com).
import config from "../config.js";

const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/";
const cache = new Map();

async function get(path, params = {}) {
  const url = new URL(API + path);
  url.searchParams.set("api_key", config.TMDB_API_KEY);
  url.searchParams.set("language", config.LANGUAGE);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }
  const key = url.toString();
  if (cache.has(key)) return cache.get(key);
  const promise = fetch(key).then(async (res) => {
    if (!res.ok) throw new Error(res.status === 401 ? "TMDB key is missing or wrong (see js/config.js)" : `TMDB error ${res.status}`);
    return res.json();
  });
  cache.set(key, promise);
  promise.catch(() => cache.delete(key));
  return promise;
}

export function img(path, size = "w342") {
  return path ? IMG + size + path : "";
}

// Turn TMDB's movie and tv shapes into one simple shape.
export function normalize(raw, type) {
  const mediaType = type || raw.media_type;
  const date = raw.release_date || raw.first_air_date || "";
  return {
    type: mediaType,
    id: raw.id,
    title: raw.title || raw.name || "Untitled",
    year: date.slice(0, 4),
    poster: raw.poster_path || null,
    backdrop: raw.backdrop_path || null,
    vote: raw.vote_average || 0,
    votes: raw.vote_count || 0,
    overview: raw.overview || "",
  };
}

const list = (data, type) =>
  (data.results || [])
    .filter((r) => (type || r.media_type) === "movie" || (type || r.media_type) === "tv")
    .map((r) => normalize(r, type));

export async function trending(type = "all") {
  return list(await get(`/trending/${type}/week`), type === "all" ? undefined : type);
}

export async function search(query, page = 1) {
  const data = await get("/search/multi", { query, page, include_adult: "false" });
  return { items: list(data), totalPages: data.total_pages || 1 };
}

export async function discover(type, { providers = [], region, genre, sort = "popularity.desc", page = 1 } = {}) {
  const params = { page, sort_by: sort, with_genres: genre, include_adult: "false" };
  if (providers.length) {
    params.with_watch_providers = providers.join("|");
    params.watch_region = region;
    params.with_watch_monetization_types = "flatrate|free|ads";
  }
  if (sort === "vote_average.desc") params["vote_count.gte"] = type === "movie" ? 500 : 200;
  if (sort.startsWith("primary_release_date") || sort.startsWith("first_air_date")) {
    params[type === "movie" ? "primary_release_date.lte" : "first_air_date.lte"] = new Date().toISOString().slice(0, 10);
    params["vote_count.gte"] = 20;
  }
  const data = await get(`/discover/${type}`, params);
  return { items: list(data, type), totalPages: data.total_pages || 1 };
}

export async function details(type, id) {
  return get(`/${type}/${id}`, {
    append_to_response: "credits,watch/providers,recommendations,videos,external_ids",
  });
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

// IMDb rating via OMDb. Cached for a week so we stay far below the
// free limit of 1,000 requests per day.
export async function imdbRating(imdbId) {
  if (!config.OMDB_API_KEY || !imdbId) return null;
  const storageKey = "omdb:" + imdbId;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (saved && Date.now() - saved.t < 7 * 864e5) return saved.v;
  } catch { /* storage unavailable */ }
  try {
    const res = await fetch(`https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${encodeURIComponent(config.OMDB_API_KEY)}`);
    const data = await res.json();
    const value = data && data.imdbRating && data.imdbRating !== "N/A"
      ? { rating: data.imdbRating, votes: data.imdbVotes }
      : null;
    try { localStorage.setItem(storageKey, JSON.stringify({ t: Date.now(), v: value })); } catch { /* ignore */ }
    return value;
  } catch {
    return null;
  }
}
