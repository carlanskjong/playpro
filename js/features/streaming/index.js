// FEATURE: Norwegian streaming (the "PlayPilot" part)
//  - "Where to watch in Norway" on every title page
//  - a chip that says which of YOUR services has it
//  - pick your streaming services in Settings
//  - home rows with what's popular on your services
//  - Browse page: filter everything by Norwegian streaming service
import config from "../../config.js";
import { register } from "../../core/registry.js";
import { state } from "../../lib/state.js";
import { providers, discover, genres, img } from "../../lib/tmdb.js";
import { updateProfile } from "../../lib/db.js";
import { esc, icon, row, grid, card, skeletonGrid, empty, toast, errorMessage } from "../../lib/ui.js";

const COUNTRY = config.COUNTRY || "NO";
const myServices = () => state.profile?.services || [];

// Providers TMDB lists for Norway, most popular first. Many are
// channels inside other apps; we keep the ones people recognise first.
let providerList = null;
async function norwegianProviders() {
  providerList ??= providers(COUNTRY);
  return providerList;
}

function availability(data) {
  const r = data["watch/providers"]?.results?.[COUNTRY];
  if (!r) return null;
  return {
    link: r.link,
    stream: [...(r.flatrate || []), ...(r.free || []), ...(r.ads || [])],
    rent: r.rent || [],
    buy: r.buy || [],
  };
}

const logo = (p, mine) => `
  <li class="provider ${mine ? "is-mine" : ""}" title="${esc(p.provider_name)}${mine ? " · you have this" : ""}">
    <img src="${img(p.logo_path, "w92")}" alt="" loading="lazy">
    <span>${esc(p.provider_name)}</span>
    ${mine ? `<span class="provider-mine">${icon.check}</span>` : ""}
  </li>`;

// ---------- title page ----------

const whereToWatch = {
  order: 10,
  render: ({ data }) => {
    const a = availability(data);
    const mine = new Set(myServices());
    const group = (label, list) => {
      const unique = [...new Map(list.map((p) => [p.provider_id, p])).values()];
      if (!unique.length) return "";
      unique.sort((x, y) => mine.has(y.provider_id) - mine.has(x.provider_id));
      return `<div class="wtw-group"><h3>${label}</h3><ul class="providers">${unique.map((p) => logo(p, mine.has(p.provider_id))).join("")}</ul></div>`;
    };
    const body = a && (a.stream.length || a.rent.length || a.buy.length)
      ? group("Stream", a.stream) + group("Rent", a.rent) + group("Buy", a.buy)
      : `<p class="muted">Not available to stream, rent or buy in Norway right now.</p>`;
    return `
      <div class="section-head"><h2>Where to watch in Norway</h2></div>
      ${body}
      <p class="attribution">Streaming data by <a href="${esc(a?.link || "https://www.justwatch.com/no")}" target="_blank" rel="noopener">JustWatch</a></p>`;
  },
};

const onYourServiceChip = {
  order: 5,
  render: ({ data }) => {
    const a = availability(data);
    if (!a?.stream.length) return "";
    const hit = a.stream.find((p) => myServices().includes(p.provider_id));
    if (hit) return `<span class="chip chip-good">${icon.play}On ${esc(hit.provider_name)}</span>`;
    return `<span class="chip">${icon.play}Streaming in Norway</span>`;
  },
};

// ---------- settings: pick your services ----------

const servicesSettings = {
  order: 10,
  render: async () => {
    const list = await norwegianProviders();
    const mine = new Set(myServices());
    const top = list.slice(0, 24);
    const rest = list.slice(24).filter((p) => mine.has(p.provider_id));
    const tile = (p) => `
      <button type="button" class="service ${mine.has(p.provider_id) ? "on" : ""}" data-id="${p.provider_id}" aria-pressed="${mine.has(p.provider_id)}">
        <img src="${img(p.logo_path, "w92")}" alt="" loading="lazy"><span>${esc(p.provider_name)}</span>
      </button>`;
    return `
      <h2>Your streaming services</h2>
      <p class="muted small">Pick what you subscribe to. We'll highlight titles you can watch right away.</p>
      <div class="services">${[...top, ...rest].map(tile).join("")}</div>
      <details class="more-services"><summary>Show all ${list.length} services in Norway</summary>
        <div class="services">${list.slice(24).filter((p) => !mine.has(p.provider_id)).map(tile).join("")}</div>
      </details>`;
  },
  wire: (box) => {
    let timer;
    box.addEventListener("click", (e) => {
      const btn = e.target.closest(".service");
      if (!btn) return;
      const on = !btn.classList.contains("on");
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", on);
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const ids = [...box.querySelectorAll(".service.on")].map((b) => Number(b.dataset.id));
        try {
          await updateProfile({ services: [...new Set(ids)] });
          toast("Streaming services saved", "good");
        } catch (err) {
          toast(errorMessage(err), "bad");
        }
      }, 600);
    });
  },
};

// ---------- home rows ----------

