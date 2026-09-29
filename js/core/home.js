// Home screen: shows the rows that enabled features provide (see "homeRows").
import { renderSlot, slot } from "./registry.js";
import { skeletonRows, empty } from "../lib/ui.js";

export default async function homeView({ el }) {
  document.title = "Playpro";
  if (!slot("homeRows").length) {
    el.innerHTML = empty("Welcome to Playpro", "Switch on some features in js/features.js to fill this page.");
    return;
  }
  const rows = document.createElement("div");
  rows.className = "home";
  el.appendChild(rows);
  await renderSlot("homeRows", rows, {}, { placeholder: skeletonRows(1) });
}
