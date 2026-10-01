// FEATURE: Your year
// A page (#/stats) with what you watched in a year: how much, when, which
// genres, and your favourites. Linked from My list. Code loads when opened.
import { register, lazy } from "../../core/registry.js";

register({
  id: "stats",
  routes: [{ path: /^\/stats$/, view: lazy(() => import("./year.js")) }],
});
