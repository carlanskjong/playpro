// Reactions and comments on a rating (yours or a friend's), shown under each
// rating in the "Friends" section of a title page.
import { sb, check, uidOf } from "../../lib/db.js";
import { esc, avatar, timeAgo, toast, errorMessage } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";

export const KINDS = { like: "👍", love: "❤️", laugh: "😂", wow: "😮", popcorn: "🍿" };

// Everything said about every rating of one title, in two requests.
export async function loadTalk(type, id) {
  const [reactions, comments] = await Promise.all([
    sb.from("reactions").select("entry_user, kind, author, profiles!author(username)").eq("media_type", type).eq("tmdb_id", id).then(check),
    sb.from("comments").select("id, entry_user, author, body, created_at, profiles!author(username)").eq("media_type", type).eq("tmdb_id", id).order("created_at").then(check),
  ]);
  return { reactions, comments };
}

export function talkHtml(entryUser, talk) {
  const me = uidOf();
  const mine = talk.reactions.find((r) => r.entry_user === entryUser && r.author === me)?.kind;
  const button = (k) => {
    const who = talk.reactions.filter((r) => r.entry_user === entryUser && r.kind === k);
    return `<button type="button" class="react ${mine === k ? "on" : ""}" data-kind="${k}" aria-pressed="${mine === k}"
      title="${esc(who.map((r) => r.profiles?.username).join(", "))}">${KINDS[k]}${who.length ? `<span>${who.length}</span>` : ""}</button>`;
  };
  const used = Object.keys(KINDS).filter((k) => talk.reactions.some((r) => r.entry_user === entryUser && r.kind === k));
  const comments = talk.comments.filter((c) => c.entry_user === entryUser);
  return `
    <div class="talk" data-entry-user="${entryUser}">
      <div class="reacts">
        ${used.map(button).join("")}
        <button type="button" class="react react-open" data-open="picker" aria-expanded="false">${esc(t("React"))}</button>
        <button type="button" class="react react-open" data-open="comment" aria-expanded="false">${esc(t("Comment"))}</button>
      </div>
      <div class="picker" role="group" aria-label="${esc(t("React"))}" hidden>${Object.keys(KINDS).map(button).join("")}</div>
      ${comments.length ? `<ul class="comments">${comments.map((c) => `
        <li>${avatar(c.profiles?.username, "avatar-s")}<p><strong>${esc(c.profiles?.username)}</strong> ${esc(c.body)} <span class="when">${esc(timeAgo(c.created_at))}</span></p>
        ${c.author === me || entryUser === me ? `<button class="link small" data-delete-comment="${c.id}">${esc(t("Delete"))}</button>` : ""}</li>`).join("")}</ul>` : ""}
      <form class="comment-form" hidden>
        <input name="body" maxlength="500" required placeholder="${esc(t("Write a comment…"))}" aria-label="${esc(t("Write a comment"))}">
        <button class="btn btn-small" type="submit">${esc(t("Send"))}</button>
      </form>
    </div>`;
}

// One click handler for the whole section.
export function wireTalk(box, { type, id }, rerender) {
  box.addEventListener("click", async (e) => {
    const talkEl = e.target.closest(".talk");
    if (!talkEl) return;
    const entryUser = talkEl.dataset.entryUser;
    const open = e.target.closest("[data-open]");
    if (open) {
      const target = talkEl.querySelector(open.dataset.open === "picker" ? ".picker" : ".comment-form");
      target.hidden = !target.hidden;
      open.setAttribute("aria-expanded", String(!target.hidden));
      if (!target.hidden) target.querySelector("input")?.focus();
      return;
    }
    const react = e.target.closest("[data-kind]");
    const del = e.target.closest("[data-delete-comment]");
    try {
      if (react) {
        const wasOn = react.classList.contains("on");
        check(await sb.from("reactions").delete().eq("entry_user", entryUser).eq("media_type", type).eq("tmdb_id", id).eq("author", uidOf()));
        if (!wasOn) check(await sb.from("reactions").insert({ entry_user: entryUser, media_type: type, tmdb_id: id, kind: react.dataset.kind }));
        rerender();
      } else if (del) {
        check(await sb.from("comments").delete().eq("id", del.dataset.deleteComment));
        rerender();
      }
    } catch (err) { toast(errorMessage(err), "bad"); }
  });
  box.addEventListener("submit", async (e) => {
    const form = e.target.closest(".comment-form");
    if (!form) return;
    e.preventDefault();
    const body = new FormData(form).get("body").trim();
    if (!body) return;
    try {
      check(await sb.from("comments").insert({ entry_user: form.closest(".talk").dataset.entryUser, media_type: type, tmdb_id: id, body }));
      rerender();
    } catch (err) { toast(errorMessage(err), "bad"); }
  });
}
