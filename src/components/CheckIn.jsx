import { useState } from 'react'
import { getWeeksLived, getDateAtWeek, getRemainingVisits, getRealityBreakdown, formatNumber, getWeeklyPerspective, getBirthdaysWithPerson } from '../utils'

const CHECKIN_OPTIONS = [
  { value: 'yes',      label: 'Yes',      sub: 'Real progress', bg: '#e8f5e9', border: '#66bb6a', activeBg: '#c8e6c9' },
  { value: 'somewhat', label: 'Somewhat', sub: 'Some drift',    bg: '#fff8e1', border: '#ffa726', activeBg: '#ffecb3' },
  { value: 'no',       label: 'No',       sub: 'Week slipped',  bg: '#fbe9e7', border: '#ef5350', activeBg: '#ffcdd2' },
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
  const lastWeek = currentWeek - 1
  const existingReflection = weeklyReflections[currentWeek] || {}
  const lastWeekReflection = weeklyReflections[lastWeek] || {}
  const [intention, setIntention] = useState(weeklyIntentions[currentWeek] || '')
  const [reflection, setReflection] = useState({
    wins: existingReflection.wins || '',
    struggles: existingReflection.struggles || '',
    change: existingReflection.change || '',
  })
  const [saved, setSaved] = useState(false)
  const [reflectionSaved, setReflectionSaved] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [showReflection, setShowReflection] = useState(false)
  const [showLastWeek, setShowLastWeek] = useState(false)

  const currentCheckin = checkins[currentWeek]
  const lastWeekCheckin = checkins[lastWeek]
  const weekStart = getDateAtWeek(birthday, currentWeek)
  const weekEnd = getWeekEndDate(weekStart)
  const lastWeekStart = getDateAtWeek(birthday, lastWeek)
  const lastWeekEnd = getWeekEndDate(lastWeekStart)
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

  const perspective = getWeeklyPerspective(birthday, lifeExpectancy, currentWeek)

  return (
    <div style={s.page}>
      {/* Perspective — gentle nudge */}
      <p style={s.perspective}>{perspective}</p>

      {/* ═══ PRIMARY: Did this week move you forward? ═══ */}
      <section style={s.section}>
        <h2 style={s.question}>Did this week move you forward?</h2>
        <p style={s.weekLabel}>
          Week {currentWeek + 1} — {formatShortDate(weekStart)} to {formatShortDate(weekEnd)}, {weekStart.getFullYear()}
        </p>
        <div style={s.options}>
          {CHECKIN_OPTIONS.map(opt => (
            <button key={opt.value} style={{
              ...s.option,
              background: currentCheckin === opt.value ? opt.activeBg : 'var(--surface)',
              border: `2px solid ${currentCheckin === opt.value ? opt.border : 'var(--border)'}`,
            }} onClick={() => onCheckin(currentWeek, opt.value)}>
              <span style={s.optionLabel}>{opt.label}</span>
              <span style={s.optionSub}>{opt.sub}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ═══ Weekly focus (always visible, lightweight) ═══ */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>What matters most this week?</h2>
        <div style={s.focusRow}>
          <input
            type="text"
            style={s.focusInput}
            value={intention}
            onChange={e => setIntention(e.target.value)}
            placeholder="One sentence..."
            onKeyDown={e => e.key === 'Enter' && handleSaveIntention()}
          />
          <button style={s.saveBtn} onClick={handleSaveIntention}>
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </section>

      {/* ═══ LAST WEEK (collapsible) ═══ */}
      {lastWeek >= 0 && (
        <section style={s.section}>
          <button style={s.expandBtn} onClick={() => setShowLastWeek(!showLastWeek)}>
            <span style={s.expandTitle}>
              Last week — {formatShortDate(lastWeekStart)} to {formatShortDate(lastWeekEnd)}
            </span>
            <span style={s.expandArrow}>{showLastWeek ? '−' : '+'}</span>
          </button>
          {showLastWeek && (
            <div style={s.expandContent}>
              {lastWeekCheckin && (
                <div style={s.lastWeekStatus}>
                  <span style={s.miniLabel}>Verdict:</span>
                  <span style={{
                    ...s.lastWeekBadge,
                    color: lastWeekCheckin === 'yes' ? 'var(--success)' : lastWeekCheckin === 'no' ? 'var(--danger)' : 'var(--accent)',
                  }}>
                    {lastWeekCheckin === 'yes' ? 'Moved forward' : lastWeekCheckin === 'somewhat' ? 'Some drift' : 'Week slipped'}
                  </span>
                </div>
              )}
              {weeklyIntentions[lastWeek] && (
                <div style={s.lastWeekItem}>
                  <span style={s.miniLabel}>Focus was:</span>
                  <span style={s.lastWeekText}>{weeklyIntentions[lastWeek]}</span>
                </div>
              )}
              {(lastWeekReflection.wins || lastWeekReflection.struggles || lastWeekReflection.change) && (
                <div style={s.lastWeekReflection}>
                  {lastWeekReflection.wins && <p style={s.lastWeekDetail}><strong>Went well:</strong> {lastWeekReflection.wins}</p>}
                  {lastWeekReflection.struggles && <p style={s.lastWeekDetail}><strong>Struggled:</strong> {lastWeekReflection.struggles}</p>}
                  {lastWeekReflection.change && <p style={s.lastWeekDetail}><strong>Committed to:</strong> {lastWeekReflection.change}</p>}
                </div>
              )}
              {!lastWeekCheckin && !weeklyIntentions[lastWeek] && !lastWeekReflection.wins && (
                <p style={s.emptyHint}>No data recorded last week.</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* ═══ Goal hours (optional, collapsible) ═══ */}
      {goals.length > 0 && (
        <section style={s.section}>
          <button style={s.expandBtn} onClick={() => setShowGoals(!showGoals)}>
            <span style={s.expandTitle}>
              Log goal hours {totalHoursLogged > 0 && <span style={s.badge}>{totalHoursLogged}h</span>}
            </span>
            <span style={s.expandArrow}>{showGoals ? '−' : '+'}</span>
          </button>
          {showGoals && (
            <div style={s.expandContent}>
              {goals.map(goal => {
                const hours = thisWeekHours[goal.id] || ''
                return (
                  <div key={goal.id} style={s.goalRow}>
                    <div style={s.goalInfo}>
                      <span style={s.goalTitle}>{goal.title}</span>
                      <span style={s.goalTarget}>{goal.hoursPerWeek}h/wk target</span>
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
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ═══ Weekly reflection (optional, collapsible) ═══ */}
      <section style={s.section}>
        <button style={s.expandBtn} onClick={() => setShowReflection(!showReflection)}>
          <span style={s.expandTitle}>Reflect on this week</span>
          <span style={s.expandArrow}>{showReflection ? '−' : '+'}</span>
        </button>
        {showReflection && (
          <div style={s.expandContent}>
            <div style={s.reflectionField}>
              <label style={s.fieldLabel}>What went well?</label>
              <textarea style={s.textarea} value={reflection.wins}
                onChange={e => setReflection(r => ({ ...r, wins: e.target.value }))}
                placeholder="Wins, progress, good decisions..." rows={2} />
            </div>
            <div style={s.reflectionField}>
              <label style={s.fieldLabel}>What didn't go as planned?</label>
              <textarea style={s.textarea} value={reflection.struggles}
                onChange={e => setReflection(r => ({ ...r, struggles: e.target.value }))}
                placeholder="Missed targets, distractions..." rows={2} />
            </div>
            <div style={s.reflectionField}>
              <label style={s.fieldLabel}>One thing I'll change next week</label>
              <textarea style={s.textarea} value={reflection.change}
                onChange={e => setReflection(r => ({ ...r, change: e.target.value }))}
                placeholder="A specific, actionable change..." rows={2} />
            </div>
            <button style={s.saveBtn} onClick={handleSaveReflection}>
              {reflectionSaved ? 'Saved' : 'Save reflection'}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

const s = {
  page: {
    display: 'flex', flexDirection: 'column', gap: 24,
  },

  perspective: {
    fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text2)',
    lineHeight: 1.6, fontStyle: 'italic', margin: 0,
    padding: '16px 0', borderBottom: '1px solid var(--border)',
  },

  section: { display: 'flex', flexDirection: 'column', gap: 12 },

  question: {
    fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--text)',
    fontWeight: 400, margin: 0, lineHeight: 1.3,
  },
  weekLabel: { fontSize: 14, color: 'var(--text3)', margin: 0 },

  sectionTitle: {
    fontSize: 17, color: 'var(--text)', fontWeight: 500, margin: 0,
  },

  options: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  option: {
    flex: '1 1 100px', padding: '16px', borderRadius: 'var(--radius)', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'center',
    transition: 'all 0.15s', minWidth: 90,
  },
  optionLabel: { fontSize: 16, fontWeight: 600, color: 'var(--text)' },
  optionSub: { fontSize: 13, color: 'var(--text2)' },

  focusRow: { display: 'flex', gap: 8 },
  focusInput: {
    flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '12px 16px', borderRadius: 8, fontSize: 16,
  },
  saveBtn: {
    background: 'var(--accent)', border: 'none', color: '#fff',
    padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500,
    flexShrink: 0, alignSelf: 'flex-start',
  },

  expandBtn: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', padding: '14px 16px', borderRadius: 'var(--radius)',
    background: 'var(--surface)', border: '1px solid var(--border)',
    textAlign: 'left',
  },
  expandTitle: { fontSize: 15, fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 },
  expandArrow: { fontSize: 18, color: 'var(--text3)', fontWeight: 300, lineHeight: 1 },
  expandContent: {
    display: 'flex', flexDirection: 'column', gap: 12,
    padding: '4px 0',
  },
  badge: {
    fontSize: 12, background: 'var(--surface2)', color: 'var(--accent)',
    padding: '2px 8px', borderRadius: 10, fontWeight: 600,
  },

  // Last week
  lastWeekStatus: { display: 'flex', alignItems: 'center', gap: 8 },
  lastWeekBadge: { fontSize: 14, fontWeight: 500 },
  lastWeekItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  lastWeekText: { fontSize: 14, color: 'var(--text)' },
  lastWeekReflection: { display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' },
  lastWeekDetail: { fontSize: 14, color: 'var(--text2)', margin: 0, lineHeight: 1.5 },
  miniLabel: { fontSize: 12, color: 'var(--text3)', fontWeight: 500 },
  emptyHint: { fontSize: 14, color: 'var(--text3)', margin: 0 },

  // Goals
  goalRow: {
    background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  },
  goalInfo: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  goalTitle: { fontSize: 15, color: 'var(--text)', fontWeight: 500 },
  goalTarget: { fontSize: 12, color: 'var(--text3)' },
  hoursInput: { display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 },
  hoursField: {
    width: 56, background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '8px', borderRadius: 6, fontSize: 15, textAlign: 'right',
  },
  hoursLabel: { fontSize: 12, color: 'var(--text3)' },

  // Reflection
  reflectionField: { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLabel: { fontSize: 13, color: 'var(--text2)', fontWeight: 500 },
  textarea: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '12px 14px', borderRadius: 8,
    fontSize: 15, lineHeight: 1.5, resize: 'vertical',
  },
}