const homeOnMyServices = {
  order: 20,
  render: async () => {
    const services = myServices();
    if (!services.length) {
      return `
        <a class="promo" href="#/settings">
          <span class="promo-icon">${icon.play}</span>
          <span><strong>Which streaming services do you have?</strong><br>
          <span class="muted">Pick them once and Playpro shows what you can watch right now.</span></span>
        </a>`;
    }
    const [movies, series] = await Promise.all([
      discover("movie", { providers: services, region: COUNTRY }),
      discover("tv", { providers: services, region: COUNTRY }),
    ]);
    return (
      row("Popular movies on your services", movies.items, { more: "#/browse?type=movie" }) +
      row("Popular series on your services", series.items, { more: "#/browse?type=tv" })
    );
  },
};

// ---------- Browse page ----------

async function browseView({ el, query }) {
  document.title = "Browse · Playpro";
  const list = await norwegianProviders();
  const genreCache = {};
  const f = {
    type: query.get("type") === "tv" ? "tv" : "movie",
    services: query.has("s") ? query.get("s").split(",").filter(Boolean).map(Number) : myServices(),
    genre: query.get("g") || "",
    sort: query.get("sort") || "popularity.desc",
  };
  let page = 1;
  let totalPages = 1;

  const sorts = [
    ["popularity.desc", "Most popular"],
    ["vote_average.desc", "Highest rated"],
    [f.type === "movie" ? "primary_release_date.desc" : "first_air_date.desc", "Newest"],
  ];

  function saveToUrl() {
    const q = new URLSearchParams({ type: f.type, s: f.services.join(","), g: f.genre, sort: f.sort });
    history.replaceState(null, "", `#/browse?${q}`);
  }

  async function load(reset) {
    const results = el.querySelector("#browse-results");
    const more = el.querySelector("#browse-more");
    if (reset) {
      page = 1;
      results.innerHTML = skeletonGrid();
    }
    more.hidden = true;
    // No services picked = everything that streams in Norway (the 20 biggest services).
    const ids = f.services.length ? f.services : list.slice(0, 20).map((p) => p.provider_id);
    try {
      const data = await discover(f.type, { providers: ids, region: COUNTRY, genre: f.genre, sort: f.sort, page });
      totalPages = data.totalPages;
      const html = data.items.map((i) => card(i)).join("");
      if (reset) results.innerHTML = data.items.length ? grid([html]) : empty("Nothing found", "Try another genre or more services.");
      else results.querySelector(".grid").insertAdjacentHTML("beforeend", html);
      more.hidden = page >= totalPages;
    } catch (err) {
      results.innerHTML = empty("Couldn't load titles", esc(errorMessage(err)));
    }
  }

  async function renderFilters() {
    genreCache[f.type] ??= await genres(f.type);
    if (!sorts.some(([v]) => v === f.sort)) f.sort = "popularity.desc";
    sorts[2][0] = f.type === "movie" ? "primary_release_date.desc" : "first_air_date.desc";
    const mine = new Set(myServices());
    const chips = [...list.filter((p) => mine.has(p.provider_id)), ...list.filter((p) => !mine.has(p.provider_id)).slice(0, 16)];
    const selected = new Set(f.services);
    el.querySelector("#browse-filters").innerHTML = `
      <div class="segmented">
        <button data-type="movie" aria-selected="${f.type === "movie"}">Movies</button>
        <button data-type="tv" aria-selected="${f.type === "tv"}">Series</button>
      </div>
      <div class="service-chips" role="group" aria-label="Streaming services">
        <button class="svc-chip ${selected.size === 0 ? "on" : ""}" data-svc="all">All services</button>
        ${chips.map((p) => `
          <button class="svc-chip ${selected.has(p.provider_id) ? "on" : ""}" data-svc="${p.provider_id}" aria-pressed="${selected.has(p.provider_id)}">
            <img src="${img(p.logo_path, "w92")}" alt="">${esc(p.provider_name)}
          </button>`).join("")}
      </div>
      <div class="selects">
        <select id="genre" aria-label="Genre">
          <option value="">All genres</option>
          ${genreCache[f.type].map((g) => `<option value="${g.id}" ${String(g.id) === f.genre ? "selected" : ""}>${esc(g.name)}</option>`).join("")}
        </select>
        <select id="sort" aria-label="Sort by">
          ${sorts.map(([v, l]) => `<option value="${v}" ${v === f.sort ? "selected" : ""}>${l}</option>`).join("")}
        </select>
      </div>`;
  }

  el.innerHTML = `
    <div class="page-head"><h1>Browse</h1><p class="muted">Everything streaming in Norway, filtered your way.</p></div>
    <div class="filters" id="browse-filters"></div>
    <div id="browse-results"></div>
    <div class="center"><button class="btn" id="browse-more" hidden>Load more</button></div>`;

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

register({
  id: "streaming",
  routes: [{ path: /^\/browse$/, view: browseView }],
  nav: [{ href: "#/browse", label: "Browse", icon: icon.compass, order: 10 }],
  titleInfo: [onYourServiceChip],
  titleSections: [whereToWatch],
  homeRows: [homeOnMyServices],
  settingsSections: [servicesSettings],
});
