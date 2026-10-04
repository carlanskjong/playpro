// Temporary: does TMDB search find titles across languages? (removed after use)
const KEY = "ccf2943bb1806ea8b4812c2a88e67dab";
const get = async (path, params) => {
  const u = new URL("https://api.themoviedb.org/3" + path);
  u.searchParams.set("api_key", KEY);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return (await fetch(u)).json();
};
const queries = ["Ringenes herre", "Hjem alene", "Skjønnheten og udyret", "Frost", "Løvenes konge", "Glemselens øy", "Kampen om tungtvannet", "Nøtteknekkeren", "Ringenes herre: Atter en konge", "Haisommer", "The Lord of the Rings", "Home Alone", "The Heavy Water War", "Okkupert", "Occupied"];
for (const query of queries) {
  for (const language of ["en-US", "nb-NO"]) {
    const d = await get("/search/multi", { query, language, include_adult: "false" });
    const top = (d.results || []).filter((r) => r.media_type !== "person").slice(0, 3).map((r) => `${r.title || r.name} (${(r.release_date || r.first_air_date || "").slice(0, 4)}) [orig: ${r.original_title || r.original_name}]`);
    console.log(`${language} "${query}": ${d.total_results} -> ${top.join(" | ") || "NOTHING"}`);
  }
}
