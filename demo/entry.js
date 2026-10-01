// Demo start-up: fake backend first, sign in to the sample account, then the real app.
import "./mock.js";

(async () => {
  const { sb } = await import("../js/lib/db.js");
  try { await sb.auth.signInWithPassword({ email: "carl@example.com", password: "demo" }); } catch (e) { console.warn(e); }
  await import("../js/core/app.js");
})();
