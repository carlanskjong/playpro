// Temporary: the app's search with Norwegian titles in English mode (removed after use).
const { findTitles } = await import("../js/features/search/find.js");
for (const q of ["Ringens brorskapp", "Ringens brorskap", "Haisomer", "arlinton road", "the godfathr"]) {
  const r = await findTitles(q, 1);
  console.log(`"${q}" -> note=${r.note || "-"}:`, r.items.slice(0, 3).map((i) => `${i.title} (${i.year})`).join(" | ") || "NOTHING");
}
