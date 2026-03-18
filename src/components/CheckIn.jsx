import { useState } from 'react'
import { getWeeksLived, getDateAtWeek, formatDate } from '../utils'

const QUOTES = [
  { text: "How we spend our days is how we spend our lives.", author: "Annie Dillard" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Lost time is never found again.", author: "Benjamin Franklin" },
  { text: "In the end, it's not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln" },
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
  { text: "We must be willing to let go of the life we planned so as to have the life that is waiting for us.", author: "Joseph Campbell" },
  { text: "Most men pursue pleasure with such breathless haste that they hurry past it.", author: "Søren Kierkegaard" },
  { text: "It is not that we have a short time to live, but that we waste a great deal of it.", author: "Seneca" },
  { text: "Do not go gentle into that good night.", author: "Dylan Thomas" },
  { text: "The price of anything is the amount of life you exchange for it.", author: "Henry David Thoreau" },
  { text: "Guard well your spare moments. They are like uncut diamonds.", author: "Ralph Waldo Emerson" },
]

const CHECKIN_OPTIONS = [
  { value: 'yes',      label: 'Yes',      sub: 'Made real progress toward what matters', bg: '#2a4a2a', border: '#3a6a3a' },
  { value: 'somewhat', label: 'Somewhat', sub: 'Partial progress — some good, some drift', bg: '#3a3010', border: '#5a4818' },
  { value: 'no',       label: 'No',       sub: 'This week slipped by without intention', bg: '#2a1a1a', border: '#3e2020' },
]

function getWeekEndDate(startDate) {
  const end = new Date(startDate)
  end.setDate(end.getDate() + 6)
  return end
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CheckIn({ birthday, goals, checkins, weeklyIntentions, weeklyGoalHours, onCheckin, onIntention, onGoalHours }) {
  const currentWeek = getWeeksLived(birthday)
  const [intention, setIntention] = useState(weeklyIntentions[currentWeek] || '')
  const [saved, setSaved] = useState(false)

  const quote = QUOTES[currentWeek % QUOTES.length]
  const currentCheckin = checkins[currentWeek]
  const weekStart = getDateAtWeek(birthday, currentWeek)
  const weekEnd = getWeekEndDate(weekStart)
  const thisWeekHours = weeklyGoalHours[currentWeek] || {}

  const totalHoursLogged = Object.values(thisWeekHours).reduce((sum, h) => sum + h, 0)

  const handleSave = () => {
    onIntention(currentWeek, intention)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Streak: consecutive weeks with yes/somewhat going backward
  let streak = 0
  for (let i = currentWeek - 1; i >= 0; i--) {
    if (checkins[i] === 'yes' || checkins[i] === 'somewhat') streak++
    else break
  }

  const counts = Object.values(checkins).reduce((acc, v) => {
    acc[v] = (acc[v] || 0) + 1
    return acc
  }, {})

  // Total hours across all weeks
  const allTimeHours = Object.values(weeklyGoalHours).reduce((total, weekData) => {
    return total + Object.values(weekData).reduce((s, h) => s + h, 0)
  }, 0)

  // Recent 12 weeks for mini grid
  const recentWeeks = Array.from({ length: Math.min(12, currentWeek + 1) }, (_, i) => currentWeek - i).reverse()

  return (
    <div style={s.container}>
      {/* ── Week Header ── */}
      <div style={s.header}>
        <div style={s.weekRange}>
          <span style={s.weekBadge}>Week {currentWeek + 1}</span>
          <span style={s.dateRange}>{formatShortDate(weekStart)} – {formatShortDate(weekEnd)}, {weekStart.getFullYear()}</span>
        </div>
        <h1 style={s.headline}>This Week</h1>
      </div>

      {/* ── Quote ── */}
      <div style={s.quoteBox}>
        <p style={s.quoteText}>"{quote.text}"</p>
        <p style={s.quoteAuthor}>— {quote.author}</p>
      </div>

      {/* ── Goal Hours Tracker ── */}
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Hours toward your goals</h2>
          {totalHoursLogged > 0 && (
            <span style={s.totalBadge}>{totalHoursLogged}h this week</span>
          )}
        </div>

        {goals.length === 0 ? (
          <div style={s.emptyGoals}>
            <p style={s.emptyText}>No goals set yet. Add goals in the Goals tab to track weekly hours here.</p>
          </div>
        ) : (
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
                      type="number"
                      min="0"
                      max="80"
                      step="0.5"
                      placeholder="0"
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
        )}
      </section>

      {/* ── Weekly Focus ── */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Weekly focus</h2>
        <div style={s.focusRow}>
          <input
            type="text"
            style={s.focusInput}
            value={intention}
            onChange={e => setIntention(e.target.value)}
            placeholder="One sentence — what matters most this week?"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <button style={s.saveBtn} onClick={handleSave}>
            {saved ? '✓' : 'Save'}
          </button>
        </div>
      </section>

      {/* ── Sentiment Check-in ── */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Did this week move you forward?</h2>
        <div style={s.options}>
          {CHECKIN_OPTIONS.map(opt => (
            <button
              key={opt.value}
              style={{
                ...s.option,
                background: currentCheckin === opt.value ? opt.bg : 'var(--surface)',
                border: `1px solid ${currentCheckin === opt.value ? opt.border : 'var(--border)'}`,
              }}
              onClick={() => onCheckin(currentWeek, opt.value)}
            >
              <span style={s.optionLabel}>{opt.label}</span>
              <span style={s.optionSub}>{opt.sub}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <div style={s.statsRow}>
        {[
          { val: streak,            label: 'week streak',   color: 'var(--accent)', testId: 'streak-value' },
          { val: totalHoursLogged,  label: 'hrs this week', color: 'var(--accent)', testId: 'hours-week-value' },
          { val: Math.round(allTimeHours), label: 'total hrs logged', color: '#6a9a5a', testId: 'total-hours-value' },
          { val: counts.yes || 0,   label: 'great weeks',   color: '#6a9a5a',       testId: 'great-weeks-value' },
          { val: counts.no || 0,    label: 'lost weeks',    color: 'var(--text3)',  testId: 'lost-weeks-value' },
        ].map(stat => (
          <div key={stat.label} style={s.statCard}>
            <span data-testid={stat.testId} style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: stat.color, lineHeight: 1 }}>{stat.val}</span>
            <span style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ── Recent weeks ── */}
      {Object.keys(checkins).length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Recent weeks</h2>
          <div style={s.recentGrid}>
            {recentWeeks.map(wk => {
              const val = checkins[wk]
              const dt = getDateAtWeek(birthday, wk)
              const isCur = wk === currentWeek
              const wkHours = Object.values(weeklyGoalHours[wk] || {}).reduce((s, h) => s + h, 0)
              return (
                <div key={wk} style={{
                  ...s.recentCell,
                  background: val === 'yes' ? '#2a4a2a' : val === 'somewhat' ? '#3a3010' : val === 'no' ? '#2a1a1a' : 'var(--surface)',
                  border: `1px solid ${isCur ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>Wk {wk + 1}</span>
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{formatShortDate(dt)}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {val === 'yes' ? '✓' : val === 'somewhat' ? '~' : val === 'no' ? '✗' : '—'}
                  </span>
                  {wkHours > 0 && <span style={{ fontSize: 10, color: 'var(--accent)' }}>{wkHours}h</span>}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 680 },

  // Header
  header: { display: 'flex', flexDirection: 'column', gap: 8 },
  weekRange: { display: 'flex', alignItems: 'center', gap: 12 },
  weekBadge: {
    fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em',
    fontWeight: 600,
  },
  dateRange: { fontSize: 14, color: 'var(--text2)', letterSpacing: '0.01em' },
  headline: { fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 44px)', color: 'var(--text)', fontWeight: 400, margin: 0 },

  // Quote
  quoteBox: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '20px 24px',
    borderLeft: '3px solid var(--accent)',
  },
  quoteText: { fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.7, margin: 0 },
  quoteAuthor: { fontSize: 12, color: 'var(--text3)', marginTop: 8, letterSpacing: '0.04em' },

  // Sections
  section: { display: 'flex', flexDirection: 'column', gap: 12 },
  sectionHeader: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text)', fontWeight: 400, margin: 0 },
  totalBadge: {
    fontSize: 13, color: 'var(--accent)', fontWeight: 600,
  },

  // Goal tracker
  emptyGoals: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '20px 24px',
  },
  emptyText: { fontSize: 14, color: 'var(--text3)', margin: 0 },
  goalList: { display: 'flex', flexDirection: 'column', gap: 8 },
  goalRow: {
    position: 'relative', overflow: 'hidden',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '14px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  goalInfo: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  goalTitle: { fontSize: 15, color: 'var(--text)', fontWeight: 500 },
  goalTarget: { fontSize: 11, color: 'var(--text3)', letterSpacing: '0.02em' },
  hoursInput: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  hoursField: {
    width: 56, background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '8px 10px', borderRadius: 6,
    fontSize: 15, textAlign: 'right',
  },
  hoursLabel: { fontSize: 12, color: 'var(--text3)' },
  progressBar: {
    position: 'absolute', bottom: 0, left: 0, height: 3,
    borderRadius: '0 2px 2px 0',
    transition: 'width 0.3s ease, background 0.3s ease',
  },

  // Weekly focus
  focusRow: { display: 'flex', gap: 8 },
  focusInput: {
    flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '12px 16px', borderRadius: 8, fontSize: 15,
  },
  saveBtn: {
    background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)',
    padding: '8px 16px', borderRadius: 6, fontSize: 13, flexShrink: 0,
  },

  // Check-in options
  options: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  option: {
    flex: '1 1 160px', padding: '14px 16px', borderRadius: 8, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left', transition: 'all 0.2s',
  },
  optionLabel: { fontSize: 15, fontWeight: 600, color: 'var(--text)' },
  optionSub: { fontSize: 12, color: 'var(--text2)' },

  // Stats
  statsRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  statCard: {
    flex: '1 1 80px', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '14px 10px',
    display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
  },

  // Recent grid
  recentGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  recentCell: {
    borderRadius: 6, padding: '8px 12px',
    display: 'flex', flexDirection: 'column', gap: 2, minWidth: 80,
  },
}
