// FEATURE: My list
//  - "Watchlist" and "Rate" buttons on title pages
//  - rate 1–10 and write a short review (visible to friends)
//  - "My list" page with Watchlist / Seen tabs
//  - "Your watchlist" row on the home screen
import { register, hasRoute } from "../../core/registry.js";
import { state, myEntry, entryKey } from "../../lib/state.js";
import { loadMyEntries, saveEntry, removeEntry } from "../../lib/db.js";
import { esc, icon, row, grid, card, empty, toast, errorMessage, openDialog, entryToItem, timeAgo } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";

// ---------- title page buttons ----------

function actionsHtml(item) {
  const e = myEntry(item.type, item.id);
  const onList = e?.status === "watchlist";
  const seen = e?.status === "seen";
  return `
    <button class="btn ${seen ? "btn-on" : "btn-primary"}" data-act="rate">
      ${seen ? `${icon.check}${esc(e.rating ? t("You gave it {n}", { n: e.rating }) : t("Seen"))}` : `${icon.star}${esc(t("Rate"))}`}
    </button>
    ${seen ? "" : `
    <button class="btn ${onList ? "btn-on" : ""}" data-act="watchlist" aria-pressed="${onList}">
      ${onList ? icon.bookmarkFilled + esc(t("On your watchlist")) : icon.plus + esc(t("Watchlist"))}
    </button>`}`;
}

function rateDialog(item, onDone) {
  const e = myEntry(item.type, item.id);
  let rating = e?.rating || 0;
  const stars = Array.from({ length: 10 }, (_, i) => i + 1)
    .map((n) => `<button type="button" class="star" data-n="${n}" aria-label="${esc(t("{n} out of 10", { n }))}">${icon.star}</button>`)
    .join("");
  openDialog(
    `<h2>${esc(item.title)}</h2>
     <form class="form" id="rate-form">
       <div class="stars" role="group" aria-label="${esc(t("Your rating"))}">${stars}</div>
       <p class="rating-value" aria-live="polite"></p>
       <div class="field">
         <label for="review">${esc(t("Short review"))}</label>
         <small id="review-hint">${esc(t("Optional. Only your friends can see it."))}</small>
         <textarea name="review" id="review" aria-describedby="review-hint" maxlength="500" rows="3" placeholder="${esc(t("What did you think?"))}">${esc(e?.review || "")}</textarea>
       </div>
       <button class="btn btn-primary btn-block" type="submit">${esc(t("Save rating"))}</button>
       ${e ? `<button class="btn btn-ghost btn-block" type="button" id="remove">${esc(t("Remove from my list"))}</button>` : ""}
     </form>`,
    (dialog, close) => {
      const paint = () => {
        dialog.querySelectorAll(".star").forEach((s) => s.classList.toggle("on", Number(s.dataset.n) <= rating));
        dialog.querySelector(".rating-value").textContent = rating ? `${rating} / 10` : t("Tap a star, or save it as seen without a rating");
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
          toast(rating ? t("Rating saved: {n}/10", { n: rating }) : t("Marked as seen"), "good");
          close();
          onDone();
        } catch (err) {
          toast(errorMessage(err), "bad");
        }
      });
      dialog.querySelector("#remove")?.addEventListener("click", async () => {
        try {
          await removeEntry(item.type, item.id);
          toast(t("Removed from your list"));
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
      try {
        if (myEntry(item.type, item.id)?.status === "watchlist") {
          await removeEntry(item.type, item.id);
          toast(t("Removed from your watchlist"));
        } else {
          await saveEntry(item, { status: "watchlist" });
          toast(t("Added to your watchlist"), "good");
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
  document.title = `${t("My list")} · Playpro`;
  await loadMyEntries();
  const tab = query.get("tab") === "seen" ? "seen" : "watchlist";
  const onlyStreaming = query.get("now") === "1";
  const all = [...state.entries.values()];
  let rows = all.filter((e) => e.status === tab);
  if (tab === "watchlist" && onlyStreaming) rows = rows.filter((e) => state.nowStreaming.has(entryKey(e.media_type, e.tmdb_id)));
  const count = (s) => all.filter((e) => e.status === s).length;
  const cards = rows.map((e) =>
    card(entryToItem(e), {
      note: esc(tab === "seen"
        ? (e.rating ? t("You gave it {n}", { n: e.rating }) : t("Seen {when}", { when: timeAgo(e.watched_at || e.updated_at) }))
        : t("Added {when}", { when: timeAgo(e.updated_at) })),
    }),
  );
  const links = [
    hasRoute("/stats") ? `<a class="btn btn-ghost btn-small" href="#/stats">${icon.chart}${esc(t("Your year"))}</a>` : "",
    hasRoute("/lists") ? `<a class="btn btn-ghost btn-small" href="#/lists">${icon.list}${esc(t("Your lists"))}</a>` : "",
  ].join("");
  const streamingFilter = tab === "watchlist" && state.nowStreaming.size
    ? `<a class="svc-chip ${onlyStreaming ? "on" : ""}" href="#/list${onlyStreaming ? "" : "?now=1"}" aria-pressed="${onlyStreaming}">${icon.play}${esc(t("On your services now"))}</a>`
    : "";

  el.innerHTML = `
    <div class="page-head page-head-row"><h1>${esc(t("My list"))}</h1><div class="button-row">${links}</div></div>
    <div class="toolbar">
      <div class="segmented" role="tablist">
        <a href="#/list" role="tab" aria-selected="${tab === "watchlist"}">${esc(t("Watchlist"))} <span class="count">${count("watchlist")}</span></a>
        <a href="#/list?tab=seen" role="tab" aria-selected="${tab === "seen"}">${esc(t("Seen"))} <span class="count">${count("seen")}</span></a>
      </div>
      ${streamingFilter}
    </div>
    ${rows.length ? grid(cards) : tab === "watchlist"
      ? empty(t("Your watchlist is empty"), t("Tap <strong>Watchlist</strong> on a movie or series to save it for later."), `<a class="btn btn-primary" href="#/browse">${esc(t("Find something"))}</a>`, "sofa")
      : empty(t("Nothing rated yet"), t("Tap <strong>Rate</strong> on something you've watched. You can also bring your ratings over from IMDb or Letterboxd in Settings."), "", "popcorn")}`;
}

// ---------- home row ----------

const watchlistRow = {
  order: 80,
  render: () => {
    const items = [...state.entries.values()].filter((e) => e.status === "watchlist").slice(0, 20).map(entryToItem);
    return row(t("Your watchlist"), items, { more: "#/list" });
  },
};

register({
  id: "mylist",
  onLogin: [loadMyEntries],
  routes: [{ path: /^\/list$/, view: listView }],
  nav: [{ href: "#/list", label: t("My list"), icon: icon.bookmark, order: 30 }],
  titleActions: [titleButtons],
  homeRows: [watchlistRow],
});
