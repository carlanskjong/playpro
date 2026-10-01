// The page for one movie or series. Features add chips, buttons and
// sections to it through the "titleInfo", "titleActions" and "titleSections" slots.
import { details, basics, normalize, img, srcset } from "../lib/tmdb.js";
import { state } from "../lib/state.js";
import { renderSlot } from "./registry.js";
import { esc, icon, typeLabel } from "../lib/ui.js";
import { t, lang, num } from "../lib/i18n.js";

function length(data, type) {
  if (type === "tv") {
    const n = data.number_of_seasons;
    return n ? t(n === 1 ? "{n} season" : "{n} seasons", { n }) : "";
  }
  const m = data.runtime;
  if (!m) return "";
  return Math.floor(m / 60) ? t("{h} h {m} min", { h: Math.floor(m / 60), m: m % 60 }) : t("{m} min", { m });
}

export const trailerAction = {
  order: 90,
  render: ({ data }) => {
    const videos = data.videos?.results || [];
    const trailer = videos.find((v) => v.site === "YouTube" && v.type === "Trailer") || videos.find((v) => v.site === "YouTube");
    if (!trailer) return "";
    // A plain link (no embedded player) so YouTube can't set cookies inside the app.
    return `<a class="btn btn-ghost" href="https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}" target="_blank" rel="noopener">${icon.play}${esc(t("Trailer"))}</a>`;
  },
};

// The average colour of the poster tints the top of the page.
function tint(el, posterPath) {
  if (!posterPath) return;
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    try {
      const c = document.createElement("canvas");
      c.width = c.height = 8;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(image, 0, 0, 8, 8);
      const px = g.getImageData(0, 0, 8, 8).data;
      let r = 0, gr = 0, b = 0;
      for (let i = 0; i < px.length; i += 4) { r += px[i]; gr += px[i + 1]; b += px[i + 2]; }
      const n = px.length / 4;
      el.style.setProperty("--tint", `rgb(${Math.round(r / n)} ${Math.round(gr / n)} ${Math.round(b / n)})`);
    } catch { /* the image host didn't allow reading colours; no tint */ }
  };
  image.src = img(posterPath, "w92");
}

export default async function titleView({ el, params: [type, id], isCurrent }) {
  // First frame: the poster you tapped, so it can grow into place.
  const tapped = state.tappedPoster?.href === `#/${type}/${id}` ? state.tappedPoster.src : "";
  el.classList.add("title-page");
  el.innerHTML = `
    <div class="title-hero"></div>
    <div class="title-head">
      <div class="title-poster">${tapped ? `<img src="${esc(tapped)}" alt="" style="view-transition-name: poster">` : `<div class="skeleton"></div>`}</div>
      <div class="title-info"><div class="skeleton heading"></div><div class="skeleton line"></div></div>
    </div>`;

  const data = await details(type, id);
  if (!isCurrent()) return;
  // No Norwegian description on TMDB? Show the English one.
  if (!data.overview && lang === "nb") {
    try { data.overview = (await basics(type, id, "en-US")).overview || ""; } catch { /* keep empty */ }
  }
  const item = normalize(data, type);
  item.imdbId = data.imdb_id || data.external_ids?.imdb_id || null;
  const ctx = { type, id: Number(id), data, item };
  document.title = `${item.title} · Playpro`;

  const facts = [typeLabel(type), item.year, length(data, type)].filter(Boolean).join(", ");
  const genres = (data.genres || []).slice(0, 3).map((g) => g.name).join(", ");
  const score = item.vote
    ? `<span class="chip" title="${esc(t("Average rating on TMDB"))}"><b>TMDB</b>${num(item.vote)}</span>`
    : "";
  const long = item.title.length > 24 ? " long" : "";

  el.innerHTML = `
    <div class="title-hero">
      ${item.backdrop ? `<img class="title-backdrop" src="${img(item.backdrop, "w780")}" srcset="${srcset(item.backdrop, ["w780", "w1280"])}" sizes="100vw" alt="">` : ""}
    </div>
    <div class="title-head">
      <div class="title-poster">
        ${item.poster ? `<img src="${img(item.poster, "w342")}" srcset="${srcset(item.poster, ["w342", "w500"])}" sizes="(max-width: 640px) 120px, 240px" alt="${esc(t("Poster for {title}", { title: item.title }))}" style="view-transition-name: poster">` : `<span class="noposter">${esc(item.title)}</span>`}
      </div>
      <div class="title-info">
        <h1 class="title-name${long}">${esc(item.title)}</h1>
        ${data.tagline ? `<p class="tagline">${esc(data.tagline)}</p>` : ""}
        <p class="facts">${esc(facts)}</p>
        ${genres ? `<p class="genres">${esc(genres)}</p>` : ""}
      </div>
    </div>
    <div class="chips" id="t-info">${score}</div>
    <div class="actions" id="t-actions"></div>
    ${item.overview ? `<p class="overview">${esc(item.overview)}</p>` : ""}
    <div id="t-sections"></div>`;
  tint(el, item.poster);

  await Promise.all([
    renderSlot("titleInfo", el.querySelector("#t-info"), ctx, { tag: "span", className: "slot-inline" }),
    renderSlot("titleActions", el.querySelector("#t-actions"), ctx, { tag: "span", className: "slot-inline" }),
    renderSlot("titleSections", el.querySelector("#t-sections"), ctx, { tag: "section", className: "section" }),
  ]);
}
