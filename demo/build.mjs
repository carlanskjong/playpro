// Builds demo/dist/playpro-demo.html: the real app plus the fake backend in
// one self-contained page (used for the shareable preview). Run: npm run demo
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname;
const file = (p) => readFileSync(root + p);
const dataUri = (p, type) => `data:${type};base64,${file(p).toString("base64")}`;

const result = await build({
  entryPoints: [root + "demo/entry.js"],
  bundle: true, format: "iife", minify: true, target: "es2020", write: false,
  plugins: [{
    name: "demo-config",
    setup(b) { b.onResolve({ filter: /config\.js$/ }, () => ({ path: root + "demo/config.js" })); },
  }],
});
const icon = dataUri("icons/icon.svg", "image/svg+xml");
const js = result.outputFiles[0].text.replaceAll("icons/icon.svg", icon).replaceAll("</script", "<\\/script");
const css = file("css/styles.css").toString()
  .replace("../fonts/anybody.woff2", dataUri("fonts/anybody.woff2", "font/woff2"))
  .replace("../fonts/familjen-grotesk.woff2", dataUri("fonts/familjen-grotesk.woff2", "font/woff2"))
  .replace("../fonts/familjen-grotesk-italic.woff2", dataUri("fonts/familjen-grotesk-italic.woff2", "font/woff2"));
const supabase = file("js/vendor/supabase.js").toString().replaceAll("</script", "<\\/script");

const html = `<title>Playpro Demo</title>
<meta name="theme-color" content="#121833">
<style>
${css}
.demo-bar { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px 10px; padding: 8px 16px; font-size: 0.8125rem; text-align: center; background: #0e1329; color: var(--fjord); }
.demo-bar strong { color: var(--lamp); }
.topbar { top: env(safe-area-inset-top, 0px); }
</style>
<div class="demo-bar"><strong>Demo</strong><span>Sample titles, ratings and Norwegian availability. Nothing you do here is saved or sent anywhere.</span></div>
<header class="topbar">
  <a class="brand" href="#/" aria-label="Playpro"><img src="${icon}" alt="" width="30" height="30"><span>Playpro</span></a>
  <nav class="topnav" id="topnav" aria-label="Main"></nav>
  <div class="me" id="me"></div>
</header>
<main id="view" tabindex="-1"></main>
<nav class="tabbar" id="tabbar" aria-label="Main"></nav>
<div id="toasts" aria-live="polite"></div>
<script>${supabase}</script>
<script>${js}</script>
`;
mkdirSync(root + "demo/dist", { recursive: true });
writeFileSync(root + "demo/dist/playpro-demo.html", html);
console.log(`demo/dist/playpro-demo.html (${Math.round(html.length / 1024)} KB)`);
