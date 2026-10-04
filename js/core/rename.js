// Shown instead of every page when your username breaks Playpro's rules
// (for example a word added to the blocked list after you chose it). You
// can't use the app until you pick a new one.
import { sb, updateProfile } from "../lib/db.js";
import { state } from "../lib/state.js";
import { esc, errorMessage } from "../lib/ui.js";
import { t } from "../lib/i18n.js";

export default async function renameView({ el }) {
  document.title = `${t("Choose a new username")} · Playpro`;
  el.innerHTML = `
    <section class="rename">
      <h1>${esc(t("Choose a new username"))}</h1>
      <p class="muted">${esc(t("Your username doesn't follow Playpro's rules for names. Pick a new one to keep using the app. Your lists, ratings and friends stay as they are."))}</p>
      <form class="form" id="rename-form">
        <div class="field">
          <label for="new-username">${esc(t("New username"))}</label>
          <input id="new-username" name="username" autocomplete="username" required pattern="[A-Za-z0-9_]{3,20}" maxlength="20" autocapitalize="off" spellcheck="false">
          <small>${esc(t("3 to 20 letters, numbers or _, and nothing rude. Other members can see it."))}</small>
        </div>
        <p class="form-error" role="alert"></p>
        <button class="btn btn-primary btn-block" type="submit">${esc(t("Save username"))}</button>
      </form>
      <button class="btn btn-ghost" id="rename-signout">${esc(t("Sign out"))}</button>
    </section>`;

  const form = el.querySelector("#rename-form");
  const error = el.querySelector(".form-error");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    error.textContent = "";
    try {
      await updateProfile({ username: form.username.value.trim() });
      // Start fresh, so pictures and friends' lists pick up the new name.
      location.replace(location.pathname + "#/");
      location.reload();
    } catch (err) {
      error.textContent = errorMessage(err);
      button.disabled = false;
    }
  });
  el.querySelector("#rename-signout").addEventListener("click", () => sb.auth.signOut());
  if (state.profile) el.querySelector("#new-username").focus();
}
