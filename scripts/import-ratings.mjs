// Weekly ratings import. GitHub Actions runs this for you (see
// .github/workflows/import-ratings.yml); you never need to run it by hand.
//
// 1. IMDb: downloads IMDb's free non-commercial ratings file and stores the
//    rating + vote count of every title with enough votes.
// 2. Rotten Tomatoes: asks Wikidata (open data, CC0) for every Tomatometer
//    score it knows, matched by IMDb id.
//
// Needs two secrets: SUPABASE_URL and SUPABASE_SERVICE_KEY (the secret /
// service_role key; it must never be put in the website itself).

import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import readline from "node:readline";

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_KEY || "";
const MIN_VOTES = Number(process.env.MIN_VOTES || 1000);
const IMDB_URL = process.env.IMDB_URL || "https://datasets.imdbws.com/title.ratings.tsv.gz";
const WIKIDATA_URL = process.env.WIKIDATA_URL || "https://query.wikidata.org/sparql";
const USER_AGENT = "PlayproRatingsImport/1.0 (private non-commercial app; https://github.com)";
const BATCH = 5000;

if (!SUPABASE_URL || !KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Add them under GitHub → Settings → Secrets and variables → Actions.");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const headers = {
  apikey: KEY,
  "Content-Type": "application/json",
  // legacy service_role keys are JWTs and also go in Authorization
  ...(KEY.startsWith("eyJ") ? { Authorization: `Bearer ${KEY}` } : {}),
};

async function rest(path, init) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...headers, ...init.headers } });
    if (res.ok) return res;
    const text = await res.text();
    if (attempt >= 4 || res.status < 500) throw new Error(`${init.method} ${path.split("?")[0]} failed: ${res.status} ${text}`);
    await sleep(2000 * attempt);
  }
}

async function upsert(table, rows) {
  for (let i = 0; i < rows.length; i += BATCH) {
    await rest(`${table}?on_conflict=imdb_id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows.slice(i, i + BATCH)),
    });
  }
}

// Removes titles that were not in this run (e.g. dropped below MIN_VOTES).
async function removeOlderThan(table, iso) {
  await rest(`${table}?updated_at=lt.${encodeURIComponent(iso)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
}

// ---------- IMDb ----------

async function importImdb(runAt) {
  const res = await fetch(IMDB_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`IMDb download failed: ${res.status}`);
  const lines = readline.createInterface({ input: Readable.fromWeb(res.body).pipe(createGunzip()), crlfDelay: Infinity });
  const rows = [];
  let header = true;
  for await (const line of lines) {
    if (header) { header = false; continue; } // tconst, averageRating, numVotes
    const [imdbId, rating, votes] = line.split("\t");
    const n = Number(votes);
    if (n >= MIN_VOTES && /^tt\d+$/.test(imdbId)) rows.push({ imdb_id: imdbId, rating: Number(rating), votes: n, updated_at: runAt });
  }
  console.log(`IMDb: ${rows.length} titles with at least ${MIN_VOTES} votes`);
  if (rows.length < 1000) throw new Error("IMDb file looks incomplete; leaving the database untouched");
  await upsert("imdb_ratings", rows);
  await removeOlderThan("imdb_ratings", runAt);
  console.log("IMDb: saved");
}

// ---------- Rotten Tomatoes via Wikidata ----------

// Every "review score" statement made by Rotten Tomatoes (Q105584) that is a
// percentage (the Tomatometer), with the item's IMDb id and RT id.
const SPARQL = `
SELECT ?imdb ?score ?date ?rank ?rt WHERE {
  ?st pq:P447 wd:Q105584 ;
      ps:P444 ?score ;
      wikibase:rank ?rank .
  FILTER(STRENDS(STR(?score), "%"))
  ?item p:P444 ?st ;
        wdt:P345 ?imdb .
  OPTIONAL { ?st pq:P585 ?date }
  OPTIONAL { ?item wdt:P1258 ?rt }
}`;

async function importRottenTomatoes(runAt) {
  const res = await fetch(WIKIDATA_URL, {
    method: "POST",
    headers: { "User-Agent": USER_AGENT, Accept: "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ query: SPARQL }),
  });
  if (!res.ok) throw new Error(`Wikidata query failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();

  const best = new Map(); // imdb id -> row
  const preferred = "http://wikiba.se/ontology#PreferredRank";
  for (const b of data.results.bindings) {
    const imdbId = b.imdb?.value;
    const score = parseInt(b.score?.value, 10);
    if (!/^tt\d+$/.test(imdbId || "") || !(score >= 0 && score <= 100)) continue;
    const row = {
      imdb_id: imdbId,
      score,
      as_of: b.date?.value ? b.date.value.slice(0, 10) : null,
      rt_id: b.rt?.value || null,
      updated_at: runAt,
      _preferred: b.rank?.value === preferred,
    };
    const old = best.get(imdbId);
    const newer = !old
      || (row._preferred && !old._preferred)
      || (row._preferred === old._preferred && (row.as_of || "") > (old.as_of || ""));
    if (newer) best.set(imdbId, row);
  }
  const rows = [...best.values()].map(({ _preferred, ...r }) => r);
  console.log(`Rotten Tomatoes: ${rows.length} titles with a Tomatometer score on Wikidata`);
  if (rows.length < 500) throw new Error("Wikidata returned very few scores; leaving the database untouched");
  await upsert("rt_scores", rows);
  await removeOlderThan("rt_scores", runAt);
  console.log("Rotten Tomatoes: saved");
}

// ---------- run ----------

const runAt = new Date().toISOString();
let failed = false;

try {
  await importImdb(runAt);
} catch (err) {
  failed = true;
  console.error(`::error::IMDb import failed: ${err.message}`);
}

try {
  await importRottenTomatoes(runAt);
} catch (err) {
  failed = true;
  console.error(`::error::Rotten Tomatoes import failed: ${err.message}`);
}

process.exit(failed ? 1 : 0);
