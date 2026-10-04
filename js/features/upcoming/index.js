// FEATURE: Coming up
//  - Browse → Coming soon: new seasons and series coming to your services, and films to stream or rent
//  - "Coming to your services" and "Newest on your services" rows on the home screen
import { register, lazy } from "../../core/registry.js";
import { discover } from "../../lib/tmdb.js";
import { esc, row, card } from "../../lib/ui.js";
import { t, date } from "../../lib/i18n.js";
import { COUNTRY, myServices } from "../streaming/shared.js";
import { comingSeries } from "./soon.js";

const comingRow = {
  order: 36,
  render: async () => {
    const items = (await comingSeries()).slice(0, 16);
    const cards = items.map((s) => card(s, {
      note: esc(s.season
        ? t("Season {n}, {date}", { n: s.season, date: date(s.soon, { day: "numeric", month: "short" }) })
        : t("New, {date}", { date: date(s.soon, { day: "numeric", month: "short" }) })),
    }));
    return row(t("Coming to your services"), cards, { more: "#/browse/coming" });
  },
};

const newestRow = {
  order: 35,
  render: async () => {
    const services = myServices();
    if (!services.length) return "";
    const [movies, series] = await Promise.all([
      discover("movie", { providers: services, region: COUNTRY, sort: "primary_release_date.desc", minVotes: 10 }),
      discover("tv", { providers: services, region: COUNTRY, sort: "first_air_date.desc", minVotes: 10 }),
    ]);
    const items = [...movies.items.slice(0, 10), ...series.items.slice(0, 10)].sort((a, b) => b.date.localeCompare(a.date));
    return row(t("Newest on your services"), items, { more: "#/browse?sort=primary_release_date.desc" });
  },
};

register({
  id: "upcoming",
  routes: [{ path: /^\/browse\/coming$/, view: lazy(() => import("./coming.js")) }],
  homeRows: [newestRow, comingRow],
});
