# Playpro design plan

Made with the `frontend-design` skill (`.claude/skills/frontend-design`).
Future design work should follow this plan or deliberately update it.

## Brief

- **Subject:** a private "what do we watch tonight?" companion for two friends in Norway.
- **Audience:** two adults on a sofa, on their phones, in the evening.
- **Primary job:** pick something to watch tonight that is on a service you already pay for, and keep track of what you both thought of it.

## Direction: "Blue hour"

The Norwegian evening sky just after sunset (*blåtimen*), lit by one warm lamp.
The app lives in that deep blue, not in near-black; warm lamp-light marks the
one thing to act on; the northern-lights green only ever means "you can watch
this now".

| Token | Hex | Role |
|---|---|---|
| `--night` | `#121833` | page background, deep blue-hour ink |
| `--dusk` | `#1c2347` | surfaces (panels, sheets) |
| `--haze` | `#2b3463` | raised surfaces, borders |
| `--snow` | `#eef0fb` | text, cool white |
| `--fjord` | `#9aa5dc` | secondary text |
| `--lamp` | `#ff9f5a` | primary action, the "tonight" ticket |
| `--aurora` | `#7fe0b4` | semantic only: available on your services |
| `--ember` | `#ff7a6b` | semantic only: errors, "rotten", delete |

## Type

- **Anybody** (variable width 50–150 %, weight 100–900) for titles. Movie titles
  are set condensed and heavy, like the credits block on a film poster; the
  width is part of the design: long titles get narrower so they stay on one or
  two lines.
- **Familjen Grotesk** (Familjen STHLM, a Scandinavian grotesk) for everything
  else: readable, slightly quirky, not a default.
- Scale (major third, 16 px base): 13 · 16 · 20 · 25 · 31 · 39 · 49 px.
  Body line-height 1.5, text measure under 70 characters.
- No all-caps labels, no eyebrows above headings, no metadata strung together
  with middle dots: details are written as plain phrases ("2024, 2 h 46 min").

## Layout

Phone first, everything left-aligned.

```
Home                                Title page
┌─────────────────────────────┐    ┌─────────────────────────────┐
│ Playpro                (◐)  │    │ ░░░ backdrop, tinted by ░░░ │
│                             │    │ ░░░ the poster's colour ░░░ │
│ What should we              │    │ ┌────┐                      │
│ watch tonight?              │    │ │post│ DUNE: PART TWO       │
│ ┌─────────────────────┬──┐  │    │ └────┘ 2024, 2 h 46 min     │
│ │ ▓▓ Past Lives        :  │  │    │ IMDb 8.5  RT 92 %  ★ 8 you  │
│ │ ▓▓ On Viaplay        :  │  │    │ [Rate] [Watchlist] [Share]  │
│ │ ▓▓ IMDb 7.8          :  │  │    │ Where to watch in Norway    │
│ └─────────────────────┴──┘  │    │ ● Max  ● Netflix            │
│ [Another one]               │    │ Friends …                   │
│ Trending ◀ wide carousel ▶  │    └─────────────────────────────┘
│ rows of posters …           │
└─────────────────────────────┘
```

## Principles

1. **One bold element:** the "tonight" ticket on the home screen (a perforated
   ticket stub). Everything else stays quiet.
2. **Radius follows hierarchy:** posters 4 px (film prints), chips are pills,
   panels 16 px, sheets and the ticket 24 px. No shadows except under sheets.
3. **Lists are lists, not card piles:** feeds, friends and reviews are rows
   separated by space and hairlines, not boxed cards.
4. **Motion answers the user:** the poster grows into the title page (view
   transition) and the ticket flips when you ask for another one. The trending
   carousel advances slowly and stops as soon as you touch it. Reduced motion
   turns all of it off.
5. **Plain words:** sentence case, buttons say what happens, empty screens say
   what to do next. English and Norwegian (bokmål).
