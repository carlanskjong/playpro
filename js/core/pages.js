// Static pages: privacy notice, about/credits, and the "not set up yet" screen.
// (Sentences here contain a little HTML; they are written by us, not by users.)
import config from "../config.js";
import { esc } from "../lib/ui.js";
import { t, locale } from "../lib/i18n.js";

export function privacyView({ el }) {
  document.title = `${t("Privacy")} · Playpro`;
  const owner = esc(config.OWNER_NAME);
  const email = esc(config.OWNER_EMAIL);
  el.innerHTML = `
    <article class="prose">
      <h1>${t("How Playpro handles your data")}</h1>
      <p>${t("Playpro is a small, non-commercial app for a group of friends. There are no ads, no analytics and no tracking.")}</p>

      <h2>${t("Who is responsible")}</h2>
      <p>${t("{owner} runs Playpro and is responsible for your data (the \"controller\" under GDPR). Contact: {email}.", { owner, email: `<a href="mailto:${email}">${email}</a>` })}</p>

      <h2>${t("What we store")}</h2>
      <ul>
        <li>${t("<strong>Account:</strong> your email address and password. The password is stored scrambled (hashed), so nobody can read it.")}</li>
        <li>${t("<strong>Profile:</strong> your username, which streaming services you have, and a profile picture if you choose to add one (shrunk to a small square before it's saved).")}</li>
        <li>${t("<strong>Your activity:</strong> your watchlist, what you've seen and when, your ratings and short reviews, lists you make, and comments and reactions you add.")}</li>
        <li>${t("<strong>Friends:</strong> who you've sent or accepted friend requests to.")}</li>
      </ul>
      <p>${t("We never ask for your real name, birthday or location. A profile picture is optional, and you can remove it at any time in Settings.")}</p>

      <h2>${t("Why, and on what basis")}</h2>
      <p>${t("Only to run the app you signed up for: signing you in, keeping your lists, and sharing ratings with the friends you choose (GDPR article 6(1)(b), providing a service you asked for). Nothing is sold, shared for marketing or used to profile you.")}</p>

      <h2>${t("Who can see what")}</h2>
      <ul>
        <li>${t("Other members can see your <strong>username</strong> and <strong>profile picture</strong> so they can find you and send you a friend request.")}</li>
        <li>${t("Only <strong>friends you have accepted</strong> can see your watchlist, ratings, reviews, shared lists, and the comments and reactions on your ratings.")}</li>
        <li>${t("Lists you mark as private are only visible to you. Nobody else can see your email address.")}</li>
      </ul>

      <h2>${t("Services that help run Playpro")}</h2>
      <ul>
        <li>${t("<strong>Supabase</strong> stores accounts and data on servers in the EU (acting as our data processor).")}</li>
        <li>${t("<strong>GitHub Pages</strong>, which serves the app's files, sees normal technical data such as your IP address.")}</li>
        <li>${t("<strong>TMDB</strong> (themoviedb.org): your device fetches movie information, posters and streaming data directly from TMDB, so TMDB sees your IP address. We don't send them anything about you.")}</li>
        <li>${t("<strong>IMDb and Rotten Tomatoes scores</strong> are copied into our own database twice a week (from IMDb's public data files and Wikidata). Your device never contacts IMDb or Wikidata for them.")}</li>
        <li>${t("Trailer, IMDb and Rotten Tomatoes buttons open those websites in a new tab; their own privacy policies apply there.")}</li>
      </ul>

      <h2>${t("Cookies and local storage")}</h2>
      <p>${t("Playpro doesn't use cookies. Your browser keeps your login, your language choice and a copy of movie information (so the app opens faster). This is strictly necessary for the app to work, so no cookie banner is needed.")}</p>

      <h2>${t("How long we keep it")}</h2>
      <p>${t("Until you delete your account. Deleting it (Settings, then Delete my account) removes your data immediately.")}</p>

      <h2>${t("Your rights")}</h2>
      <ul>
        <li>${t("<strong>See and download</strong> your data: Settings, then Download my data.")}</li>
        <li>${t("<strong>Correct</strong> it: change your username, lists and ratings at any time.")}</li>
        <li>${t("<strong>Delete</strong> it: Settings, then Delete my account.")}</li>
        <li>${t("<strong>Object or ask questions:</strong> email {email}.", { email })}</li>
        <li>${t("<strong>Complain</strong> to a data protection authority, in Norway {link}.", { link: '<a href="https://www.datatilsynet.no" target="_blank" rel="noopener">Datatilsynet</a>' })}</li>
      </ul>
      <p class="muted small">${t("Last updated {date}.", { date: new Date(document.lastModified).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" }) })}</p>
    </article>`;
}

export function aboutView({ el }) {
  document.title = `${t("About")} · Playpro`;
  el.innerHTML = `
    <article class="prose">
      <h1>Playpro</h1>
      <p>${t("A private, non-commercial app for friends: find something to watch tonight, see where it streams in Norway, rate what you've seen and compare notes.")}</p>
      <h2>${t("Credits")}</h2>
      <div class="credit">
        <a class="badge-tmdb" href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </div>
      <div class="credit">
        <a class="badge-jw" href="https://www.justwatch.com" target="_blank" rel="noopener">JustWatch</a>
        <p>${t("Streaming availability is provided by JustWatch through TMDB.")}</p>
      </div>
      <div class="credit">
        <a class="badge-imdb" href="https://www.imdb.com" target="_blank" rel="noopener">IMDb</a>
        <p>Information courtesy of IMDb (<a href="https://www.imdb.com" target="_blank" rel="noopener">https://www.imdb.com</a>). Used with permission. ${t("IMDb ratings come from IMDb's non-commercial datasets. Playpro is not affiliated with IMDb.")}</p>
      </div>
      <div class="credit">
        <a class="badge-wd" href="https://www.wikidata.org" target="_blank" rel="noopener">Wikidata</a>
        <p>${t("Rotten Tomatoes scores come from Wikidata (CC0), with the date they were recorded. Playpro is not affiliated with Rotten Tomatoes or Fandango.")}</p>
      </div>
      <p>${t("Typefaces: Anybody and Familjen Grotesk, under the SIL Open Font License.")}</p>
      <p><a href="#/privacy">${t("Read the privacy notice")}</a></p>
    </article>`;
}

export function setupView({ el }) {
  document.title = "Set up Playpro";
  el.innerHTML = `
    <article class="prose setup">
      <img src="icons/icon.svg" alt="" width="64" height="64">
      <h1>Almost there</h1>
      <p>Playpro is running, but it doesn't have its keys yet. Open <code>js/config.js</code> and fill in:</p>
      <ol>
        <li><strong>SUPABASE_URL</strong> and <strong>SUPABASE_ANON_KEY</strong> from your <em>new</em> Supabase project.</li>
        <li><strong>TMDB_API_KEY</strong> from themoviedb.org.</li>
      </ol>
      <p>The step-by-step guide is in <code>README.md</code>.</p>
    </article>`;
}
