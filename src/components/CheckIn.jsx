import { useState } from 'react'
import { getWeeksLived, getDateAtWeek, getWeeklyPerspective, getAgeAtWeek } from '../utils'

const CHECKIN_OPTIONS = [
  { value: 'yes',      label: 'Yes',      sub: 'Real progress', bg: '#e8f5e9', border: '#66bb6a', activeBg: '#c8e6c9' },
  { value: 'somewhat', label: 'Somewhat', sub: 'Some drift',    bg: '#fff8e1', border: '#ffa726', activeBg: '#ffecb3' },
  { value: 'no',       label: 'No',       sub: 'Week slipped',  bg: '#fbe9e7', border: '#ef5350', activeBg: '#ffcdd2' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SENTIMENTS = [
  { value: 'positive', emoji: '+', color: '#66bb6a', bg: '#e8f5e9' },
  { value: 'neutral',  emoji: '~', color: '#ffa726', bg: '#fff8e1' },
  { value: 'negative', emoji: '-', color: '#ef5350', bg: '#fbe9e7' },
]

function getWeekEndDate(startDate) {
  const end = new Date(startDate)
  end.setDate(end.getDate() + 6)
  return end
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getWeekImpression(sentiments) {
  if (!sentiments || Object.keys(sentiments).length === 0) return null
  const values = Object.values(sentiments)
  const pos = values.filter(v => v === 'positive').length
  const neg = values.filter(v => v === 'negative').length
  const total = values.length

  if (pos >= total * 0.7) return { text: 'Great week — mostly positive days.', tone: 'positive' }
  if (pos >= total * 0.5) return { text: 'Solid week with more good days than bad.', tone: 'positive' }
  if (neg >= total * 0.7) return { text: 'Tough week. Be kind to yourself.', tone: 'negative' }
  if (neg >= total * 0.5) return { text: 'More hard days than easy ones. What drained you?', tone: 'negative' }
  return { text: 'A mixed week — some ups, some downs.', tone: 'neutral' }
}

export default function CheckIn({
  birthday, lifeExpectancy, name, goals, people, checkins, milestones,
  weeklyIntentions, weeklyGoalHours, weeklyReflections, onCheckin, onIntention,
  onGoalHours, onReflection, onMilestone, onNavigate,
}) {
  const currentWeek = getWeeksLived(birthday)
  const lastWeek = currentWeek - 1

  const lastWeekReflection = weeklyReflections[lastWeek] || {}
  const existingCurrentReflection = weeklyReflections[currentWeek] || {}

  const [reflection, setReflection] = useState({
    wins: lastWeekReflection.wins || '',
    struggles: lastWeekReflection.struggles || '',
    change: lastWeekReflection.change || '',
  })
  const [intention, setIntention] = useState(weeklyIntentions[currentWeek] || '')
  const [saved, setSaved] = useState(false)
  const [reflectionSaved, setReflectionSaved] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [eventText, setEventText] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventSaved, setEventSaved] = useState(false)

  const lastWeekCheckin = checkins[lastWeek]
  const weekStart = getDateAtWeek(birthday, currentWeek)
  const weekEnd = getWeekEndDate(weekStart)
  const lastWeekStart = getDateAtWeek(birthday, lastWeek)
  const lastWeekEnd = getWeekEndDate(lastWeekStart)

  const thisWeekHours = weeklyGoalHours[currentWeek] || {}
  const totalHoursLogged = Object.values(thisWeekHours).reduce((sum, h) => sum + h, 0)

  // Daily sentiments for current week
  const currentSentiments = existingCurrentReflection.dailySentiments || {}
  const lastWeekSentiments = lastWeekReflection.dailySentiments || {}
  const lastWeekImpression = getWeekImpression(lastWeekSentiments)

  const handleSaveReflection = () => {
    onReflection(lastWeek, { ...reflection, dailySentiments: lastWeekSentiments })
    setReflectionSaved(true)
    setTimeout(() => setReflectionSaved(false), 2000)
  }

  const handleSaveIntention = () => {
    onIntention(currentWeek, intention)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDaySentiment = (dayIndex, sentiment) => {
    const updated = { ...currentSentiments, [dayIndex]: sentiment }
    onReflection(currentWeek, { ...existingCurrentReflection, dailySentiments: updated })
  }

  const perspective = getWeeklyPerspective(birthday, lifeExpectancy, currentWeek)

  // Figure out what day of the week it is relative to the week start
  const today = new Date()
  const daysSinceWeekStart = Math.floor((today - weekStart) / (24 * 60 * 60 * 1000))
  const currentDayIndex = Math.max(0, Math.min(6, daysSinceWeekStart))

  return (
    <div style={s.page}>
      {/* Perspective */}
      <p style={s.perspective}>{perspective}</p>

      {/* ═══ 1. LAST WEEK VERDICT ═══ */}
      {lastWeek >= 0 && (
        <section style={s.section}>
          <h2 style={s.question}>Did last week move you forward?</h2>
          <p style={s.weekLabel}>
            {formatShortDate(lastWeekStart)} – {formatShortDate(lastWeekEnd)}, {lastWeekStart.getFullYear()}
          </p>

          {lastWeekImpression && (
            <p style={{
              ...s.impression,
              color: lastWeekImpression.tone === 'positive' ? 'var(--success)'
                : lastWeekImpression.tone === 'negative' ? 'var(--danger)' : 'var(--accent)',
            }}>
              {lastWeekImpression.text}
            </p>
          )}

          <div style={s.options}>
            {CHECKIN_OPTIONS.map(opt => (
              <button key={opt.value} style={{
                ...s.option,
                background: lastWeekCheckin === opt.value ? opt.activeBg : 'var(--surface)',
                border: `2px solid ${lastWeekCheckin === opt.value ? opt.border : 'var(--border)'}`,
              }} onClick={() => onCheckin(lastWeek, opt.value)}>
                <span style={s.optionLabel}>{opt.label}</span>
                <span style={s.optionSub}>{opt.sub}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ═══ 2. REFLECT ON LAST WEEK ═══ */}
      {lastWeek >= 0 && (
        <section style={s.section}>
          <h2 style={s.sectionTitle}>
            Reflect on last week
            <span style={s.dateInline}>{formatShortDate(lastWeekStart)} – {formatShortDate(lastWeekEnd)}</span>
          </h2>
          <div style={s.reflectionGrid}>
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
              <label style={s.fieldLabel}>One thing to change</label>
              <textarea style={s.textarea} value={reflection.change}
                onChange={e => setReflection(r => ({ ...r, change: e.target.value }))}
                placeholder="A specific, actionable change..." rows={2} />
            </div>
          </div>
          <button style={s.saveBtn} onClick={handleSaveReflection}>
            {reflectionSaved ? 'Saved' : 'Save reflection'}
          </button>
        </section>
      )}

      {/* ═══ 3. THIS WEEK SENTIMENT TRACKER ═══ */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>
          How's this week going?
          <span style={s.dateInline}>{formatShortDate(weekStart)} – {formatShortDate(weekEnd)}</span>
        </h2>
        <p style={s.hint}>Tap each day to record how it felt</p>
        <div style={s.sentimentGrid}>
          {DAYS.map((day, i) => {
            const current = currentSentiments[i]
            const isFuture = i > currentDayIndex
            return (
              <div key={day} style={s.dayCol}>
                <span style={{ ...s.dayLabel, opacity: isFuture ? 0.4 : 1 }}>{day}</span>
                <div style={s.sentimentBtns}>
                  {SENTIMENTS.map(sent => (
                    <button
                      key={sent.value}
                      style={{
                        ...s.sentimentBtn,
                        background: current === sent.value ? sent.bg : 'var(--surface)',
                        border: `1.5px solid ${current === sent.value ? sent.color : 'var(--border)'}`,
                        color: current === sent.value ? sent.color : 'var(--text3)',
                        opacity: isFuture ? 0.3 : 1,
                      }}
                      onClick={() => !isFuture && handleDaySentiment(i, current === sent.value ? null : sent.value)}
                      disabled={isFuture}
                    >
                      {sent.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        {Object.keys(currentSentiments).length > 0 && (() => {
          const imp = getWeekImpression(currentSentiments)
          return imp ? <p style={{ ...s.impression, color: imp.tone === 'positive' ? 'var(--success)' : imp.tone === 'negative' ? 'var(--danger)' : 'var(--accent)' }}>{imp.text}</p> : null
        })()}
      </section>

      {/* ═══ 4. GOAL HOURS (collapsible) ═══ */}
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

      {/* ═══ 5. WHAT MATTERS THIS WEEK ═══ */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>
          What matters this week?
          <span style={s.dateInline}>{formatShortDate(weekStart)} – {formatShortDate(weekEnd)}</span>
        </h2>
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

      {/* ═══ 6. ADD A LIFE EVENT ═══ */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Add a life event</h2>
        <p style={s.hint}>Mark milestones, big moments, or turning points</p>
        <div style={s.eventForm}>
          <input
            type="text"
            style={s.focusInput}
            value={eventText}
            onChange={e => setEventText(e.target.value)}
            placeholder="What happened?"
          />
          <input
            type="date"
            style={s.dateInput}
            value={eventDate}
            onChange={e => setEventDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
          <button
            style={{ ...s.saveBtn, opacity: eventText && eventDate ? 1 : 0.4 }}
            disabled={!eventText || !eventDate}
            onClick={() => {
              if (!eventText || !eventDate || !onMilestone) return
              const eventDateObj = new Date(eventDate)
              const birthDate = new Date(birthday)
              const weekIndex = Math.floor((eventDateObj - birthDate) / (7 * 24 * 60 * 60 * 1000))
              onMilestone(weekIndex, eventText)
              setEventText('')
              setEventDate('')
              setEventSaved(true)
              setTimeout(() => setEventSaved(false), 2000)
            }}
          >
            {eventSaved ? 'Added' : 'Add'}
          </button>
        </div>
      </section>
    </div>
  )
}

const s = {
  page: {
    display: 'flex', flexDirection: 'column', gap: 28,
  },

  perspective: {
    fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text2)',
    lineHeight: 1.6, fontStyle: 'italic', margin: 0,
    padding: '16px 0', borderBottom: '1px solid var(--border)',
  },

  section: { display: 'flex', flexDirection: 'column', gap: 12 },

  question: {
    fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text)',
    fontWeight: 400, margin: 0, lineHeight: 1.3,
  },
  weekLabel: { fontSize: 14, color: 'var(--text3)', margin: 0 },

  sectionTitle: {
    fontSize: 17, color: 'var(--text)', fontWeight: 500, margin: 0,
    display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap',
  },
  dateInline: {
    fontSize: 13, color: 'var(--text3)', fontWeight: 400,
  },

  hint: { fontSize: 13, color: 'var(--text3)', margin: '-4px 0 0' },

  impression: {
    fontSize: 14, fontWeight: 500, margin: 0, lineHeight: 1.4,
    padding: '8px 12px', borderRadius: 8, background: 'var(--surface)',
  },

  options: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  option: {
    flex: '1 1 100px', padding: '16px', borderRadius: 'var(--radius)', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'center',
    transition: 'all 0.15s', minWidth: 90,
  },
  optionLabel: { fontSize: 16, fontWeight: 600, color: 'var(--text)' },
  optionSub: { fontSize: 13, color: 'var(--text2)' },

  // Sentiment tracker
  sentimentGrid: {
    display: 'flex', gap: 4, justifyContent: 'space-between',
  },
  dayCol: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1,
  },
  dayLabel: { fontSize: 11, color: 'var(--text3)', fontWeight: 500 },
  sentimentBtns: {
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  sentimentBtn: {
    width: 32, height: 32, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.1s',
  },

  // Focus
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

  // Expandable
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

  // Life event
  eventForm: {
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  dateInput: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '12px 16px', borderRadius: 8, fontSize: 16,
    width: '100%',
  },

  // Reflection
  reflectionGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  reflectionField: { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLabel: { fontSize: 13, color: 'var(--text2)', fontWeight: 500 },
  textarea: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '12px 14px', borderRadius: 8,
    fontSize: 15, lineHeight: 1.5, resize: 'vertical',
  },
}
