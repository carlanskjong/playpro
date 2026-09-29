// FEATURE: Friends
//  - find friends by username, send / accept friend requests
//  - friends' ratings and reviews on every title page
//  - friends' average rating chip
//  - activity feed on the Friends page and the home screen
//  - profile pages (#/u/username)
// Needs the "mylist" feature (that's where ratings come from).
import { register } from "../../core/registry.js";
import { state } from "../../lib/state.js";
import {
  friendsOnTitle, friendFeed, friendships, searchUsers, requestFriend, acceptFriend,
  removeFriendship, profileByUsername, entriesOf,
} from "../../lib/db.js";
import { img } from "../../lib/tmdb.js";
import { esc, icon, avatar, row, grid, card, empty, toast, errorMessage, entryToItem, timeAgo } from "../../lib/ui.js";

const userLink = (username) => `<a class="user-link" href="#/u/${encodeURIComponent(username)}">${esc(username)}</a>`;

const describe = (e) =>
  e.status === "seen" ? (e.rating ? `rated <strong>${e.rating}/10</strong>` : "watched") : "wants to watch";

// ---------- title page ----------

// Both the chip and the section need the same data; fetch it once per page.
const onTitle = (ctx) => (ctx.friendsPromise ??= friendsOnTitle(ctx.type, ctx.id));

const friendsAverage = {
  order: 20,
  render: async (ctx) => {
    const rated = (await onTitle(ctx)).filter((r) => r.rating);
    if (!rated.length) return "";
    const avg = rated.reduce((s, r) => s + r.rating, 0) / rated.length;
    return `<span class="chip chip-friends">${icon.users}${avg.toFixed(1)}<small>${rated.length} friend${rated.length === 1 ? "" : "s"}</small></span>`;
  },
};

const friendsSection = {
  order: 20,
  render: async (ctx) => {
    const rows = await onTitle(ctx);
    if (!rows.length) return "";
    return `
      <div class="section-head"><h2>Friends</h2></div>
      <ul class="reviews">
        ${rows.map((r) => `
          <li class="review">
            ${avatar(r.profiles?.username)}
            <div>
              <p>${userLink(r.profiles?.username)} ${describe(r)} <span class="muted small">· ${timeAgo(r.updated_at)}</span></p>
              ${r.review ? `<blockquote>${esc(r.review)}</blockquote>` : ""}
            </div>
          </li>`).join("")}
      </ul>`;
  },
};

// ---------- feed ----------

function feedList(rows) {
  return `
    <ul class="feed">
      ${rows.map((e) => `
        <li>
          <a class="feed-item" href="#/${e.media_type}/${e.tmdb_id}">
            ${avatar(e.profiles?.username)}
            <div class="feed-text">
              <p><strong>${esc(e.profiles?.username)}</strong> ${describe(e)} <strong>${esc(e.title)}</strong></p>
              ${e.review ? `<p class="feed-review">“${esc(e.review)}”</p>` : ""}
              <p class="muted small">${timeAgo(e.updated_at)}</p>
            </div>
            ${e.poster_path ? `<img class="feed-poster" src="${img(e.poster_path, "w92")}" alt="" loading="lazy">` : ""}
          </a>
        </li>`).join("")}
    </ul>`;
}

const homeFeed = {
  order: 10,
  render: async () => {
    const rows = await friendFeed(20);
    if (!rows.length) {
      return `
        <a class="promo" href="#/friends">
          <span class="promo-icon">${icon.users}</span>
          <span><strong>Add your friends</strong><br><span class="muted">See what they're watching and how they rate it.</span></span>
        </a>`;
    }
    const cards = rows.map((e) =>
      card(entryToItem(e), { note: `${esc(e.profiles?.username)} · ${e.status === "seen" ? (e.rating ? `★ ${e.rating}` : "seen") : "wants to watch"}` }),
    );
    return row("Friends are watching", cards, { more: "#/friends" });
  },
};

// ---------- Friends page ----------

