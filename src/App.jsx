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
  { id: 'grid',    label: 'Your Life',     icon: '◉' },
  { id: 'reality', label: 'Reality Check',  icon: '◷' },
  { id: 'goals',   label: 'Goals',          icon: '◎' },
  { id: 'people',  label: 'People',         icon: '♡' },
  { id: 'checkin', label: 'This Week',      icon: '↻' },
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
        try {
          const { userId: newId } = await createUser()
          userId = newId
          localStorage.setItem(USER_ID_KEY, userId)
        } catch {
          setState(loadLocalState())
          setLoading(false)
          return
        }
      }

      userIdRef.current = userId

      try {
        const data = await loadUser(userId)
        if (data) {
          const { userId: _id, ...rest } = data
          setState({ ...defaultState, ...rest })
        } else {
          setState(loadLocalState())
        }
      } catch {
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
      {/* Top bar: brand + sync + reset */}
      <header style={s.header}>
        <div style={s.brand}>Finite</div>
        <div style={s.headerRight}>
          <div style={s.syncStatus}>
            {syncing && <span style={s.syncing}>Saving...</span>}
            {syncError && <span style={s.syncErr} title="Sync failed — saved locally">Offline</span>}
          </div>
          <button
            style={s.resetBtn}
            onClick={() => { if (window.confirm('Reset all data? This cannot be undone.')) setState(defaultState) }}
          >
            Reset
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav style={s.nav}>
        <div style={s.tabs}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                style={{ ...s.tab, ...(isActive ? s.tabActive : {}) }}
                onClick={() => setActiveTab(tab.id)}
              >
                <span style={{ ...s.tabIcon, ...(isActive ? s.tabIconActive : {}) }}>{tab.icon}</span>
                <span style={{ ...s.tabLabel, ...(isActive ? s.tabLabelActive : {}) }}>{tab.label}</span>
                {isActive && <div style={s.tabIndicator} />}
              </button>
            )
          })}
        </div>
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

  // ── Top header: brand + sync ──
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 24px 0',
    flexShrink: 0,
  },
  brand: {
    fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--accent)',
    letterSpacing: '0.02em', fontWeight: 400,
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  syncStatus: { display: 'flex', alignItems: 'center', gap: 4 },
  syncing: { fontSize: 11, color: 'var(--text3)', letterSpacing: '0.04em' },
  syncErr: { fontSize: 11, color: '#e74c3c', letterSpacing: '0.04em' },
  resetBtn: {
    background: 'none', color: 'var(--text3)', fontSize: 11, padding: '4px 10px',
    borderRadius: 4, border: '1px solid var(--border)', letterSpacing: '0.04em',
  },

  // ── Tab bar ──
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border)',
    padding: '0 24px',
    flexShrink: 0,
  },
  tabs: {
    display: 'flex', gap: 6,
    maxWidth: 1100, margin: '0 auto', width: '100%',
    overflowX: 'auto', scrollbarWidth: 'none',
    padding: '10px 0',
  },
  tab: {
    position: 'relative',
    background: 'rgba(255,255,255,0.03)', border: '1px solid transparent',
    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: '10px 18px',
    borderRadius: 8,
    cursor: 'pointer',
    minWidth: 0,
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  tabActive: {
    background: 'rgba(201,168,76,0.12)',
    border: '1px solid rgba(201,168,76,0.25)',
  },
  tabIcon: {
    fontSize: 16, lineHeight: 1,
    color: '#6a6560',
    transition: 'color 0.15s ease',
  },
  tabIconActive: {
    color: 'var(--accent)',
  },
  tabLabel: {
    fontSize: 13, fontWeight: 500, letterSpacing: '0.01em',
    color: '#8a8580',
    whiteSpace: 'nowrap',
    transition: 'color 0.15s ease',
  },
  tabLabelActive: {
    color: '#f4f0e8',
    fontWeight: 600,
  },
  tabIndicator: {
    display: 'none',
  },

  // ── Main content ──
  main: {
    flex: 1, padding: '32px 24px 64px',
    maxWidth: 1100, margin: '0 auto', width: '100%',
  },
}
