// FEATURE: "What should we watch tonight?"
// The ticket at the top of the home screen. It picks from your watchlist and
// your friends' watchlists, keeps only what streams on a service one of you
// has, and puts first what's on both lists and rated highest on IMDb.
// "Another one" moves to the next pick.
import { register } from "../../core/registry.js";
import { state } from "../../lib/state.js";
import { friendsWatchlists, sb, check } from "../../lib/db.js";
import { watchProviders } from "../../lib/tmdb.js";
import { imdbRatings } from "../../lib/ratings.js";
import { esc, icon, posterImg, kindAndYear, drawing, entryToItem } from "../../lib/ui.js";
import { t, num } from "../../lib/i18n.js";
import { availability, myServices } from "../streaming/shared.js";

async function picks() {
  const mine = [...state.entries.values()].filter((e) => e.status === "watchlist");
  const theirs = await friendsWatchlists().catch(() => []);
  // Friends' streaming services, to know who can play what.
  const friendIds = [...new Set(theirs.map((e) => e.user_id))];
  const friendServices = friendIds.length
    ? check(await sb.from("profiles").select("id, username, services").in("id", friendIds))
    : [];

  // One candidate per title, remembering whose list it is on.
  const byKey = new Map();
  for (const e of [...mine, ...theirs]) {
    const key = `${e.media_type}:${e.tmdb_id}`;
    const c = byKey.get(key) || { entry: e, item: entryToItem(e), on: [] };
    c.on.push(e.user_id === state.session.user.id ? "me" : e.profiles?.username || "?");
    c.item.imdbId ||= e.imdb_id;
    byKey.set(key, c);
  }
  const candidates = [...byKey.values()].slice(0, 60);

  const [streams, ratings] = await Promise.all([
    Promise.all(candidates.map((c) => watchProviders(c.item.type, c.item.id).catch(() => ({})))),
    imdbRatings(candidates.map((c) => c.item.imdbId)),
  ]);

  const me = new Set(myServices());
  const result = [];
  candidates.forEach((c, k) => {
    const a = availability(streams[k]);
    if (!a?.stream.length) return;
    const who = (p) => [
      me.has(p.provider_id) ? "me" : null,
      ...friendServices.filter((f) => (f.services || []).includes(p.provider_id)).map((f) => f.username),
    ].filter(Boolean);
    // Prefer a service the most of you have.
    const options = a.stream.map((p) => ({ p, who: who(p) })).filter((o) => o.who.length).sort((x, y) => y.who.length - x.who.length);
    if (!options.length) return;
    const imdb = ratings[k];
    const score = (c.on.length > 1 ? 10 : 0) + (options[0].who.length > 1 ? 3 : 0) + (imdb?.rating ?? 6);
    result.push({ ...c, service: options[0], imdb, score });
  });
  return result.sort((a, b) => b.score - a.score);
}

// "On both your watchlists" / "On anna's watchlist" / "On your watchlist"
function whyLine(pick) {
  if (pick.on.length > 1) return t("On both your watchlists");
  return pick.on[0] === "me" ? t("On your watchlist") : t("On {name}'s watchlist", { name: pick.on[0] });
}

function serviceLine({ p, who }) {
  if (who.length > 1) return t("On {service}, which you both have", { service: p.provider_name });
  if (who[0] === "me") return t("On {service}, which you have", { service: p.provider_name });
  return t("On {service}, which {name} has", { service: p.provider_name, name: who[0] });
}

function ticket(pick) {
  const { item } = pick;
  return `
    <a class="ticket" href="#/${item.type}/${item.id}">
      <span class="ticket-poster">${item.poster ? posterImg(item.poster, { sizes: "110px", eager: true }) : ""}</span>
      <span class="ticket-body">
        <strong class="ticket-title${item.title.length > 22 ? " long" : ""}">${esc(item.title)}</strong>
        <span class="ticket-service">${esc(serviceLine(pick.service))}</span>
        <span>${esc(whyLine(pick))}</span>
        <span class="ticket-meta">${esc(kindAndYear(item))}${pick.imdb ? `<b>IMDb ${num(pick.imdb.rating)}</b>` : ""}</span>
      </span>
    </a>`;
}

let lastPicks = [];

const tonight = {
  order: 0,
  noPlaceholder: true,
  render: async () => {
    const list = (lastPicks = await picks());
    const headline = `<h1 class="tonight-q">${esc(t("What should we watch tonight?"))}</h1>`;
    if (!list.length) {
      return `
        <div class="tonight-block">${headline}
        <div class="ticket ticket-empty">
          ${drawing.ticket}
          <p>${esc(t("Put a few titles on your watchlist, and pick your streaming services in Settings. Then Playpro picks something you can watch tonight."))}</p>
          <a class="btn btn-small" href="#/browse">${esc(t("Find something"))}</a>
        </div></div>`;
    }
    return `
      <div class="tonight-block">
        ${headline}
        <div class="tonight-pick">
          <div class="tonight">${ticket(list[0])}</div>
          ${list.length > 1 ? `<button class="btn btn-lamp" id="another">${icon.shuffle}${esc(t("Another one"))}</button>` : ""}
          <p class="tonight-count muted small">${esc(t(list.length === 1 ? "1 title you can watch tonight" : "{n} titles you can watch tonight", { n: list.length }))}</p>
        </div>
      </div>`;
  },
  wire: (box) => {
    const button = box.querySelector("#another");
    if (!button) return;
    const list = lastPicks;
    let index = 0;
    const holder = box.querySelector(".tonight");
    button.addEventListener("click", () => {
      index = (index + 1) % list.length;
      holder.classList.remove("flip");
      void holder.offsetWidth; // restart the animation
      holder.innerHTML = ticket(list[index]);
      holder.classList.add("flip");
    });
  },
};

register({
  id: "tonight",
  homeRows: [tonight],
});
