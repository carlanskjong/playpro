// FEATURE: Friends
//  - find friends by username, send / accept friend requests (page.js)
//  - friends' ratings and reviews on every title page, with reactions and
//    comments (talk.js)
//  - friends' average rating chip
//  - activity row on the home screen; profile pages #/u/username (profile.js)
// Needs the "mylist" feature (that's where ratings come from).
import { register, lazy } from "../../core/registry.js";
import { state, myEntry } from "../../lib/state.js";
import { friendsOnTitle, friendFeed, sb, check, uidOf } from "../../lib/db.js";
import { esc, icon, avatar, row, card, entryToItem, timeAgo } from "../../lib/ui.js";
import { t, num, plural } from "../../lib/i18n.js";
import { loadTalk, talkHtml, wireTalk } from "./talk.js";

export const userLink = (username) => `<a class="user-link" href="#/u/${encodeURIComponent(username)}">${esc(username)}</a>`;

// "rated it 8" / "watched it" / "wants to watch it"
export const describe = (e) =>
  e.status === "seen" ? (e.rating ? t("rated it {n}", { n: e.rating }) : t("watched it")) : t("wants to watch it");

// ---------- title page ----------

// The chip and the section need the same data; fetch it once per page.
const onTitle = (ctx) => (ctx.friendsPromise ??= friendsOnTitle(ctx.type, ctx.id));

const friendsAverage = {
  order: 20,
  render: async (ctx) => {
    const rated = (await onTitle(ctx)).filter((r) => r.rating);
    if (!rated.length) return "";
    const avg = rated.reduce((s, r) => s + r.rating, 0) / rated.length;
    return `<span class="chip chip-friends" title="${esc(t("Average rating from your friends"))}">${icon.users}${num(avg)}<small>${esc(plural(rated.length, "{n} friend", "{n} friends"))}</small></span>`;
  },
};

async function sectionHtml(ctx) {
  const friends = await onTitle(ctx);
  const mine = myEntry(ctx.type, ctx.id);
  const rows = [
    ...(mine?.status === "seen" ? [{ ...mine, user_id: uidOf(), profiles: { username: state.profile?.username }, me: true }] : []),
    ...friends,
  ];
  if (!rows.length) return "";
  const talk = await loadTalk(ctx.type, ctx.id);
  return `
    <div class="section-head"><h2>${esc(t("What you thought"))}</h2></div>
    <ul class="reviews">
      ${rows.map((r) => `
        <li class="review">
          ${avatar(r.profiles?.username)}
          <div class="review-body">
            <p>${r.me ? `<strong>${esc(t("You"))}</strong>` : userLink(r.profiles?.username)} ${esc(describe(r))} <span class="when">${esc(timeAgo(r.updated_at))}</span></p>
            ${r.review ? `<blockquote>${esc(r.review)}</blockquote>` : ""}
            ${r.status === "seen" ? talkHtml(r.user_id, talk) : ""}
          </div>
        </li>`).join("")}
    </ul>`;
}

const friendsSection = {
  order: 20,
  render: sectionHtml,
  wire: (box, ctx) => wireTalk(box, ctx, async () => { box.innerHTML = await sectionHtml(ctx); }),
};

// ---------- home row ----------

const homeFeed = {
  order: 40,
  render: async () => {
    const rows = await friendFeed(20);
    if (!rows.length) {
      return `
        <a class="promo" href="#/friends">
          <strong>${esc(t("Add your friend"))}</strong>
          <span>${esc(t("See what they're watching and what they thought of it."))}</span>
        </a>`;
    }
    const cards = rows.map((e) => card(entryToItem(e), { note: esc(`${e.profiles?.username} ${describe(e)}`) }));
    return row(t("Your friends lately"), cards, { more: "#/friends" });
  },
};

register({
  id: "friends",
  routes: [
    { path: /^\/friends$/, view: lazy(() => import("./page.js")) },
    { path: /^\/u\/([^/?]+)$/, view: lazy(() => import("./profile.js")) },
  ],
  nav: [{ href: "#/friends", label: t("Friends"), icon: icon.users, order: 40 }],
  titleInfo: [friendsAverage],
  titleSections: [friendsSection],
  homeRows: [homeFeed],
  exportData: [async () => ({
    comments: check(await sb.from("comments").select("body, created_at, media_type, tmdb_id").eq("author", uidOf())),
    reactions: check(await sb.from("reactions").select("kind, created_at, media_type, tmdb_id").eq("author", uidOf())),
  })],
});
