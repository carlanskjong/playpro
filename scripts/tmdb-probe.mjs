// Temporary: runs the app's own search code against the real TMDB (removed after use).
const { findTitles } = await import("../js/features/search/find.js");
for (const q of ["Arlington road", "Arlington road 1999", "arlinton road", "arlington raod", "Arlingtn Road", "the godfathr", "intersteller", "shogun", "Skam", "zzzqqq"]) {
  const t0 = Date.now();
  const r = await findTitles(q, 1);
  console.log(`"${q}" -> note=${r.note || "-"} ${Date.now() - t0}ms:`, r.items.slice(0, 4).map((i) => `${i.title} (${i.year})`).join(" | ") || "NOTHING");
}
