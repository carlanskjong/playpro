// Browse page: everything streaming in Norway, filtered by service, genre,
// sort order and (optionally) IMDb score. Loaded only when opened.
import { discover, genres, img } from "../../lib/tmdb.js";
import { ratingsForItems } from "../../lib/ratings.js";
import { esc, grid, card, skeletonGrid, empty, errorMessage } from "../../lib/ui.js";
import { t, num } from "../../lib/i18n.js";
import { COUNTRY, myServices, norwegianProviders, browseTabs } from "./shared.js";

const MIN_IMDB = 7;

export default async function browseView({ el, query, isCurrent }) {
  document.title = `${t("Browse")} · Playpro`;
  const list = await norwegianProviders();
  const genreCache = {};
  const f = {
    type: query.get("type") === "tv" ? "tv" : "movie",
    services: query.has("s") ? query.get("s").split(",").filter(Boolean).map(Number) : myServices(),
    genre: query.get("g") || "",
    sort: query.get("sort") || "popularity.desc",
    imdb: query.get("imdb") === "1",
  };
  let page = 1;
  let totalPages = 1;
  let requestId = 0;

  const sorts = () => [
    ["popularity.desc", t("Most popular")],
    ["vote_average.desc", t("Highest rated")],
    [f.type === "movie" ? "primary_release_date.desc" : "first_air_date.desc", t("Newest")],
  ];

  function saveToUrl() {
    const q = new URLSearchParams({ type: f.type, s: f.services.join(","), g: f.genre, sort: f.sort, imdb: f.imdb ? "1" : "" });
    history.replaceState(null, "", `#/browse?${q}`);
  }

  // One page of results; with the IMDb filter on, keep fetching until
  // there's a screenful of titles rated 7 or more.
  async function fetchPage() {
    const ids = f.services.length ? f.services : list.slice(0, 20).map((p) => p.provider_id);
    const found = [];
    do {
      const data = await discover(f.type, { providers: ids, region: COUNTRY, genre: f.genre, sort: f.sort, page, minVotes: f.imdb ? 200 : undefined });
      totalPages = data.totalPages;
      if (!f.imdb) return data.items.map((i) => card(i));
      for (const { item, imdb } of await ratingsForItems(data.items)) {
        if (imdb && imdb.rating >= MIN_IMDB) found.push(card(item, { note: `IMDb ${num(imdb.rating)}` }));
      }
      if (found.length >= 12 || page >= totalPages) break;
      page += 1;
    } while (found.length < 12);
    return found;
  }

  async function load(reset) {
    const id = ++requestId;
    const results = el.querySelector("#browse-results");
    const more = el.querySelector("#browse-more");
    if (reset) {
      page = 1;
      results.innerHTML = skeletonGrid();
    }
    more.hidden = true;
    try {
      const cards = await fetchPage();
      if (id !== requestId || !isCurrent()) return;
      if (reset) {
        results.innerHTML = cards.length
          ? grid(cards)
          : empty(t("Nothing matches"), esc(t("Try another genre, more services, or switch off the IMDb filter.")), "", "popcorn");
      } else results.querySelector(".grid")?.insertAdjacentHTML("beforeend", cards.join(""));
      more.hidden = page >= totalPages;
    } catch (err) {
      if (id === requestId) results.innerHTML = empty(t("Titles didn't load"), esc(errorMessage(err)));
    }
  }

  async function renderFilters() {
    genreCache[f.type] ??= await genres(f.type);
    const options = sorts();
    if (!options.some(([v]) => v === f.sort)) f.sort = "popularity.desc";
    const mine = new Set(myServices());
    const chips = [...list.filter((p) => mine.has(p.provider_id)), ...list.filter((p) => !mine.has(p.provider_id)).slice(0, 16)];
    const selected = new Set(f.services);
    el.querySelector("#browse-filters").innerHTML = `
      <div class="segmented" role="radiogroup" aria-label="${esc(t("Movies or series"))}">
        <button role="radio" data-type="movie" aria-checked="${f.type === "movie"}">${esc(t("Movies"))}</button>
        <button role="radio" data-type="tv" aria-checked="${f.type === "tv"}">${esc(t("Series"))}</button>
      </div>
      <div class="service-chips" role="group" aria-label="${esc(t("Streaming services"))}">
        <button class="svc-chip ${selected.size === 0 ? "on" : ""}" data-svc="all" aria-pressed="${selected.size === 0}">${esc(t("All services"))}</button>
        ${chips.map((p) => `
          <button class="svc-chip ${selected.has(p.provider_id) ? "on" : ""}" data-svc="${p.provider_id}" aria-pressed="${selected.has(p.provider_id)}">
            <img src="${img(p.logo_path, "w92")}" alt="">${esc(p.provider_name)}
          </button>`).join("")}
      </div>
      <div class="selects">
        <select id="genre" aria-label="${esc(t("Genre"))}">
          <option value="">${esc(t("All genres"))}</option>
          ${genreCache[f.type].map((g) => `<option value="${g.id}" ${String(g.id) === f.genre ? "selected" : ""}>${esc(g.name)}</option>`).join("")}
        </select>
        <select id="sort" aria-label="${esc(t("Sort by"))}">
          ${options.map(([v, l]) => `<option value="${v}" ${v === f.sort ? "selected" : ""}>${esc(l)}</option>`).join("")}
        </select>
        <button class="svc-chip imdb-filter ${f.imdb ? "on" : ""}" id="imdb-filter" aria-pressed="${f.imdb}"><b>IMDb</b>${num(MIN_IMDB, 0)}+</button>
      </div>`;
  }

  el.innerHTML = `
    <div class="page-head"><h1>${esc(t("Browse"))}</h1><p class="muted">${esc(t("Everything streaming in Norway, filtered your way."))}</p></div>
    ${browseTabs("/browse")}
    <div class="filters" id="browse-filters"></div>
    <div id="browse-results"></div>
    <div class="center"><button class="btn" id="browse-more" hidden>${esc(t("Load more"))}</button></div>`;

  const filters = el.querySelector("#browse-filters");
  filters.addEventListener("click", async (e) => {
    const typeBtn = e.target.closest("[data-type]");
    const svc = e.target.closest("[data-svc]");
    if (typeBtn) {
      f.type = typeBtn.dataset.type;
      f.genre = "";
    } else if (svc) {
      const id = svc.dataset.svc;
      if (id === "all") f.services = [];
      else f.services = f.services.includes(Number(id)) ? f.services.filter((x) => x !== Number(id)) : [...f.services, Number(id)];
    } else if (e.target.closest("#imdb-filter")) {
      f.imdb = !f.imdb;
    } else return;
    saveToUrl();
    await renderFilters();
    load(true);
  });
  filters.addEventListener("change", (e) => {
    if (e.target.id === "genre") f.genre = e.target.value;
    if (e.target.id === "sort") f.sort = e.target.value;
    saveToUrl();
    load(true);
  });
  el.querySelector("#browse-more").addEventListener("click", () => { page += 1; load(false); });

  await renderFilters();
  await load(true);
}
