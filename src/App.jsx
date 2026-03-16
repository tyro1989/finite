import { useState, useEffect, useRef } from 'react'
import Onboarding from './components/Onboarding'
import Grid from './components/Grid'
import RealityCheck from './components/RealityCheck'
import Goals from './components/Goals'
import People from './components/People'
import CheckIn from './components/CheckIn'
import { createUser, loadUser, saveUser } from './api'

const STORAGE_KEY = 'lifeinweeks_v1'
const USER_ID_KEY = 'finite_user_id'

const defaultState = {
  onboarded: false,
  name: '',
  birthday: '',
  lifeExpectancy: 75,
  goals: [],
  milestones: {},
  checkins: {},
  people: [],
  weeklyIntentions: {},
}

function loadLocalState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...defaultState, ...JSON.parse(saved) }
  } catch {}
  return defaultState
}

const TABS = [
  { id: 'grid',    label: 'Your Life' },
  { id: 'reality', label: 'Reality Check' },
  { id: 'goals',   label: 'Goals' },
  { id: 'people',  label: 'People' },
  { id: 'checkin', label: 'This Week' },
]

export default function App() {
  const [state, setState] = useState(defaultState)
  const [activeTab, setActiveTab] = useState('grid')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState(false)
  const userIdRef = useRef(null)
  const saveTimer = useRef(null)

  // ── Bootstrap: resolve userId, load data from API (fallback: localStorage) ──
  useEffect(() => {
    async function bootstrap() {
      let userId = localStorage.getItem(USER_ID_KEY)

      if (!userId) {
        // First visit — create a new user in the DB
        try {
          const { userId: newId } = await createUser()
          userId = newId
          localStorage.setItem(USER_ID_KEY, userId)
        } catch {
          // API unavailable — fall back to localStorage-only mode
          setState(loadLocalState())
          setLoading(false)
          return
        }
      }

      userIdRef.current = userId

      // Try loading from backend
      try {
        const data = await loadUser(userId)
        if (data) {
          const { userId: _id, ...rest } = data
          setState({ ...defaultState, ...rest })
        } else {
          // userId exists locally but not in DB (e.g. DB was wiped) — use localStorage
          setState(loadLocalState())
        }
      } catch {
        // API unavailable — use localStorage cache
        setState(loadLocalState())
        setSyncError(true)
      }

      setLoading(false)
    }

    bootstrap()
  }, [])

  // ── Persist to localStorage on every change ────────────────────────────────
  useEffect(() => {
    if (loading) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, loading])

  // ── Debounced sync to backend (1.5s after last change) ────────────────────
  useEffect(() => {
    if (loading || !userIdRef.current || !state.onboarded) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSyncing(true)
      setSyncError(false)
      try {
        await saveUser(userIdRef.current, state)
      } catch {
        setSyncError(true)
      } finally {
        setSyncing(false)
      }
    }, 1500)
    return () => clearTimeout(saveTimer.current)
  }, [state, loading])

  const update = (updates) => setState(prev => ({ ...prev, ...updates }))

  if (loading) return <LoadingScreen />

  if (!state.onboarded) {
    return <Onboarding onComplete={(data) => update({ ...data, onboarded: true })} />
  }

  return (
    <div style={s.app}>
      <nav style={s.nav}>
        <div style={s.brand}>Finite</div>
        <div style={s.tabs}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              style={{ ...s.tab, ...(activeTab === tab.id ? s.tabActive : {}) }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={s.syncStatus}>
          {syncing && <span style={s.syncing}>↑</span>}
          {syncError && <span style={s.syncErr} title="Sync failed — saved locally">!</span>}
        </div>
        <button
          style={s.resetBtn}
          onClick={() => { if (window.confirm('Reset all data? This cannot be undone.')) setState(defaultState) }}
        >
          Reset
        </button>
      </nav>

      <main style={s.main}>
        {activeTab === 'grid' && (
          <Grid
            birthday={state.birthday}
            lifeExpectancy={state.lifeExpectancy}
            name={state.name}
            milestones={state.milestones}
            checkins={state.checkins}
            weeklyIntentions={state.weeklyIntentions}
            goals={state.goals}
            people={state.people}
            onMilestone={(wi, text, sentiment) => update({ milestones: { ...state.milestones, [wi]: { text, sentiment: sentiment || 'neutral' } } })}
            onDeleteMilestone={(wi) => {
              const m = { ...state.milestones }
              delete m[wi]
              update({ milestones: m })
            }}
            onIntention={(wi, text) => update({ weeklyIntentions: { ...state.weeklyIntentions, [wi]: text } })}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'reality' && (
          <RealityCheck birthday={state.birthday} lifeExpectancy={state.lifeExpectancy} name={state.name} people={state.people} />
        )}
        {activeTab === 'goals' && (
          <Goals
            birthday={state.birthday}
            lifeExpectancy={state.lifeExpectancy}
            goals={state.goals}
            onUpdate={(goals) => update({ goals })}
          />
        )}
        {activeTab === 'people' && (
          <People people={state.people} onUpdate={(people) => update({ people })} />
        )}
        {activeTab === 'checkin' && (
          <CheckIn
            birthday={state.birthday}
            goals={state.goals}
            checkins={state.checkins}
            weeklyIntentions={state.weeklyIntentions}
            onCheckin={(wi, val) => update({ checkins: { ...state.checkins, [wi]: val } })}
            onIntention={(wi, text) => update({ weeklyIntentions: { ...state.weeklyIntentions, [wi]: text } })}
          />
        )}
      </main>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: '#c9a84c' }}>Finite</div>
        <div style={{ fontSize: 12, color: '#5a5550', marginTop: 12, letterSpacing: '0.1em' }}>LOADING</div>
      </div>
    </div>
  )
}

const s = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' },
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(10,10,10,0.96)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    padding: '0 24px', display: 'flex', alignItems: 'center', gap: 24, height: 54, flexShrink: 0,
  },
  brand: { fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--accent)', letterSpacing: '0.02em', whiteSpace: 'nowrap', flexShrink: 0 },
  tabs: { display: 'flex', gap: 2, flex: 1, overflowX: 'auto', scrollbarWidth: 'none' },
  tab: { background: 'none', color: 'var(--text3)', fontSize: 11, fontWeight: 500, padding: '5px 12px', borderRadius: 5, whiteSpace: 'nowrap', letterSpacing: '0.06em', textTransform: 'uppercase', border: 'none' },
  tabActive: { color: 'var(--accent)', background: 'rgba(201,168,76,0.08)' },
  syncStatus: { display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 },
  syncing: { fontSize: 14, color: 'var(--text3)', animation: 'pulse 1s infinite' },
  syncErr: { fontSize: 13, color: '#e74c3c', cursor: 'default' },
  resetBtn: { background: 'none', color: 'var(--text3)', fontSize: 11, padding: '4px 8px', borderRadius: 4, flexShrink: 0, border: 'none' },
  main: { flex: 1, padding: '32px 24px 64px', maxWidth: 1100, margin: '0 auto', width: '100%' },
}
