// FEATURE TEMPLATE: copy this folder to start a new feature.
//
// 1. Copy js/features/_template to js/features/my-feature
// 2. Change the code below
// 3. Add this line to js/features.js:
//      import "./features/my-feature/index.js";
//
// Delete any part you don't need. Each part is optional.
import { register } from "../../core/registry.js";
import { esc, icon } from "../../lib/ui.js";

// A whole new page, reachable at #/hello
async function helloView({ el }) {
  document.title = "Hello · Playpro";
  el.innerHTML = `<div class="page-head"><h1>Hello!</h1><p class="muted">This page comes from the template feature.</p></div>`;
}

register({
  id: "template",

  // New pages
  routes: [{ path: /^\/hello$/, view: helloView }],

  // Menu link (bottom bar on phones, top bar on computers)
  nav: [{ href: "#/hello", label: "Hello", icon: icon.star, order: 50 }],

  // A row on the home screen. `order` decides where it goes
  // (hero = 0, friends = 10, your services = 20, trending = 30, watchlist = 40).
  homeRows: [{ order: 35, render: async () => `<p class="muted">A row from the template feature.</p>` }],

  // Something on every movie/series page. You get the TMDB data for the title.
  titleSections: [{
    order: 60,
    render: async ({ item, data }) =>
      `<div class="section-head"><h2>Fun fact</h2></div><p>${esc(item.title)} has ${data.credits?.cast?.length || 0} credited actors.</p>`,
  }],
});
