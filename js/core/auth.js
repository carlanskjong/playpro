// Sign in, create account, forgot password, set new password.
import { signIn, signUp, sendPasswordReset, setPassword } from "../lib/db.js";
import { esc, toast, errorMessage } from "../lib/ui.js";
import { t, lang, setLang } from "../lib/i18n.js";

const brand = () => `
  <div class="auth-brand">
    <img src="icons/icon.svg" alt="" width="48" height="48">
    <h1>${esc(t("What should we watch tonight?"))}</h1>
    <p>${esc(t("Playpro shows where to stream it in Norway, and what your friends thought of it."))}</p>
  </div>`;

const langSwitch = () => `
  <button class="link" type="button" id="lang-switch">${lang === "nb" ? "English" : "Norsk"}</button>`;

function busy(form, on) {
  form.querySelectorAll("button, input").forEach((x) => (x.disabled = on));
  form.classList.toggle("is-busy", on);
}

const field = (id, label, input, hint = "") => `
  <div class="field">
    <label for="${id}">${esc(label)}</label>
    ${hint ? `<small id="${id}-hint">${esc(hint)}</small>` : ""}
    ${input.replace("<input", `<input id="${id}"${hint ? ` aria-describedby="${id}-hint"` : ""}`)}
  </div>`;

export async function loginView({ el, query }) {
  document.title = `${t("Sign in")} · Playpro`;
  let mode = query.get("mode") || "signin";

  const forms = {
    signin: () => `
      <form class="form" id="auth-form">
        ${field("email", t("Email"), `<input type="email" name="email" autocomplete="email" required>`)}
        ${field("password", t("Password"), `<input type="password" name="password" autocomplete="current-password" required>`)}
        <button class="btn btn-primary btn-block" type="submit">${esc(t("Sign in"))}</button>
        <button class="link" type="button" data-mode="forgot">${esc(t("Forgot password?"))}</button>
      </form>`,
    signup: () => `
      <form class="form" id="auth-form">
        ${field("username", t("Username"), `<input name="username" autocomplete="username" required pattern="[A-Za-z0-9_]{3,20}" maxlength="20">`, t("3 to 20 letters, numbers or _, and nothing rude. Other members can see it."))}
        ${field("email", t("Email"), `<input type="email" name="email" autocomplete="email" required>`, t("Only used to sign in. Nobody else sees it."))}
        ${field("password", t("Password"), `<input type="password" name="password" autocomplete="new-password" required minlength="8">`, t("At least 8 characters."))}
        ${field("invite", t("Invite code"), `<input name="invite" required autocomplete="off" autocapitalize="characters" value="${esc(query.get("invite") || "")}">`, t("Ask the person who sent you the link."))}
        <label class="check"><input type="checkbox" name="consent" required>
          <span>${t("I have read the {link} and want an account.", { link: `<a href="#/privacy" target="_blank">${esc(t("privacy notice"))}</a>` })}</span></label>
        <button class="btn btn-primary btn-block" type="submit">${esc(t("Create account"))}</button>
      </form>`,
    forgot: () => `
      <form class="form" id="auth-form">
        <p class="muted">${esc(t("Enter your email and we'll send you a link to choose a new password."))}</p>
        ${field("email", t("Email"), `<input type="email" name="email" autocomplete="email" required>`)}
        <button class="btn btn-primary btn-block" type="submit">${esc(t("Send reset link"))}</button>
        <button class="link" type="button" data-mode="signin">${esc(t("Back to sign in"))}</button>
      </form>`,
  };

  function render() {
    el.innerHTML = `
      <div class="auth">
        ${brand()}
        <div class="auth-card">
          ${mode !== "forgot" ? `
          <div class="segmented" role="tablist">
            <button role="tab" data-mode="signin" aria-selected="${mode === "signin"}">${esc(t("Sign in"))}</button>
            <button role="tab" data-mode="signup" aria-selected="${mode === "signup"}">${esc(t("Create account"))}</button>
          </div>` : `<h2>${esc(t("Reset password"))}</h2>`}
          ${forms[mode]()}
          <p class="form-error" id="auth-error" role="alert"></p>
        </div>
        <p class="auth-foot"><a href="#/privacy">${esc(t("Privacy"))}</a><a href="#/about">${esc(t("About"))}</a>${langSwitch()}</p>
      </div>`;
    el.querySelectorAll("[data-mode]").forEach((b) =>
      b.addEventListener("click", () => { mode = b.dataset.mode; render(); }),
    );
    el.querySelector("#lang-switch").addEventListener("click", () => setLang(lang === "nb" ? "en" : "nb"));
    const form = el.querySelector("#auth-form");
    const errorEl = el.querySelector("#auth-error");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.textContent = "";
      const f = Object.fromEntries(new FormData(form));
      busy(form, true);
      try {
        if (mode === "signin") {
          await signIn(f.email.trim(), f.password);
          // app.js notices the login and moves on to the app
        } else if (mode === "signup") {
          const result = await signUp({ email: f.email.trim(), password: f.password, username: f.username.trim(), inviteCode: f.invite.trim() });
          if (!result.session) {
            el.querySelector(".auth-card").innerHTML = `<h2>${esc(t("Check your email"))}</h2><p class="muted">${t("We sent a confirmation link to {email}. Open it on this device to finish.", { email: `<strong>${esc(f.email)}</strong>` })}</p>`;
          }
        } else {
          await sendPasswordReset(f.email.trim());
          el.querySelector(".auth-card").innerHTML = `<h2>${esc(t("Check your email"))}</h2><p class="muted">${t("If an account exists for {email}, a reset link is on its way. Open it on this device.", { email: `<strong>${esc(f.email)}</strong>` })}</p>`;
        }
      } catch (err) {
        errorEl.textContent = /invalid login/i.test(err.message) ? t("Wrong email or password.") : errorMessage(err);
        busy(form, false);
      }
    });
  }
  render();
}

export async function resetView({ el }) {
  document.title = `${t("New password")} · Playpro`;
  el.innerHTML = `
    <div class="auth">
      ${brand()}
      <div class="auth-card">
        <h2>${esc(t("Choose a new password"))}</h2>
        <form class="form" id="reset-form">
          ${field("new-password", t("New password"), `<input type="password" name="password" autocomplete="new-password" required minlength="8">`, t("At least 8 characters."))}
          <button class="btn btn-primary btn-block" type="submit">${esc(t("Save password"))}</button>
        </form>
        <p class="form-error" role="alert"></p>
      </div>
    </div>`;
  const form = el.querySelector("#reset-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    busy(form, true);
    try {
      await setPassword(new FormData(form).get("password"));
      toast(t("Password saved"), "good");
      location.hash = "#/";
    } catch (err) {
      el.querySelector(".form-error").textContent = errorMessage(err);
      busy(form, false);
    }
  });
}
