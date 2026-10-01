// Page #/lists/<id>: one list. The owner can rename, share or delete it and
// remove titles.
import { sb, check, uidOf } from "../../lib/db.js";
import { esc, grid, card, empty, toast, errorMessage, confirmDialog, openDialog, entryToItem } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";
import { removeItem } from "./index.js";

export default async function listView(ctx) {
  const { params: [id] } = ctx;
  // A fresh container each time, so click handlers never pile up on reload.
  const el = document.createElement("div");
  ctx.el.replaceChildren(el);
  const list = check(await sb.from("lists").select("id, owner, name, shared, profiles(username), list_items(*)").eq("id", id).maybeSingle());
  if (!list) {
    el.innerHTML = empty(t("This list isn't available"), esc(t("It may be private or deleted.")), `<a class="btn" href="#/lists">${esc(t("All lists"))}</a>`);
    return;
  }
  document.title = `${list.name} · Playpro`;
  const own = list.owner === uidOf();
  const items = list.list_items.sort((a, b) => b.added_at.localeCompare(a.added_at)).map((i) => ({ ...entryToItem(i), imdbId: null }));

  el.innerHTML = `
    <div class="page-head">
      <a class="back" href="#/lists">${esc(t("All lists"))}</a>
      <h1>${esc(list.name)}</h1>
      <p class="muted">${esc(own ? (list.shared ? t("Your friends can see this list.") : t("Only you can see this list.")) : t("A list by {name}", { name: list.profiles?.username || "?" }))}</p>
      ${own ? `
        <div class="button-row">
          <button class="btn btn-small" id="rename">${esc(t("Rename"))}</button>
          <button class="btn btn-small" id="share">${esc(list.shared ? t("Make private") : t("Share with friends"))}</button>
          <button class="btn btn-small btn-danger" id="delete">${esc(t("Delete list"))}</button>
        </div>` : ""}
    </div>
    ${items.length
      ? grid(items.map((i) => card(i) + (own ? `<button class="remove-item" data-type="${i.type}" data-id="${i.id}" aria-label="${esc(t("Remove {title} from the list", { title: i.title }))}">×</button>` : "")).map((h) => `<div class="card-wrap">${h}</div>`))
      : empty(t("This list is empty"), esc(t("Open a movie or series and tap Add to list.")), "", "ticket")}`;

  if (!own) return;
  const update = async (patch) => {
    try { check(await sb.from("lists").update(patch).eq("id", id)); listView(ctx); } catch (err) { toast(errorMessage(err), "bad"); }
  };
  el.querySelector("#rename").addEventListener("click", () => openDialog(`
    <h2>${esc(t("Rename list"))}</h2>
    <form class="form" id="rename-form">
      <div class="field"><label for="rename-name">${esc(t("Name"))}</label>
      <input id="rename-name" name="name" maxlength="60" required value="${esc(list.name)}"></div>
      <button class="btn btn-primary btn-block" type="submit">${esc(t("Save name"))}</button>
    </form>`, (dialog, close) => {
    dialog.querySelector("#rename-form").addEventListener("submit", (e) => {
      e.preventDefault();
      close();
      update({ name: new FormData(e.target).get("name").trim().slice(0, 60) });
    });
  }));
  el.querySelector("#share").addEventListener("click", () => update({ shared: !list.shared }));
  el.querySelector("#delete").addEventListener("click", async () => {
    if (!(await confirmDialog(t("Delete the list {name}?", { name: list.name }), t("Delete")))) return;
    try { check(await sb.from("lists").delete().eq("id", id)); location.hash = "#/lists"; } catch (err) { toast(errorMessage(err), "bad"); }
  });
  el.addEventListener("click", async (e) => {
    const b = e.target.closest(".remove-item");
    if (!b) return;
    try {
      await removeItem(id, { type: b.dataset.type, id: Number(b.dataset.id) });
      b.closest(".card-wrap").remove();
    } catch (err) { toast(errorMessage(err), "bad"); }
  });
}
