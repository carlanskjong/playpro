// FEATURE: Cinema
//  - Browse → Cinema: films showing in Norwegian cinemas now, and a calendar of premieres
//  - "Coming to cinemas in Norway" on the home screen
//  - on a film's page: when it's in Norwegian cinemas, and a link to showtimes and tickets
import { register, lazy } from "../../core/registry.js";
import { basics, pickRelease, day } from "../../lib/tmdb.js";
import { esc, row, card, icon } from "../../lib/ui.js";
import { t, date, lang } from "../../lib/i18n.js";
import { COUNTRY } from "../streaming/shared.js";
import { comingSoon, filmwebLink } from "./data.js";

const short = (iso) => date(iso, { day: "numeric", month: "short" });
const long = (iso) => date(iso, { weekday: "long", day: "numeric", month: "long" });

const cinemaRow = {
  order: 75,
  render: async () => {
    const items = (await comingSoon(1)).slice(0, 20);
    const cards = items.map((i) => card(i, { note: esc(t("In cinemas {date}", { date: short(i.premiere) })) }));
    return row(t("Coming to cinemas in Norway"), cards, { more: "#/browse/cinema" });
  },
};

// On a film's page, from six weeks before it opens until two months after.
const atTheCinema = {
  order: 9,
  render: async ({ type, id, data }) => {
    if (type !== "movie") return "";
    const premiere = pickRelease(data.release_dates, COUNTRY);
    if (!premiere || premiere < day(-60) || premiere > day(240)) return "";
    // Filmweb uses the Norwegian title
    const norwegian = lang === "nb" ? data.title : (await basics("movie", id, "nb-NO").catch(() => null))?.title || data.title;
    const when = premiere > day(0)
      ? t("Opens in Norwegian cinemas on {date}.", { date: long(premiere) })
      : t("In Norwegian cinemas since {date}.", { date: long(premiere) });
    return `
      <div class="section-head"><h2>${esc(t("At the cinema"))}</h2></div>
      <p>${esc(when)}</p>
      <p><a class="btn" href="${esc(filmwebLink(norwegian))}" target="_blank" rel="noopener">${icon.ticket}${esc(t("Showtimes and tickets"))}</a></p>
      <p class="muted small">${esc(t("Opens Filmweb, which sells tickets for most cinemas in Norway."))}</p>`;
  },
};

register({
  id: "cinema",
  routes: [{ path: /^\/browse\/cinema$/, view: lazy(() => import("./page.js")) }],
  homeRows: [cinemaRow],
  titleSections: [atTheCinema],
});
