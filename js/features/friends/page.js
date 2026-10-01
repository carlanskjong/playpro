// Page #/friends: find people, answer requests, see what friends are up to.
import { friendFeed, friendships, searchUsers, requestFriend, acceptFriend, removeFriendship } from "../../lib/db.js";
import { img } from "../../lib/tmdb.js";
import { esc, icon, avatar, empty, toast, errorMessage, timeAgo, confirmDialog } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";
import { userLink, describe } from "./index.js";

function feedList(rows) {
  return `
    <ul class="feed">
      ${rows.map((e) => `
        <li>
          <a class="feed-item" href="#/${e.media_type}/${e.tmdb_id}">
            ${avatar(e.profiles?.username)}
            <div class="feed-text">
              <p><strong>${esc(e.profiles?.username)}</strong> ${esc(describe(e))}: <strong>${esc(e.title)}</strong></p>
              ${e.review ? `<p class="feed-review">${esc(e.review)}</p>` : ""}
              <p class="muted small">${esc(timeAgo(e.updated_at))}</p>
            </div>
            ${e.poster_path ? `<img class="feed-poster" src="${img(e.poster_path, "w92")}" alt="" loading="lazy">` : ""}
          </a>
        </li>`).join("")}
    </ul>`;
}

export default async function friendsView({ el }) {
  document.title = `${t("Friends")} · Playpro`;
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
    <div class="page-head"><h1>${esc(t("Friends"))}</h1></div>

    <label class="searchbox">
      ${icon.search}
      <input type="search" id="find" placeholder="${esc(t("Find people by username…"))}" autocomplete="off" aria-label="${esc(t("Find people by username"))}">
    </label>
    <ul class="people" id="found"></ul>

    ${incoming.length ? `
      <section class="panel">
        <h2>${esc(t("Friend requests"))} <span class="count">${incoming.length}</span></h2>
        <ul class="people">${incoming.map((l) => person(l, `
          <button class="btn btn-small btn-primary" data-accept="${l.other.id}">${esc(t("Accept"))}</button>
          <button class="btn btn-small btn-ghost" data-remove="${l.other.id}">${esc(t("Decline"))}</button>`)).join("")}</ul>
      </section>` : ""}

    <div class="two-col">
      <section>
        <h2 class="subhead">${esc(t("Lately"))}</h2>
        ${feed.length ? feedList(feed) : empty(t("Nothing here yet"), esc(friends.length ? t("When your friends rate something, it shows up here.") : t("Add a friend to see what they're watching.")), "", "friends")}
      </section>
      <aside>
        <h2 class="subhead">${esc(t("Your friends"))} <span class="count">${friends.length}</span></h2>
        ${friends.length ? `<ul class="people">${friends.map((l) => person(l, `<button class="btn btn-small btn-ghost" data-remove="${l.other.id}" data-name="${esc(l.other.username)}">${esc(t("Remove"))}</button>`)).join("")}</ul>` : `<p class="muted">${esc(t("No friends yet. Search for their username above, or send them the app link and invite code."))}</p>`}
        ${outgoing.length ? `
          <h3 class="subhead small">${esc(t("Waiting for an answer"))}</h3>
          <ul class="people">${outgoing.map((l) => person(l, `<button class="btn btn-small btn-ghost" data-remove="${l.other.id}">${esc(t("Cancel"))}</button>`)).join("")}</ul>` : ""}
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
        toast(t("You're now friends"), "good");
      } else if (b.dataset.add) {
        await requestFriend(b.dataset.add);
        toast(t("Friend request sent"), "good");
      } else if (b.dataset.remove) {
        if (b.dataset.name && !(await confirmDialog(t("Remove {name} as a friend?", { name: b.dataset.name }), t("Remove")))) { b.disabled = false; return; }
        await removeFriendship(b.dataset.remove);
      }
      reload();
    } catch (err) {
      toast(/duplicate/i.test(err.message) ? t("There's already a request between you two") : errorMessage(err), "bad");
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
              const btn = s === "friends" ? `<span class="muted small">${esc(t("Friends"))}</span>`
                : s === "sent" ? `<span class="muted small">${esc(t("Requested"))}</span>`
                : s === "incoming" ? `<button class="btn btn-small btn-primary" data-accept="${u.id}">${esc(t("Accept"))}</button>`
                : `<button class="btn btn-small" data-add="${u.id}">${icon.plus}${esc(t("Add"))}</button>`;
              return person({ other: u }, btn);
            }).join("")
          : `<li class="muted">${esc(t("No one called “{q}”.", { q }))}</li>`;
      } catch (err) {
        found.innerHTML = `<li class="muted">${esc(errorMessage(err))}</li>`;
      }
    }, 300);
  });
}
