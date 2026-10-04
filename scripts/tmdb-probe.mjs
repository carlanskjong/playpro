// Temporary: shows what TMDB returns for a few searches (removed after use).
const KEY = "ccf2943bb1806ea8b4812c2a88e67dab";
const get = async (path, params) => {
  const u = new URL("https://api.themoviedb.org/3" + path);
  u.searchParams.set("api_key", KEY);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u);
  return { status: r.status, body: await r.json() };
};
for (const query of ["Arlington road 1999", "Arlington road (1999)", "Arlington Rd", "Arlington roa", "arlinton road", "Arlington road "]) {
  const { body: d } = await get("/search/multi", { query, language: "nb-NO", include_adult: "false" });
  console.log(`multi "${query}": total ${d.total_results}:`, (d.results || []).slice(0, 4).map((r) => `${r.media_type} ${r.id} ${r.title || r.name}`).join(" | "));
}
for (const language of ["nb-NO", "en-US"]) {
  const { status, body } = await get("/movie/1073", { language, append_to_response: "credits,watch/providers,recommendations,videos,external_ids" });
  console.log(`\nDETAILS ${language} status ${status}`);
  if (language === "nb-NO") {
    body.credits.crew = body.credits.crew.slice(0, 5);
    console.log("JSON:" + JSON.stringify(body));
  }
}
