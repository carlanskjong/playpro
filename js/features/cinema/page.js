// Page #/browse/cinema: what's on in Norwegian cinemas now, and a calendar
// of premieres for the next four months.
import { showingNow, comingSoon } from "./data.js";
import { browseTabs } from "../streaming/shared.js";
import { esc, card, grid, skeletonGrid, empty, errorMessage } from "../../lib/ui.js";
import { t, date } from "../../lib/i18n.js";

const short = (iso) => date(iso, { day: "numeric", month: "short" });

// Premieres grouped by month, soonest first, each card with its day.
function calendar(items) {
  const months = new Map();
  for (const item of items) {
    const month = item.premiere.slice(0, 7);
    months.set(month, [...(months.get(month) || []), item]);
  }
  return [...months].map(([month, films]) => `
    <section class="premiere-month">
      <h3 class="month-head"><time datetime="${month}">${esc(date(`${month}-01`, { month: "long", year: "numeric" }))}</time></h3>
      ${grid(films.map((f) => card(f, { note: esc(date(f.premiere, { weekday: "short", day: "numeric", month: "short" })) })))}
    </section>`).join("");
}

export default async function cinemaView({ el, isCurrent }) {
  document.title = `${t("Cinema")} · Playpro`;
  el.innerHTML = `
    <div class="page-head"><h1>${esc(t("Cinema"))}</h1><p class="muted">${esc(t("Films in Norwegian cinemas now, and the ones opening soon."))}</p></div>
    ${browseTabs("/browse/cinema")}
    <section class="section"><div class="section-head"><h2>${esc(t("Showing now"))}</h2></div><div id="cinema-now">${skeletonGrid(6)}</div></section>
    <section class="section"><div class="section-head"><h2>${esc(t("Coming soon"))}</h2></div><div id="cinema-soon">${skeletonGrid(6)}</div></section>
    <p class="muted small cinema-note">${esc(t("Open a film to find showtimes and tickets on Filmweb, which sells tickets for most cinemas in Norway."))}</p>`;

  const [now, soon] = await Promise.allSettled([showingNow(), comingSoon()]);
  if (!isCurrent()) return;
  const box = (id, result, html, nothing) => {
    el.querySelector(id).innerHTML = result.status === "rejected"
      ? empty(t("This didn't load"), esc(errorMessage(result.reason)))
      : result.value.length ? html(result.value) : empty(nothing, "", "", "ticket");
  };
  box("#cinema-now", now, (items) => `<div class="scroller">${items.map((f) => card(f, { note: esc(t("Since {date}", { date: short(f.premiere) })) })).join("")}</div>`, t("Nothing listed for Norwegian cinemas right now"));
  box("#cinema-soon", soon, calendar, t("No premieres listed yet"));
}
