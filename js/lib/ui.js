// Small building blocks used by every screen.
import { img } from "./tmdb.js";
import { myEntry } from "./state.js";

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

const svg = (d, extra = "") =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

export const icon = {
  home: svg('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  compass: svg('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  bookmark: svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
  bookmarkFilled: svg('<path d="M6 3h12v18l-6-4-6 4z" fill="currentColor"/>'),
  users: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  star: svg('<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" fill="currentColor" stroke="none"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  play: svg('<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>'),
  external: svg('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  tv: svg('<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8"/>'),
  film: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4"/>'),
};

export const typeLabel = (type) => (type === "tv" ? "Series" : "Movie");

// Poster card used in rows and grids.
export function card(item, { note = "" } = {}) {
  const entry = myEntry(item.type, item.id);
  let badge = "";
  if (entry?.status === "seen") {
    badge = `<span class="badge badge-seen" title="You've seen this">${icon.check}${entry.rating ? entry.rating : ""}</span>`;
  } else if (entry?.status === "watchlist") {
    badge = `<span class="badge badge-list" title="On your watchlist">${icon.bookmarkFilled}</span>`;
  }
  const poster = item.poster
    ? `<img src="${img(item.poster, "w342")}" alt="" loading="lazy" decoding="async">`
    : `<span class="noposter">${esc(item.title)}</span>`;
  const score = item.vote ? `<span class="score">${icon.star}${item.vote.toFixed(1)}</span>` : "";
  return `
    <a class="card" href="#/${item.type}/${item.id}" aria-label="${esc(item.title)}">
      <div class="poster">${poster}${badge}${score}</div>
      <div class="card-title">${esc(item.title)}</div>
      <div class="card-meta">${note || `${esc(item.year || "—")} · ${typeLabel(item.type)}`}</div>
    </a>`;
}

export function row(title, items, { more = "", sub = "" } = {}) {
  if (!items.length) return "";
  return `
    <section class="row">
      <div class="row-head">
        <div><h2>${esc(title)}</h2>${sub ? `<p class="row-sub">${sub}</p>` : ""}</div>
        ${more ? `<a class="row-more" href="${more}">See all</a>` : ""}
      </div>
      <div class="scroller">${items.map((i) => (typeof i === "string" ? i : card(i))).join("")}</div>
    </section>`;
}

export function grid(items) {
  return `<div class="grid">${items.map((i) => (typeof i === "string" ? i : card(i))).join("")}</div>`;
}

export function skeletonRows(n = 2) {
  const cards = Array.from({ length: 8 }, () => `<div class="card"><div class="poster skeleton"></div><div class="skeleton line"></div></div>`).join("");
  return Array.from({ length: n }, () => `<section class="row"><div class="skeleton heading"></div><div class="scroller">${cards}</div></section>`).join("");
}

export function skeletonGrid(n = 12) {
  return `<div class="grid">${Array.from({ length: n }, () => `<div class="card"><div class="poster skeleton"></div><div class="skeleton line"></div></div>`).join("")}</div>`;
}

export function empty(title, text, action = "") {
  return `<div class="empty"><h3>${esc(title)}</h3><p>${text}</p>${action}</div>`;
}

// Coloured circle with the first letter of a username.
export function avatar(username = "?", size = "") {
  let hash = 0;
  for (const c of username) hash = (hash * 31 + c.charCodeAt(0)) % 360;
  return `<span class="avatar ${size}" style="--h:${hash}" aria-hidden="true">${esc(username.charAt(0).toUpperCase())}</span>`;
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
  if (!navigator.onLine) return "You're offline. Check your connection.";
  return err?.message || "Something went wrong.";
}

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString();
}

// Entry row from the database -> the item shape cards expect.
export function entryToItem(e) {
  return { type: e.media_type, id: e.tmdb_id, title: e.title, year: e.year, poster: e.poster_path, vote: 0 };
}

// Opens a modal dialog. `build(dialog, close)` fills and wires it.
export function openDialog(html, wire) {
  const dialog = document.createElement("dialog");
  dialog.className = "sheet";
  dialog.innerHTML = `<button class="icon-btn sheet-close" aria-label="Close">${icon.close}</button>${html}`;
  document.body.appendChild(dialog);
  const close = () => dialog.close();
  dialog.addEventListener("close", () => dialog.remove());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });
  dialog.querySelector(".sheet-close").addEventListener("click", close);
  wire?.(dialog, close);
  dialog.showModal();
  return dialog;
}
