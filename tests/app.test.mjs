// Opens the real app in a headless browser with the demo's fake backend
// (demo/mock.js), clicks through every page and the main actions, and fails
// on any error or anything that makes a page wider than a phone screen.
// Screenshots land in test-results/ for a quick look.
import { chromium } from "playwright";
import { build } from "esbuild";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const out = join(root, "test-results");
await mkdir(out, { recursive: true });

// --- serve the app folder ---
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  try {
    const file = join(root, path.endsWith("/") ? path + "index.html" : path);
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(await readFile(file));
  } catch { res.writeHead(404).end(); }
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

// --- the fake backend, injected before the app starts ---
const mock = (await build({ entryPoints: [join(root, "demo/mock.js")], bundle: true, format: "iife", write: false, globalName: "__mock" })).outputFiles[0].text;
const config = await readFile(join(root, "js/config.js"), "utf8");
const ref = (config.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/) || [, "demo"])[1];

const browser = await chromium.launch();
let failures = 0;
const fail = (msg) => { failures++; console.log("  FAIL ", msg); };
const pass = (msg) => console.log("  ok   ", msg);

async function open({ width = 390, lang = "en", username = "" } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 2, isMobile: width < 600, hasTouch: width < 600 });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
  await context.addInitScript(({ mock, ref, lang, username }) => {
    globalThis.__playproMockDelay = 20;
    if (username) globalThis.__playproMockUsername = username;
    const now = Math.floor(Date.now() / 1000);
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({
      access_token: "demo.eyJzdWIiOiJkZW1vIn0.demo", token_type: "bearer", expires_in: 360000, expires_at: now + 360000,
      refresh_token: "demo", user: { id: "00000000-0000-4000-8000-000000000001", email: "carl@example.com", aud: "authenticated", role: "authenticated" },
    }));
    if (!localStorage.getItem("playpro:lang")) localStorage.setItem("playpro:lang", lang); // keep a language the app switched to
    // pretend the watchlist was checked before, so "new on your services" can show
    if (!localStorage.getItem("playpro:streaming-known")) localStorage.setItem("playpro:streaming-known", "[]");
    (0, eval)(mock);
  }, { mock, ref, lang, username });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  return { context, page, errors };
}

async function visit(page, hash, waitFor) {
  await page.goto(base + "#" + hash);
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 8000 });
  await page.waitForTimeout(400);
}

async function fitsScreen(page, name) {
  const wide = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (!r.width || r.right <= vw + 1) continue;
      let p = el.parentElement, inside = false;
      while (p && p !== document.body) { if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX) && p.getBoundingClientRect().right <= vw + 1) { inside = true; break; } p = p.parentElement; }
      if (!inside) bad.push(`${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`);
    }
    return bad.slice(0, 3);
  });
  if (wide.length) fail(`${name}: wider than the screen (${wide.join(", ")})`);
}


if (process.argv[2] === "look") {
  const shots = process.argv.slice(3);
  const { page, context } = await open({ width: Number(process.env.W || 390), lang: process.env.LANG_UI || "en" });
  for (const spec of shots) {
    const [hash, y = "0"] = spec.split("@");
    await page.goto(base + "#" + hash);
    await page.waitForTimeout(1600);
    await page.evaluate((y) => window.scrollTo(0, Number(y)), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(out, `look${hash.replace(/[^a-z0-9]+/gi, "-")}-${y}.png`) });
  }
  await context.close(); await browser.close(); server.close(); process.exit(0);
}

// ---------- phone: every page ----------
console.log("Phone pages");
{
  const { page, errors, context } = await open();
  const pages = [
    ["/", ".ticket"], ["/movie/693134", ".title-name"], ["/tv/64439", ".title-name"], ["/browse", ".grid"],
    ["/browse/cinema", "#cinema-soon .premiere-month"], ["/browse/coming", "#coming-series .premiere-month"], ["/movie/900001", ".title-name"],
    ["/search?q=dune", ".grid"], ["/list", ".grid"], ["/list?tab=seen", ".grid"], ["/lists", ".list-grid"],
    ["/stats", ".chart"], ["/friends", ".feed"], ["/u/anna", ".grid"], ["/settings", ".services"],
    ["/privacy", ".prose"], ["/about", ".prose"],
  ];
  for (const [hash, sel] of pages) {
    try {
      await visit(page, hash, sel);
      await fitsScreen(page, hash);
      await page.screenshot({ path: join(out, `phone${hash.replace(/[^a-z0-9]+/gi, "-")}.png`), fullPage: hash === "/" || hash.startsWith("/movie") || hash.startsWith("/browse/") });
      pass(hash);
    } catch (err) { fail(`${hash}: ${err.message.split("\n")[0]}`); }
  }
  if (errors.length) fail("errors: " + [...new Set(errors)].join(" | "));
  await context.close();
}

