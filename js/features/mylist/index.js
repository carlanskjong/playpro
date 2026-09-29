// FEATURE: My list
//  - "Watchlist" and "Rate" buttons on title pages
//  - rate 1–10 and write a short review (visible to friends)
//  - "My list" page with Watchlist / Seen tabs
//  - "Your watchlist" row on the home screen
import { register } from "../../core/registry.js";
import { state, myEntry } from "../../lib/state.js";
import { loadMyEntries, saveEntry, removeEntry } from "../../lib/db.js";
import { esc, icon, row, grid, card, empty, toast, errorMessage, openDialog, entryToItem, timeAgo } from "../../lib/ui.js";

// ---------- title page buttons ----------

function actionsHtml(item) {
  const e = myEntry(item.type, item.id);
  const onList = e?.status === "watchlist";
  const seen = e?.status === "seen";
  return `
    <button class="btn ${onList ? "btn-on" : ""}" data-act="watchlist" aria-pressed="${onList}">
      ${onList ? icon.bookmarkFilled + "On watchlist" : icon.plus + "Watchlist"}
    </button>
    <button class="btn ${seen ? "btn-on" : "btn-primary"}" data-act="rate">
      ${seen ? `${icon.check}${e.rating ? `Your rating ${e.rating}` : "Seen"}` : `${icon.star}Rate`}
    </button>`;
}

function rateDialog(item, onDone) {
  const e = myEntry(item.type, item.id);
  let rating = e?.rating || 0;
  const stars = Array.from({ length: 10 }, (_, i) => i + 1)
    .map((n) => `<button type="button" class="star" data-n="${n}" aria-label="${n} out of 10">${icon.star}</button>`)
    .join("");
  openDialog(
    `<p class="eyebrow">Rate</p>
     <h2>${esc(item.title)}</h2>
     <form class="form" id="rate-form">
       <div class="stars" role="group" aria-label="Your rating">${stars}</div>
       <p class="rating-value" aria-live="polite"></p>
       <label>Short review <small>optional · only your friends can see it</small>
         <textarea name="review" maxlength="500" rows="3" placeholder="What did you think?">${esc(e?.review || "")}</textarea></label>
       <button class="btn btn-primary btn-block" type="submit">Save</button>
       ${e ? `<button class="btn btn-ghost btn-block" type="button" id="remove">Remove from my list</button>` : ""}
     </form>`,
    (dialog, close) => {
      const paint = () => {
        dialog.querySelectorAll(".star").forEach((s) => s.classList.toggle("on", Number(s.dataset.n) <= rating));
        dialog.querySelector(".rating-value").textContent = rating ? `${rating} / 10` : "Tap a star, or just save as seen";
      };
      paint();
      dialog.querySelector(".stars").addEventListener("click", (ev) => {
        const s = ev.target.closest(".star");
        if (!s) return;
        rating = Number(s.dataset.n) === rating ? 0 : Number(s.dataset.n);
        paint();
      });
      dialog.querySelector("#rate-form").addEventListener("submit", async (ev) => {
        ev.preventDefault();
        try {
          await saveEntry(item, { status: "seen", rating: rating || null, review: new FormData(ev.target).get("review").trim() || null });
          toast(rating ? `Rated ${rating}/10` : "Marked as seen", "good");
          close();
          onDone();
        } catch (err) {
          toast(errorMessage(err), "bad");
        }
      });
      dialog.querySelector("#remove")?.addEventListener("click", async () => {
        try {
          await removeEntry(item.type, item.id);
          toast("Removed from your list");
          close();
          onDone();
        } catch (err) {
          toast(errorMessage(err), "bad");
        }
      });
    },
  );
}

const titleButtons = {
  order: 10,
  render: ({ item }) => actionsHtml(item),
  wire: (box, { item }) => {
    const refresh = () => { box.innerHTML = actionsHtml(item); };
    box.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      if (btn.dataset.act === "rate") return rateDialog(item, refresh);
      const current = myEntry(item.type, item.id);
      try {
        if (current?.status === "watchlist") {
          await removeEntry(item.type, item.id);
          toast("Removed from watchlist");
        } else if (current?.status === "seen") {
          toast("You've already seen this. Open Rate to change it.");
        } else {
          await saveEntry(item, { status: "watchlist" });
          toast("Added to watchlist", "good");
        }
        refresh();
      } catch (err) {
        toast(errorMessage(err), "bad");
      }
    });
  },
};

// ---------- My list page ----------

async function listView({ el, query }) {
  document.title = "My list · Playpro";
  await loadMyEntries();
  const tab = query.get("tab") === "seen" ? "seen" : "watchlist";
  const all = [...state.entries.values()];
  const rows = all.filter((e) => e.status === tab);
  const count = (s) => all.filter((e) => e.status === s).length;
  const cards = rows.map((e) =>
    card(entryToItem(e), { note: tab === "seen" ? `${e.rating ? `★ ${e.rating}/10 · ` : ""}${timeAgo(e.updated_at)}` : `Added ${timeAgo(e.updated_at)}` }),
  );
  el.innerHTML = `
    <div class="page-head"><h1>My list</h1></div>
    <div class="segmented">
      <a href="#/list" role="tab" aria-selected="${tab === "watchlist"}">Watchlist <span class="count">${count("watchlist")}</span></a>
      <a href="#/list?tab=seen" role="tab" aria-selected="${tab === "seen"}">Seen <span class="count">${count("seen")}</span></a>
    </div>
    ${rows.length ? grid(cards) : tab === "watchlist"
      ? empty("Your watchlist is empty", "Tap <strong>Watchlist</strong> on any movie or series to save it for later.", `<a class="btn btn-primary" href="#/browse">Browse titles</a>`)
      : empty("Nothing rated yet", "Tap <strong>Rate</strong> on something you've watched.")}`;
}

// ---------- home row ----------

const watchlistRow = {
  order: 40,
  render: () => {
    const items = [...state.entries.values()].filter((e) => e.status === "watchlist").slice(0, 20).map(entryToItem);
    return row("Your watchlist", items, { more: "#/list" });
  },
};

register({
  id: "mylist",
  onLogin: [loadMyEntries],
  routes: [{ path: /^\/list$/, view: listView }],
  nav: [{ href: "#/list", label: "My list", icon: icon.bookmark, order: 30 }],
  titleActions: [titleButtons],
  homeRows: [watchlistRow],
});
