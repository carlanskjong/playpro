// Small building blocks used by every screen.
import { img, srcset } from "./tmdb.js";
import { state, myEntry } from "./state.js";
import { icon, drawing } from "./icons.js";
import { t, num, date } from "./i18n.js";

export { icon, drawing };

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export const typeLabel = (type) => (type === "tv" ? t("Series") : t("Movie"));

// "Series, 2024" / "Movie"
export const kindAndYear = (item) => [typeLabel(item.type), item.year].filter(Boolean).join(", ");

// Poster image sized for the screen: phones get the small file.
export function posterImg(path, { sizes = "(max-width: 600px) 34vw, 180px", alt = "", eager = false } = {}) {
  return `<img src="${img(path, "w342")}" srcset="${srcset(path, ["w185", "w342", "w500"])}" sizes="${sizes}" alt="${esc(alt)}" ${eager ? "" : 'loading="lazy"'} decoding="async">`;
}

// Poster card used in rows and grids.
export function card(item, { note = "", wrap = false } = {}) {
  const key = `${item.type}:${item.id}`;
  const entry = myEntry(item.type, item.id);
  let badge = "";
  if (entry?.status === "seen") {
    badge = `<span class="badge badge-seen" title="${esc(t("You've seen this"))}">${icon.check}${entry.rating || ""}</span>`;
  } else if (entry?.status === "watchlist") {
    badge = `<span class="badge badge-list" title="${esc(t("On your watchlist"))}">${icon.bookmarkFilled}</span>`;
  }
  const streaming = state.nowStreaming.has(key)
    ? `<span class="badge badge-now" title="${esc(t("Streaming now on one of your services"))}">${icon.play}</span>`
    : "";
  const poster = item.poster ? posterImg(item.poster) : `<span class="noposter">${esc(item.title)}</span>`;
  const score = item.vote ? `<span class="score">${num(item.vote)}</span>` : "";
  const imdbAttr = item.imdbId ? ` data-imdb-id="${esc(item.imdbId)}"` : "";
  return `
    <a class="card" href="#/${item.type}/${item.id}"${imdbAttr}>
      <div class="poster">${poster}${badge}${streaming}${score}</div>
      <div class="card-title">${esc(item.title)}</div>
      <div class="card-meta${wrap ? " wrap" : ""}">${note || esc(kindAndYear(item))}</div>
    </a>`;
}

export function row(title, items, { more = "", sub = "" } = {}) {
  if (!items.length) return "";
  return `
    <section class="row">
      <div class="row-head">
        <div><h2>${esc(title)}</h2>${sub ? `<p class="row-sub">${sub}</p>` : ""}</div>
        ${more ? `<a class="row-more" href="${more}">${esc(t("See all"))}</a>` : ""}
      </div>
      <div class="scroller">${items.map((i) => (typeof i === "string" ? i : card(i))).join("")}</div>
    </section>`;
}

export function grid(items) {
  return `<div class="grid">${items.map((i) => (typeof i === "string" ? i : card(i))).join("")}</div>`;
}

const skeletonCard = `<div class="card"><div class="poster skeleton"></div><div class="skeleton line"></div></div>`;

export function skeletonRows(n = 2) {
  return Array.from({ length: n }, () => `<section class="row"><div class="skeleton heading"></div><div class="scroller">${skeletonCard.repeat(8)}</div></section>`).join("");
}

export function skeletonGrid(n = 12) {
  return `<div class="grid">${skeletonCard.repeat(n)}</div>`;
}

// Empty screen: a small drawing, what's missing, and what to do about it.
export function empty(title, text, action = "", art = "reel") {
  return `<div class="empty">${drawing[art] || ""}<h3>${esc(title)}</h3>${text ? `<p>${text}</p>` : ""}${action}</div>`;
}

// Round profile picture, or a coloured circle with the first letter.
export function avatar(username = "?", size = "") {
  username = username || "?";
  let hash = 0;
  for (const c of username) hash = (hash * 31 + c.charCodeAt(0)) % 360;
  const picture = state.avatars.get(username);
  const inner = picture ? `<img src="${esc(picture)}" alt="">` : esc(username.charAt(0).toUpperCase());
  return `<span class="avatar ${size}" style="--h:${hash}" data-user="${esc(username)}" aria-hidden="true">${inner}</span>`;
}

// Redraw every avatar of one person on the page (after a new picture).
export function refreshAvatars(username) {
  document.querySelectorAll(`.avatar[data-user="${CSS.escape(username)}"]`).forEach((el) => {
    const size = [...el.classList].find((c) => c.startsWith("avatar-")) || "";
    el.outerHTML = avatar(username, size);
  });
}

export function toast(message, kind = "info") {
  const el = document.createElement("div");
  el.className = `toast toast-${kind}`;
  el.setAttribute("role", "status");
  el.textContent = message;
  document.getElementById("toasts").appendChild(el);
  setTimeout(() => el.classList.add("out"), 2800);
  setTimeout(() => el.remove(), 3300);
}

export function errorMessage(err) {
  if (!navigator.onLine) return t("You're offline. Check your connection.");
  return err?.message || t("Something went wrong.");
}

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return t("just now");
  if (s < 3600) return t("{n} min ago", { n: Math.floor(s / 60) });
  if (s < 86400) return t("{n} h ago", { n: Math.floor(s / 3600) });
  if (s < 604800) return t("{n} d ago", { n: Math.floor(s / 86400) });
  return date(iso);
}

// Entry row from the database -> the item shape cards expect.
export function entryToItem(e) {
  return { type: e.media_type, id: e.tmdb_id, title: e.title, year: e.year, poster: e.poster_path, imdbId: e.imdb_id, vote: 0 };
}

// Opens a sheet (a modal dialog). `wire(dialog, close)` fills and wires it.
export function openDialog(html, wire) {
  const dialog = document.createElement("dialog");
  dialog.className = "sheet";
  dialog.innerHTML = `<button class="icon-btn sheet-close" aria-label="${esc(t("Close"))}">${icon.close}</button>${html}`;
  document.body.appendChild(dialog);
  const close = () => dialog.close();
  dialog.addEventListener("close", () => dialog.remove());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });
  dialog.querySelector(".sheet-close").addEventListener("click", close);
  wire?.(dialog, close);
  dialog.showModal();
  return dialog;
}

// In-app "Are you sure?" box. Resolves to true when the person confirms.
export function confirmDialog(message, okLabel = t("Yes")) {
  return new Promise((resolve) => {
    let answer = false;
    const dialog = openDialog(
      `<h2>${esc(message)}</h2>
       <div class="button-row">
         <button class="btn btn-danger" data-ok>${esc(okLabel)}</button>
         <button class="btn btn-ghost" data-cancel>${esc(t("Cancel"))}</button>
       </div>`,
      (d, close) => {
        d.querySelector("[data-ok]").addEventListener("click", () => { answer = true; close(); });
        d.querySelector("[data-cancel]").addEventListener("click", close);
      },
    );
    dialog.addEventListener("close", () => resolve(answer));
  });
}
