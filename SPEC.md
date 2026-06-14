# Finite — Product Specification

> "You have 3,900 weeks. See how many are left — and make every one count."

**Finite** is a reflective life-planning PWA that visualizes your entire life as a grid of weeks, helping you confront mortality and plan intentionally.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, inline styles, CSS variables |
| Backend | Express.js 4 |
| Database | PostgreSQL (JSONB columns for flexible schema) |
| PWA | vite-plugin-pwa + Workbox (auto-update, CacheFirst for fonts) |
| Testing | Vitest, @testing-library/react, JSDOM |
| Deploy | Railway |
| Fonts | Playfair Display (serif headings), Inter (sans body) |

---

## Architecture

### State Management

- Centralized state in `App.jsx`, passed via props to all tabs
- No routing library — tab navigation via `activeTab` state variable
- Persistence: **localStorage-first**, debounced (1.5s) sync to PostgreSQL
- Offline indicator shown when backend sync fails

### Data Flow

```
User action → setState() → localStorage (immediate) → PUT /api/users/:id (1.5s debounce)
```

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/users` | Create anonymous user, returns `{ userId: UUID }` |
| GET | `/api/users/:id` | Load user data |
| PUT | `/api/users/:id` | Upsert full state (ON CONFLICT DO UPDATE) |
| GET | `/api/health` | Health check |

### Database Table: `user_data`

| Column | Type | Default |
|--------|------|---------|
| user_id | UUID PK | gen_random_uuid() |
| name | TEXT | NULL |
| birthday | TEXT | NULL |
| life_expectancy | INTEGER | 80 |
| onboarded | BOOLEAN | FALSE |
| goals | JSONB | '[]' |
| milestones | JSONB | '{}' |
| checkins | JSONB | '{}' |
| people | JSONB | '[]' |
| weekly_intentions | JSONB | '{}' |
| created_at | TIMESTAMPTZ | NOW() |
| updated_at | TIMESTAMPTZ | NOW() |

**Known gap:** `weeklyGoalHours` and `weeklyReflections` are NOT in the DB schema — localStorage only.

---

## Data Models

### App State

```js
{
  onboarded: false,
  name: '',
  birthday: '',                // ISO date string
  lifeExpectancy: 75,
  goals: [],                   // Goal[]
  milestones: {},              // { [weekIndex]: string | { text, sentiment } }
  checkins: {},                // { [weekIndex]: 'yes' | 'somewhat' | 'no' }
  people: [],                  // Person[]
  weeklyIntentions: {},        // { [weekIndex]: string }
  weeklyGoalHours: {},         // { [weekIndex]: { [goalId]: number } }
  weeklyReflections: {},       // { [weekIndex]: { wins, struggles, change } }
}
```

### Goal

```js
{ id: timestamp, title: string, description: string, targetAge: number, hoursPerWeek: number (0.5-40) }
```

### Person

```js
{ id: timestamp, name: string, relationship: string, age: number, visitsPerYear: number, lifeExpectancy: number (default 82), hoursPerVisit: number (default 3) }
```

### Milestone

```js
// Legacy: plain string
// Current: { text: string, sentiment: 'enjoyed' | 'neutral' | 'regret' }
```

### Weekly Reflection

```js
{ wins: string, struggles: string, change: string }
```

---

## Tabs & Features

### 1. This Week (`checkin`)

The home tab. A **segmented control** splits it into two focused views to keep cognitive load low:

**This week** (daily driver, default):
- Rotating perspective line + week date range
- **Daily mood tracker (hero):** tap Good / Okay / Hard per day (Mon–Sun); future days disabled; live impression summarizes the week from logged moods
- **"What matters most this week?"** single-line focus (autosaves on blur)
- **Goal hours** with inline progress bars (only if goals exist)

**Last week** (the weekly ritual):
- **"Did last week move you forward?"** verdict — Yes / Somewhat / No
- Impression derived from last week's logged daily moods
- **Reflect:** wins / struggles / one thing to change (autosaves on blur)

> Daily moods live in `weeklyReflections[week].dailySentiments`. They feed the verdict impression — the data the user taps this week becomes the evidence when they evaluate the week next week.

### 2. Your Life (`grid`)

Visual timeline — entire life as a 52-column week grid.

- **Live ticker:** Seconds alive (real-time), weeks lived, weeks remaining, share button
- **52xN grid:** Each cell = 8x8px, 1px gap
  - Colors: life phase (faded bg), sentiment overlay, current week (gold pulse), intentions (blue)
  - Hover tooltip: date, age, phase, week number, milestone/intention/sentiment
  - Click to open edit modal
- **Date entry form:** Add milestones (past: text + sentiment) or intentions (future: text)
- **Edit modal:** Add/edit/delete milestone or intention for any week
- **Right panel:**
  - Life progress bar (% lived)
  - Current life phase badge
  - Moments summary: enjoyed count, regrets count, intentions count
  - Contentment ratio: enjoyed / (enjoyed + regrets) * 100
  - Quick links to other tabs
  - Setup nudge if no goals/people yet
- **Legend:** Phase colors, current week, sentiment indicators, intention color
- **Share:** Generates "I've lived X of my Y weeks (Z%)" text

### 3. Goals (`goals`)

Define and track long-term life goals.

- **Goal cards:** Title, description, weeks to deadline, free weeks (25% of remaining), free hours, hours/week, mastery insight (10k-hour rule), delete
- **Past goals:** Grayed out when deadline passed
- **Add form:** Title (required), description, target age (min: current+1), hours/week (0.5-40), live preview
- **Footer:** Total truly free weeks remaining

### 4. People (`people`)

Track time remaining with loved ones.

- **Relationships:** Parent, Grandparent, Sibling, Partner, Child, Close friend, Mentor, Other
- **Person cards:** Name, relationship, age, remaining visits, total hours, hours perspective, visit frequency, years left, urgency message
- **Urgency levels:**
  - Critical (<50 visits): Red — "Make every visit sacred"
  - Moderate (50-200 visits): Gold — "Time is more limited than it feels"
  - OK (>200 visits): Gray — "Keep nurturing"
- **Add form:** Name, relationship, age, visits/year (default 12), hours/visit (default 3), life expectancy (default 82), live preview
- **Insight quote:** "Most people overestimate how much time they have..."

### 5. Reality Check (`reality`)

Honest breakdown of where remaining life time goes.

- **Hero:** "Your truly free weeks" — giant number, free %, summers left, free weekends, holiday seasons
- **Time breakdown bars:**
  - Asleep: ~33% (8 hrs/day)
  - Working: ~24% (until age 65)
  - Daily tasks: ~15% (chores, errands, hygiene, commute)
  - Eating: ~5% (meals + prep)
  - **Truly free:** remaining % (accent color)
- **"What you could do" cards:**
  - Books (1 per 2 weeks)
  - Skills (10k hours = mastery)
  - People to cherish deeply (~1hr/week)
  - Projects (~1 per 8 weeks)
- **Time with loved ones:** Person grid (if people added), total hours, perspective message
- **Quote:** "The key is not spending time, but in investing it." — Covey

### Onboarding (initial setup)

5-step flow, shown before any tabs:

1. Welcome: "3,900 weeks" messaging
2. Name input (Enter to continue)
3. Birthday input (date picker, Enter to continue)
4. Life expectancy slider (50-100 years, shows total weeks)
5. Reveal: Weeks lived, percentage, weeks remaining

---

## Component Hierarchy

```
App.jsx              — Central state, API calls, tab routing, sync
├── Onboarding.jsx   — 5-step setup flow
├── CheckIn.jsx      — This Week tab
├── Grid.jsx         — Your Life tab (grid, ticker, modal, sidebar)
├── Goals.jsx        — Goals tab
├── People.jsx       — People tab
└── RealityCheck.jsx — Reality Check tab
```

All components receive state + update function as props from App.jsx.

---

## Utility Functions (`utils.js`)

| Function | Returns |
|----------|---------|
| `getWeeksLived(birthday)` | Weeks elapsed since birth |
| `getAgeAtWeek(birthday, weekIndex)` | Decimal age at given week |
| `getDateAtWeek(birthday, weekIndex)` | Date object for week start |
| `formatDate(date)` | "Mon Day, Year" string |
| `getCurrentAge(birthday)` | Decimal years |
| `getSecondsSinceBirth(birthday)` | Total seconds elapsed |
| `formatNumber(n)` | Locale string with commas |
| `getLifePhase(ageInYears)` | Phase object (name, color) |
| `getRealityBreakdown(birthday, lifeExpectancy)` | Time allocation breakdown |
| `getFreeWeeksToGoal(birthday, lifeExpectancy, targetAge)` | Weeks + free weeks to deadline |
| `getRemainingVisits(personAge, visitsPerYear, personLE)` | Estimated visits remaining |

### Life Phases

| Phase | Ages | Color |
|-------|------|-------|
| Childhood | 0-12 | #4a7fa5 |
| Adolescence | 13-17 | #7a5fa5 |
| Young Adult | 18-25 | #5a9a7a |
| Building | 26-40 | #c9a84c |
| Prime | 41-60 | #c97a4c |
| Wisdom | 61-75 | #7a9a5a |
| Final Chapter | 76-120 | #a57a5a |

---

## Design System

### Color Palette (light theme — auto dark via `prefers-color-scheme`)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | #faf9f7 | Background |
| `--surface` | #ffffff | Card/panel backgrounds |
| `--surface2` | #f3f1ee | Input backgrounds |
| `--border` | #e8e5e0 | Borders |
| `--text` | #1a1a1a | Primary text |
| `--text2` | #5c5650 | Secondary text |
| `--text3` | #9a9490 | Tertiary/muted text |
| `--accent` | #b8860b | Gold — primary accent |
| `--accent2` | #d4713a | Coral — secondary accent |
| `--success` | #2e7d32 | Green — positive states |
| `--danger` | #c62828 | Red — negative states |

> Always reference these variables, never hardcoded hex. Dark-theme overrides live in the `@media (prefers-color-scheme: dark)` block in `src/index.css`.

### Sentiment Colors

- Enjoyed: #4ade80 (bright green)
- Neutral: var(--text3)
- Regret: #f87171 (bright red)

### Urgency Colors

- Critical: #e74c3c
- Moderate: var(--accent) (gold)
- OK: var(--text) (off-white)

### Typography

- **Headings:** Playfair Display (serif), 400/700
- **Body:** Inter (sans-serif), 300/400/500/600
- **Responsive sizing:** `clamp()` for scalable fonts

### Animations

- `pulse`: Current week glow (2.5s loop)
- `fadeIn`: Component entrance (0.4s)
- `slideUp`: Modal entrance (0.5s)
- Hover transitions on borders and opacity

---

## PWA Configuration

- **Display:** standalone (full-screen app feel)
- **Orientation:** portrait-primary
- **Theme/BG:** #0a0a0a (dark)
- **Icons:** 192px, 512px, 512px maskable
- **Service worker:** Auto-update, CacheFirst for Google Fonts (1yr TTL, max 10 entries)
- **iOS meta tags:** apple-touch-icon, web-app-capable, status-bar black-translucent

---

## Known Gaps

1. `weeklyGoalHours` and `weeklyReflections` not synced to backend (localStorage only)
2. No edit history / undo / trash
3. No data export
4. No notifications / weekly reminders
5. No year-over-year trends or analytics
6. No grid filtering (by sentiment, goal, date range)
7. No automatic retry on backend disconnect
8. Single-user only, no collaborative features
9. Grid renders 3,900+ DOM nodes without virtualization
10. No backup/recovery mechanism
