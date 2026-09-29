// FEATURE: Discover
//  - big "trending now" banner and trending rows on the home screen
//  - cast and "more like this" on title pages
import { register } from "../../core/registry.js";
import { trending, img, normalize } from "../../lib/tmdb.js";
import { esc, icon, row, typeLabel } from "../../lib/ui.js";

const hero = {
  order: 0,
  noPlaceholder: true,
  render: async () => {
    const items = (await trending("all")).filter((i) => i.backdrop);
    const pick = items[new Date().getDate() % Math.min(items.length, 5)];
    if (!pick) return "";
    return `
      <a class="hero" href="#/${pick.type}/${pick.id}">
        <img class="hero-img" src="${img(pick.backdrop, "w1280")}" alt="">
        <div class="hero-body">
          <p class="eyebrow">Trending this week · ${typeLabel(pick.type)}</p>
          <h1>${esc(pick.title)}</h1>
          <p class="hero-text">${esc(pick.overview.length > 180 ? pick.overview.slice(0, 180).trim() + "…" : pick.overview)}</p>
          <span class="btn btn-primary">${icon.play}See where to watch</span>
        </div>
      </a>`;
  },
};

const trendingRows = {
  order: 30,
  render: async () => {
    const [movies, series] = await Promise.all([trending("movie"), trending("tv")]);
    return row("Trending movies", movies) + row("Trending series", series);
  },
};

const cast = {
  order: 40,
  render: ({ data }) => {
    const people = (data.credits?.cast || []).slice(0, 16);
    if (!people.length) return "";
    return `
      <div class="section-head"><h2>Cast</h2></div>
      <div class="scroller cast">
        ${people.map((p) => `
          <div class="person">
            ${p.profile_path ? `<img src="${img(p.profile_path, "w185")}" alt="" loading="lazy">` : `<span class="person-empty">${esc(p.name.charAt(0))}</span>`}
            <strong>${esc(p.name)}</strong>
            <span>${esc(p.character || "")}</span>
          </div>`).join("")}
      </div>`;
  },
};

const moreLikeThis = {
  order: 50,
  render: ({ data, type }) => {
    const items = (data.recommendations?.results || []).map((r) => normalize(r, type)).slice(0, 20);
    return row("More like this", items);
  },
};

register({
  id: "discover",
  homeRows: [hero, trendingRows],
  titleSections: [cast, moreLikeThis],
});
