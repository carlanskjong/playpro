// A forgiving search. TMDB only finds exact spellings, so when it finds
// nothing this tries again: without a year at the end ("Arlington road 1999"),
// then with shorter versions of what you typed, keeping only titles that look
// like it ("arlinton road" finds Arlington Road). Actors are shown as the
// titles they're known for (see search() in lib/tmdb.js), and a pasted IMDb
// link finds that title.
import { search, findByImdb } from "../../lib/tmdb.js";

const MAX_TRIES = 10;
const simple = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9æøå ]+/g, " ").replace(/\s+/g, " ").trim();

function distance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

// 1 = the same, 0 = nothing alike. Also compares with the start of the title,
// so "arlinton" still looks like "Arlington Road".
function likeness(query, title) {
  const q = simple(query), t = simple(title);
  const whole = 1 - distance(q, t) / Math.max(q.length, t.length);
  const start = 1 - distance(q, t.slice(0, q.length)) / q.length;
  return Math.max(whole, start);
}

// Shorter and shorter versions of the text: "arlinton road" -> "arlinton roa" -> … -> "arlin"
function shorter(text) {
  const out = [];
  for (let s = text.slice(0, -1).trim(); s.length >= 3 && out.length < MAX_TRIES; s = s.slice(0, -1).trim()) out.push(s);
  return out;
}

// Returns { items, totalPages, note, year }. note says what was changed
// ("year" or "close"), or is empty for an exact search.
export async function findTitles(text, page = 1) {
  const imdb = text.match(/\btt\d{7,9}\b/);
  if (imdb) {
    const item = await findByImdb(imdb[0]);
    return { items: item ? [item] : [], totalPages: 1, note: "" };
  }

  const exact = await search(text, page);
  if (exact.items.length || page > 1) return { ...exact, note: "" };

  const withYear = text.match(/^(.+?)[\s,]*\(?((?:18|19|20)\d\d)\)?$/);
  const query = withYear ? withYear[1] : text;
  if (withYear && Number(withYear[2]) <= new Date().getFullYear() + 3) {
    const year = withYear[2];
    const data = await search(query, 1);
    if (data.items.length) {
      const items = [...data.items.filter((i) => i.year === year), ...data.items.filter((i) => i.year !== year)];
      return { items, totalPages: 1, note: "year", year };
    }
  }

  for (const attempt of shorter(query)) {
    const data = await search(attempt, 1);
    const close = data.items
      .map((item) => ({ item, score: likeness(query, item.title) }))
      .filter((x) => x.score >= 0.6)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.item);
    if (close.length) return { items: close, totalPages: 1, note: "close" };
  }
  return { items: [], totalPages: 1, note: "" };
}
