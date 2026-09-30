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
| `streaming` | "Where to watch in Norway", "On Netflix" chip, service picker in Settings, "Popular on your services" rows, **Browse** page | – |
| `discover` | Home banner, trending rows, cast, "More like this" | – |
| `search` | **Search** page | – |
| `mylist` | Watchlist and Rate buttons, **My list** page, "Your watchlist" row, badges on posters | – |
| `friends` | **Friends** page, profiles, feed row, friends' ratings on titles | `mylist` (ratings come from there) |
| `profilepicture` | Upload a profile picture in Settings, shown instead of the letter everywhere | – |
| `imdb` | IMDb rating on posters and title pages, link to IMDb | the ratings import (README step 3) |
| `rottentomatoes` | Rotten Tomatoes score chip with date, link to RT | the ratings import (README step 3) |

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

`order` decides the position (lower = higher up). Current home order: banner 0, friends 10, your services 20, trending 30, watchlist 40.

`render` returns HTML text. Return `""` to show nothing. `wire(box)` runs afterwards so you can add click handlers inside `box`. If a feature crashes, only its own box disappears; the rest of the page keeps working.

### Useful helpers

- `js/lib/tmdb.js`: `trending`, `search`, `discover`, `details`, `providers`, `img(path, size)`
- `js/lib/db.js`: everything that reads or writes Supabase
- `js/lib/ui.js`: `card`, `row`, `grid`, `icon`, `toast`, `openDialog`, `esc` (**always** wrap text from users or TMDB in `esc(...)`)
- `js/lib/state.js`: who is logged in (`state.session`, `state.profile`) and their list

### If a feature needs to store new data

1. Add a table in Supabase (SQL Editor). **Always** turn on Row Level Security and add policies; copy the pattern from `supabase/schema.sql`.
2. Add the functions that read and write it to the feature itself, or to `js/lib/db.js`.
3. Include the new data in `exportMyData()` in `js/lib/db.js`, and make sure it's deleted with the account (`on delete cascade`).
4. Add a line to the privacy notice in `js/core/pages.js`.

## Ideas for later

- **Leaving soon / new this week in Norway:** TMDB `discover` sorted by date, per service
- **Watch party:** friends vote on what to watch Friday
- **Lists:** "Best of 2026", shareable with friends
- **Import your own IMDb ratings:** IMDb lets you export your ratings as a CSV; a feature could read that file
- **Sort Browse by IMDb score:** the ratings are in your database now, so a feature could re-sort what TMDB returns
- **Norwegian language:** set `LANGUAGE: "nb-NO"` in `config.js` for Norwegian titles and descriptions (the app's own buttons stay English until translated)
