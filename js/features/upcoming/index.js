// FEATURE: Coming up
//  - movies coming to Norwegian cinemas soon (with the premiere date)
//  - the newest titles on your streaming services
import { register } from "../../core/registry.js";
import { upcoming, discover } from "../../lib/tmdb.js";
import { esc, row, card } from "../../lib/ui.js";
import { t, date } from "../../lib/i18n.js";
import { COUNTRY, myServices } from "../streaming/shared.js";

const cinemaRow = {
  order: 75,
  render: async () => {
    const items = (await upcoming(COUNTRY)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 20);
    const cards = items.map((i) => card(i, { note: esc(t("In cinemas {date}", { date: date(i.date, { day: "numeric", month: "short" }) })) }));
    return row(t("Coming to cinemas in Norway"), cards);
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
  homeRows: [newestRow, cinemaRow],
});
