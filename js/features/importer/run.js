// Reads an IMDb or Letterboxd CSV export and saves the matching titles.
import { state, entryKey } from "../../lib/state.js";
import { saveEntries } from "../../lib/db.js";
import { findByImdb, findMovie } from "../../lib/tmdb.js";
import { t } from "../../lib/i18n.js";

// A small CSV reader that understands quotes ("Lord of the Rings, The").
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head = [], ...body] = rows.filter((r) => r.some((x) => x.trim()));
  const names = head.map((h) => h.replace(/^﻿/, "").trim());
  return body.map((r) => Object.fromEntries(names.map((h, k) => [h, (r[k] ?? "").trim()])));
}

const IMDB_TYPES = /^(movie|tvMovie|tvSeries|tvMiniSeries|tvSpecial|short|video)$/i;

// What one CSV row asks for: which title, seen or watchlist, rating, date.
export function readRow(r, fileName) {
  const watchlistFile = /watchlist/i.test(fileName);
  if (r.Const) { // IMDb
    if (r["Title Type"] && !IMDB_TYPES.test(r["Title Type"])) return null;
    const rating = Number(r["Your Rating"]) || null;
    return {
      find: () => findByImdb(r.Const),
      imdbId: r.Const,
      status: rating ? "seen" : "watchlist",
      rating,
      watchedAt: r["Date Rated"] ? new Date(r["Date Rated"]).toISOString() : null,
    };
  }
  if (r["Letterboxd URI"] || (r.Name && r.Year)) { // Letterboxd (films only)
    const stars = Number(r.Rating) || 0; // 0.5 to 5 stars
    const day = r["Watched Date"] || r.Date;
    return {
      find: () => findMovie(r.Name, r.Year),
      status: watchlistFile ? "watchlist" : "seen",
      rating: stars ? Math.min(10, Math.max(1, Math.round(stars * 2))) : null,
      watchedAt: !watchlistFile && day ? new Date(day).toISOString() : null,
    };
  }
  return null;
}

export async function importFile(file, onProgress) {
  const rows = parseCsv(await file.text()).map((r) => readRow(r, file.name)).filter(Boolean);
  if (!rows.length) throw new Error(t("That file doesn't look like an IMDb or Letterboxd export."));
  const result = { added: 0, skipped: 0, missing: 0 };
  const toSave = [];
  let done = 0;
  let next = 0;
  // Five lookups at a time: quick, without flooding TMDB.
  const worker = async () => {
    while (next < rows.length) {
      const row = rows[next++];
      try {
        const item = await row.find();
        if (!item) result.missing++;
        else {
          const existing = state.entries.get(entryKey(item.type, item.id));
          // keep what you already have, but a rating beats a watchlist entry
          if (existing && !(existing.status === "watchlist" && row.status === "seen")) result.skipped++;
          else {
            item.imdbId = row.imdbId || null;
            toSave.push({ item, options: { status: row.status, rating: row.rating, watchedAt: row.watchedAt } });
          }
        }
      } catch { result.missing++; }
      onProgress(++done, rows.length);
    }
  };
  await Promise.all(Array.from({ length: 5 }, worker));
  // one title can appear twice in a file (e.g. diary rewatches): keep the last
  const unique = [...new Map(toSave.map((x) => [entryKey(x.item.type, x.item.id), x])).values()];
  for (let i = 0; i < unique.length; i += 100) await saveEntries(unique.slice(i, i + 100));
  result.added = unique.length;
  return result;
}
