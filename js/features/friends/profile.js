// Page #/u/<username>: a member's profile. Friends see each other's lists.
import { state } from "../../lib/state.js";
import { friendships, requestFriend, profileByUsername, entriesOf } from "../../lib/db.js";
import { esc, icon, avatar, grid, card, empty, toast, errorMessage, entryToItem, timeAgo } from "../../lib/ui.js";
import { t, num, date } from "../../lib/i18n.js";

export default async function profileView(ctx) {
  const { el, params: [username], query } = ctx;
  const profile = await profileByUsername(decodeURIComponent(username));
  if (!profile) {
    el.innerHTML = empty(t("No such member"), esc(t("Maybe they changed their username.")), "", "friends");
    return;
  }
  document.title = `${profile.username} · Playpro`;
  const isMe = profile.id === state.session.user.id;
  const links = isMe ? [] : await friendships();
  const link = links.find((l) => l.other?.id === profile.id);
  const isFriend = isMe || link?.status === "accepted";
  const entries = isFriend ? await entriesOf(profile.id) : [];
  const tab = query.get("tab") === "watchlist" ? "watchlist" : "seen";
  const seen = entries.filter((e) => e.status === "seen");
  const rated = seen.filter((e) => e.rating);
  const avg = rated.length ? num(rated.reduce((s, e) => s + e.rating, 0) / rated.length) : "–";
  const shown = entries.filter((e) => e.status === tab);
  const base = `#/u/${encodeURIComponent(profile.username)}`;

  let action = "";
  if (!isMe && !link) action = `<button class="btn btn-primary" id="add">${icon.plus}${esc(t("Add friend"))}</button>`;
  else if (link?.status === "pending") action = `<span class="chip">${esc(link.incoming ? t("Wants to be your friend. Answer on the Friends page.") : t("Friend request sent"))}</span>`;

  el.innerHTML = `
    <div class="page-head profile-head">
      ${avatar(profile.username, "avatar-xl")}
      <div>
        <h1>${esc(profile.username)}</h1>
        <p class="muted">${esc(t("Member since {date}", { date: date(profile.created_at, { month: "long", year: "numeric" }) }))}</p>
      </div>
      <span class="spacer"></span>
      ${action}
    </div>
    ${isFriend ? `
      <p class="profile-sentence">${t("{seen} seen, average rating {avg}, {list} on the watchlist.", {
        seen: `<strong>${seen.length}</strong>`, avg: `<strong>${avg}</strong>`, list: `<strong>${entries.length - seen.length}</strong>`,
      })}</p>
      <div class="segmented" role="tablist">
        <a href="${base}" role="tab" aria-selected="${tab === "seen"}">${esc(t("Seen"))}</a>
        <a href="${base}?tab=watchlist" role="tab" aria-selected="${tab === "watchlist"}">${esc(t("Watchlist"))}</a>
      </div>
      ${shown.length
        ? grid(shown.map((e) => card(entryToItem(e), { note: esc(e.rating ? t("Rated {n}", { n: e.rating }) : timeAgo(e.updated_at)) })))
        : empty(t("Nothing here yet"), "", "", "reel")}`
      : empty(t("Their lists are private"), esc(t("Only friends can see each other's ratings and watchlists.")), "", "friends")}`;

  el.querySelector("#add")?.addEventListener("click", async (e) => {
    e.target.disabled = true;
    try {
      await requestFriend(profile.id);
      toast(t("Friend request sent"), "good");
      profileView(ctx);
    } catch (err) {
      toast(errorMessage(err), "bad");
      e.target.disabled = false;
    }
  });
}
