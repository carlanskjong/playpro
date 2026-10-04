// What's coming to your streaming services: new seasons of series you can
// already watch there, and new series from those services. Films only come
// with a date for "stream or rent", because TMDB doesn't know which service
// a film will land on before it's there.
import { discoverAll, seriesNext, releasesIn, releaseDate, sixAtATime, day } from "../../lib/tmdb.js";
import { COUNTRY, myServices, availability } from "../streaming/shared.js";

const WINDOW = 90; // days ahead

// The TV channels / studios behind each Norwegian streaming service (TMDB ids),
// so brand-new series show up before TMDB knows where they stream.
const NETWORKS = {
  8: { networks: [213], name: "Netflix" },
  119: { networks: [1024], name: "Prime Video" },
  350: { networks: [2552], name: "Apple TV" },
  337: { networks: [2739], name: "Disney+" },
  1899: { networks: [49, 3186], name: "HBO Max" },
  76: { networks: [2406], name: "Viaplay" },
  442: { networks: [379, 843], name: "NRK TV" },
  431: { networks: [467], name: "TV 2 Play" },
};

export async function comingSeries() {
  const services = myServices();
  if (!services.length) return [];
  const networks = services.flatMap((s) => NETWORKS[s]?.networks || []);
  const [onServices, fromNetworks] = await Promise.all([
    discoverAll("tv", { watch_region: COUNTRY, with_watch_providers: services.join("|"), with_watch_monetization_types: "flatrate|free|ads", "air_date.gte": day(1), "air_date.lte": day(WINDOW), sort_by: "popularity.desc" }, 2),
    networks.length ? discoverAll("tv", { with_networks: networks.join("|"), "first_air_date.gte": day(1), "first_air_date.lte": day(WINDOW), sort_by: "popularity.desc" }, 1) : [],
  ]);
  const seen = new Set();
  const candidates = [...onServices, ...fromNetworks].filter((i) => !seen.has(i.id) && seen.add(i.id)).slice(0, 40);
  const details = await sixAtATime(candidates, (i) => seriesNext(i.id));

  const out = [];
  candidates.forEach((item, k) => {
    const d = details[k];
    if (!d) return;
    const next = d.next_episode_to_air;
    let when = null;
    if (d.first_air_date > day(0) && d.first_air_date <= day(WINDOW)) when = { date: d.first_air_date, season: 0 };
    else if (next?.episode_number === 1 && next.air_date > day(0) && next.air_date <= day(WINDOW)) when = { date: next.air_date, season: next.season_number };
    if (!when) return; // a series that's just carrying on with its weekly episodes
    const streams = availability(d["watch/providers"]?.results)?.stream || [];
    const service = streams.find((p) => services.includes(p.provider_id))?.provider_name
      || services.map((s) => NETWORKS[s]).find((n) => n && d.networks?.some((x) => n.networks.includes(x.id)))?.name;
    if (!service) return;
    out.push({ ...item, soon: when.date, season: when.season, service });
  });
  return out.sort((a, b) => a.soon.localeCompare(b.soon));
}

// Films coming to stream or rent in Norway in the next two months.
export async function comingFilms() {
  const items = await releasesIn(COUNTRY, "digital", day(1), day(60), "popularity.desc", 1);
  const dates = await sixAtATime(items, (i) => releaseDate(i.id, COUNTRY, "digital"));
  return items.map((item, k) => ({ ...item, soon: dates[k] || "" }))
    .filter((i) => i.soon > day(0))
    .sort((a, b) => a.soon.localeCompare(b.soon));
}