// ---------- phone: actions ----------
console.log("Actions");
{
  const { page, errors, context } = await open();
  const step = async (name, fn) => { try { await fn(); pass(name); } catch (err) { fail(`${name}: ${err.message.split("\n")[0]}`); } };

  await visit(page, "/", ".ticket");
  await step("tonight: another one", async () => {
    const first = await page.textContent(".ticket-title");
    await page.click("#another");
    await page.waitForTimeout(500);
    if ((await page.textContent(".ticket-title")) === first) throw new Error("same title after Another one");
  });
  await step("new on your services", async () => { await page.waitForSelector(".news .card", { timeout: 4000 }); });

  await visit(page, "/movie/693134", ".title-name");
  await step("IMDb and RT chips", async () => {
    await page.waitForSelector(".chip-imdb small", { timeout: 4000 });
    await page.waitForSelector(".chip-rt", { timeout: 4000 });
  });
  await step("rate 8 with a review", async () => {
    await page.click("[data-act=rate]");
    await page.click(".star[data-n='8']");
    await page.fill("#review", "Loved it");
    await page.click("#rate-form button[type=submit]");
    await page.waitForFunction(() => document.querySelector("[data-act=rate]")?.textContent.includes("8"));
  });
  await step("react and comment on a friend's rating", async () => {
    await page.waitForSelector(".talk");
    await page.click(".talk [data-open=picker] >> nth=0");
    await page.click(".talk .picker [data-kind=laugh] >> nth=0");
    await page.waitForSelector(".react.on");
    await page.click(".talk [data-open=comment] >> nth=0");
    await page.fill(".comment-form input >> nth=0", "Next time together!");
    await page.click(".comment-form button >> nth=0");
    await page.waitForFunction(() => document.body.textContent.includes("Next time together!"));
  });
  await step("add to a new list", async () => {
    await page.click("[data-add-list]");
    await page.fill("#new-list-name", "Sofa Sundays");
    await page.click("#new-list button[type=submit]");
    await page.waitForSelector(".toast");
  });
  await step("share copies the link", async () => {
    await page.evaluate(() => { delete Navigator.prototype.share; });
    await page.click("[data-share]");
    await page.waitForFunction(() => [...document.querySelectorAll(".toast")].some((t) => /copied/i.test(t.textContent)));
  });
  await page.screenshot({ path: join(out, "phone-title-after-actions.png"), fullPage: true });

  await visit(page, "/lists", ".list-grid");
  await step("new list shows on the lists page", async () => {
    if (!(await page.textContent("main")).includes("Sofa Sundays")) throw new Error("list missing");
  });

  await visit(page, "/browse", ".grid");
  await step("IMDb 7+ filter", async () => {
    await page.click("#imdb-filter");
    await page.waitForFunction(() => document.querySelector("#imdb-filter")?.getAttribute("aria-pressed") === "true" && document.querySelectorAll("#browse-results .card").length > 0);
    const notes = await page.$$eval("#browse-results .card-meta", (els) => els.map((e) => e.textContent));
    if (!notes.every((n) => /IMDb (\d+[.,]\d)/.test(n) && parseFloat(n.match(/(\d+[.,]\d)/)[1].replace(",", ".")) >= 7)) throw new Error(notes.join(" / "));
  });

  const searchFinds = async (text, title, note) => {
    await visit(page, `/search?q=${encodeURIComponent(text)}`, "#results .grid");
    const first = await page.textContent("#results .card-title");
    if (first !== title) throw new Error(`first result was ${first}`);
    if (note && !(await page.isVisible(".search-note"))) throw new Error("no note about the changed search");
  };
  await step("search with the year added", () => searchFinds("Dune part two 2024", "Dune: Part Two", true));
  await step("search with a typo", () => searchFinds("dune prat two", "Dune: Part Two", true));
  await step("search with an IMDb link", () => searchFinds("https://www.imdb.com/title/tt1693134/", "Dune: Part Two"));

  await step("cinema: showing now and premieres", async () => {
    await visit(page, "/browse/cinema", "#cinema-soon .premiere-month");
    const now = await page.$$eval("#cinema-now .card-title", (els) => els.map((e) => e.textContent));
    if (!now.includes("The Odyssey")) throw new Error("showing now: " + now.join(", "));
    const heads = await page.$$eval("#cinema-soon .month-head time", (els) => els.map((e) => e.getAttribute("datetime")));
    if (heads.join() !== [...heads].sort().join()) throw new Error("premieres out of order");
  });
  await step("film page links to showtimes", async () => {
    await visit(page, "/movie/900003", "[data-feature=cinema] a[href*='filmweb.no/sok']");
  });
  await step("coming: new seasons on your services", async () => {
    await visit(page, "/browse/coming", "#coming-series .premiere-month");
    const notes = await page.$$eval("#coming-series .card-meta", (els) => els.map((e) => e.textContent));
    for (const want of ["Season 4 on Netflix", "Season 5 on NRK TV", "New series on Netflix"]) if (!notes.some((n) => n.startsWith(want))) throw new Error(notes.join(" / "));
    await page.waitForSelector("#coming-films .card");
  });

  await visit(page, "/stats", ".chart");
  await step("year chart has 12 months and a table", async () => {
    if ((await page.$$(".chart .bar")).length !== 12) throw new Error("not 12 bars");
    await page.waitForSelector(".chart-table table", { state: "attached" });
  });

  await visit(page, "/settings", ".services");
  await step("import an IMDb ratings file", async () => {
    const csv = 'Const,Your Rating,Date Rated,Title,Title Type,Year\ntt1329865,8,2026-05-01,"Arrival",movie,2016\ntt1095396,9,2026-06-01,Severance,tvSeries,2022\ntt9999999,7,2026-06-02,Unknown film,movie,2020\n';
    await writeFile(join(out, "imdb-ratings.csv"), csv);
    await page.setInputFiles("#import-file", join(out, "imdb-ratings.csv"));
    await page.waitForFunction(() => /Added 2/.test(document.querySelector(".import-progress p")?.textContent || ""), null, { timeout: 8000 });
  });
  await step("pick a profile picture", async () => {
    await page.setInputFiles("#picture-file", join(root, "icons/icon-512.png"));
    await page.waitForSelector(".me .avatar img");
  });

  if (errors.length) fail("errors: " + [...new Set(errors)].join(" | "));
  await context.close();
}

