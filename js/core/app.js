// App shell: starts everything, handles login state and page navigation.
import config from "../config.js";
import { sb, loadProfile } from "../lib/db.js";
import { state } from "../lib/state.js";
import { icon, avatar, esc, errorMessage } from "../lib/ui.js";
import { register, slot } from "./registry.js";
import homeView from "./home.js";
import titleView, { trailerAction } from "./title.js";
import settingsView from "./settings.js";
import { loginView, resetView } from "./auth.js";
import { privacyView, aboutView, setupView } from "./pages.js";
import "../features.js";

register({
  id: "core",
  routes: [
    { path: /^\/$/, view: homeView },
    { path: /^\/(movie|tv)\/(\d+)$/, view: titleView },
    { path: /^\/settings$/, view: settingsView },
    { path: /^\/login$/, view: loginView, public: true },
    { path: /^\/reset$/, view: resetView, public: true },
    { path: /^\/privacy$/, view: privacyView, public: true },
    { path: /^\/about$/, view: aboutView, public: true },
  ],
  nav: [{ href: "#/", label: "Home", icon: icon.home, order: 0 }],
  titleActions: [trailerAction],
});

const view = document.getElementById("view");
const configured = !/YOUR-/.test(config.SUPABASE_URL + config.SUPABASE_ANON_KEY + config.TMDB_API_KEY);

function parseHash() {
  const raw = decodeURI(location.hash.slice(1)) || "/";
  const [path, qs = ""] = raw.split("?");
  return { path: path || "/", query: new URLSearchParams(qs) };
}

export function navigate(hash) {
  if (location.hash === hash) router();
  else location.hash = hash;
}

function renderChrome(path) {
  const signedIn = !!state.session;
  document.body.classList.toggle("signed-out", !signedIn);
  const items = signedIn ? slot("nav") : [];
  const isActive = (href) => {
    const target = href.replace(/^#/, "");
    return target === "/" ? path === "/" : path.startsWith(target);
  };
  const links = items
    .map((n) => `<a href="${n.href}" class="${isActive(n.href) ? "active" : ""}" ${isActive(n.href) ? 'aria-current="page"' : ""}>${n.icon}<span>${esc(n.label)}</span></a>`)
    .join("");
  document.getElementById("topnav").innerHTML = links;
  document.getElementById("tabbar").innerHTML = links;
  document.getElementById("me").innerHTML = signedIn
    ? `<a href="#/settings" class="me-link ${path === "/settings" ? "active" : ""}" aria-label="Settings and account">${avatar(state.profile?.username || "?")}</a>`
    : path === "/login" ? "" : `<a href="#/login" class="btn btn-small">Sign in</a>`;
}

const footer = () => `
  <footer class="footer">
    <a href="#/about">About</a><span>·</span><a href="#/privacy">Privacy</a>
    <span class="footer-credit">Movie data from <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>, streaming data from <a href="https://www.justwatch.com" target="_blank" rel="noopener">JustWatch</a></span>
  </footer>`;

let navId = 0;
let lastPath = null;

export async function router() {
  const id = ++navId;
  const { path, query } = parseHash();

  if (!configured && !["/privacy", "/about"].includes(path)) {
    renderChrome(path);
    view.innerHTML = "";
    return setupView({ el: view });
  }

  let route = null;
  let match = null;
  for (const r of slot("routes")) {
    match = path.match(r.path);
    if (match) { route = r; break; }
  }
  if (!route) return location.replace("#/");
  if (!route.public && !state.session) {
    const next = path === "/" ? "" : `?next=${encodeURIComponent(location.hash.slice(1))}`;
    return location.replace(`#/login${next}`);
  }
  if (path === "/login" && state.session) return location.replace("#/");

  renderChrome(path);
  if (path !== lastPath) window.scrollTo(0, 0);
  lastPath = path;

  const el = document.createElement("div");
  el.className = "page";
  view.replaceChildren(el);
  const ctx = { el, params: match.slice(1), query, isCurrent: () => id === navId };
  try {
    await route.view(ctx);
  } catch (err) {
    console.error(err);
    if (ctx.isCurrent()) {
      el.innerHTML = `<div class="empty"><h3>Couldn't load this page</h3><p>${esc(errorMessage(err))}</p><button class="btn" id="retry">Try again</button></div>`;
      el.querySelector("#retry").addEventListener("click", router);
    }
  }
  if (ctx.isCurrent() && !route.public) el.insertAdjacentHTML("beforeend", footer());
}

// ---------- login state ----------

async function applySession(session) {
  const before = state.session?.user?.id;
  state.session = session;
  const after = session?.user?.id;
  if (after && after !== before) {
    try { await loadProfile(); } catch (err) { console.error(err); }
    for (const fn of slot("onLogin")) {
      try { await fn(); } catch (err) { console.error(err); }
    }
  }
  if (!after && before) {
    state.profile = null;
    state.entries.clear();
    for (const fn of slot("onLogout")) fn();
  }
  return before !== after;
}

async function start() {
  if (configured) {
    const { data } = await sb.auth.getSession();
    await applySession(data.session);
    sb.auth.onAuthStateChange((event, session) => {
      // Run outside Supabase's callback (it must not await other Supabase calls).
      setTimeout(async () => {
        if (event === "PASSWORD_RECOVERY") {
          state.session = session;
          return navigate("#/reset");
        }
        const changed = await applySession(session);
        if (!changed) return;
        const { path, query } = parseHash();
        if (path === "/login") navigate("#" + (query.get("next") || "/"));
        else router();
      }, 0);
    });
  }
  window.addEventListener("hashchange", router);
  router();

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch((err) => console.warn("Service worker:", err));
  }
}

start();
