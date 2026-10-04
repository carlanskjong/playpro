// Settings: account, language, feature settings (slot "settingsSections"), your data.
import { state } from "../lib/state.js";
import { updateProfile, exportMyData, deleteAccount, signOut } from "../lib/db.js";
import { renderSlot } from "./registry.js";
import { esc, avatar, toast, errorMessage, openDialog } from "../lib/ui.js";
import { t, lang, setLang } from "../lib/i18n.js";

export default async function settingsView({ el }) {
  document.title = `${t("Settings")} · Playpro`;
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
      <h2>${esc(t("Username"))}</h2>
      <form class="inline-form" id="username-form">
        <input name="username" id="username" value="${esc(p.username)}" required pattern="[A-Za-z0-9_]{3,20}" maxlength="20" aria-label="${esc(t("Username"))}">
        <button class="btn" type="submit">${esc(t("Save"))}</button>
      </form>
      <p class="muted small">${esc(t("Other members see this name when they look for friends."))}</p>
    </section>

    <section class="panel">
      <h2>${esc(t("Language"))}</h2>
      <div class="segmented" role="radiogroup" aria-label="${esc(t("Language"))}">
        <button type="button" role="radio" data-lang="nb" aria-checked="${lang === "nb"}">Norsk</button>
        <button type="button" role="radio" data-lang="en" aria-checked="${lang === "en"}">English</button>
      </div>
      <p class="muted small">${esc(t("Changes the app's buttons and menus, and movie descriptions where TMDB has them in Norwegian."))}</p>
    </section>

    <div id="feature-settings"></div>

    <section class="panel">
      <h2>${esc(t("Your data and privacy"))}</h2>
      <p class="muted">${t("You own your data. The {link} says exactly what is stored and who can see it.", { link: `<a href="#/privacy">${esc(t("privacy notice"))}</a>` })}</p>
      <div class="button-row">
        <button class="btn" id="export">${esc(t("Download my data"))}</button>
        <button class="btn btn-danger" id="delete">${esc(t("Delete my account"))}</button>
      </div>
    </section>

    <div class="button-row">
      <button class="btn btn-ghost" id="signout">${esc(t("Sign out"))}</button>
      <a class="btn btn-ghost" href="#/about">${esc(t("About Playpro"))}</a>
    </div>`;

  el.querySelector("#username-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = new FormData(e.target).get("username").trim();
    try {
      const before = p.username;
      await updateProfile({ username });
      const picture = state.avatars.get(before);
      if (picture) { state.avatars.delete(before); state.avatars.set(username, picture); }
      window.dispatchEvent(new Event("playpro:profile-changed"));
      toast(t("Username saved"), "good");
      settingsView({ el });
    } catch (err) {
      toast(errorMessage(err), "bad");
    }
  });

  el.querySelectorAll("[data-lang]").forEach((b) =>
    b.addEventListener("click", () => b.dataset.lang !== lang && setLang(b.dataset.lang)),
  );

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
      `<h2>${esc(t("Delete your account?"))}</h2>
       <p class="muted">${esc(t("This permanently deletes your login, lists, ratings, reviews, comments and friendships. It can't be undone."))}</p>
       <form class="form" id="del-form">
         <label for="del-confirm">${t("Type {name} to confirm", { name: `<strong>${esc(p.username)}</strong>` })}</label>
         <input name="confirm" id="del-confirm" autocomplete="off" required>
         <button class="btn btn-danger btn-block" type="submit">${esc(t("Delete everything"))}</button>
       </form>`,
      (dialog, close) => {
        dialog.querySelector("#del-form").addEventListener("submit", async (e) => {
          e.preventDefault();
          if (new FormData(e.target).get("confirm").trim() !== p.username) return toast(t("The name doesn't match"), "bad");
          try {
            await deleteAccount();
            close();
            toast(t("Your account and data are deleted"), "good");
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
