// Films in Norwegian cinemas, with the day each one opens in Norway.
import { releasesIn, releaseDate, sixAtATime, day } from "../../lib/tmdb.js";
import { COUNTRY } from "../streaming/shared.js";

async function withPremiere(items) {
  const dates = await sixAtATime(items, (i) => releaseDate(i.id, COUNTRY));
  return items.map((item, k) => ({ ...item, premiere: dates[k] || item.date }));
}

// Opened in the last six weeks, most popular first.
export async function showingNow() {
  return (await withPremiere(await releasesIn(COUNTRY, "cinema", day(-42), day(0))))
    .filter((i) => i.premiere <= day(0));
}

// Opening in the next four months, soonest first.
export async function comingSoon(pages = 3) {
  const items = await withPremiere(await releasesIn(COUNTRY, "cinema", day(1), day(120), "primary_release_date.asc", pages));
  return items.filter((i) => i.premiere > day(0)).sort((a, b) => a.premiere.localeCompare(b.premiere));
}

// Filmweb sells tickets for most cinemas in Norway and lists every showing.
export const filmwebLink = (title) => `https://www.filmweb.no/sok?q=${encodeURIComponent(title)}`;
