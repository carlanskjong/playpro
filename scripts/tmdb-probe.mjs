// Temporary: shows what TMDB search returns for one query (removed after use).
const KEY = "ccf2943bb1806ea8b4812c2a88e67dab";
const get = async (path, params) => {
  const u = new URL("https://api.themoviedb.org/3" + path);
  u.searchParams.set("api_key", KEY);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u);
  return r.json();
};
for (const language of ["en-US", "nb-NO"]) {
  for (const query of ["Arlington road", "Arlington Road", "arlington"]) {
    const d = await get("/search/multi", { query, language, include_adult: "false", page: 1 });
    console.log(`\nmulti ${language} "${query}": total ${d.total_results}, pages ${d.total_pages}`);
    for (const r of d.results || []) console.log("  ", r.media_type, r.id, JSON.stringify(r.title || r.name), r.release_date || r.first_air_date || "", r.adult ? "ADULT" : "");
  }
  const m = await get("/search/movie", { query: "Arlington road", language, include_adult: "false" });
  console.log(`\nmovie ${language}: total ${m.total_results}`, (m.results || []).slice(0, 5).map((r) => `${r.id} ${r.title} ${r.release_date}`));
}
const f = await get("/find/tt0137363", { external_source: "imdb_id", language: "nb-NO" });
console.log("\nfind tt0137363:", JSON.stringify(f.movie_results?.map((r) => ({ id: r.id, title: r.title, original: r.original_title, adult: r.adult, date: r.release_date }))));
const id = f.movie_results?.[0]?.id;
if (id) {
  const det = await get(`/movie/${id}`, { language: "nb-NO", append_to_response: "alternative_titles,translations" });
  console.log("details:", JSON.stringify({ title: det.title, original: det.original_title, adult: det.adult, status: det.status, popularity: det.popularity, votes: det.vote_count, alt: det.alternative_titles?.titles?.slice(0, 10), nb: det.translations?.translations?.filter((t) => t.iso_639_1 === "nb" || t.iso_639_1 === "no").map((t) => t.data) }));
}
