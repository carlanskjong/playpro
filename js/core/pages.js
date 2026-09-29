// Static pages: privacy notice, about/credits, and the "not set up yet" screen.
import config from "../config.js";
import { esc } from "../lib/ui.js";

export function privacyView({ el }) {
  document.title = "Privacy · Playpro";
  el.innerHTML = `
    <article class="prose">
      <p class="eyebrow">Privacy notice</p>
      <h1>How Playpro handles your data</h1>
      <p>Playpro is a small, non-commercial app for a group of friends. There are no ads, no analytics and no tracking.</p>

      <h2>Who is responsible</h2>
      <p>${esc(config.OWNER_NAME)} runs Playpro and is responsible for your data (the "controller" under GDPR).
      Contact: <a href="mailto:${esc(config.OWNER_EMAIL)}">${esc(config.OWNER_EMAIL)}</a>.</p>

      <h2>What we store</h2>
      <ul>
        <li><strong>Account:</strong> your email address and password. The password is stored scrambled (hashed), so nobody can read it.</li>
        <li><strong>Profile:</strong> your username and which streaming services you have.</li>
        <li><strong>Your activity:</strong> titles on your watchlist, titles you've seen, your ratings and short reviews.</li>
        <li><strong>Friends:</strong> who you've sent or accepted friend requests to.</li>
      </ul>
      <p>We never ask for your real name, birthday, location or photos.</p>

      <h2>Why, and on what basis</h2>
      <p>Only to run the app you signed up for: logging you in, keeping your lists, and sharing ratings with the friends you choose
      (GDPR article 6(1)(b), providing a service you asked for). Nothing is sold, shared for marketing or used to profile you.</p>

      <h2>Who can see what</h2>
      <ul>
        <li>Other members can see your <strong>username</strong> so they can send you a friend request.</li>
        <li>Only <strong>friends you have accepted</strong> can see your lists, ratings and reviews.</li>
        <li>Nobody else can see your email address.</li>
      </ul>

      <h2>Services that help run Playpro</h2>
      <ul>
        <li><strong>Supabase</strong> stores accounts and data on servers in the EU (acting as our data processor).</li>
        <li><strong>The web host</strong> that serves the app's files sees normal technical data such as your IP address.</li>
        <li><strong>TMDB</strong> (themoviedb.org): your device fetches movie information, posters and streaming data directly from TMDB, so TMDB sees your IP address. We don't send them anything about you.</li>
        <li><strong>IMDb and Rotten Tomatoes scores</strong> are copied into our own database once a week (from IMDb's public data files and Wikidata). Your device never contacts IMDb or Wikidata for them.</li>
        <li>Trailer, IMDb and Rotten Tomatoes buttons open those websites in a new tab; their own privacy policies apply there.</li>
      </ul>

      <h2>Cookies and local storage</h2>
      <p>Playpro doesn't use cookies. It keeps your login and a small cache of movie ids in your browser's local storage.
      This is strictly necessary for the app to work, so no cookie banner is needed.</p>

      <h2>How long we keep it</h2>
      <p>Until you delete your account. Deleting it (Settings → Delete my account) removes your data immediately.</p>

      <h2>Your rights</h2>
      <ul>
        <li><strong>See and download</strong> your data: Settings → Download my data.</li>
        <li><strong>Correct</strong> it: change your username, lists and ratings at any time.</li>
        <li><strong>Delete</strong> it: Settings → Delete my account.</li>
        <li><strong>Object or ask questions:</strong> email ${esc(config.OWNER_EMAIL)}.</li>
        <li><strong>Complain</strong> to a data protection authority, in Norway <a href="https://www.datatilsynet.no" target="_blank" rel="noopener">Datatilsynet</a>.</li>
      </ul>
      <p class="muted small">Last updated ${new Date(document.lastModified).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}.</p>
    </article>`;
}

export function aboutView({ el }) {
  document.title = "About · Playpro";
  el.innerHTML = `
    <article class="prose">
      <p class="eyebrow">About</p>
      <h1>Playpro</h1>
      <p>A private, non-commercial app for friends: discover movies and series, see where to stream them in Norway, rate what you've seen, and compare notes.</p>
      <h2>Credits</h2>
      <div class="credit">
        <a class="tmdb-badge" href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </div>
      <div class="credit">
        <a class="jw-badge" href="https://www.justwatch.com" target="_blank" rel="noopener">JustWatch</a>
        <p>Streaming availability is provided by JustWatch through TMDB.</p>
      </div>
      <div class="credit">
        <a class="imdb-badge" href="https://www.imdb.com" target="_blank" rel="noopener">IMDb</a>
        <p>Information courtesy of IMDb (<a href="https://www.imdb.com" target="_blank" rel="noopener">https://www.imdb.com</a>). Used with permission. IMDb ratings come from IMDb's non-commercial datasets. Playpro is not affiliated with IMDb.</p>
      </div>
      <div class="credit">
        <a class="wd-badge" href="https://www.wikidata.org" target="_blank" rel="noopener">Wikidata</a>
        <p>Rotten Tomatoes scores come from Wikidata (CC0), with the date they were recorded. Playpro is not affiliated with Rotten Tomatoes or Fandango.</p>
      </div>
      <p><a href="#/privacy">Read the privacy notice</a></p>
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
