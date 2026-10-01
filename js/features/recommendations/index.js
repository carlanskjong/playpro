// FEATURE: Recommendations
// A home-screen row picked from the titles you rated 8 or higher: TMDB's
// recommendations for each of them, with the ones several of your favourites
// point to first, and nothing you've already seen or saved.
import { register } from "../../core/registry.js";
import { state, entryKey } from "../../lib/state.js";
import { recommendations } from "../../lib/tmdb.js";
import { esc, row } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";

const recommendedRow = {
  order: 50,
  render: async () => {
    const favourites = [...state.entries.values()]
      .filter((e) => e.status === "seen" && e.rating >= 8)
      .sort((a, b) => b.rating - a.rating || new Date(b.watched_at || b.updated_at) - new Date(a.watched_at || a.updated_at))
      .slice(0, 5);
    if (!favourites.length) return "";
    const lists = await Promise.all(favourites.map((e) => recommendations(e.media_type, e.tmdb_id).catch(() => [])));
    const tally = new Map();
    lists.forEach((items, rank) =>
      items.slice(0, 12).forEach((item, pos) => {
        const key = entryKey(item.type, item.id);
        if (state.entries.has(key)) return;
        const prev = tally.get(key) || { item, score: 0 };
        prev.score += 3 + (favourites.length - rank) * 0.2 - pos * 0.1;
        tally.set(key, prev);
      }),
    );
    const items = [...tally.values()].sort((a, b) => b.score - a.score).slice(0, 20).map((x) => x.item);
    const because = favourites.slice(0, 3).map((e) => e.title).join(", ");
    return row(t("Picked for you"), items, { sub: esc(t("Because you liked {titles}", { titles: because })) });
  },
};

register({
  id: "recommendations",
  homeRows: [recommendedRow],
});
