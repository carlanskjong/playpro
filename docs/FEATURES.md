# Features: how to add, remove and change them

Playpro is built as a small **core** plus **features** that plug into it.

- The **core** (`js/core/`) is the frame: menu, login, home page, title page and settings. It doesn't know about streaming, friends or ratings.
- Each **feature** (`js/features/<name>/index.js`) says *where* it wants to appear: a page, a menu link, a row on the home screen, a button on a title page, and so on.
- The **switchboard** (`js/features.js`) lists which features are on.

So one feature is always one folder plus one line in the switchboard.

## Switch a feature off

Open `js/features.js` and put `//` in front of the line:

```js
import "./features/streaming/index.js";
// import "./features/imdb/index.js";      ← IMDb chip is now gone everywhere
```

Commit, and the site updates. To switch it back on, remove the `//`.

## What each feature does

| Feature | Adds | Depends on |
|---|---|---|
| `tonight` | "What should we watch tonight?" ticket on the home screen: picks from both your watchlists, with "Another one" | `mylist`; best with `friends` and `streaming` |
| `nowstreaming` | "New on your services" row and a badge on watchlist posters that are streaming on your services | `mylist`, `streaming` |
| `streaming` | "Where to watch in Norway", "On Netflix" chip, service picker in Settings, "Popular on your services", **Browse** page (with an IMDb 7+ filter when `imdb` is on) | – |
| `discover` | Rotating home banner, trending rows, cast, "More like this" | – |
| `recommendations` | "Picked for you", based on what you rated 8 or higher | `mylist` |
| `upcoming` | **Browse → Coming soon** (new seasons and series coming to your services, films to stream or rent soon), "Coming to your services" and "Newest on your services" rows | `streaming` |
| `cinema` | **Browse → Cinema** (showing now in Norwegian cinemas, premiere calendar), "Coming to cinemas in Norway" row, "At the cinema" with a showtimes link on film pages | `streaming` |
| `search` | **Search** page | – |
| `mylist` | Watchlist and Rate buttons, **My list** page, "Your watchlist" row, badges on posters | – |
| `lists` | Your own lists ("Best of 2026"), visible to your friends | `mylist` |
| `stats` | **Your year**: titles per month, hours, genres, favourites | `mylist` |
| `importer` | Import your ratings from an IMDb or Letterboxd CSV export (Settings) | `mylist` |
| `friends` | **Friends** page, profiles, feed row, friends' ratings on titles, reactions and comments | `mylist` |
| `share` | Share button on title pages (phone share sheet, or copies the link) | – |
| `invites` | **Invite friends** in Settings for the administrator: single-use invite codes that last 7 days, with a share link | – |
| `profilepicture` | Upload a profile picture in Settings, shown instead of the letter everywhere | – |
| `imdb` | IMDb rating on posters and title pages, link to IMDb | the ratings import (README step 3) |
| `rottentomatoes` | Rotten Tomatoes score chip with date, link to RT | the ratings import (README step 3) |

Features that depend on another one simply hide their links when the other is switched off.

## Add a new feature

1. Copy the folder `js/features/_template` and rename it, e.g. `js/features/watch-party`.
2. Edit its `index.js`. Keep the parts you need and delete the rest.
3. Add a line to `js/features.js`: `import "./features/watch-party/index.js";`

### Where a feature can plug in ("slots")

| Slot | What it is | Shape |
|---|---|---|
| `routes` | A new page | `{ path: /^\/party$/, view: async ({ el, params, query }) => { el.innerHTML = "…" } }` |
| `nav` | A menu link | `{ href: "#/party", label: "Party", icon: icon.users, order: 50 }` |
| `homeRows` | A block on the home screen | `{ order: 25, render: async () => "html", wire?: (box) => {…} }` |
| `titleInfo` | A chip next to the ratings | same as `homeRows`; `render({ item, data, type, id })` |
| `titleActions` | A button under the title | same |
| `titleSections` | A section on the title page | same |
| `settingsSections` | A box on the Settings page | same |
| `onLogin` / `onLogout` | Code that runs when someone signs in or out | `async () => {…}` |
| `exportData` | Extra data for "Download my data" | `async () => ({ my_table: rows })` |

`order` decides the position (lower = higher up). Current home order: tonight 0, new on your services 10, banner 20, popular on your services 30, newest on your services 35, coming to your services 36, friends 40, picked for you 50, trending 60, cinemas 75, watchlist 80.

`render` returns HTML text. Return `""` to show nothing. `wire(box)` runs afterwards so you can add click handlers inside `box`. If a feature crashes, only its own box disappears; the rest of the page keeps working.

Big pages should load their code only when opened: `routes: [{ path: /^\/party$/, view: lazy(() => import("./page.js")) }]`, where `page.js` has `export default async function ({ el }) {…}`. The template shows how.

### Text and language

Write every text in English inside `t("…")` and add the Norwegian version to `js/lib/nb.js`. For counts use `plural(n, "{n} friend", "{n} friends")`. `npm test` fails if a Norwegian version is missing.

### Useful helpers

- `js/lib/tmdb.js`: `trending`, `search`, `discover`, `details`, `recommendations`, `releasesIn`, `releaseDate`, `seriesNext`, `discoverAll`, `providers`, `img(path, size)`; answers are cached on the phone
- `js/lib/db.js`: everything that reads or writes Supabase
- `js/lib/ui.js`: `card`, `row`, `grid`, `empty`, `icon`, `drawing`, `toast`, `openDialog`, `esc` (**always** wrap text from users or TMDB in `esc(...)`)
- `js/lib/i18n.js`: `t`, `plural`, `num`, `date`
- `js/core/registry.js`: `register`, `lazy`, `hasRoute`
- `js/lib/state.js`: who is logged in (`state.session`, `state.profile`) and their list

### If a feature needs to store new data

1. Add the table to `supabase/schema.sql`, written so the file can be run again (`create table if not exists`, `drop policy if exists` before `create policy`). **Always** turn on Row Level Security, add policies and grants; copy the pattern of the `lists` table.
2. Run the whole file again in Supabase (SQL Editor → paste → Run). Your data stays.
3. Add the functions that read and write it to the feature itself, or to `js/lib/db.js`.
4. Add the data to "Download my data" with the `exportData` slot, and make sure it's deleted with the account (`on delete cascade`).
5. Add a line to the privacy notice in `js/core/pages.js`.
6. Add checks to `tests/db.test.mjs` and teach the fake backend (`demo/mock.js`) about the table.

## Checking your changes

`npm test` checks translations, the database rules and clicks through the whole app in a headless browser. GitHub runs it on every push: a green tick on the commit means all is well, a red cross shows what broke.

## Ideas for later

- **Watch party:** friends vote on what to watch Friday
- **Leaving soon:** JustWatch knows, but TMDB doesn't pass it on yet
- **Series tracking:** which episode you're on
