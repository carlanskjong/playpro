// Temporary: how TMDB answers shortened words (removed after use).
const KEY = "ccf2943bb1806ea8b4812c2a88e67dab";
const get = async (path, params) => {
  const u = new URL("https://api.themoviedb.org/3" + path);
  u.searchParams.set("api_key", KEY);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return (await fetch(u)).json();
};
for (const query of ["arlinton", "arlinto", "arlint", "arlin", "arli", "arling", "arlinton r", "arlinton road"]) {
  for (const path of ["/search/multi", "/search/movie"]) {
    const d = await get(path, { query, include_adult: "false", language: "nb-NO" });
    const res = d.results || [];
    const pos = res.findIndex((r) => r.id === 1073);
    console.log(`${path} "${query}": total ${d.total_results}, Arlington Road at ${pos}; first: ${res.slice(0, 5).map((r) => r.title || r.name).join(" | ")}`);
  }
}