async function friendsView({ el }) {
  document.title = "Friends · Playpro";
  const [links, feed] = await Promise.all([friendships(), friendFeed(30)]);
  const incoming = links.filter((l) => l.status === "pending" && l.incoming);
  const outgoing = links.filter((l) => l.status === "pending" && !l.incoming);
  const friends = links.filter((l) => l.status === "accepted");
  const statusOf = new Map(links.map((l) => [l.other?.id, l.status === "accepted" ? "friends" : l.incoming ? "incoming" : "sent"]));

  const person = (l, buttons) => `
    <li class="person-row">
      ${avatar(l.other?.username)}
      ${userLink(l.other?.username)}
      <span class="spacer"></span>
      ${buttons}
    </li>`;

  // A fresh container each time, so click handlers never pile up on reload.
  const root = document.createElement("div");
  el.replaceChildren(root);
  root.innerHTML = `
    <div class="page-head"><h1>Friends</h1></div>

    <label class="searchbox">
      ${icon.search}
      <input type="search" id="find" placeholder="Find people by username…" autocomplete="off" aria-label="Find people by username">
    </label>
    <ul class="people" id="found"></ul>

    ${incoming.length ? `
      <section class="panel">
        <h2>Friend requests <span class="count">${incoming.length}</span></h2>
        <ul class="people">${incoming.map((l) => person(l, `
          <button class="btn btn-small btn-primary" data-accept="${l.other.id}">Accept</button>
          <button class="btn btn-small btn-ghost" data-remove="${l.other.id}">Decline</button>`)).join("")}</ul>
      </section>` : ""}

    <div class="two-col">
      <section>
        <h2 class="subhead">Activity</h2>
        ${feed.length ? feedList(feed) : empty("Nothing here yet", friends.length ? "When your friends rate something, it shows up here." : "Add a friend to see what they're watching.")}
      </section>
      <aside>
        <h2 class="subhead">Your friends <span class="count">${friends.length}</span></h2>
        ${friends.length ? `<ul class="people">${friends.map((l) => person(l, `<button class="btn btn-small btn-ghost" data-remove="${l.other.id}" data-name="${esc(l.other.username)}">Remove</button>`)).join("")}</ul>` : `<p class="muted">No friends yet. Search for their username above, or send them the app link and invite code.</p>`}
        ${outgoing.length ? `
          <h3 class="subhead small">Waiting for answer</h3>
          <ul class="people">${outgoing.map((l) => person(l, `<button class="btn btn-small btn-ghost" data-remove="${l.other.id}">Cancel</button>`)).join("")}</ul>` : ""}
      </aside>
    </div>`;

  const reload = () => friendsView({ el });

  root.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-accept],[data-remove],[data-add]");
    if (!b) return;
    b.disabled = true;
    try {
      if (b.dataset.accept) {
        await acceptFriend(b.dataset.accept);
        toast("You're now friends", "good");
      } else if (b.dataset.add) {
        await requestFriend(b.dataset.add);
        toast("Friend request sent", "good");
      } else if (b.dataset.remove) {
        if (b.dataset.name && !confirm(`Remove ${b.dataset.name} as a friend?`)) { b.disabled = false; return; }
        await removeFriendship(b.dataset.remove);
      }
      reload();
    } catch (err) {
      toast(/duplicate/i.test(err.message) ? "There's already a request between you two" : errorMessage(err), "bad");
      b.disabled = false;
    }
  });

  let timer;
  const found = root.querySelector("#found");
  root.querySelector("#find").addEventListener("input", (e) => {
    clearTimeout(timer);
    const q = e.target.value.trim();
    timer = setTimeout(async () => {
      if (q.length < 2) return (found.innerHTML = "");
      try {
        const users = await searchUsers(q);
        found.innerHTML = users.length
          ? users.map((u) => {
              const s = statusOf.get(u.id);
              const btn = s === "friends" ? `<span class="muted small">Friends</span>`
                : s === "sent" ? `<span class="muted small">Requested</span>`
                : s === "incoming" ? `<button class="btn btn-small btn-primary" data-accept="${u.id}">Accept</button>`
                : `<button class="btn btn-small" data-add="${u.id}">${icon.plus}Add</button>`;
              return person({ other: u }, btn);
            }).join("")
          : `<li class="muted">No one called “${esc(q)}”.</li>`;
      } catch (err) {
        found.innerHTML = `<li class="muted">${esc(errorMessage(err))}</li>`;
      }
    }, 300);
  });
}

// ---------- profile page ----------

async function profileView({ el, params: [username], query }) {
  const profile = await profileByUsername(decodeURIComponent(username));
  if (!profile) {
    el.innerHTML = empty("No such user", "Maybe they changed their username.");
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
  const avg = rated.length ? (rated.reduce((s, e) => s + e.rating, 0) / rated.length).toFixed(1) : "–";
  const shown = entries.filter((e) => e.status === tab);
  const base = `#/u/${encodeURIComponent(profile.username)}`;

  let action = "";
  if (!isMe && !link) action = `<button class="btn btn-primary" id="add">${icon.plus}Add friend</button>`;
  else if (link?.status === "pending") action = `<span class="chip">${link.incoming ? "Wants to be your friend – see Friends" : "Friend request sent"}</span>`;

  el.innerHTML = `
    <div class="page-head profile-head">
      ${avatar(profile.username, "avatar-xl")}
      <div>
        <h1>${esc(profile.username)}</h1>
        <p class="muted">Member since ${new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
      </div>
      <span class="spacer"></span>
      ${action}
    </div>
    ${isFriend ? `
      <div class="stats">
        <div><strong>${seen.length}</strong><span>seen</span></div>
        <div><strong>${avg}</strong><span>avg rating</span></div>
        <div><strong>${entries.length - seen.length}</strong><span>on watchlist</span></div>
      </div>
      <div class="segmented">
        <a href="${base}" aria-selected="${tab === "seen"}">Seen</a>
        <a href="${base}?tab=watchlist" aria-selected="${tab === "watchlist"}">Watchlist</a>
      </div>
      ${shown.length
        ? grid(shown.map((e) => card(entryToItem(e), { note: e.rating ? `★ ${e.rating}/10` : timeAgo(e.updated_at) })))
        : empty("Nothing here yet", "")}`
      : empty("Their lists are private", "Only friends can see each other's ratings and watchlists.")}`;

  el.querySelector("#add")?.addEventListener("click", async (e) => {
    e.target.disabled = true;
    try {
      await requestFriend(profile.id);
      toast("Friend request sent", "good");
      profileView({ el, params: [username], query });
    } catch (err) {
      toast(errorMessage(err), "bad");
      e.target.disabled = false;
    }
  });
}

register({
  id: "friends",
  routes: [
    { path: /^\/friends$/, view: friendsView },
    { path: /^\/u\/([^/?]+)$/, view: profileView },
  ],
  nav: [{ href: "#/friends", label: "Friends", icon: icon.users, order: 40 }],
  titleInfo: [friendsAverage],
  titleSections: [friendsSection],
  homeRows: [homeFeed],
});
