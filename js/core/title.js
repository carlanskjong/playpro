// The page for one movie or series. Features add chips, buttons and
// sections to it through the "titleInfo", "titleActions" and "titleSections" slots.
import { details, normalize, img } from "../lib/tmdb.js";
import { renderSlot } from "./registry.js";
import { esc, icon, typeLabel } from "../lib/ui.js";

function runtime(data, type) {
  if (type === "tv") {
    const n = data.number_of_seasons;
    return n ? `${n} season${n === 1 ? "" : "s"}` : "";
  }
  const m = data.runtime;
  return m ? `${Math.floor(m / 60)}h ${m % 60}m` : "";
}

export const trailerAction = {
  order: 90,
  render: ({ data }) => {
    const videos = data.videos?.results || [];
    const trailer = videos.find((v) => v.site === "YouTube" && v.type === "Trailer") || videos.find((v) => v.site === "YouTube");
    if (!trailer) return "";
    // A plain link (no embedded player) so YouTube can't set cookies inside the app.
    return `<a class="btn btn-ghost" href="https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}" target="_blank" rel="noopener">${icon.play}Trailer</a>`;
  },
};

export default async function titleView({ el, params: [type, id] }) {
  el.innerHTML = `<div class="title-skeleton"><div class="skeleton backdrop-sk"></div><div class="skeleton heading"></div><div class="skeleton line"></div></div>`;
  const data = await details(type, id);
  const item = normalize(data, type);
  const ctx = { type, id: Number(id), data, item };
  document.title = `${item.title} · Playpro`;

  const genres = (data.genres || []).slice(0, 3).map((g) => g.name).join(", ");
  const meta = [runtime(data, type), genres].filter(Boolean).join(" · ");
  const score = item.vote
    ? `<span class="chip"><span class="chip-star">${icon.star}</span>${item.vote.toFixed(1)}<small>TMDB</small></span>`
    : "";

  el.innerHTML = `
    <div class="title-hero">
      ${item.backdrop ? `<img class="title-backdrop" src="${img(item.backdrop, "w1280")}" alt="">` : ""}
    </div>
    <div class="title-head">
      <div class="title-poster">
        ${item.poster ? `<img src="${img(item.poster, "w500")}" alt="Poster for ${esc(item.title)}">` : `<span class="noposter">${esc(item.title)}</span>`}
      </div>
      <div class="title-info">
        <p class="eyebrow">${type === "tv" ? icon.tv : icon.film}${typeLabel(type)}${item.year ? ` · ${esc(item.year)}` : ""}</p>
        <h1>${esc(item.title)}</h1>
        ${data.tagline ? `<p class="tagline">${esc(data.tagline)}</p>` : ""}
        ${meta ? `<p class="meta">${esc(meta)}</p>` : ""}
        <div class="chips" id="t-info">${score}</div>
        <div class="actions" id="t-actions"></div>
      </div>
    </div>
    ${item.overview ? `<p class="overview">${esc(item.overview)}</p>` : ""}
    <div id="t-sections"></div>`;

  await Promise.all([
    renderSlot("titleInfo", el.querySelector("#t-info"), ctx, { tag: "span", className: "slot-inline" }),
    renderSlot("titleActions", el.querySelector("#t-actions"), ctx, { tag: "span", className: "slot-inline" }),
    renderSlot("titleSections", el.querySelector("#t-sections"), ctx, { tag: "section", className: "section" }),
  ]);
}
