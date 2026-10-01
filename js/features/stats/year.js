// Page #/stats: your year in movies and series.
import { state } from "../../lib/state.js";
import { loadMyEntries } from "../../lib/db.js";
import { basics } from "../../lib/tmdb.js";
import { esc, empty, card, entryToItem } from "../../lib/ui.js";
import { t, num, locale, plural } from "../../lib/i18n.js";

// Look up runtime and genres, six titles at a time.
async function details(entries) {
  const out = new Array(entries.length);
  let next = 0;
  const worker = async () => {
    while (next < entries.length) {
      const k = next++;
      out[k] = await basics(entries[k].media_type, entries[k].tmdb_id).catch(() => null);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return out;
}

// Column chart: titles per month. One series, so no legend; the heading names it.
function monthChart(counts, year) {
  const W = 336, H = 168, left = 26, bottom = 22, top = 18;
  const max = Math.max(1, ...counts);
  const step = max <= 4 ? 1 : max <= 10 ? 2 : Math.ceil(max / 4);
  const ticks = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  const y = (v) => top + (H - top - bottom) * (1 - v / ticks.at(-1));
  const band = (W - left) / 12;
  const bar = Math.min(16, band - 6);
  const months = Array.from({ length: 12 }, (_, m) => new Date(year, m, 1).toLocaleDateString(locale, { month: "short" }).replace(".", ""));
  const peak = counts.indexOf(Math.max(...counts));
  const bars = counts.map((c, m) => {
    const x = left + band * m + (band - bar) / 2;
    const h = H - bottom - y(c);
    const r = Math.min(4, h); // rounded data end, square at the baseline
    const label = t(c === 1 ? "{month}: 1 title" : "{month}: {n} titles", { month: months[m], n: c });
    return `
      <g class="bar" tabindex="0" role="img" aria-label="${esc(label)}" data-tip="${esc(label)}">
        <rect class="hit" x="${left + band * m}" y="${top}" width="${band}" height="${H - bottom - top}" fill="transparent"/>
        ${c ? `<path d="M${x},${H - bottom} v${-(h - r)} q0,${-r} ${r},${-r} h${bar - 2 * r} q${r},0 ${r},${r} v${h - r} z" fill="var(--chart)"/>` : ""}
        ${m === peak && c ? `<text x="${x + bar / 2}" y="${y(c) - 6}" text-anchor="middle" class="chart-value">${c}</text>` : ""}
        <text x="${left + band * m + band / 2}" y="${H - 6}" text-anchor="middle" class="chart-axis">${esc(months[m].slice(0, 3))}</text>
      </g>`;
  }).join("");
  const grid = ticks.map((v) => `
    <line x1="${left}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="chart-grid"/>
    <text x="${left - 6}" y="${y(v) + 4}" text-anchor="end" class="chart-axis">${v}</text>`).join("");
  return `
    <figure class="chart">
      <svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(t("Titles watched per month"))}">${grid}${bars}</svg>
      <div class="chart-tip" role="status" hidden></div>
      <details class="chart-table"><summary>${esc(t("Show as a table"))}</summary>
        <table><thead><tr><th>${esc(t("Month"))}</th><th>${esc(t("Titles"))}</th></tr></thead>
        <tbody>${counts.map((c, m) => `<tr><td>${esc(months[m])}</td><td>${c}</td></tr>`).join("")}</tbody></table>
      </details>
    </figure>`;
}

function wireTooltip(figure) {
  const tip = figure.querySelector(".chart-tip");
  const show = (g) => {
    tip.textContent = g.dataset.tip;
    tip.hidden = false;
    const box = g.querySelector(".hit").getBoundingClientRect();
    const fig = figure.getBoundingClientRect();
    tip.style.left = `${Math.min(fig.width - 120, Math.max(0, box.left - fig.left + box.width / 2 - 60))}px`;
  };
  figure.querySelectorAll(".bar").forEach((g) => {
    g.addEventListener("pointerenter", () => show(g));
    g.addEventListener("focus", () => show(g));
    g.addEventListener("pointerleave", () => (tip.hidden = true));
    g.addEventListener("blur", () => (tip.hidden = true));
  });
}

export default async function yearView({ el, query, isCurrent }) {
  document.title = `${t("Your year")} · Playpro`;
  if (!state.entries.size) await loadMyEntries();
  const seen = [...state.entries.values()].filter((e) => e.status === "seen" && (e.watched_at || e.updated_at));
  const when = (e) => new Date(e.watched_at || e.updated_at);
  const years = [...new Set(seen.map((e) => when(e).getFullYear()))].sort((a, b) => b - a);
  const year = Number(query.get("year")) || years[0] || new Date().getFullYear();
  const list = seen.filter((e) => when(e).getFullYear() === year);

  const head = `
    <div class="page-head">
      <a class="back" href="#/list">${esc(t("My list"))}</a>
      <h1>${esc(t("Your {year}", { year }))}</h1>
      ${years.length > 1 ? `<div class="segmented">${years.map((y) => `<a href="#/stats?year=${y}" aria-selected="${y === year}">${y}</a>`).join("")}</div>` : ""}
    </div>`;
  if (!list.length) {
    el.innerHTML = head + empty(t("Nothing watched yet this year"), esc(t("Rate what you watch, and your year fills up here.")), "", "reel");
    return;
  }
  el.innerHTML = head + `<p class="year-sentence skeleton line"></p>`;

  const info = await details(list);
  if (!isCurrent()) return;
  const movies = list.filter((e) => e.media_type === "movie");
  const series = list.length - movies.length;
  const minutes = list.reduce((sum, e, k) => sum + (e.media_type === "movie" ? info[k]?.runtime || 0 : 0), 0);
  const rated = list.filter((e) => e.rating);
  const average = rated.length ? rated.reduce((s, e) => s + e.rating, 0) / rated.length : 0;
  const genreCount = new Map();
  info.forEach((d) => (d?.genres || []).forEach((g) => genreCount.set(g.name, (genreCount.get(g.name) || 0) + 1)));
  const topGenres = [...genreCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const months = Array(12).fill(0);
  list.forEach((e) => months[when(e).getMonth()]++);
  const favourites = rated.sort((a, b) => b.rating - a.rating).slice(0, 10);

  el.innerHTML = head + `
    <p class="year-sentence">${t("You watched {titles}: {movies} and {series}.", {
      titles: `<strong>${esc(plural(list.length, "{n} title", "{n} titles"))}</strong>`,
      movies: esc(plural(movies.length, "{n} movie", "{n} movies")),
      series: esc(plural(series, "1 series", "{n} series")),
    })} ${minutes ? t("That's {hours} of film.", { hours: `<strong>${esc(plural(Math.round(minutes / 60), "{n} hour", "{n} hours"))}</strong>` }) : ""}
    ${average ? t("Your average rating was {avg}.", { avg: `<strong>${num(average)}</strong>` }) : ""}</p>

    <section class="section">
      <div class="section-head"><h2>${esc(t("Titles watched per month"))}</h2></div>
      ${monthChart(months, year)}
    </section>

    ${topGenres.length ? `
    <section class="section">
      <div class="section-head"><h2>${esc(t("Your genres"))}</h2></div>
      <ol class="genre-list">${topGenres.map(([name, n]) => `<li><span>${esc(name)}</span><span class="muted">${esc(plural(n, "{n} title", "{n} titles"))}</span></li>`).join("")}</ol>
    </section>` : ""}

    ${favourites.length ? `
    <section class="section">
      <div class="section-head"><h2>${esc(t("Your favourites"))}</h2></div>
      <div class="scroller">${favourites.map((e) => card(entryToItem(e), { note: esc(t("You gave it {n}", { n: e.rating })) })).join("")}</div>
    </section>` : ""}`;
  wireTooltip(el.querySelector(".chart"));
}
