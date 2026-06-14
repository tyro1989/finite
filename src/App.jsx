import { useState, useEffect, useRef } from 'react'
import Onboarding from './components/Onboarding'
import Grid from './components/Grid'
import RealityCheck from './components/RealityCheck'
import Goals from './components/Goals'
import People from './components/People'
import CheckIn from './components/CheckIn'
import Auth, { LinkAccount } from './components/Auth'
import { loadUser, saveUser } from './api'

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
  weeklyGoalHours: {},
  weeklyReflections: {},
}

function loadLocalState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...defaultState, ...JSON.parse(saved) }
  } catch {}
  return defaultState
}

const TABS = [
  { id: 'checkin', label: 'This Week' },
  { id: 'grid',    label: 'Your Life' },
  { id: 'goals',   label: 'Goals' },
  { id: 'people',  label: 'People' },
  { id: 'reality', label: 'Reality Check' },
]

export default function App() {
  const [state, setState] = useState(defaultState)
  const [activeTab, setActiveTab] = useState('checkin')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState(null)
  const userIdRef = useRef(null)
  const saveTimer = useRef(null)

  useEffect(() => {
    async function bootstrap() {
      const userId = localStorage.getItem(USER_ID_KEY)

      if (!userId) {
        setLoading(false)
        return
      }

      userIdRef.current = userId

      try {
        const data = await loadUser(userId)
        if (data) {
          const { userId: _id, email, ...rest } = data
          setState({ ...defaultState, ...rest })
          setUserEmail(email || null)
          setAuthenticated(true)
        } else {
          localStorage.removeItem(USER_ID_KEY)
        }
      } catch {
        setState(loadLocalState())
        setAuthenticated(true)
        setSyncError(true)
      }

      setLoading(false)
    }

    bootstrap()
  }, [])

  useEffect(() => {
    if (loading) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, loading])

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

  const handleAuth = async (userId) => {
    localStorage.setItem(USER_ID_KEY, userId)
    userIdRef.current = userId
    try {
      const data = await loadUser(userId)
      if (data) {
        const { userId: _id, email, ...rest } = data
        setState({ ...defaultState, ...rest })
        setUserEmail(email || null)
      }
    } catch {}
    setAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem(USER_ID_KEY)
    localStorage.removeItem(STORAGE_KEY)
    userIdRef.current = null
    setState(defaultState)
    setAuthenticated(false)
    setUserEmail(null)
  }

  if (loading) return <LoadingScreen />

  if (!authenticated) {
    return <Auth onAuth={handleAuth} />
  }

  if (!state.onboarded) {
    return <Onboarding onComplete={(data) => update({ ...data, onboarded: true })} />
  }

  return (
    <div style={s.app}>
      <header style={s.header}>
        <div style={s.brand}>Finite</div>
        <div style={s.headerRight}>
          {syncing && <span style={s.syncing}>Saving...</span>}
          {syncError && <span style={s.syncErr}>Offline</span>}
          <button style={s.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </header>

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
            lifeExpectancy={state.lifeExpectancy}
            name={state.name}
            goals={state.goals}
            checkins={state.checkins}
            weeklyIntentions={state.weeklyIntentions}
            weeklyGoalHours={state.weeklyGoalHours || {}}
            weeklyReflections={state.weeklyReflections || {}}
            onCheckin={(wi, val) => update({ checkins: { ...state.checkins, [wi]: val } })}
            onIntention={(wi, text) => update({ weeklyIntentions: { ...state.weeklyIntentions, [wi]: text } })}
            onGoalHours={(wi, goalId, hours) => {
              const weekData = { ...(state.weeklyGoalHours || {})[wi] }
              if (hours > 0) weekData[goalId] = hours
              else delete weekData[goalId]
              update({ weeklyGoalHours: { ...state.weeklyGoalHours, [wi]: weekData } })
            }}
            onReflection={(wi, reflection) => update({ weeklyReflections: { ...state.weeklyReflections, [wi]: reflection } })}
          />
        )}

        {/* Link account prompt — only show if no email linked yet */}
        {!userEmail && activeTab === 'checkin' && (
          <div style={{ marginTop: 32 }}>
            <LinkAccount userId={userIdRef.current} onLinked={setUserEmail} />
          </div>
        )}
      </main>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: 'var(--accent)' }}>Finite</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 12 }}>Loading...</div>
      </div>
    </div>
  )
}

const s = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' },

  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px 0',
    flexShrink: 0,
  },
  brand: {
    fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--accent)',
    fontWeight: 400,
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  syncing: { fontSize: 12, color: 'var(--text3)' },
  syncErr: { fontSize: 12, color: 'var(--danger)' },
  logoutBtn: {
    background: 'none', border: '1px solid var(--border)', color: 'var(--text3)',
    fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
  },

  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'var(--bg)',
    borderBottom: '1px solid var(--border)',
    padding: '0 20px',
    flexShrink: 0,
  },
  tabs: {
    display: 'flex', gap: 0,
    maxWidth: 700, margin: '0 auto', width: '100%',
    overflowX: 'auto', scrollbarWidth: 'none',
  },
  tab: {
    position: 'relative',
    background: 'none', border: 'none',
    padding: '14px 16px',
    cursor: 'pointer',
  },
  tabActive: {},
  tabLabel: {
    fontSize: 15, fontWeight: 500,
    color: 'var(--text3)',
    whiteSpace: 'nowrap',
  },
  tabLabelActive: { color: 'var(--text)', fontWeight: 600 },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: 12, right: 12,
    height: 2, borderRadius: 1,
    background: 'var(--accent)',
  },

  main: {
    flex: 1, padding: '24px 20px 100px',
    maxWidth: 700, margin: '0 auto', width: '100%',
  },
}
