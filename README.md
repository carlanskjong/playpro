# Playpro 🍿

A free, private app for you and your friends that combines the best of **IMDb** (ratings, cast, your own 1–10 scores) and **PlayPilot** (where to stream it **in Norway**, filtered by the services you actually have). It's a PWA, so it installs on phones like a normal app, without any app store.

- **What should we watch tonight?** One tap picks something from both your watchlists that's streaming on your services.
- **Where to watch in Norway:** Netflix, Max, Viaplay, TV 2 Play, NRK TV, Disney+, Prime Video and others. Your own services are highlighted, and you're told when something on your watchlist arrives on one of them.
- **Browse** everything streaming in Norway by service, genre and IMDb score; see what's on in Norwegian cinemas, with premiere dates and a link to showtimes and tickets; and see new seasons and series coming to your services.
- **Ratings:** IMDb score (on every poster), Rotten Tomatoes score, and your friends' average.
- **Watchlist + "seen it"** with 1–10 ratings and short reviews, recommendations from what you loved, your own lists, and **Your year** in numbers. Bring your old ratings from IMDb or Letterboxd.
- **Friends:** friend requests, an activity feed, friends' reviews on every title, with reactions and comments.
- **Norsk eller English:** the app follows your phone's language; switch with the NO/EN button at the top. Search finds titles by their Norwegian, English or original name.
- **Privacy built in:** invite-only sign-up, no tracking, and buttons to download or delete your own data.
- **Plug-in features:** switch features on and off with one line (see [docs/FEATURES.md](docs/FEATURES.md)).

It costs **0 kr** to run, is published straight from GitHub, and doesn't touch your other Supabase or Netlify project.

---

## Why these services?

