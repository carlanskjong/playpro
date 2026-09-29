// Settings: account, feature settings (slot "settingsSections"), your data.
import { state } from "../lib/state.js";
import { updateProfile, exportMyData, deleteAccount, signOut } from "../lib/db.js";
import { renderSlot } from "./registry.js";
import { esc, avatar, toast, errorMessage, openDialog } from "../lib/ui.js";

export default async function settingsView({ el }) {
  document.title = "Settings · Playpro";
  const p = state.profile || { username: "" };
  el.innerHTML = `
    <div class="page-head profile-head">
      ${avatar(p.username, "avatar-xl")}
      <div>
        <h1>${esc(p.username)}</h1>
        <p class="muted">${esc(state.session.user.email)}</p>
      </div>
    </div>

    <section class="panel">
      <h2>Username</h2>
      <form class="inline-form" id="username-form">
        <input name="username" value="${esc(p.username)}" required pattern="[A-Za-z0-9_]{3,20}" maxlength="20" aria-label="Username">
        <button class="btn" type="submit">Save</button>
      </form>
      <p class="muted small">Other members see this name when they look for friends.</p>
    </section>

    <div id="feature-settings"></div>

    <section class="panel">
      <h2>Your data &amp; privacy</h2>
      <p class="muted">You own your data. Read the <a href="#/privacy">privacy notice</a> to see exactly what is stored and who can see it.</p>
      <div class="button-row">
        <button class="btn" id="export">Download my data</button>
        <button class="btn btn-danger" id="delete">Delete my account</button>
      </div>
    </section>

    <section class="panel">
      <div class="button-row">
        <button class="btn btn-ghost" id="signout">Sign out</button>
        <a class="btn btn-ghost" href="#/about">About Playpro</a>
      </div>
    </section>`;

  el.querySelector("#username-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = new FormData(e.target).get("username").trim();
    try {
      await updateProfile({ username });
      toast("Username saved", "good");
      settingsView({ el });
    } catch (err) {
      toast(/duplicate|unique/i.test(err.message) ? "That username is taken" : errorMessage(err), "bad");
    }
  });

  el.querySelector("#export").addEventListener("click", async () => {
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `playpro-${p.username}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (err) {
      toast(errorMessage(err), "bad");
    }
  });

  el.querySelector("#delete").addEventListener("click", () => {
    openDialog(
      `<h2>Delete your account?</h2>
       <p class="muted">This permanently deletes your login, your lists, ratings, reviews and friendships. It can't be undone.</p>
       <form class="form" id="del-form">
         <label>Type <strong>${esc(p.username)}</strong> to confirm<input name="confirm" autocomplete="off" required></label>
         <button class="btn btn-danger btn-block" type="submit">Delete everything</button>
       </form>`,
      (dialog, close) => {
        dialog.querySelector("#del-form").addEventListener("submit", async (e) => {
          e.preventDefault();
          if (new FormData(e.target).get("confirm").trim() !== p.username) return toast("The name doesn't match", "bad");
          try {
            await deleteAccount();
            close();
            toast("Your account and data are deleted", "good");
          } catch (err) {
            toast(errorMessage(err), "bad");
          }
        });
      },
    );
  });

  el.querySelector("#signout").addEventListener("click", () => signOut());

  await renderSlot("settingsSections", el.querySelector("#feature-settings"), {}, { tag: "section", className: "panel" });
}
