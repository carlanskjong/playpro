// FEATURE: Rotten Tomatoes score
// Shows the Tomatometer (% of critics who liked it) on title pages, with the
// date it was recorded. Rotten Tomatoes has no free API and forbids copying
// from its website, so the scores come from Wikidata, the free, open
// database behind Wikipedia. A weekly job copies them into your Supabase
// database (see scripts/import-ratings.mjs). Wikidata is volunteer-run, so
// some scores are missing or a bit old; the chip always says "as of".
import { register } from "../../core/registry.js";
import { sb } from "../../lib/db.js";
import { esc } from "../../lib/ui.js";
import { t, date } from "../../lib/i18n.js";

const month = (iso) => date(iso, { month: "short", year: "numeric" });

const rtChip = {
  order: 12,
  render: async ({ item }) => {
    const id = item.imdbId;
    if (!id) return "";
    const { data: rows, error } = await sb.from("rt_scores").select("score, as_of, rt_id").eq("imdb_id", id).limit(1);
    if (error) throw error;
    const r = rows[0];
    if (!r) return "";
    const fresh = r.score >= 60;
    const label = `<b class="${fresh ? "rt-fresh" : "rt-rotten"}" aria-hidden="true"></b>${r.score} %<small>${esc(r.as_of ? t("RT, {date}", { date: month(r.as_of) }) : "RT")}</small>`;
    const title = esc(r.as_of ? t("Rotten Tomatoes critics score from {date}, via Wikidata", { date: month(r.as_of) }) : t("Rotten Tomatoes critics score, via Wikidata"));
    return r.rt_id
      ? `<a class="chip chip-rt" href="https://www.rottentomatoes.com/${esc(r.rt_id)}" target="_blank" rel="noopener" title="${title}">${label}</a>`
      : `<span class="chip chip-rt" title="${title}">${label}</span>`;
  },
};

register({
  id: "rottentomatoes",
  titleInfo: [rtChip],
});
