// FEATURE: IMDb rating
// Shows the IMDb rating (through the free OMDb API) with a link to IMDb.
// Without an OMDB_API_KEY in config.js it only shows the link.
import { register } from "../../core/registry.js";
import { imdbRating } from "../../lib/tmdb.js";
import { esc } from "../../lib/ui.js";

const imdbChip = {
  order: 10,
  render: async ({ data }) => {
    const imdbId = data.imdb_id || data.external_ids?.imdb_id;
    if (!imdbId) return "";
    const r = await imdbRating(imdbId);
    return `
      <a class="chip chip-imdb" href="https://www.imdb.com/title/${esc(imdbId)}/" target="_blank" rel="noopener" title="${r ? `${esc(r.votes)} votes on IMDb` : "Open on IMDb"}">
        <b>IMDb</b>${r ? esc(r.rating) : "↗"}
      </a>`;
  },
};

register({
  id: "imdb",
  titleInfo: [imdbChip],
});
