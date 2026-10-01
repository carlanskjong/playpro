// Every text wrapped in t("…") or plural(n, "…", "…") must have a Norwegian
// version in js/lib/nb.js. Prints the missing ones (or the unused ones with
// --unused) so they're easy to add.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../js", import.meta.url).pathname;
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === "vendor" || name === "nb.js") continue;
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith(".js")) files.push(path);
  }
})(root);

const str = String.raw`"((?:[^"\\]|\\.)*)"`;
const patterns = [
  new RegExp(String.raw`\bt\(\s*${str}`, "g"),                                   // t("…")
  new RegExp(String.raw`\bt\([^"()]{1,40}\?\s*${str}\s*:\s*${str}`, "g"),         // t(n === 1 ? "…" : "…")
  new RegExp(String.raw`\bplural\([^,]+,\s*${str},\s*${str}`, "g"),               // plural(n, "…", "…")
];
const used = new Set();
for (const file of files) {
  const src = readFileSync(file, "utf8").replace(/^\s*\/\/.*$/gm, ""); // skip comment lines
  for (const re of patterns) for (const m of src.matchAll(re)) m.slice(1).filter(Boolean).forEach((s) => used.add(JSON.parse(`"${s}"`)));
}

const nb = (await import(new URL("../js/lib/nb.js", import.meta.url))).default;
const missing = [...used].filter((k) => !(k in nb)).sort();
const unused = Object.keys(nb).filter((k) => !used.has(k)).sort();
const badVars = Object.entries(nb).filter(([en, no]) => (en.match(/\{\w+\}/g) || []).sort().join() !== (no.match(/\{\w+\}/g) || []).sort().join());

if (process.argv.includes("--unused")) console.log(unused.join("\n"));
if (process.argv.includes("--missing")) console.log(JSON.stringify(missing, null, 1));
console.log(`${used.size} texts, ${missing.length} missing Norwegian, ${unused.length} unused, ${badVars.length} with mismatched {placeholders}`);
for (const [en] of badVars) console.log("  placeholders differ:", en);
process.exit(missing.length || badVars.length ? 1 : 0);
