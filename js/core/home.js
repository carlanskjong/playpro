// Home screen: shows the rows that enabled features provide (see "homeRows").
// Pull down at the top of the page to fetch fresh lists.
import { renderSlot, slot } from "./registry.js";
import { refreshLists } from "../lib/tmdb.js";
import { skeletonRows, empty, esc } from "../lib/ui.js";
import { t } from "../lib/i18n.js";

export default async function homeView(ctx) {
  const { el } = ctx;
  document.title = "Playpro";
  if (!slot("homeRows").length) {
    el.innerHTML = empty(t("Nothing on the home screen yet"), t("Switch on some features in js/features.js to fill this page."));
    return;
  }
  el.innerHTML = `<div class="pull" aria-hidden="true"><span>${esc(t("Pull to refresh"))}</span></div><div class="home"></div>`;
  pullToRefresh(el, ctx);
  await renderSlot("homeRows", el.querySelector(".home"), {}, { placeholder: skeletonRows(1) });
}

// One set of touch listeners for the whole app; they only act while the
// home screen is showing.
let current = null; // { hint, ctx }
let startY = null;
let distance = 0;

function pullToRefresh(el, ctx) {
  current = { hint: el.querySelector(".pull"), ctx };
}

function setHint(px) {
  const hint = current.hint;
  hint.style.setProperty("--pull", `${px}px`);
  hint.classList.toggle("ready", px > 80);
  hint.firstElementChild.textContent = px > 80 ? t("Release to refresh") : t("Pull to refresh");
}

window.addEventListener("touchstart", (e) => {
  startY = current?.ctx.isCurrent() && window.scrollY <= 0 ? e.touches[0].clientY : null;
}, { passive: true });

window.addEventListener("touchmove", (e) => {
  if (startY === null) return;
  distance = Math.max(0, Math.min(120, e.touches[0].clientY - startY));
  setHint(distance);
}, { passive: true });

window.addEventListener("touchend", async () => {
  if (startY === null) return;
  const go = distance > 80;
  startY = null;
  distance = 0;
  setHint(0);
  if (!go) return;
  current.hint.classList.add("busy");
  await refreshLists();
  window.dispatchEvent(new Event("playpro:refresh"));
});
