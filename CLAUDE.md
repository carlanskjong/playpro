# Playpro: notes for working on the code

Private movie/series PWA for a couple of friends in Norway: where to stream (TMDB/JustWatch, region NO), IMDb and Rotten Tomatoes scores, watchlists, ratings, lists and friends. The owner doesn't code, so explain changes in plain language and keep setup steps click-by-click.

## Ground rules

- **No build step.** Plain ES modules served as-is by GitHub Pages (`.nojekyll`). Don't add a bundler or framework. `node_modules` is only for tests and the demo.
- **Free and private.** No paid services, analytics, trackers, Google Fonts or third-party embeds. Fonts are self-hosted in `fonts/`.
- **Secrets:** the Supabase secret/service key lives only in GitHub Actions secrets; never in `js/config.js` or anywhere in the repo. The invite code lives only in the database. Never ask the owner to paste the secret key into chat.
- **Usernames** follow `public.username_problem()` in the schema (format + `private.blocked_words`); the database enforces it and the app shows `js/core/rename.js` to anyone whose old name breaks a newer rule.
- **GDPR:** new kinds of stored data need RLS, a line in the privacy notice (`js/core/pages.js`), inclusion in the data export (`exportData` slot) and `on delete cascade`.

## Architecture

- `js/core/`: the frame (router, nav, home, title page, settings, auth, privacy/about). It knows nothing about specific features.
- `js/features/<name>/index.js`: one plug-in per folder, registered with `register({ id, ...slots })`. Switched on/off by one line in `js/features.js`.
- Slots (`js/core/registry.js`): `routes`, `nav`, `homeRows`, `titleInfo`, `titleActions`, `titleSections`, `settingsSections`, `onLogin`, `onLogout`, `exportData`. Each entry renders HTML text, with optional `wire(box)`. A crashing feature only loses its own box.
- Pages use `lazy(() => import("./page.js"))` so their code loads on first visit. Link to another feature's page only if `hasRoute("/path")` says it is switched on.
- `js/lib/`: `tmdb.js` (TMDB with a Cache Storage cache), `db.js` (Supabase), `ratings.js` (IMDb), `ui.js` (cards, rows, dialogs, `esc`), `icons.js`, `state.js`, `i18n.js` + `nb.js`.
- Always `esc()` text that comes from users or TMDB before putting it in HTML.

## Language

UI text is English in the code, wrapped in `t("…")` / `plural(n, "…", "…")`, with Norwegian in `js/lib/nb.js`. Every new text needs a Norwegian entry; `node tests/i18n.test.mjs --missing` lists the gaps. Use `num()` and `date()` for numbers and dates.

## Database

`supabase/schema.sql` is the single source of truth and is **idempotent**: to update a live database, the owner re-runs the whole file in the Supabase SQL Editor. Keep it that way (`if not exists`, `create or replace`, `drop policy if exists`, `on conflict do nothing`). New Supabase projects grant nothing by default, so every table needs explicit grants and RLS policies. Don't add separate migration files.

## Design

Follow `docs/DESIGN.md` ("Blue hour") and the frontend-design skill in `.claude/skills/`. Colours are tokens at the top of `css/styles.css`. No uppercase eyebrow labels, no middle-dot metadata strings, radius by hierarchy (4 / 16 / 24 px), one bold element per screen. Respect `prefers-reduced-motion`. Phone first: nothing may make a page wider than the screen.

## Checks

```
npm install                       # once
npx playwright install chromium   # once, outside the cloud sandbox
npm test                          # translations, database rules, app click-through
node tests/app.test.mjs look "/browse" "/@600"   # screenshots (page@scroll) into test-results/; W=1280 for desktop, LANG_UI=nb for Norwegian
npm run demo                      # single-file demo in demo/dist/ (fake backend in demo/mock.js)
```

The app test runs the real app against `demo/mock.js`; when a feature calls a new table or RPC, teach the mock about it. GitHub Actions runs `npm test` on every push (`.github/workflows/check.yml`).

After changing files the service worker caches, bump `VERSION` in `sw.js`.
