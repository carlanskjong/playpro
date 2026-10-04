// Page #/lists: your lists and your friends' shared lists.
import { sb, check, uidOf } from "../../lib/db.js";
import { img } from "../../lib/tmdb.js";
import { esc, empty, toast, errorMessage } from "../../lib/ui.js";
import { t, plural } from "../../lib/i18n.js";
import { createList } from "./index.js";

const tile = (l, owner = "") => {
  const posters = [...l.list_items.slice(0, 3), {}, {}, {}].slice(0, 3);
  return `
    <a class="list-tile" href="#/lists/${l.id}">
      <span class="list-stack">${posters.map((p) => p.poster_path ? `<img src="${img(p.poster_path, "w185")}" alt="" loading="lazy">` : `<span></span>`).join("")}</span>
      <strong>${esc(l.name)}</strong>
      <span class="muted small">${esc([owner, plural(l.list_items.length, "{n} title", "{n} titles"), l.shared ? "" : t("private")].filter(Boolean).join(", "))}</span>
    </a>`;
};

export default async function listsView({ el }) {
  document.title = `${t("Lists")} · Playpro`;
  const lists = check(await sb.from("lists").select("id, owner, name, shared, profiles!owner(username), list_items(poster_path, added_at)").order("created_at", { ascending: false }));
  const mine = lists.filter((l) => l.owner === uidOf());
  const theirs = lists.filter((l) => l.owner !== uidOf());
  el.innerHTML = `
    <div class="page-head"><h1>${esc(t("Lists"))}</h1></div>
    <form class="inline-form" id="new-list">
      <input name="name" id="list-name" maxlength="60" required placeholder="${esc(t("New list, e.g. Christmas films"))}" aria-label="${esc(t("Name of the new list"))}">
      <button class="btn btn-primary" type="submit">${esc(t("Create list"))}</button>
    </form>
    <h2 class="subhead">${esc(t("Your lists"))}</h2>
    ${mine.length ? `<div class="list-grid">${mine.map((l) => tile(l)).join("")}</div>` : `<p class="muted">${esc(t("No lists yet. Make one above, or tap Add to list on any title."))}</p>`}
    <h2 class="subhead">${esc(t("Your friends' lists"))}</h2>
    ${theirs.length ? `<div class="list-grid">${theirs.map((l) => tile(l, l.profiles?.username)).join("")}</div>` : empty(t("No shared lists yet"), esc(t("When your friends share a list, it shows up here.")), "", "friends")}`;

  el.querySelector("#new-list").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const list = await createList(new FormData(e.target).get("name"));
      location.hash = `#/lists/${list.id}`;
    } catch (err) { toast(errorMessage(err), "bad"); }
  });
}
