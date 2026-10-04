// App shell: starts everything, handles login state and page navigation.
import config from "../config.js";
import { sb, loadProfile } from "../lib/db.js";
import { state } from "../lib/state.js";
import { icon, avatar, esc, errorMessage } from "../lib/ui.js";
import { t } from "../lib/i18n.js";
import { register, slot } from "./registry.js";
import homeView from "./home.js";
import titleView, { trailerAction } from "./title.js";
import settingsView from "./settings.js";
import { loginView, resetView } from "./auth.js";
import { privacyView, aboutView, setupView } from "./pages.js";
import renameView from "./rename.js";
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
  nav: [{ href: "#/", label: t("Home"), icon: icon.home, order: 0 }],
  titleActions: [trailerAction],
});

const view = document.getElementById("view");
const configured = !/YOUR-/.test(config.SUPABASE_URL + config.SUPABASE_ANON_KEY + config.TMDB_API_KEY);
const calm = matchMedia("(prefers-reduced-motion: reduce)");

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
  const items = signedIn && !state.profile?.usernameProblem ? slot("nav") : [];
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
    ? `<a href="#/settings" class="me-link ${path === "/settings" ? "active" : ""}" aria-label="${esc(t("Settings and account"))}">${avatar(state.profile?.username || "?")}</a>`
    : path === "/login" ? "" : `<a href="#/login" class="btn btn-small">${esc(t("Sign in"))}</a>`;
}

const footer = () => `
  <footer class="footer">
    <nav><a href="#/about">${esc(t("About"))}</a><a href="#/privacy">${esc(t("Privacy"))}</a></nav>
    <p>${t("Movie data from {tmdb}, streaming data from {jw}.", {
      tmdb: '<a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>',
      jw: '<a href="https://www.justwatch.com" target="_blank" rel="noopener">JustWatch</a>',
    })}</p>
  </footer>`;

// The poster you tapped grows into the title page (see title.js).
document.addEventListener("click", (e) => {
  const card = e.target.closest("a.card");
  const poster = card?.querySelector(".poster img");
  if (!poster || calm.matches || !document.startViewTransition) return;
  document.querySelectorAll("[style*='view-transition-name']").forEach((el) => (el.style.viewTransitionName = ""));
  poster.style.viewTransitionName = "poster";
  state.tappedPoster = { href: card.getAttribute("href"), src: poster.currentSrc || poster.src };
}, true);

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
  // A username that breaks the rules must be changed before anything else.
  if (state.profile?.usernameProblem && !route.public) route = { view: renameView };

  const el = document.createElement("div");
  el.className = "page";
  const ctx = { el, params: match.slice(1), query, isCurrent: () => id === navId };
  let done;

  // Swap pages. Views draw their first frame (a skeleton) right away, so a
  // page transition can animate between the old and new screen.
  const swap = () => {
    renderChrome(path);
    if (path !== lastPath) window.scrollTo(0, 0);
    lastPath = path;
    view.replaceChildren(el);
    done = Promise.resolve(route.view(ctx));
  };
  const animate = path !== lastPath && !calm.matches && document.startViewTransition && state.session;
  if (animate) await document.startViewTransition(swap).updateCallbackDone.catch(() => {});
  else swap();
  state.tappedPoster = null;

  try {
    await done;
  } catch (err) {
    console.error(err);
    if (ctx.isCurrent()) {
      el.innerHTML = `<div class="empty"><h3>${esc(t("This page didn't load"))}</h3><p>${esc(errorMessage(err))}</p><button class="btn" id="retry">${esc(t("Try again"))}</button></div>`;
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
    // Loaders run side by side; one slow feature doesn't hold up the others.
    await Promise.all(slot("onLogin").map((fn) => Promise.resolve().then(fn).catch((err) => console.error(err))));
    setTimeout(() => window.dispatchEvent(new Event("playpro:signed-in")), 0);
  }
  if (!after && before) {
    state.profile = null;
    state.entries.clear();
    state.avatars.clear();
    state.nowStreaming.clear();
    for (const fn of slot("onLogout")) fn();
  }
  return before !== after;
}

// No pinch-zoom: iPhones ignore "user-scalable=no" in index.html, so stop
// Safari's pinch gesture here. Remove these two lines to allow zooming again.
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("gesturechange", (e) => e.preventDefault());

// A feature or the settings page changed the name or picture: redraw the header.
window.addEventListener("playpro:profile-changed", () => renderChrome(parseHash().path));
// A feature finished loading something the current page shows: draw it again.
window.addEventListener("playpro:refresh", () => router());

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
