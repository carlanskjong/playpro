// IMDb ratings from your own database (filled by the weekly import job).
// Used by the imdb feature, the Browse filter and the "tonight" pick.
import { sb, check } from "./db.js";
import { imdbId } from "./tmdb.js";

const cache = new Map(); // "tt123" -> { rating, votes } or null

export async function imdbRatings(ids) {
  const missing = [...new Set(ids.filter(Boolean))].filter((id) => !cache.has(id));
  for (let i = 0; i < missing.length; i += 100) {
    const chunk = missing.slice(i, i + 100);
    const rows = check(await sb.from("imdb_ratings").select("imdb_id, rating, votes").in("imdb_id", chunk));
    for (const id of chunk) cache.set(id, null);
    for (const r of rows) cache.set(r.imdb_id, { rating: Number(r.rating), votes: r.votes });
  }
  return ids.map((id) => cache.get(id) ?? null);
}

export const cachedRating = (id) => cache.get(id) ?? null;

// IMDb rating for TMDB items (looks up IMDb ids where the item doesn't have one).
export async function ratingsForItems(items) {
  const ids = await Promise.all(items.map((i) => i.imdbId || imdbId(i.type, i.id).catch(() => null)));
  items.forEach((item, k) => (item.imdbId = ids[k]));
  const ratings = await imdbRatings(ids);
  return items.map((item, k) => ({ item, imdb: ratings[k] }));
}
