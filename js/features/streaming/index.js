// FEATURE: Norwegian streaming (the "PlayPilot" part)
//  - "Where to watch in Norway" on every title page
//  - a chip that says which of YOUR services has it
//  - pick your streaming services in Settings
//  - home rows with what's popular on your services
//  - Browse page (browse.js): everything streaming in Norway, by service,
//    genre and IMDb score
import { register, lazy } from "../../core/registry.js";
import { discover, img } from "../../lib/tmdb.js";
import { updateProfile } from "../../lib/db.js";
import { esc, icon, row, toast, errorMessage } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";
import { COUNTRY, myServices, norwegianProviders, availability } from "./shared.js";

const logo = (p, mine) => `
  <li class="provider ${mine ? "is-mine" : ""}">
    <img src="${img(p.logo_path, "w92")}" alt="" loading="lazy">
    <span>${esc(p.provider_name)}</span>
    ${mine ? `<span class="provider-mine" title="${esc(t("You have this"))}">${icon.check}</span>` : ""}
  </li>`;

// ---------- title page ----------

const whereToWatch = {
  order: 10,
  render: ({ data }) => {
    const a = availability(data["watch/providers"]?.results);
    const mine = new Set(myServices());
    const group = (label, list) => {
      const unique = [...new Map(list.map((p) => [p.provider_id, p])).values()];
      if (!unique.length) return "";
      unique.sort((x, y) => mine.has(y.provider_id) - mine.has(x.provider_id));
      return `<div class="wtw-group"><h3>${esc(label)}</h3><ul class="providers">${unique.map((p) => logo(p, mine.has(p.provider_id))).join("")}</ul></div>`;
    };
    const body = a && (a.stream.length || a.rent.length || a.buy.length)
      ? group(t("Stream"), a.stream) + group(t("Rent"), a.rent) + group(t("Buy"), a.buy)
      : `<p class="muted">${esc(t("Not available to stream, rent or buy in Norway right now."))}</p>`;
    return `
      <div class="section-head"><h2>${esc(t("Where to watch in Norway"))}</h2></div>
      ${body}
      <p class="attribution">${t("Streaming data from {link}", { link: `<a href="${esc(a?.link || "https://www.justwatch.com/no")}" target="_blank" rel="noopener">JustWatch</a>` })}</p>`;
  },
};

const onYourServiceChip = {
  order: 5,
  render: ({ data }) => {
    const a = availability(data["watch/providers"]?.results);
    if (!a?.stream.length) return "";
    const hit = a.stream.find((p) => myServices().includes(p.provider_id));
    if (hit) return `<span class="chip chip-good">${icon.play}${esc(t("On {service}", { service: hit.provider_name }))}</span>`;
    return `<span class="chip">${icon.play}${esc(t("Streams in Norway"))}</span>`;
  },
};

// ---------- settings: pick your services ----------

const servicesSettings = {
  order: 10,
  render: async () => {
    const list = await norwegianProviders();
    const mine = new Set(myServices());
    const top = list.slice(0, 24);
    const rest = list.slice(24).filter((p) => mine.has(p.provider_id));
    const tile = (p) => `
      <button type="button" class="service ${mine.has(p.provider_id) ? "on" : ""}" data-id="${p.provider_id}" aria-pressed="${mine.has(p.provider_id)}">
        <img src="${img(p.logo_path, "w92")}" alt="" loading="lazy"><span>${esc(p.provider_name)}</span>
      </button>`;
    return `
      <h2>${esc(t("Your streaming services"))}</h2>
      <p class="muted small">${esc(t("Pick what you pay for. Playpro then shows what you can watch right away."))}</p>
      <div class="services">${[...top, ...rest].map(tile).join("")}</div>
      <details class="more-services"><summary>${esc(t("Show all {n} services in Norway", { n: list.length }))}</summary>
        <div class="services">${list.slice(24).filter((p) => !mine.has(p.provider_id)).map(tile).join("")}</div>
      </details>`;
  },
  wire: (box) => {
    let timer;
    box.addEventListener("click", (e) => {
      const btn = e.target.closest(".service");
      if (!btn) return;
      const on = !btn.classList.contains("on");
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", on);
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const ids = [...box.querySelectorAll(".service.on")].map((b) => Number(b.dataset.id));
        try {
          await updateProfile({ services: [...new Set(ids)] });
          toast(t("Streaming services saved"), "good");
        } catch (err) {
          toast(errorMessage(err), "bad");
        }
      }, 600);
    });
  },
};

// ---------- home rows ----------

const homeOnMyServices = {
  order: 30,
  render: async () => {
    const services = myServices();
    if (!services.length) {
      return `
        <a class="promo" href="#/settings">
          <strong>${esc(t("Which streaming services do you have?"))}</strong>
          <span>${esc(t("Pick them once, and Playpro shows what you can watch right now."))}</span>
        </a>`;
    }
    const [movies, series] = await Promise.all([
      discover("movie", { providers: services, region: COUNTRY }),
      discover("tv", { providers: services, region: COUNTRY }),
    ]);
    return (
      row(t("Popular movies on your services"), movies.items, { more: "#/browse?type=movie" }) +
      row(t("Popular series on your services"), series.items, { more: "#/browse?type=tv" })
    );
  },
};

register({
  id: "streaming",
  routes: [{ path: /^\/browse$/, view: lazy(() => import("./browse.js")) }],
  nav: [{ href: "#/browse", label: t("Browse"), icon: icon.compass, order: 10 }],
  titleInfo: [onYourServiceChip],
  titleSections: [whereToWatch],
  homeRows: [homeOnMyServices],
  settingsSections: [servicesSettings],
});
