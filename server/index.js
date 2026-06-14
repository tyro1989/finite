import express from 'express'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createRequire } from 'module'

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
      email         TEXT UNIQUE,
      passphrase    TEXT,
      name          TEXT,
      birthday      TEXT,
      life_expectancy INTEGER DEFAULT 80,
      onboarded     BOOLEAN DEFAULT FALSE,
      goals         JSONB DEFAULT '[]'::jsonb,
      milestones    JSONB DEFAULT '{}'::jsonb,
      checkins      JSONB DEFAULT '{}'::jsonb,
      people        JSONB DEFAULT '[]'::jsonb,
      weekly_intentions JSONB DEFAULT '{}'::jsonb,
      weekly_goal_hours JSONB DEFAULT '{}'::jsonb,
      weekly_reflections JSONB DEFAULT '{}'::jsonb,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await pool.query(`ALTER TABLE user_data ADD COLUMN IF NOT EXISTS weekly_goal_hours JSONB DEFAULT '{}'::jsonb`)
  await pool.query(`ALTER TABLE user_data ADD COLUMN IF NOT EXISTS weekly_reflections JSONB DEFAULT '{}'::jsonb`)
  await pool.query(`ALTER TABLE user_data ADD COLUMN IF NOT EXISTS email TEXT`)
  await pool.query(`ALTER TABLE user_data ADD COLUMN IF NOT EXISTS passphrase TEXT`)
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email ON user_data(email) WHERE email IS NOT NULL`)
  console.log('DB ready')
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '650167826764-7c5kn3e332pve8nlpvbi8ocfo132mhf9.apps.googleusercontent.com'

function decodeJwtPayload(token) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token')
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  if (payload.aud !== GOOGLE_CLIENT_ID) throw new Error('Invalid audience')
  if (!['https://accounts.google.com', 'accounts.google.com'].includes(payload.iss)) throw new Error('Invalid issuer')
  if (payload.exp * 1000 < Date.now()) throw new Error('Token expired')
  return payload
}

// ─── Auth routes ─────────────────────────────────────────────────────────────

// Register: create user with email + passphrase
app.post('/api/register', async (req, res) => {
  const { email, passphrase } = req.body
  if (!email || !passphrase) return res.status(400).json({ error: 'Email and passphrase required' })
  if (passphrase.length < 4) return res.status(400).json({ error: 'Passphrase must be at least 4 characters' })

  try {
    const hash = await bcrypt.hash(passphrase, 10)
    const { rows } = await pool.query(
      'INSERT INTO user_data (email, passphrase) VALUES ($1, $2) RETURNING user_id',
      [email.toLowerCase().trim(), hash]
    )
    res.json({ userId: rows[0].user_id })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' })
    res.status(500).json({ error: err.message })
  }
})

// Login: verify email + passphrase, return userId
app.post('/api/login', async (req, res) => {
  const { email, passphrase } = req.body
  if (!email || !passphrase) return res.status(400).json({ error: 'Email and passphrase required' })

  try {
    const { rows } = await pool.query(
      'SELECT user_id, passphrase FROM user_data WHERE email = $1',
      [email.toLowerCase().trim()]
    )
    if (!rows.length) return res.status(401).json({ error: 'No account with that email' })

    const valid = await bcrypt.compare(passphrase, rows[0].passphrase)
    if (!valid) return res.status(401).json({ error: 'Wrong passphrase' })

    res.json({ userId: rows[0].user_id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Google Sign-In: verify token, create or login user by email
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body
  if (!credential) return res.status(400).json({ error: 'Missing credential' })

  try {
    const payload = decodeJwtPayload(credential)
    const email = payload.email.toLowerCase().trim()

    // Check if user exists
    const { rows } = await pool.query('SELECT user_id FROM user_data WHERE email = $1', [email])

    if (rows.length) {
      return res.json({ userId: rows[0].user_id })
    }

    // Create new user with this email
    const { rows: newRows } = await pool.query(
      'INSERT INTO user_data (email) VALUES ($1) RETURNING user_id',
      [email]
    )
    res.json({ userId: newRows[0].user_id, isNew: true })
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
})

// Link email to existing anonymous account
app.post('/api/users/:id/link', async (req, res) => {
  const { email, passphrase } = req.body
  if (!email || !passphrase) return res.status(400).json({ error: 'Email and passphrase required' })
  if (passphrase.length < 4) return res.status(400).json({ error: 'Passphrase must be at least 4 characters' })

  try {
    const hash = await bcrypt.hash(passphrase, 10)
    const { rowCount } = await pool.query(
      'UPDATE user_data SET email = $1, passphrase = $2 WHERE user_id = $3 AND email IS NULL',
      [email.toLowerCase().trim(), hash, req.params.id]
    )
    if (rowCount === 0) return res.status(409).json({ error: 'Account already linked or email taken' })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' })
    res.status(500).json({ error: err.message })
  }
})

// ─── API routes ───────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Create a new anonymous user
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
      userId:             row.user_id,
      email:              row.email,
      name:               row.name,
      birthday:           row.birthday,
      lifeExpectancy:     row.life_expectancy,
      onboarded:          row.onboarded,
      goals:              row.goals,
      milestones:         row.milestones,
      checkins:           row.checkins,
      people:             row.people,
      weeklyIntentions:   row.weekly_intentions,
      weeklyGoalHours:    row.weekly_goal_hours,
      weeklyReflections:  row.weekly_reflections,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Save (upsert) user data
app.put('/api/users/:id', async (req, res) => {
  const { name, birthday, lifeExpectancy, onboarded, goals, milestones, checkins, people, weeklyIntentions, weeklyGoalHours, weeklyReflections } = req.body
  try {
    await pool.query(`
      INSERT INTO user_data
        (user_id, name, birthday, life_expectancy, onboarded, goals, milestones, checkins, people, weekly_intentions, weekly_goal_hours, weekly_reflections, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        name               = EXCLUDED.name,
        birthday           = EXCLUDED.birthday,
        life_expectancy    = EXCLUDED.life_expectancy,
        onboarded          = EXCLUDED.onboarded,
        goals              = EXCLUDED.goals,
        milestones         = EXCLUDED.milestones,
        checkins           = EXCLUDED.checkins,
        people             = EXCLUDED.people,
        weekly_intentions  = EXCLUDED.weekly_intentions,
        weekly_goal_hours  = EXCLUDED.weekly_goal_hours,
        weekly_reflections = EXCLUDED.weekly_reflections,
        updated_at         = NOW()
    `, [
      req.params.id,
      name, birthday, lifeExpectancy, onboarded,
      JSON.stringify(goals              ?? []),
      JSON.stringify(milestones         ?? {}),
      JSON.stringify(checkins           ?? {}),
      JSON.stringify(people             ?? []),
      JSON.stringify(weeklyIntentions   ?? {}),
      JSON.stringify(weeklyGoalHours    ?? {}),
      JSON.stringify(weeklyReflections  ?? {}),
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
