// Page #/browse/coming: new seasons and new series coming to your services,
// day by day, and films coming to stream or rent.
import { comingSeries, comingFilms } from "./soon.js";
import { browseTabs } from "../streaming/shared.js";
import { esc, card, grid, skeletonGrid, empty, errorMessage } from "../../lib/ui.js";
import { t, date } from "../../lib/i18n.js";

const short = (iso) => date(iso, { day: "numeric", month: "short" });
export const seriesNote = (s) => s.season
  ? t("Season {n} on {service}", { n: s.season, service: s.service })
  : t("New series on {service}", { service: s.service });

// Grouped by month, soonest first; each card says what's coming, where and when.
function byMonth(items, note) {
  const months = new Map();
  for (const item of items) {
    const month = item.soon.slice(0, 7);
    months.set(month, [...(months.get(month) || []), item]);
  }
  return [...months].map(([month, list]) => `
    <section class="premiere-month">
      <h3 class="month-head"><time datetime="${month}">${esc(date(`${month}-01`, { month: "long", year: "numeric" }))}</time></h3>
      ${grid(list.map((i) => card(i, { note: note(i), wrap: true })))}
    </section>`).join("");
}

export default async function comingView({ el, isCurrent }) {
  document.title = `${t("Coming soon")} · Playpro`;
  el.innerHTML = `
    <div class="page-head"><h1>${esc(t("Coming soon"))}</h1><p class="muted">${esc(t("New seasons and new series on the services you have."))}</p></div>
    ${browseTabs("/browse/coming")}
    <div id="coming-series">${skeletonGrid(6)}</div>
    <section class="section"><div class="section-head"><h2>${esc(t("Films to stream or rent soon"))}</h2></div><div id="coming-films">${skeletonGrid(6)}</div></section>`;

  const [series, films] = await Promise.allSettled([comingSeries(), comingFilms()]);
  if (!isCurrent()) return;
  const seriesBox = el.querySelector("#coming-series");
  if (series.status === "rejected") seriesBox.innerHTML = empty(t("This didn't load"), esc(errorMessage(series.reason)));
  else if (!series.value.length) {
    seriesBox.innerHTML = empty(t("Nothing announced yet"), esc(t("Pick your streaming services in Settings, and new seasons and series on them show up here.")), `<a class="btn" href="#/settings">${esc(t("Go to Settings"))}</a>`, "sofa");
  } else seriesBox.innerHTML = byMonth(series.value, (s) => `${esc(seriesNote(s))}<br>${esc(date(s.soon, { weekday: "short", day: "numeric", month: "short" }))}`);

  el.querySelector("#coming-films").innerHTML = films.status === "rejected"
    ? empty(t("This didn't load"), esc(errorMessage(films.reason)))
    : films.value.length ? grid(films.value.map((f) => card(f, { note: esc(t("From {date}", { date: short(f.soon) })) }))) : empty(t("Nothing announced yet"), "", "", "reel");
}
