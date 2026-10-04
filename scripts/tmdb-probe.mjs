// Temporary research for the cinema and "coming soon" pages (removed after use).
const KEY = "ccf2943bb1806ea8b4812c2a88e67dab";
const get = async (path, params = {}) => {
  const u = new URL("https://api.themoviedb.org/3" + path);
  u.searchParams.set("api_key", KEY);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return (await fetch(u)).json();
};
const today = new Date().toISOString().slice(0, 10);
const plus = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const brief = (r) => `${r.id} ${r.title || r.name} [${r.release_date || r.first_air_date}]`;

for (const [name, path, params] of [
  ["now_playing NO", "/movie/now_playing", { region: "NO", language: "nb-NO" }],
  ["upcoming NO", "/movie/upcoming", { region: "NO", language: "nb-NO" }],
  ["discover cinema NO next 90d", "/discover/movie", { region: "NO", with_release_type: "2|3", "release_date.gte": today, "release_date.lte": plus(90), sort_by: "primary_release_date.asc", language: "nb-NO" }],
  ["discover cinema NO last 35d", "/discover/movie", { region: "NO", with_release_type: "2|3", "release_date.gte": plus(-35), "release_date.lte": today, sort_by: "popularity.desc", language: "nb-NO" }],
  ["discover digital NO next 60d", "/discover/movie", { region: "NO", with_release_type: "4", "release_date.gte": today, "release_date.lte": plus(60), sort_by: "popularity.desc" }],
  ["movie netflix NO future", "/discover/movie", { watch_region: "NO", with_watch_providers: "8", "primary_release_date.gte": today }],
  ["tv netflix network airing 60d", "/discover/tv", { with_networks: "213", "air_date.gte": today, "air_date.lte": plus(60), sort_by: "popularity.desc" }],
  ["tv providers 8|1899 airing 60d", "/discover/tv", { watch_region: "NO", with_watch_providers: "8|1899", with_watch_monetization_types: "flatrate", "air_date.gte": today, "air_date.lte": plus(60), sort_by: "popularity.desc" }],
  ["tv new on netflix network", "/discover/tv", { with_networks: "213", "first_air_date.gte": today, "first_air_date.lte": plus(90), sort_by: "popularity.desc" }],
]) {
  const d = await get(path, params);
  console.log(`\n${name}: total ${d.total_results}, pages ${d.total_pages}, dates ${JSON.stringify(d.dates || "")}`);
  console.log("  " + (d.results || []).slice(0, 8).map(brief).join(" | "));
  if (name === "upcoming NO" || name === "discover cinema NO next 90d") {
    for (const r of (d.results || []).slice(0, 4)) {
      const rd = await get(`/movie/${r.id}/release_dates`);
      const no = rd.results?.find((x) => x.iso_3166_1 === "NO");
      console.log(`    ${r.title}: NO dates ${JSON.stringify(no?.release_dates?.map((x) => [x.type, x.release_date.slice(0, 10), x.note]))}`);
    }
  }
}

// TV networks of Norwegian streaming services (from well-known shows)
for (const q of ["Skam", "Exit", "Heimebane", "Rådebank", "Neon", "Wisting", "Ragnarok", "Shōgun", "The Last of Us", "Severance", "The Boys", "Beforeigners", "Lykkeland", "Okkupert"]) {
  const s = await get("/search/tv", { query: q });
  const id = s.results?.[0]?.id;
  if (!id) continue;
  const d = await get(`/tv/${id}`, {});
  console.log(`network: ${d.name}: ${d.networks?.map((n) => `${n.id} ${n.name} (${n.origin_country})`).join(", ")}; next ep ${JSON.stringify(d.next_episode_to_air && { s: d.next_episode_to_air.season_number, e: d.next_episode_to_air.episode_number, d: d.next_episode_to_air.air_date })}`);
}
const prov = await get("/watch/providers/tv", { watch_region: "NO" });
console.log("\nNO tv providers:", prov.results?.slice(0, 30).map((p) => `${p.provider_id} ${p.provider_name}`).join(", "));

// Cinema showtime sites: what answers?
for (const url of ["https://www.filmweb.no/", "https://www.filmweb.no/sok/?q=dune", "https://www.filmweb.no/search?q=dune", "https://www.filmweb.no/kinoprogram/", "https://www.nfkino.no/", "https://www.odeonkino.no/", "https://www.kino.no/", "https://www.oslokino.no/"]) {
  try {
    const r = await fetch(url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0" } });
    const html = await r.text();
    const title = html.match(/<title[^>]*>([^<]*)/i)?.[1]?.trim();
    const forms = [...html.matchAll(/<form[^>]*action="([^"]*)"[^>]*>/gi)].map((m) => m[1]).slice(0, 4);
    const searchy = [...new Set([...html.matchAll(/href="([^"]*(?:sok|search|film\/|movie|kinoprogram)[^"]*)"/gi)].map((m) => m[1]))].slice(0, 8);
    console.log(`\n${url} -> ${r.status} ${r.url}\n  title: ${title}\n  forms: ${forms.join(" ")}\n  links: ${searchy.join(" ")}`);
  } catch (e) { console.log(`\n${url} -> ERROR ${e.message}`); }
}
