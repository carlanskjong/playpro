// FEATURE: Now streaming
// Checks your watchlist against your streaming services when you open the
// app. Titles you can watch right now get a green play badge, and titles
// that arrived on your services since your last visit show up at the top
// of the home screen. (The check runs on your device; nothing is sent
// anywhere new.)
import { register } from "../../core/registry.js";
import { state, entryKey } from "../../lib/state.js";
import { watchProviders } from "../../lib/tmdb.js";
import { esc, row, entryToItem } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";
import { onMyService } from "../streaming/shared.js";

const SEEN_KEY = "playpro:streaming-known";
let check = null;
// Runs once per sign-in, the first time something needs it (your list is
// loaded by then).
const ensureChecked = () => (check ??= checkWatchlist().catch(console.error));
let arrivals = []; // entries that became available since last time

function known() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "null"); } catch { return null; }
}
function remember(keys) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(keys)); } catch { /* ignore */ }
}

async function checkWatchlist() {
  const watchlist = [...state.entries.values()].filter((e) => e.status === "watchlist").slice(0, 80);
  const results = await Promise.all(watchlist.map((e) => watchProviders(e.media_type, e.tmdb_id).catch(() => null)));
  state.nowStreaming.clear();
  const services = new Map();
  watchlist.forEach((e, k) => {
    const hit = onMyService(results[k]);
    if (hit) {
      state.nowStreaming.add(entryKey(e.media_type, e.tmdb_id));
      services.set(entryKey(e.media_type, e.tmdb_id), hit.provider_name);
    }
  });
  const before = known();
  // The first time, everything is "already known": no flood of alerts.
  arrivals = before
    ? watchlist.filter((e) => services.has(entryKey(e.media_type, e.tmdb_id)) && !before.includes(entryKey(e.media_type, e.tmdb_id)))
        .map((e) => ({ e, service: services.get(entryKey(e.media_type, e.tmdb_id)) }))
    : [];
  remember([...state.nowStreaming]);
}

const homeRow = {
  order: 10,
  render: async () => {
    await ensureChecked();
    if (arrivals.length) {
      const shown = arrivals;
      arrivals = []; // show the news once
      return `<div class="news" role="status">${row(t("New on your services"), shown.map((a) => entryToItem(a.e)), {
        more: "#/list?now=1", sub: esc(t("From your watchlist, since your last visit")),
      })}</div>`;
    }
    const ready = [...state.entries.values()].filter((e) => state.nowStreaming.has(entryKey(e.media_type, e.tmdb_id))).map(entryToItem);
    return row(t("Ready to watch from your watchlist"), ready, { more: "#/list?now=1", sub: esc(t("On services you have")) });
  },
};

// Check as soon as you're signed in (your list is loaded by then), and
// redraw My list once the badges are known.
window.addEventListener("playpro:signed-in", async () => {
  await ensureChecked();
  if (location.hash.startsWith("#/list") && state.nowStreaming.size) window.dispatchEvent(new Event("playpro:refresh"));
});

register({
  id: "nowstreaming",
  onLogin: [() => { check = null; }],
  homeRows: [homeRow],
});
