// Sign in, create account, forgot password, set new password.
import { signIn, signUp, sendPasswordReset, setPassword } from "../lib/db.js";
import { esc, toast, errorMessage } from "../lib/ui.js";

const brand = `
  <div class="auth-brand">
    <img src="icons/icon.svg" alt="" width="56" height="56">
    <h1>Playpro</h1>
    <p>Find out where to stream it in Norway, rate it, and see what your friends think.</p>
  </div>`;

function busy(form, on) {
  form.querySelectorAll("button, input").forEach((x) => (x.disabled = on));
  form.classList.toggle("is-busy", on);
}

export async function loginView({ el, query }) {
  document.title = "Sign in · Playpro";
  let mode = query.get("mode") || "signin";

  const forms = {
    signin: `
      <form class="form" id="auth-form">
        <label>Email<input type="email" name="email" autocomplete="email" required></label>
        <label>Password<input type="password" name="password" autocomplete="current-password" required></label>
        <button class="btn btn-primary btn-block" type="submit">Sign in</button>
        <button class="link" type="button" data-mode="forgot">Forgot password?</button>
      </form>`,
    signup: `
      <form class="form" id="auth-form">
        <label>Username <small>3–20 letters, numbers or _ · visible to other members</small>
          <input name="username" autocomplete="username" required pattern="[A-Za-z0-9_]{3,20}" maxlength="20"></label>
        <label>Email <small>only used for logging in, never shown to anyone</small>
          <input type="email" name="email" autocomplete="email" required></label>
        <label>Password <small>at least 8 characters</small>
          <input type="password" name="password" autocomplete="new-password" required minlength="8"></label>
        <label>Invite code <small>ask the person who sent you the link</small>
          <input name="invite" required autocomplete="off"></label>
        <label class="check"><input type="checkbox" name="consent" required>
          <span>I have read the <a href="#/privacy" target="_blank">privacy notice</a> and want an account.</span></label>
        <button class="btn btn-primary btn-block" type="submit">Create account</button>
      </form>`,
    forgot: `
      <form class="form" id="auth-form">
        <p class="muted">Enter your email and we'll send you a link to choose a new password.</p>
        <label>Email<input type="email" name="email" autocomplete="email" required></label>
        <button class="btn btn-primary btn-block" type="submit">Send reset link</button>
        <button class="link" type="button" data-mode="signin">Back to sign in</button>
      </form>`,
  };

  function render() {
    el.innerHTML = `
      <div class="auth">
        ${brand}
        <div class="auth-card">
          ${mode !== "forgot" ? `
          <div class="segmented" role="tablist">
            <button role="tab" data-mode="signin" aria-selected="${mode === "signin"}">Sign in</button>
            <button role="tab" data-mode="signup" aria-selected="${mode === "signup"}">Create account</button>
          </div>` : `<h2>Reset password</h2>`}
          ${forms[mode]}
          <p class="form-error" id="auth-error" role="alert"></p>
        </div>
        <p class="auth-foot"><a href="#/privacy">Privacy</a> · <a href="#/about">About</a></p>
      </div>`;
    el.querySelectorAll("[data-mode]").forEach((b) =>
      b.addEventListener("click", () => { mode = b.dataset.mode; render(); }),
    );
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
            el.querySelector(".auth-card").innerHTML = `<h2>Check your email</h2><p class="muted">We sent a confirmation link to <strong>${esc(f.email)}</strong>. Open it on this device to finish.</p>`;
          }
        } else {
          await sendPasswordReset(f.email.trim());
          el.querySelector(".auth-card").innerHTML = `<h2>Check your email</h2><p class="muted">If an account exists for <strong>${esc(f.email)}</strong>, a reset link is on its way. Open it on this device.</p>`;
        }
      } catch (err) {
        errorEl.textContent = /invalid login/i.test(err.message) ? "Wrong email or password." : errorMessage(err);
        busy(form, false);
      }
    });
  }
  render();
}

export async function resetView({ el }) {
  document.title = "New password · Playpro";
  el.innerHTML = `
    <div class="auth">
      ${brand}
      <div class="auth-card">
        <h2>Choose a new password</h2>
        <form class="form" id="reset-form">
          <label>New password <small>at least 8 characters</small>
            <input type="password" name="password" autocomplete="new-password" required minlength="8"></label>
          <button class="btn btn-primary btn-block" type="submit">Save password</button>
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
      toast("Password updated", "good");
      location.hash = "#/";
    } catch (err) {
      el.querySelector(".form-error").textContent = errorMessage(err);
      busy(form, false);
    }
  });
}
