// FEATURE: IMDb ratings
//  - IMDb rating chip (with vote count and a link to IMDb) on title pages
//  - IMDb rating on posters everywhere, instead of the TMDB score
// The ratings come from IMDb's own data file, which a twice-weekly job copies
// into your Supabase database (scripts/import-ratings.mjs). No extra service
// sees your friends' activity.
import { register } from "../../core/registry.js";
import { imdbId } from "../../lib/tmdb.js";
import { imdbRatings, cachedRating } from "../../lib/ratings.js";
import { esc } from "../../lib/ui.js";
import { t, num } from "../../lib/i18n.js";

const votes = (n) => (n >= 1e6 ? `${num(n / 1e6)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

// ---------- title page chip ----------

const imdbChip = {
  order: 10,
  render: async ({ item }) => {
    if (!item.imdbId) return "";
    const [r] = await imdbRatings([item.imdbId]);
    return `
      <a class="chip chip-imdb" href="https://www.imdb.com/title/${esc(item.imdbId)}/" target="_blank" rel="noopener"
         title="${r ? esc(t("{n} votes on IMDb.", { n: r.votes.toLocaleString() })) + " " : ""}Information courtesy of IMDb (https://www.imdb.com). Used with permission.">
        <b>IMDb</b>${r ? `${num(r.rating)}<small>${esc(t("{n} votes", { n: votes(r.votes) }))}</small>` : "↗"}
      </a>`;
  },
};

// ---------- IMDb score on every poster ----------
// Watches the page for poster cards and, once one scrolls into view, looks up
// its IMDb id (if the card doesn't already know it) and rating, in batches.

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
  badge.innerHTML = `<b>IMDb</b>${num(r.rating)}`;
}

async function flush() {
  const batch = pending;
  pending = new Map();
  const ids = [...batch.keys()];
  try {
    const rows = await imdbRatings(ids);
    rows.forEach((r, i) => r && batch.get(ids[i]).forEach((card) => paint(card, r)));
  } catch (err) {
    console.warn("[imdb]", err);
  }
}

async function queue(card) {
  const m = (card.getAttribute("href") || "").match(/^#\/(movie|tv)\/(\d+)/);
  if (!m) return;
  try {
    const id = card.dataset.imdbId || (await imdbId(m[1], m[2]));
    if (!id) return;
    const known = cachedRating(id);
    if (known) return paint(card, known);
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
  const scan = () => document.querySelectorAll("a.card:not([data-imdb-watch])").forEach((card) => {
    card.dataset.imdbWatch = "";
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
