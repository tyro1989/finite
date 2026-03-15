import { useState, useEffect } from 'react'
import Onboarding from './components/Onboarding'
import Grid from './components/Grid'
import RealityCheck from './components/RealityCheck'
import Goals from './components/Goals'
import People from './components/People'
import CheckIn from './components/CheckIn'

const STORAGE_KEY = 'lifeinweeks_v1'

const defaultState = {
  onboarded: false,
  name: '',
  birthday: '',
  lifeExpectancy: 80,
  goals: [],
  milestones: {},
  checkins: {},
  people: [],
  weeklyIntentions: {},
}

function loadState() {
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
  const [state, setState] = useState(loadState)
  const [activeTab, setActiveTab] = useState('grid')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const update = (updates) => setState(prev => ({ ...prev, ...updates }))

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
            onMilestone={(wi, text) => update({ milestones: { ...state.milestones, [wi]: text } })}
            onDeleteMilestone={(wi) => {
              const m = { ...state.milestones }
              delete m[wi]
              update({ milestones: m })
            }}
            onIntention={(wi, text) => update({ weeklyIntentions: { ...state.weeklyIntentions, [wi]: text } })}
          />
        )}
        {activeTab === 'reality' && (
          <RealityCheck birthday={state.birthday} lifeExpectancy={state.lifeExpectancy} name={state.name} />
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

const s = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
  },
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(10,10,10,0.96)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    height: 54,
    flexShrink: 0,
  },
  brand: {
    fontFamily: 'var(--font-serif)',
    fontSize: 15,
    color: 'var(--accent)',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  tabs: {
    display: 'flex',
    gap: 2,
    flex: 1,
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  tab: {
    background: 'none',
    color: 'var(--text3)',
    fontSize: 11,
    fontWeight: 500,
    padding: '5px 12px',
    borderRadius: 5,
    whiteSpace: 'nowrap',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    border: 'none',
  },
  tabActive: {
    color: 'var(--accent)',
    background: 'rgba(201,168,76,0.08)',
  },
  resetBtn: {
    background: 'none',
    color: 'var(--text3)',
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 4,
    flexShrink: 0,
    border: 'none',
  },
  main: {
    flex: 1,
    padding: '32px 24px 64px',
    maxWidth: 1100,
    margin: '0 auto',
    width: '100%',
  },
}
