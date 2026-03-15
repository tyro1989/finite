import express from 'express'
import { Pool } from 'pg'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

app.use(express.json())

// Serve built React frontend
app.use(express.static(join(__dirname, '../dist')))

// ─── DB init ─────────────────────────────────────────────────────────────────

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_data (
      user_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name          TEXT,
      birthday      TEXT,
      life_expectancy INTEGER DEFAULT 80,
      onboarded     BOOLEAN DEFAULT FALSE,
      goals         JSONB DEFAULT '[]'::jsonb,
      milestones    JSONB DEFAULT '{}'::jsonb,
      checkins      JSONB DEFAULT '{}'::jsonb,
      people        JSONB DEFAULT '[]'::jsonb,
      weekly_intentions JSONB DEFAULT '{}'::jsonb,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  console.log('DB ready')
}

// ─── API routes ───────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Create a new anonymous user — returns a UUID the client stores locally
app.post('/api/users', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'INSERT INTO user_data DEFAULT VALUES RETURNING user_id'
    )
    res.json({ userId: rows[0].user_id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Load user data
app.get('/api/users/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM user_data WHERE user_id = $1',
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'not found' })
    const row = rows[0]
    res.json({
      userId:           row.user_id,
      name:             row.name,
      birthday:         row.birthday,
      lifeExpectancy:   row.life_expectancy,
      onboarded:        row.onboarded,
      goals:            row.goals,
      milestones:       row.milestones,
      checkins:         row.checkins,
      people:           row.people,
      weeklyIntentions: row.weekly_intentions,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Save (upsert) user data
app.put('/api/users/:id', async (req, res) => {
  const { name, birthday, lifeExpectancy, onboarded, goals, milestones, checkins, people, weeklyIntentions } = req.body
  try {
    await pool.query(`
      INSERT INTO user_data
        (user_id, name, birthday, life_expectancy, onboarded, goals, milestones, checkins, people, weekly_intentions, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        name             = EXCLUDED.name,
        birthday         = EXCLUDED.birthday,
        life_expectancy  = EXCLUDED.life_expectancy,
        onboarded        = EXCLUDED.onboarded,
        goals            = EXCLUDED.goals,
        milestones       = EXCLUDED.milestones,
        checkins         = EXCLUDED.checkins,
        people           = EXCLUDED.people,
        weekly_intentions = EXCLUDED.weekly_intentions,
        updated_at       = NOW()
    `, [
      req.params.id,
      name, birthday, lifeExpectancy, onboarded,
      JSON.stringify(goals        ?? []),
      JSON.stringify(milestones   ?? {}),
      JSON.stringify(checkins     ?? {}),
      JSON.stringify(people       ?? []),
      JSON.stringify(weeklyIntentions ?? {}),
    ])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// All other routes → React app
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'))
})

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Finite running on :${PORT}`)
  initDb().catch(err => console.error('DB init failed:', err.message))
})
