// FEATURE: Invite friends (administrator only)
// The administrator creates personal invite codes in Settings. Each code
// works once, for 7 days, and can be cancelled. The shared invite code in
// the database keeps working too. Rules live in supabase/schema.sql
// (private.admins, private.invites, create_invite, my_invites, revoke_invite).
import { register } from "../../core/registry.js";
import { sb, check } from "../../lib/db.js";
import { esc, toast, errorMessage, icon } from "../../lib/ui.js";
import { t, date } from "../../lib/i18n.js";

const isAdmin = async () => (await sb.rpc("am_i_admin")).data === true;
const day = (iso) => date(iso, { day: "numeric", month: "short" });

// The link fills in the code on the sign-up form.
const inviteLink = (code) => `${location.origin}${location.pathname}#/login?mode=signup&invite=${encodeURIComponent(code)}`;

function status(i) {
  if (i.used_at) return `<span class="invite-used">${esc(t("Used by {name}, {date}", { name: i.used_by || t("a deleted account"), date: day(i.used_at) }))}</span>`;
  if (i.revoked_at) return `<span class="muted">${esc(t("Cancelled"))}</span>`;
  if (new Date(i.expires_at) < new Date()) return `<span class="muted">${esc(t("Expired"))}</span>`;
  return `<span>${esc(t("Waiting, until {date}", { date: day(i.expires_at) }))}</span>
    <button class="link" type="button" data-invite-share="${esc(i.code)}">${esc(t("Share"))}</button>
    <button class="link link-danger" type="button" data-revoke="${esc(i.code)}">${esc(t("Cancel"))}</button>`;
}

const list = (invites) => invites.length
  ? `<ul class="invite-list">${invites.map((i) => `
      <li>
        <div><strong class="invite-code-small">${esc(i.code)}</strong>${i.note ? ` <span class="muted">${esc(i.note)}</span>` : ""}</div>
        <div class="invite-status">${status(i)}</div>
      </li>`).join("")}</ul>`
  : "";

async function share(code) {
  const text = t("Join me on Playpro! Open the link and create an account. Your invite code is {code}.", { code });
  const url = inviteLink(code);
  try {
    if (navigator.share) return await navigator.share({ title: "Playpro", text, url });
  } catch (err) { if (err.name === "AbortError") return; }
  await navigator.clipboard.writeText(`${text}\n${url}`);
  toast(t("Invite copied. Paste it in a message."), "good");
}

const invitesSettings = {
  order: 3,
  render: async () => {
    if (!(await isAdmin())) return "";
    const invites = check(await sb.rpc("my_invites"));
    return `
      <h2>${esc(t("Invite friends"))}</h2>
      <p class="muted">${esc(t("You're the administrator. Each invite code works for one person, for 7 days."))}</p>
      <form class="inline-form" id="invite-form">
        <input name="note" maxlength="60" autocomplete="off" placeholder="${esc(t("Who is it for? (optional)"))}" aria-label="${esc(t("Who is it for? (optional)"))}">
        <button class="btn btn-primary" type="submit">${icon.ticket}${esc(t("Create invite code"))}</button>
      </form>
      <div id="invite-new" aria-live="polite"></div>
      <div id="invite-list">${list(invites)}</div>`;
  },
  wire: (box) => {
    const form = box.querySelector("#invite-form");
    if (!form) return;
    const refresh = async () => { box.querySelector("#invite-list").innerHTML = list(check(await sb.rpc("my_invites"))); };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const button = form.querySelector("button");
      button.disabled = true;
      try {
        const code = check(await sb.rpc("create_invite", { note: form.note.value }));
        form.reset();
        box.querySelector("#invite-new").innerHTML = `
          <div class="invite-new">
            <p class="muted">${esc(t("New invite code"))}</p>
            <p class="invite-code">${esc(code)}</p>
            <button class="btn" type="button" data-invite-share="${esc(code)}">${icon.share}${esc(t("Share invite"))}</button>
          </div>`;
        await refresh();
      } catch (err) { toast(errorMessage(err), "bad"); }
      button.disabled = false;
    });
    box.addEventListener("click", async (e) => {
      const shareButton = e.target.closest("[data-invite-share]");
      const revokeButton = e.target.closest("[data-revoke]");
      try {
        if (shareButton) await share(shareButton.dataset.inviteShare);
        if (revokeButton) {
          check(await sb.rpc("revoke_invite", { invite: revokeButton.dataset.revoke }));
          toast(t("Invite code cancelled"));
          await refresh();
        }
      } catch (err) { toast(errorMessage(err), "bad"); }
    });
  },
};

register({
  id: "invites",
  settingsSections: [invitesSettings],
  exportData: [async () => ((await isAdmin()) ? { invite_codes_you_made: check(await sb.rpc("my_invites")) } : {})],
});
