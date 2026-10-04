// Temporary: the app's search with Norwegian titles in English mode (removed after use).
const { findTitles } = await import("../js/features/search/find.js");
for (const q of ["Haisommer", "Haisomer", "Okkupert", "Okupert", "Ringens brorskapp", "kampen om tungvannet", "Løvenes konge", "Glemselens øy", "Arlington road", "arlinton road"]) {
  const r = await findTitles(q, 1);
  console.log(`"${q}" -> note=${r.note || "-"}:`, r.items.slice(0, 3).map((i) => `${i.title} (${i.year})`).join(" | ") || "NOTHING");
}
