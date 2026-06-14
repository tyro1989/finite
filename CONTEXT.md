# Finite — Agent Context

> Quick-start for AI agents. Read this first; it's the source of truth for how the app is built and how to work in it. Keep it updated when you change architecture.

## What this is

**Finite** is a reflective life-tracking PWA. Visualizes your whole life as a grid of weeks; helps you track weekly progress, log how days feel, set goals, and confront the finite time you have with people you love.

Tagline: *"You have 3,900 weeks. See how many are left — and make every one count."*

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite 5, **inline styles** (object `s = {}` per component), CSS variables for theming |
| Backend | Express 4 (`server/index.js`) |
| DB | PostgreSQL on Railway (JSONB columns) |
| Auth | Google Sign-In (GSI) + email/passphrase (bcryptjs); userId stored in localStorage |
| PWA | vite-plugin-pwa + Workbox |
| Tests | Vitest + @testing-library/react + JSDOM |
| Deploy | Railway (`railway up`); mobile via Capacitor (see DEPLOY.md) |

## Run / test / build / deploy

```bash
npm run dev        # Vite dev server at :5173 (proxies /api → :3000)
npm run test       # vitest watch
npm run test:run   # vitest run (CI)
npm run build      # production build → dist/
npm start          # express server (serves dist/ + API), needs DATABASE_URL
railway up         # deploy (project already linked)
```

**ALWAYS run `npx vitest run` after changes. Keep tests green.** Add/update tests with every component change.

## Architecture

- **All state lives in `App.jsx`** as one object, passed to tabs via props. No router — `activeTab` state drives which tab renders.
- **Persistence:** localStorage immediately + debounced (1.5s) `PUT /api/users/:id`. Offline → localStorage only, shows "Offline" tag.
- **Auth gate:** App shows `<Auth>` if no `finite_user_id` in localStorage; else loads from DB and renders tabs. Users stay signed in across sessions; "Sign out" clears localStorage.

### App state shape
```js
{
  onboarded, name, birthday, lifeExpectancy,     // identity
  goals: [],            // { id, title, description, targetAge, hoursPerWeek }
  people: [],           // { id, name, relationship, age, visitsPerYear, lifeExpectancy, hoursPerVisit }
  milestones: {},       // { [weekIndex]: { text, sentiment: 'enjoyed'|'neutral'|'regret' } }  (legacy: plain string)
  checkins: {},         // { [weekIndex]: 'yes'|'somewhat'|'no' }   ← last-week verdict
  weeklyIntentions: {}, // { [weekIndex]: string }                  ← "what matters this week"
  weeklyGoalHours: {},  // { [weekIndex]: { [goalId]: hours } }
  weeklyReflections: {},// { [weekIndex]: { wins, struggles, change, dailySentiments: { [0-6]: 'positive'|'neutral'|'negative' } } }
}
```
`weekIndex` = whole weeks since birthday (`getWeeksLived`). Day index 0–6 = Mon–Sun within a week.

## Components (`src/components/`)

| File | Tab | Notes |
|------|-----|-------|
| `Onboarding.jsx` | — | 5-step setup before tabs appear |
| `Auth.jsx` | — | Google primary, email collapsed; exports `LinkAccount` |
| `CheckIn.jsx` | This Week | **Segmented control: "This week" / "Last week".** This week = daily mood tracker (hero) + focus + goal hours. Last week = verdict + reflection. Autosaves on blur/tap. |
| `Grid.jsx` | Your Life | Week grid + live ticker + prominent "Add a life event" button (opens modal) + info panel. Tap cell → edit modal. |
| `Goals.jsx` | Goals | Goal cards with free-weeks/hours math, 10k-hr mastery insight |
| `People.jsx` | People | Visits/hours remaining, urgency levels |
| `RealityCheck.jsx` | Reality Check | Time breakdown, life seasons, "what free weeks become" |

## Design system (light theme)

Theme is **light** with auto dark-mode via `@media (prefers-color-scheme: dark)` in `src/index.css`. **Always use CSS variables, never hardcoded hex** (the old dark hexes like `#0a0a0a`, `#181816` were bugs on the light theme — all removed).

```
--bg #faf9f7   --surface #fff   --surface2 #f3f1ee   --border #e8e5e0
--text #1a1a1a --text2 #5c5650  --text3 #9a9490
--accent #b8860b (gold)  --success #2e7d32  --danger #c62828
--radius 12px   --safe-top/bottom/left/right (iOS notch insets)
Fonts: --font-serif (Playfair Display, headings), --font-sans (Inter, body)
```

Sentiment/mood color convention (light-theme friendly):
- positive/enjoyed/yes → green `#2e7d32` on `#e8f5e9`
- neutral/somewhat → gold `#b8860b` on `#fff8e1`
- negative/regret/no → red `#c62828` on `#fbe9e7`

## Conventions / gotchas

- **Mobile-first.** Single column, ≥44px tap targets, no hover-only interactions (hover tooltips are desktop bonus only). Use `flexWrap` so panels stack on narrow screens.
- **Inline styles only** — match the existing `const s = {}` pattern at the bottom of each component.
- Tests query by **visible text / role / placeholder**, so changing copy breaks tests — update them together.
- `src/api.js` wraps all fetch calls. `server/index.js` mirrors the state shape in its upsert SQL — **if you add a state field, add the DB column + the upsert + the GET mapping.**
- Backend gap to watch: confirm `weekly_goal_hours` / `weekly_reflections` columns exist (added via `ALTER TABLE IF NOT EXISTS` in `initDb`).

## Deploy targets

- **Web/PWA:** `railway up`. Live at the Railway URL; installable via "Add to Home Screen".
- **iOS/Android native:** Capacitor wrapper — see `DEPLOY.md`.
