import { useState } from 'react'
import { getWeeksLived, getDateAtWeek, getRemainingVisits, getRealityBreakdown, formatNumber } from '../utils'

const CHECKIN_OPTIONS = [
  { value: 'yes',      label: 'Yes',      sub: 'Real progress', bg: '#2a4a2a', border: '#3a6a3a' },
  { value: 'somewhat', label: 'Somewhat', sub: 'Some drift',    bg: '#3a3010', border: '#5a4818' },
  { value: 'no',       label: 'No',       sub: 'Week slipped',  bg: '#2a1a1a', border: '#3e2020' },
]

function getWeekEndDate(startDate) {
  const end = new Date(startDate)
  end.setDate(end.getDate() + 6)
  return end
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CheckIn({
  birthday, lifeExpectancy, name, goals, people, checkins, weeklyIntentions,
  weeklyGoalHours, weeklyReflections, onCheckin, onIntention, onGoalHours,
  onReflection, onNavigate,
}) {
  const currentWeek = getWeeksLived(birthday)
  const existingReflection = weeklyReflections[currentWeek] || {}
  const [intention, setIntention] = useState(weeklyIntentions[currentWeek] || '')
  const [reflection, setReflection] = useState({
    wins: existingReflection.wins || '',
    struggles: existingReflection.struggles || '',
    change: existingReflection.change || '',
  })
  const [saved, setSaved] = useState(false)
  const [reflectionSaved, setReflectionSaved] = useState(false)

  const currentCheckin = checkins[currentWeek]
  const weekStart = getDateAtWeek(birthday, currentWeek)
  const weekEnd = getWeekEndDate(weekStart)
  const thisWeekHours = weeklyGoalHours[currentWeek] || {}
  const totalHoursLogged = Object.values(thisWeekHours).reduce((sum, h) => sum + h, 0)

  const handleSaveIntention = () => {
    onIntention(currentWeek, intention)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveReflection = () => {
    onReflection(currentWeek, reflection)
    setReflectionSaved(true)
    setTimeout(() => setReflectionSaved(false), 2000)
  }

  // Stats
  let streak = 0
  for (let i = currentWeek - 1; i >= 0; i--) {
    if (checkins[i] === 'yes' || checkins[i] === 'somewhat') streak++
    else break
  }
  const counts = Object.values(checkins).reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc }, {})
  const allTimeHours = Object.values(weeklyGoalHours).reduce((total, wd) => total + Object.values(wd).reduce((s, h) => s + h, 0), 0)

  // Sidebar data
  const { freeWeeks, remaining } = getRealityBreakdown(birthday, lifeExpectancy)
  const urgentPeople = people.filter(p => getRemainingVisits(p.age, p.visitsPerYear, p.lifeExpectancy || 82) <= 150)

  return (
    <div style={s.page}>
      {/* ══════ MAIN JOURNAL ══════ */}
      <div style={s.main}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.weekRange}>
            <span style={s.weekBadge}>Week {currentWeek + 1}</span>
            <span style={s.dateRange}>{formatShortDate(weekStart)} – {formatShortDate(weekEnd)}, {weekStart.getFullYear()}</span>
          </div>
          <h1 style={s.headline}>{name ? `${name}'s Week` : 'This Week'}</h1>
        </div>

        {/* Weekly focus */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Weekly focus</h2>
          <div style={s.focusRow}>
            <input
              type="text"
              style={s.focusInput}
              value={intention}
              onChange={e => setIntention(e.target.value)}
              placeholder="One sentence — what matters most this week?"
              onKeyDown={e => e.key === 'Enter' && handleSaveIntention()}
            />
            <button style={s.saveBtn} onClick={handleSaveIntention}>
              {saved ? '✓' : 'Save'}
            </button>
          </div>
        </section>

        {/* Goal hours */}
        {goals.length > 0 && (
          <section style={s.section}>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>Hours toward your goals</h2>
              {totalHoursLogged > 0 && <span style={s.totalBadge}>{totalHoursLogged}h</span>}
            </div>
            <div style={s.goalList}>
              {goals.map(goal => {
                const hours = thisWeekHours[goal.id] || ''
                return (
                  <div key={goal.id} style={s.goalRow}>
                    <div style={s.goalInfo}>
                      <span style={s.goalTitle}>{goal.title}</span>
                      <span style={s.goalTarget}>{goal.hoursPerWeek}h/week target</span>
                    </div>
                    <div style={s.hoursInput}>
                      <input
                        type="number" min="0" max="80" step="0.5" placeholder="0"
                        value={hours}
                        onChange={e => {
                          const val = parseFloat(e.target.value)
                          onGoalHours(currentWeek, goal.id, isNaN(val) ? 0 : val)
                        }}
                        style={s.hoursField}
                      />
                      <span style={s.hoursLabel}>hrs</span>
                    </div>
                    {hours > 0 && (
                      <div style={{
                        ...s.progressBar,
                        width: `${Math.min(100, (hours / goal.hoursPerWeek) * 100)}%`,
                        background: hours >= goal.hoursPerWeek ? '#3a6a3a' : 'var(--accent)',
                      }} />
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Reflection */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Weekly reflection</h2>
          <div style={s.reflectionGrid}>
            <div style={s.reflectionField}>
              <label style={s.reflectionLabel}>What went well?</label>
              <textarea style={s.reflectionInput} value={reflection.wins}
                onChange={e => setReflection(r => ({ ...r, wins: e.target.value }))}
                placeholder="Wins, progress, good decisions..." rows={2} />
            </div>
            <div style={s.reflectionField}>
              <label style={s.reflectionLabel}>What didn't go as planned?</label>
              <textarea style={s.reflectionInput} value={reflection.struggles}
                onChange={e => setReflection(r => ({ ...r, struggles: e.target.value }))}
                placeholder="Missed targets, distractions..." rows={2} />
            </div>
            <div style={s.reflectionField}>
              <label style={s.reflectionLabel}>One thing I'll change next week</label>
              <textarea style={s.reflectionInput} value={reflection.change}
                onChange={e => setReflection(r => ({ ...r, change: e.target.value }))}
                placeholder="A specific, actionable change..." rows={2} />
            </div>
          </div>
          <button style={s.saveBtn} onClick={handleSaveReflection}>
            {reflectionSaved ? '✓ Saved' : 'Save reflection'}
          </button>
        </section>

        {/* Sentiment */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Did this week move you forward?</h2>
          <div style={s.options}>
            {CHECKIN_OPTIONS.map(opt => (
              <button key={opt.value} style={{
                ...s.option,
                background: currentCheckin === opt.value ? opt.bg : 'var(--surface)',
                border: `1px solid ${currentCheckin === opt.value ? opt.border : 'var(--border)'}`,
              }} onClick={() => onCheckin(currentWeek, opt.value)}>
                <span style={s.optionLabel}>{opt.label}</span>
                <span style={s.optionSub}>{opt.sub}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ══════ SIDEBAR / BOTTOM ══════ */}
      <aside style={s.sidebar}>
        {/* Stats */}
        <div style={s.card}>
          <div style={s.cardTitle}>This week</div>
          <div style={s.miniStats}>
            <div style={s.miniStat}>
              <span data-testid="streak-value" style={s.miniStatVal}>{streak}</span>
              <span style={s.miniStatLabel}>week streak</span>
            </div>
            <div style={s.miniStat}>
              <span data-testid="hours-week-value" style={s.miniStatVal}>{totalHoursLogged}</span>
              <span style={s.miniStatLabel}>hrs logged</span>
            </div>
            <div style={s.miniStat}>
              <span data-testid="great-weeks-value" style={{ ...s.miniStatVal, color: '#6a9a5a' }}>{counts.yes || 0}</span>
              <span style={s.miniStatLabel}>great weeks</span>
            </div>
            <div style={s.miniStat}>
              <span data-testid="lost-weeks-value" style={{ ...s.miniStatVal, color: 'var(--text3)' }}>{counts.no || 0}</span>
              <span style={s.miniStatLabel}>lost weeks</span>
            </div>
          </div>
        </div>

        {/* Life snapshot */}
        <button style={s.navCard} onClick={() => onNavigate && onNavigate('grid')}>
          <div style={s.navCardTop}>
            <span style={s.navCardLabel}>Your Life</span>
            <span style={s.navCardArrow}>→</span>
          </div>
          <div style={s.navCardStats}>
            <span style={s.navCardNum}>{formatNumber(remaining)}</span>
            <span style={s.navCardSub}>weeks remaining</span>
          </div>
          <div style={s.navCardStats}>
            <span style={{ ...s.navCardNum, color: 'var(--accent)' }}>{formatNumber(freeWeeks)}</span>
            <span style={s.navCardSub}>truly free weeks</span>
          </div>
        </button>

        {/* Goals snapshot */}
        <button style={s.navCard} onClick={() => onNavigate && onNavigate('goals')}>
          <div style={s.navCardTop}>
            <span style={s.navCardLabel}>Goals</span>
            <span style={s.navCardArrow}>→</span>
          </div>
          {goals.length === 0 ? (
            <span style={s.navCardHint}>No goals yet — add one to start tracking</span>
          ) : (
            <>
              <div style={s.navCardStats}>
                <span style={s.navCardNum}>{goals.length}</span>
                <span style={s.navCardSub}>{goals.length === 1 ? 'life goal' : 'life goals'}</span>
              </div>
              <div style={s.navCardStats}>
                <span style={{ ...s.navCardNum, color: 'var(--accent)' }}>{Math.round(allTimeHours)}</span>
                <span style={s.navCardSub}>total hrs invested</span>
              </div>
            </>
          )}
        </button>

        {/* People snapshot */}
        <button style={s.navCard} onClick={() => onNavigate && onNavigate('people')}>
          <div style={s.navCardTop}>
            <span style={s.navCardLabel}>People</span>
            <span style={s.navCardArrow}>→</span>
          </div>
          {people.length === 0 ? (
            <span style={s.navCardHint}>Add loved ones to see time remaining with them</span>
          ) : (
            <>
              <div style={s.navCardStats}>
                <span style={s.navCardNum}>{people.length}</span>
                <span style={s.navCardSub}>{people.length === 1 ? 'person tracked' : 'people tracked'}</span>
              </div>
              {urgentPeople.length > 0 && (
                <span style={s.navCardUrgent}>
                  {urgentPeople.length === 1
                    ? `${urgentPeople[0].name} — limited visits left`
                    : `${urgentPeople.length} people with limited visits`}
                </span>
              )}
            </>
          )}
        </button>

        {/* Reality check link */}
        <button style={s.navCard} onClick={() => onNavigate && onNavigate('reality')}>
          <div style={s.navCardTop}>
            <span style={s.navCardLabel}>Reality Check</span>
            <span style={s.navCardArrow}>→</span>
          </div>
          <span style={s.navCardHint}>See how your time is really spent</span>
        </button>
      </aside>
    </div>
  )
}

const s = {
  page: {
    display: 'flex', gap: 40, alignItems: 'flex-start',
    flexWrap: 'wrap',
  },

  // Main journal column
  main: { flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: 28, minWidth: 0 },

  // Header
  header: { display: 'flex', flexDirection: 'column', gap: 6 },
  weekRange: { display: 'flex', alignItems: 'center', gap: 12 },
  weekBadge: { fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 },
  dateRange: { fontSize: 14, color: 'var(--text2)' },
  headline: { fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px, 5vw, 36px)', color: 'var(--text)', fontWeight: 400, margin: 0 },

  // Sections
  section: { display: 'flex', flexDirection: 'column', gap: 10 },
  sectionHeader: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text)', fontWeight: 400, margin: 0 },
  totalBadge: { fontSize: 13, color: 'var(--accent)', fontWeight: 600 },

  // Focus
  focusRow: { display: 'flex', gap: 8 },
  focusInput: {
    flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '10px 14px', borderRadius: 8, fontSize: 14,
  },
  saveBtn: {
    background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)',
    padding: '8px 14px', borderRadius: 6, fontSize: 13, flexShrink: 0, alignSelf: 'flex-start',
  },

  // Goals
  goalList: { display: 'flex', flexDirection: 'column', gap: 6 },
  goalRow: {
    position: 'relative', overflow: 'hidden',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '12px 14px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  },
  goalInfo: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  goalTitle: { fontSize: 14, color: 'var(--text)', fontWeight: 500 },
  goalTarget: { fontSize: 11, color: 'var(--text3)' },
  hoursInput: { display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 },
  hoursField: {
    width: 52, background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '7px 8px', borderRadius: 6, fontSize: 14, textAlign: 'right',
  },
  hoursLabel: { fontSize: 11, color: 'var(--text3)' },
  progressBar: {
    position: 'absolute', bottom: 0, left: 0, height: 2,
    borderRadius: '0 2px 2px 0', transition: 'width 0.3s ease, background 0.3s ease',
  },

  // Reflection
  reflectionGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  reflectionField: { display: 'flex', flexDirection: 'column', gap: 3 },
  reflectionLabel: { fontSize: 12, color: 'var(--text3)', fontWeight: 500 },
  reflectionInput: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '10px 12px', borderRadius: 8,
    fontSize: 14, lineHeight: 1.5, resize: 'vertical',
  },

  // Sentiment
  options: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  option: {
    flex: '1 1 120px', padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left', transition: 'all 0.2s',
  },
  optionLabel: { fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  optionSub: { fontSize: 11, color: 'var(--text2)' },

  // ── Sidebar ──
  sidebar: {
    flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: 10,
    position: 'sticky', top: 80,
  },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
    padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
  },
  cardTitle: { fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 },
  miniStats: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  miniStat: { display: 'flex', flexDirection: 'column', gap: 2 },
  miniStatVal: { fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--accent)', lineHeight: 1 },
  miniStatLabel: { fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' },

  // Nav cards
  navCard: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
    padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
    textAlign: 'left', transition: 'border-color 0.2s', width: '100%',
  },
  navCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navCardLabel: { fontSize: 14, color: 'var(--text)', fontWeight: 500 },
  navCardArrow: { fontSize: 14, color: 'var(--text3)' },
  navCardStats: { display: 'flex', alignItems: 'baseline', gap: 6 },
  navCardNum: { fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text)', lineHeight: 1 },
  navCardSub: { fontSize: 11, color: 'var(--text3)' },
  navCardHint: { fontSize: 12, color: 'var(--text3)', lineHeight: 1.4 },
  navCardUrgent: { fontSize: 12, color: '#e74c3c', lineHeight: 1.4 },
}
