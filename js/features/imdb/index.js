// FEATURE: IMDb ratings
//  - IMDb rating chip (with vote count and a link to IMDb) on title pages
//  - IMDb rating on posters everywhere, instead of the TMDB score
// The ratings come from IMDb's own data file, which a weekly job copies into
// your Supabase database (see scripts/import-ratings.mjs). No extra service
// sees your friends' activity.
import { register } from "../../core/registry.js";
import { sb } from "../../lib/db.js";
import { imdbId } from "../../lib/tmdb.js";
import { esc } from "../../lib/ui.js";

const cache = new Map(); // "tt123" -> { rating, votes } or null

async function ratings(ids) {
  const missing = [...new Set(ids)].filter((id) => !cache.has(id));
  for (let i = 0; i < missing.length; i += 100) {
    const chunk = missing.slice(i, i + 100);
    const { data, error } = await sb.from("imdb_ratings").select("imdb_id, rating, votes").in("imdb_id", chunk);
    if (error) throw error;
    for (const id of chunk) cache.set(id, null);
    for (const r of data) cache.set(r.imdb_id, r);
  }
  return ids.map((id) => cache.get(id));
}

const votes = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

// ---------- title page chip ----------

const imdbChip = {
  order: 10,
  render: async ({ data }) => {
    const id = data.imdb_id || data.external_ids?.imdb_id;
    if (!id) return "";
    const [r] = await ratings([id]);
    return `
      <a class="chip chip-imdb" href="https://www.imdb.com/title/${esc(id)}/" target="_blank" rel="noopener"
         title="${r ? `${r.votes.toLocaleString("en-GB")} votes on IMDb. ` : ""}Information courtesy of IMDb (https://www.imdb.com). Used with permission.">
        <b>IMDb</b>${r ? `${Number(r.rating).toFixed(1)}<small>${votes(r.votes)} votes</small>` : "↗"}
      </a>`;
  },
};

// ---------- IMDb score on every poster ----------
// Watches the page for poster cards and, once one scrolls into view, looks up
// its IMDb id and rating. Cards are handled in small batches.

let pending = new Map(); // imdb id -> [card elements]
let timer = null;

function paint(card, r) {
  const poster = card.querySelector(".poster");
  if (!poster) return;
  let badge = poster.querySelector(".score");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "score";
    poster.appendChild(badge);
  }
  badge.classList.add("score-imdb");
  badge.innerHTML = `<b>IMDb</b>${Number(r.rating).toFixed(1)}`;
}

async function flush() {
  const batch = pending;
  pending = new Map();
  const ids = [...batch.keys()];
  try {
    const rows = await ratings(ids);
    rows.forEach((r, i) => r && batch.get(ids[i]).forEach((card) => paint(card, r)));
  } catch (err) {
    console.warn("[imdb]", err);
  }
}

async function queue(card) {
  const m = (card.getAttribute("href") || "").match(/^#\/(movie|tv)\/(\d+)/);
  if (!m) return;
  try {
    const id = await imdbId(m[1], m[2]);
    if (!id) return;
    if (cache.has(id)) return cache.get(id) && paint(card, cache.get(id));
    if (!pending.has(id)) pending.set(id, []);
    pending.get(id).push(card);
    clearTimeout(timer);
    timer = setTimeout(flush, 120);
  } catch { /* no badge for this one */ }
}

let watching = false;
function watchPosters() {
  if (watching) return;
  watching = true;
  const seen = new IntersectionObserver((items) => {
    for (const item of items) {
      if (!item.isIntersecting) continue;
      seen.unobserve(item.target);
      queue(item.target);
    }
  }, { rootMargin: "300px" });
  const scan = () => document.querySelectorAll("a.card:not([data-imdb])").forEach((card) => {
    card.dataset.imdb = "";
    seen.observe(card);
  });
  new MutationObserver(scan).observe(document.getElementById("view"), { childList: true, subtree: true });
  scan();
}

register({
  id: "imdb",
  titleInfo: [imdbChip],
  onLogin: [async () => watchPosters()],
});
