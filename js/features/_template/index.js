// FEATURE TEMPLATE: copy this folder to start a new feature.
//
// 1. Copy js/features/_template to js/features/my-feature
// 2. Change the code below
// 3. Add this line to js/features.js:
//      import "./features/my-feature/index.js";
//
// Delete any part you don't need. Each part is optional.
// Wrap every text people see in t("…") and add its Norwegian version to
// js/lib/nb.js (`npm test` lists the ones that are missing).
import { register, lazy } from "../../core/registry.js";
import { esc, icon } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";

register({
  id: "template",

  // New pages. lazy() loads the page's code the first time someone opens it.
  // (For a small page you can also write the function right here.)
  routes: [{ path: /^\/hello$/, view: lazy(() => import("./page.js")) }],

  // Menu link (bottom bar on phones, top bar on computers)
  nav: [{ href: "#/hello", label: t("Hello"), icon: icon.star, order: 50 }],

  // A row on the home screen. `order` decides where it goes (see docs/FEATURES.md).
  homeRows: [{ order: 45, render: async () => `<p class="muted">${esc(t("A row from the template feature."))}</p>` }],

  // Something on every movie/series page. You get the TMDB data for the title.
  titleSections: [{
    order: 60,
    render: async ({ item, data }) =>
      `<div class="section-head"><h2>${esc(t("Fun fact"))}</h2></div>
       <p>${esc(t("{title} has {n} credited actors.", { title: item.title, n: data.credits?.cast?.length || 0 }))}</p>`,
  }],
});
