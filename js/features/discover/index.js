// FEATURE: Discover
//  - "Trending this week" banner that slides through five titles
//  - trending movie and series rows on the home screen
//  - cast and "More like this" on title pages
import { register } from "../../core/registry.js";
import { trending, img, srcset, normalize } from "../../lib/tmdb.js";
import { esc, row, kindAndYear } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";

const calm = matchMedia("(prefers-reduced-motion: reduce)");

const carousel = {
  order: 20,
  render: async () => {
    const items = (await trending("all")).filter((i) => i.backdrop).slice(0, 5);
    if (!items.length) return "";
    return `
      <section class="carousel" aria-roledescription="carousel" aria-label="${esc(t("Trending this week"))}">
        <h2>${esc(t("Trending this week"))}</h2>
        <div class="slides">
          ${items.map((i, k) => `
            <a class="slide" href="#/${i.type}/${i.id}" aria-label="${esc(i.title)}" data-index="${k}">
              <img src="${img(i.backdrop, "w780")}" srcset="${srcset(i.backdrop, ["w780", "w1280"])}" sizes="(max-width: 820px) 92vw, 1200px" alt="" ${k ? 'loading="lazy"' : ""}>
              <span class="slide-text"><strong>${esc(i.title)}</strong><span>${esc(kindAndYear(i))}</span></span>
            </a>`).join("")}
        </div>
        <div class="dots" aria-hidden="true">${items.map((_, k) => `<span class="${k ? "" : "on"}"></span>`).join("")}</div>
      </section>`;
  },
  wire: (box) => {
    const slides = box.querySelector(".slides");
    const dots = [...box.querySelectorAll(".dots span")];
    let index = 0;
    let timer = null;
    const show = (k) => dots.forEach((d, i) => d.classList.toggle("on", i === k));
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { index = Number(e.target.dataset.index); show(index); }
    }, { root: slides, threshold: 0.6 });
    slides.querySelectorAll(".slide").forEach((s) => observer.observe(s));
    // Slides move on by themselves every 7 seconds, until you touch them.
    const stop = () => { clearInterval(timer); timer = null; };
    if (!calm.matches) {
      timer = setInterval(() => {
        if (!box.isConnected) return stop();
        const next = slides.children[(index + 1) % dots.length];
        slides.scrollTo({ left: next.offsetLeft - slides.offsetLeft, behavior: "smooth" });
      }, 7000);
    }
    slides.addEventListener("pointerdown", stop, { once: true });
    slides.addEventListener("wheel", stop, { once: true, passive: true });
  },
};

const trendingRows = {
  order: 60,
  render: async () => {
    const [movies, series] = await Promise.all([trending("movie"), trending("tv")]);
    return row(t("Trending movies"), movies) + row(t("Trending series"), series);
  },
};

const cast = {
  order: 40,
  render: ({ data }) => {
    const people = (data.credits?.cast || []).slice(0, 16);
    if (!people.length) return "";
    return `
      <div class="section-head"><h2>${esc(t("Cast"))}</h2></div>
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
    return row(t("More like this"), items);
  },
};

register({
  id: "discover",
  homeRows: [carousel, trendingRows],
  titleSections: [cast, moreLikeThis],
});
