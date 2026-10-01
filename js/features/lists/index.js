// FEATURE: Your own lists
//  - make lists like "Christmas films"; friends can see the ones you share
//  - "Add to list" button on title pages
//  - pages: #/lists (yours and your friends') and #/lists/<id> (lists.js)
import { register, lazy } from "../../core/registry.js";
import { sb, check, uidOf } from "../../lib/db.js";
import { esc, icon, toast, errorMessage, openDialog } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";

export async function myLists() {
  return check(await sb.from("lists").select("id, name, shared, list_items(media_type, tmdb_id)").eq("owner", uidOf()).order("created_at"));
}

export async function createList(name, shared = true) {
  return check(await sb.from("lists").insert({ name: name.trim().slice(0, 60), shared }).select().single());
}

function addDialog(item) {
  openDialog(`<h2>${esc(t("Add to a list"))}</h2><div class="list-picker"><div class="skeleton line"></div></div>`, async (dialog, close) => {
    const box = dialog.querySelector(".list-picker");
    const paint = async () => {
      const lists = await myLists();
      const inList = (l) => l.list_items.some((i) => i.media_type === item.type && i.tmdb_id === item.id);
      box.innerHTML = `
        ${lists.length ? `<ul class="choices">${lists.map((l) => `
          <li><label class="check"><input type="checkbox" data-list="${l.id}" ${inList(l) ? "checked" : ""}><span>${esc(l.name)}</span></label></li>`).join("")}</ul>` : `<p class="muted">${esc(t("You don't have any lists yet."))}</p>`}
        <form class="inline-form" id="new-list">
          <input name="name" id="new-list-name" maxlength="60" required placeholder="${esc(t("New list, e.g. Christmas films"))}" aria-label="${esc(t("Name of the new list"))}">
          <button class="btn" type="submit">${esc(t("Create"))}</button>
        </form>`;
      box.querySelector("#new-list").addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          const list = await createList(new FormData(e.target).get("name"));
          await addItem(list.id, item);
          toast(t("Added to {list}", { list: list.name }), "good");
          close();
        } catch (err) { toast(errorMessage(err), "bad"); }
      });
      box.querySelectorAll("[data-list]").forEach((cb) => cb.addEventListener("change", async () => {
        const list = lists.find((l) => l.id === cb.dataset.list);
        try {
          if (cb.checked) { await addItem(list.id, item); toast(t("Added to {list}", { list: list.name }), "good"); }
          else { await removeItem(list.id, item); toast(t("Removed from {list}", { list: list.name })); }
        } catch (err) { cb.checked = !cb.checked; toast(errorMessage(err), "bad"); }
      }));
    };
    try { await paint(); } catch (err) { box.innerHTML = `<p class="form-error">${esc(errorMessage(err))}</p>`; }
  });
}

export async function addItem(listId, item) {
  check(await sb.from("list_items").upsert({
    list_id: listId, media_type: item.type, tmdb_id: item.id,
    title: item.title.slice(0, 300), poster_path: item.poster, year: item.year || null,
  }));
}

export async function removeItem(listId, item) {
  check(await sb.from("list_items").delete().eq("list_id", listId).eq("media_type", item.type).eq("tmdb_id", item.id));
}

const addButton = {
  order: 30,
  render: () => `<button class="btn btn-ghost" data-add-list>${icon.list}${esc(t("Add to list"))}</button>`,
  wire: (box, { item }) => box.querySelector("[data-add-list]").addEventListener("click", () => addDialog(item)),
};

register({
  id: "lists",
  routes: [
    { path: /^\/lists$/, view: lazy(() => import("./lists.js")) },
    { path: /^\/lists\/([0-9a-f-]{36})$/, view: lazy(() => import("./list.js")) },
  ],
  titleActions: [addButton],
  exportData: [async () => ({ lists: check(await sb.from("lists").select("name, shared, created_at, list_items(media_type, tmdb_id, title, added_at)").eq("owner", uidOf())) })],
});