| Question | Answer |
|---|---|
| Is there a free IMDb API? | **No.** IMDb's official API is a paid enterprise product (via AWS). Their free "datasets" are huge daily files with no posters and aren't usable from a website. |
| Is there a PlayPilot API? | **No public one.** PlayPilot sells its data to businesses only. |
| So what does Playpro use? | **[TMDB](https://www.themoviedb.org)**: a free, community-run movie database (non-commercial use). Its "where to watch" data comes from **JustWatch**, the same kind of data PlayPilot shows. |
| IMDb ratings? | IMDb's free **[non-commercial ratings file](https://developer.imdb.com/non-commercial-datasets/)**. A free weekly GitHub job copies it into your own database, so no extra service sees your friends. |
| Rotten Tomatoes? | Rotten Tomatoes has **no free API** (licences are sold by Fandango) and its [terms of use](https://www.rottentomatoes.com/policies/terms-of-use) forbid copying from the site. The legal free source is **[Wikidata](https://www.wikidata.org)**, the open (CC0) database behind Wikipedia, which records Tomatometer scores with a date. The same weekly job copies those. Some titles are missing or have an older score, and the app always shows the date. |
| Accounts and database? | **[Supabase](https://supabase.com)** free plan, in a **new, separate project** in the EU. |
| Hosting? | **[GitHub Pages](https://pages.github.com)**: free, publishes straight from this repository, no extra account. **Not Netlify:** Netlify's free plan has one shared monthly allowance for your whole account, and every publish uses part of it, so Playpro could end up pausing your *other* site. |

---

## Setup: about 30–45 minutes, no coding

You'll create two free accounts (TMDB and Supabase), copy some keys, and switch on publishing in GitHub. Screens on these websites change now and then, so a button may have a slightly different name.

### Step 1: Get a TMDB key (movie data)

1. Create a free account at [themoviedb.org/signup](https://www.themoviedb.org/signup) and confirm your email.
2. Go to **Settings → API** ([direct link](https://www.themoviedb.org/settings/api)) and request an API key. Choose **Developer / Personal use**.
3. Fill in the form. For "Application URL", put `https://carlanskjong.github.io/playpro/`. For the description, write something like *"Private, non-commercial app for friends to track movies."*
4. Copy the **API Key** (the short one, *not* the long "Read Access Token").

### Step 2: Create a new Supabase project (accounts + database)

> ⚠️ **Create a NEW project. Never run Playpro's setup in your existing project.** Its sign-up rules would apply to your other app too.

1. Log in at [supabase.com/dashboard](https://supabase.com/dashboard) with your normal account. Click **New project**.
   - **Name:** `playpro`
   - **Database password:** click *Generate* and save it in your password manager.
   - **Region:** pick an **EU** region, e.g. *North EU (Stockholm)* or *Central EU (Frankfurt)*. This matters for GDPR.
   - The free plan allows **2 active projects**. If you already have 2, you'll need to pause one first.
2. When it's ready, open **SQL Editor → New query**.
3. Open [`supabase/schema.sql`](supabase/schema.sql) from this repository, copy everything, and paste it in.
4. Find the line with `popcorn-2026` and `<-- CHANGE ME`. Replace `popcorn-2026` with your own **invite code**; your friends need it to sign up.
5. Click **Run**. You should see "Success. No rows returned".
6. Go to **Authentication → Sign In / Providers → Email** and **turn off "Confirm email"**, then save.
   *Why:* Supabase's built-in email sender only delivers to your own team's addresses, a few per hour. With confirmation on, your friends would never get their email. (Want confirmation and "forgot password" emails? See *Optional extras* below.)
7. Go to **Project Settings → API** (or **Data API / API Keys**) and copy:
   - the **Project URL** (`https://xxxx.supabase.co`)
   - the **anon / publishable** key: this one goes in the app
   - the **secret / service_role** key: this one goes **only** into GitHub in the next step, never in the app

> **Updating later:** when Playpro gets new features that store data, run the whole `supabase/schema.sql` again the same way (copy everything, paste, Run). It only adds what's missing; your data and invite code stay. If Supabase warns about "destructive operations", choose **Run this query**: the warning is about the file replacing its own rules.

### Step 3: Switch on the weekly ratings import (IMDb + Rotten Tomatoes)

A small job on GitHub (free) copies IMDb ratings and Rotten Tomatoes scores into your database twice a week. As a bonus, this keeps your free Supabase project from going to sleep.

1. On GitHub, open this repository → **Settings → Secrets and variables → Actions → New repository secret**.
2. Add two secrets:
   - Name `SUPABASE_URL`, value: your Project URL
   - Name `SUPABASE_SERVICE_KEY`, value: the **secret / service_role** key
3. Go to the **Actions** tab. If GitHub asks, click **I understand my workflows, go ahead and enable them**.
4. Click **Import ratings → Run workflow**. After a few minutes it should show a green tick ✅. Click it to see how many titles were imported.

GitHub only runs (and shows) this job from the repository's **default branch** (Settings → General shows which one that is). The app is already on it.

Secrets are stored encrypted by GitHub and are never shown in the code or to visitors.

### Step 4: Put your keys in the app

1. On GitHub, open this repository and click the file **`js/config.js`**.
2. Click the ✏️ pencil icon ("Edit this file").
3. Replace the placeholder values in quotes with your keys, and put your name and email under `OWNER_NAME` / `OWNER_EMAIL` (the privacy notice shows these).
4. Click **Commit changes**.

> 🔓 Free GitHub Pages needs the repository to be **public**, so these keys are visible to anyone who looks. That's fine: the Supabase publishable key is designed to be public (the database's own rules decide what anyone can do), and the TMDB key is read-only; if it's ever misused, create a new one on TMDB. The things that must stay secret are **not** in the code: the invite code lives only in your database, and the secret Supabase key lives only in GitHub's encrypted secrets.

### Step 5: Publish it with GitHub Pages

1. On GitHub, open this repository → **Settings → Pages**.
2. Under **Build and deployment**:
   - **Source:** *Deploy from a branch*
   - **Branch:** `main` (the branch with the app; see *Renaming the branch* below if yours is still called `claude/imdb-playpilot-pwa-pvjzp7`), folder **/ (root)**
3. Click **Save**. After a minute or two the page shows your address: **https://carlanskjong.github.io/playpro/**
4. In **Supabase → Authentication → URL Configuration**, set **Site URL** to that address, add it under **Redirect URLs** too, and save.

Every time you change a file on GitHub, the new version goes live within a minute or two. (The repository contains an empty `.nojekyll` file; leave it, so GitHub publishes every file exactly as it is.)

### Step 6: Invite your friends 🎉

Send them the link and the invite code. They open the link, tap **Create account**, and add the app to their home screen:

- **iPhone:** open in Safari → Share button → **Add to Home Screen**
- **Android:** open in Chrome → ⋮ menu → **Install app**

Then everyone goes to **Settings** (tap your avatar) and ticks their streaming services.

---

## Keeping it free

- **Supabase pauses free projects after 7 days without any use.** The twice-weekly ratings import should keep it awake. If it's paused anyway, open the Supabase dashboard and click **Restore**. Nothing is lost.
- All limits are far above what a group of friends will use: Supabase allows 50,000 monthly users and 500 MB of data (the ratings use about 20 MB); GitHub Pages allows 100 GB of traffic a month (posters come from TMDB, not from your site); TMDB has no daily cap; GitHub Actions is free for public repositories.
- **GitHub switches off scheduled jobs in public repositories after 60 days without any commits.** GitHub emails you first. If it happens, go to **Actions → Import ratings → Enable workflow**, or just commit any small change now and then.
- Nothing requires a credit card.

## GDPR: what's built in, and what's on you

*This is practical guidance, not legal advice.*

**Built in:**
- Data stays in the EU (Supabase EU region).
- Minimal data: email, username, services, lists and ratings, plus an optional small profile picture. No real names or location.
- Invite-only sign-up with a consent checkbox that links to the privacy notice (in the app at `#/privacy`).
- Your data is private by default: only accepted friends see your ratings; other members only see your username.
- **Download my data** (right of access/portability) and **Delete my account** (right to erasure) buttons in Settings.
- No cookies, analytics, ads, Google Fonts or embedded YouTube players. Posters come from TMDB, and the privacy notice says so. IMDb and Rotten Tomatoes scores are stored in your own database, so those services never see your friends.
- The database rules are strict: every table has Row Level Security, and they were tested.

**Your part as the person running it:**
- IMDb's data file is licensed for **personal and non-commercial use only**, and their terms say it mustn't be used to build a movie database for others. Playpro stores only the rating and vote count, readable only by signed-in members of your private, invite-only group. That is a reasonable reading of "personal, non-commercial", but it is a grey area. Keep the app private and free; if IMDb ever objects, switch the feature off (one line) and delete the table.
- Fill in `OWNER_NAME` and `OWNER_EMAIL` in `js/config.js` and answer if someone emails you.
- Keep the invite code among friends. Change it anytime in Supabase (see the comment in `schema.sql`).
- **Usernames:** rude words are blocked (English and Norwegian, also spelled with numbers like "a55"). If someone finds a way around it, add the word in **Supabase → SQL Editor**: `insert into private.blocked_words (word) values ('theword');` (lowercase letters only). Anyone whose name contains it must pick a new one the next time they open the app. Add `, true` after the word (`values ('theword', true)`) to block it only as a whole word, for words that hide inside ordinary ones.
- Don't add tracking or analytics scripts.
- If you add a feature that stores new kinds of data, add a line about it to the privacy notice (`js/core/pages.js`).

## Optional extras

- **Emails (confirm sign-up, "forgot password"):** create a free account at an email service such as [Brevo](https://www.brevo.com) (300 emails/day free) or [Resend](https://resend.com) (3,000/month free). Put its SMTP details in **Supabase → Authentication → Emails → SMTP Settings**. Then you can turn "Confirm email" back on. Remember to list the email service in the privacy notice.
- **Your own domain:** GitHub → Settings → Pages → Custom domain (the domain itself costs money).

## Renaming the branch to `main` (optional, once)

The app was built on a branch with a long name. To rename it:

1. On GitHub, open this repository → **Settings → General**. Under **Default branch**, click the ✏️ pencil next to `claude/imdb-playpilot-pwa-pvjzp7`, type `main` and click **Rename branch**.
2. Open **Settings → Pages** and check that **Branch** now says `main`. If not, pick `main` and click **Save**.

Nothing else changes; the address stays the same.

## Checks on every change

Every time something changes on GitHub, an automatic check (**Actions → Check**) clicks through the whole app in an invisible browser, tests the database rules and checks that every text has a Norwegian version. A green tick ✅ next to a commit means everything works; a red cross ❌ means something broke, and GitHub emails you.

## Adding, removing and changing features

Every feature is a self-contained plug-in in `js/features/`. To remove one, put `//` in front of its line in [`js/features.js`](js/features.js). To add one, copy `js/features/_template`. The full guide is in [docs/FEATURES.md](docs/FEATURES.md).

## Where things are

```
index.html               the page that loads the app
js/config.js             ← your keys and settings (the only file you must edit)
js/features.js           ← feature on/off switchboard
js/features/             one folder per feature
  tonight/               "What should we watch tonight?"
  nowstreaming/          watchlist titles that arrived on your services
  streaming/             Norway: where to watch, your services, Browse page
  discover/              home banner, trending, cast, "more like this"
  recommendations/       "Picked for you"
  upcoming/              coming soon to your services, newest on your services
  cinema/                Norwegian cinemas: showing now, premieres, showtimes
  search/                search page
  mylist/                watchlist, ratings, reviews
  lists/                 your own lists
  stats/                 "Your year"
  importer/              import ratings from IMDb or Letterboxd
  friends/               friends, feed, profiles, comments and reactions
  share/                 share button
  profilepicture/        profile pictures
  imdb/                  IMDb ratings on posters and title pages
  rottentomatoes/        Rotten Tomatoes score (via Wikidata)
  _template/             copy this to make a new feature
js/core/                 the app's frame: navigation, home, title page, settings, login, privacy
js/lib/                  helpers: TMDB, Supabase, shared UI pieces, icons
js/lib/nb.js             all Norwegian texts
css/styles.css           all styling; colours are at the top
fonts/                   the two typefaces (free, self-hosted)
docs/DESIGN.md           the design plan
supabase/schema.sql      database setup (run it again to update)
scripts/import-ratings.mjs          the IMDb + Rotten Tomatoes import
.github/workflows/import-ratings.yml runs the import twice a week
.github/workflows/check.yml          the automatic check on every change
tests/                   the checks themselves
demo/                    the clickable demo with made-up data
sw.js, manifest.webmanifest, icons/   what makes it an installable app
CLAUDE.md                notes for Claude when working on the code
```

## Trying it on your own computer (optional)

In a terminal in this folder, run `python3 -m http.server 8000` and open <http://localhost:8000>. Add `http://localhost:8000` to Supabase's Redirect URLs first.

To run the checks yourself (needs [Node.js](https://nodejs.org)): `npm install`, `npx playwright install chromium`, then `npm test`. `npm run demo` builds the demo with made-up data into `demo/dist/`.

## Credits

This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability is provided by JustWatch. Information courtesy of IMDb (https://www.imdb.com). Used with permission. Rotten Tomatoes scores via Wikidata (CC0). Playpro is not affiliated with IMDb, Rotten Tomatoes, Fandango or PlayPilot.
