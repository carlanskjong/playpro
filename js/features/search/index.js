// FEATURE: Search for movies and series.
import { register } from "../../core/registry.js";
import { search, trending } from "../../lib/tmdb.js";
import { esc, icon, grid, card, skeletonGrid, empty, errorMessage } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";

async function searchView({ el, query }) {
  document.title = `${t("Search")} · Playpro`;
  let q = query.get("q") || "";
  let page = 1;
  let timer;
  let requestId = 0;

  el.innerHTML = `
    <div class="page-head"><h1>${esc(t("Search"))}</h1></div>
    <label class="searchbox">
      ${icon.search}
      <input type="search" id="q" placeholder="${esc(t("Movies, series, actors…"))}" value="${esc(q)}" autocomplete="off" enterkeyhint="search" aria-label="${esc(t("Search movies and series"))}">
    </label>
    <div id="results"></div>
    <div class="center"><button class="btn" id="more" hidden>${esc(t("Load more"))}</button></div>`;

  const input = el.querySelector("#q");
  const results = el.querySelector("#results");
  const more = el.querySelector("#more");

  async function run(reset) {
    const id = ++requestId;
    more.hidden = true;
    if (!q.trim()) {
      const head = `<h2 class="subhead">${esc(t("Trending right now"))}</h2>`;
      results.innerHTML = head + skeletonGrid(6);
      const items = (await trending("all")).slice(0, 12);
      if (id === requestId) results.innerHTML = head + grid(items);
      return;
    }
    if (reset) { page = 1; results.innerHTML = skeletonGrid(); }
    try {
      const data = await search(q.trim(), page);
      if (id !== requestId) return;
      const html = data.items.map((i) => card(i)).join("");
      if (reset) {
        results.innerHTML = data.items.length
          ? grid([html])
          : empty(t("No results"), esc(t("Nothing matched “{q}”. Check the spelling, or try the original title.", { q })), "", "popcorn");
      } else results.querySelector(".grid")?.insertAdjacentHTML("beforeend", html);
      more.hidden = page >= data.totalPages;
    } catch (err) {
      if (id === requestId) results.innerHTML = empty(t("Search didn't work"), esc(errorMessage(err)));
    }
  }

  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      q = input.value;
      history.replaceState(null, "", q ? `#/search?q=${encodeURIComponent(q)}` : "#/search");
      run(true);
    }, 350);
  });
  more.addEventListener("click", () => { page += 1; run(false); });
  input.focus();
  await run(true);
}

register({
  id: "search",
  routes: [{ path: /^\/search$/, view: searchView }],
  nav: [{ href: "#/search", label: t("Search"), icon: icon.search, order: 20 }],
});
