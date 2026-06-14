# Finite

> You have ~3,900 weeks. See how many are left — and make every one count.

**Finite** is a reflective life-tracking PWA. It visualizes your entire life as a grid of weeks and helps you act on what truly matters: track how each week goes, log the memories that define you, set goals against the free time you actually have, and confront how little time remains with the people you love.

**Live app:** https://web-production-a33b57.up.railway.app
(Open on a phone → "Add to Home Screen" / "Install app" for a full-screen experience.)

## What it does

- **This Week** — a low-friction weekly ritual. A daily mood tracker (Good / Okay / Hard), a single "what matters most this week" focus, and goal-hour logging. A separate "Last week" view captures a verdict + reflection. Everything autosaves.
- **Your Life** — your whole life as a 52-column week grid: phase colors, the current week pulsing, and your memories marked in gold. Add a life event by date, tag it with a **theme** (family, career, health, travel, growth…), and browse a filterable **memory log** to spot patterns over time.
- **Goals** — define life goals and see exactly how many free weeks and hours you have before a target age, with a 10,000-hour mastery insight.
- **People** — how many visits and hours you realistically have left with the people you love. The number is always smaller than you think.
- **Reality Check** — an honest breakdown of where your remaining time actually goes, and what your truly free weeks could become.

Goals and People are kept intentionally separate (they model time differently); a small orienting note keeps the mental model clear: **Goals = what to achieve · People = who to cherish · Your Life = what you lived.**

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite 5, inline styles + CSS variables (light theme, auto dark) |
| Backend | Express 4 (`server/index.js`) |
| Database | PostgreSQL on Railway (JSONB columns) |
| Auth | Google Sign-In + email/passphrase (bcryptjs) |
| PWA / Mobile | vite-plugin-pwa + Workbox; Capacitor for iOS/Android |
| Tests | Vitest + Testing Library (JSDOM) |
| Deploy | Railway |

## Getting started

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm run test       # watch tests   (npm run test:run for one-off)
npm run build      # production build → dist/
```

Running the full app (frontend + API + DB) locally requires a `DATABASE_URL` env var pointing at a Postgres instance; `npm start` serves the built app via Express.

## Deploy

- **Web:** `railway up` (project is linked; Postgres + `DATABASE_URL` already configured).
- **Phone (no stores):** open the URL and Add to Home Screen (iOS Safari) / Install app (Android Chrome).
- **Native iOS / Android:** Capacitor is configured — see [`DEPLOY.md`](./DEPLOY.md).

## Docs

- [`CONTEXT.md`](./CONTEXT.md) — agent/developer quick-start: architecture, state shape, conventions. **Read this first when contributing.**
- [`SPEC.md`](./SPEC.md) — fuller product specification.
- [`DEPLOY.md`](./DEPLOY.md) — web, PWA, and native store deployment.

## Data model (at a glance)

All app state lives in `App.jsx` and syncs to Postgres (localStorage-first, 1.5s debounce). Weeks are indexed as whole weeks since birth.

```js
{ onboarded, name, birthday, lifeExpectancy,
  goals, people, milestones, checkins,
  weeklyIntentions, weeklyGoalHours, weeklyReflections }
```

See `CONTEXT.md` for the full shape and field semantics.
