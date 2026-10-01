// The plug-in system.
//
// Every feature (see js/features.js) is a plain object that says where it
// wants to appear. The core app asks the registry "what goes in this spot?"
// and renders whatever the enabled features provide. Removing a feature from
// js/features.js removes all of its buttons, pages and sections at once.
//
// Spots ("slots") a feature can fill:
//   routes           pages:  { path: /^\/list$/, view: async ({ el, params, query }) => {} , public?: true }
//   nav              menu:   { href: "#/list", label: "My list", icon: "<svg>", order }
//   homeRows         rows on the home screen:        { order, render: async (ctx) => html, wire?(el, ctx) }
//   titleInfo        chips next to a title's rating:  same shape as homeRows
//   titleActions     buttons under a title:           same shape
//   titleSections    sections on a title page:        same shape
//   settingsSections sections on the settings page:  same shape
//   onLogin          async functions run after sign-in (e.g. load data)
//   onLogout         functions run after sign-out
//   exportData       async () => ({ name: rows }) added to "Download my data"
//
// Big pages can load their code only when opened: view: lazy(() => import("./page.js"))

const slots = {
  routes: [], nav: [], homeRows: [], titleInfo: [], titleActions: [],
  titleSections: [], settingsSections: [], onLogin: [], onLogout: [], exportData: [],
};

export const lazy = (load) => async (ctx) => (await load()).default(ctx);

export function register(feature) {
  for (const [slot, value] of Object.entries(feature)) {
    if (slot === "id") continue;
    if (!slots[slot]) {
      console.warn(`Feature "${feature.id}" uses unknown slot "${slot}"`);
      continue;
    }
    for (const item of [].concat(value)) slots[slot].push(typeof item === "function" ? item : { ...item, feature: feature.id });
  }
}

export function slot(name) {
  return [...slots[name]].sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
}

// Render every item of a slot into `container`. Each item gets its own box,
// so a slow or broken feature never blocks or breaks the rest of the page.
export async function renderSlot(name, container, ctx, { tag = "div", className = "", placeholder = "" } = {}) {
  const items = slot(name);
  const boxes = items.map((item) => {
    const box = document.createElement(tag);
    if (className) box.className = className;
    box.dataset.feature = item.feature;
    if (placeholder && !item.noPlaceholder) box.innerHTML = placeholder;
    container.appendChild(box);
    return box;
  });
  await Promise.all(
    items.map(async (item, i) => {
      const box = boxes[i];
      try {
        const html = await item.render(ctx);
        if (!html) return box.remove();
        box.innerHTML = html;
        item.wire?.(box, ctx);
      } catch (err) {
        console.error(`[${item.feature}]`, err);
        box.remove();
      }
    }),
  );
}

// Is there a page at this address? (Lets features link to each other only
// when the other feature is switched on.)
export const hasRoute = (path) => slot("routes").some((r) => r.path.test(path));