// ---------- Norwegian and desktop ----------
console.log("Username rules");
{
  const { page, errors, context } = await open({ username: "wanker_x" });
  const step = async (name, fn) => { try { await fn(); pass(name); } catch (err) { fail(`${name}: ${err.message.split("\n")[0]}`); } };
  await step("a blocked username must be changed first", async () => {
    await visit(page, "/friends", ".rename");
    if (await page.$$eval("#tabbar a", (a) => a.length)) throw new Error("menu still shown");
    await page.screenshot({ path: join(out, "phone-rename.png") });
  });
  await step("another blocked name is refused", async () => {
    await page.fill("#new-username", "shitlord");
    await page.click("#rename-form button[type=submit]");
    await page.waitForFunction(() => /isn't allowed/.test(document.querySelector(".form-error").textContent));
  });
  await step("an allowed name opens the app", async () => {
    await page.fill("#new-username", "carl_ok");
    await page.click("#rename-form button[type=submit]");
    await page.waitForSelector(".tonight-q", { timeout: 10000 });
    if (!(await page.$$eval("#tabbar a", (a) => a.length))) throw new Error("no menu");
  });
  await page.screenshot({ path: join(out, "phone-after-rename.png") });
  if (errors.length) fail("errors: " + [...new Set(errors)].join(" | "));
  await context.close();
}

console.log("Language button");
{
  const { page, errors, context } = await open();
  try {
    await visit(page, "/", ".tonight-q");
    await page.click(".lang-switch");
    await page.waitForFunction(() => /kveld/.test(document.querySelector(".tonight-q")?.textContent || ""), null, { timeout: 10000 });
    if ((await page.textContent(".lang-switch")) !== "EN") throw new Error("button doesn't offer English now");
    pass("NO button switches to Norwegian, then offers EN");
  } catch (err) { fail(`language button: ${err.message.split("\n")[0]}`); }
  if (errors.length) fail("errors: " + [...new Set(errors)].join(" | "));
  await context.close();
}

console.log("Norwegian and desktop");
{
  const { page, errors, context } = await open({ lang: "nb" });
  await visit(page, "/", ".ticket");
  const q = await page.textContent(".tonight-q");
  q.includes("kveld") ? pass("Norwegian home: " + q) : fail("not Norwegian: " + q);
  await page.screenshot({ path: join(out, "phone-norsk-home.png") });
  await visit(page, "/movie/872585", ".title-name");
  await page.screenshot({ path: join(out, "phone-norsk-title.png") });
  if (errors.length) fail("errors: " + [...new Set(errors)].join(" | "));
  await context.close();
}
{
  const { page, errors, context } = await open({ width: 1280 });
  for (const [hash, sel] of [["/", ".ticket"], ["/movie/693134", ".title-name"], ["/browse", ".grid"], ["/friends", ".feed"]]) {
    await visit(page, hash, sel);
    await fitsScreen(page, "desktop " + hash);
    await page.screenshot({ path: join(out, `desktop${hash.replace(/[^a-z0-9]+/gi, "-")}.png`) });
  }
  pass("desktop pages");
  if (errors.length) fail("errors: " + [...new Set(errors)].join(" | "));
  await context.close();
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} app check(s) FAILED` : "\nAll app checks passed");
process.exit(failures ? 1 : 0);
