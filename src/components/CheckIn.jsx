import { useState, useEffect } from 'react'
import { getWeeksLived, getWeeklyPerspective, getRemainingVisits, getCurrentCalendarWeek } from '../utils'
import { themeMeta } from '../themes'
import ThemePicker from './ThemePicker'

// Build a single, personalized attention line from the user's own data.
// Priority: momentum streak → urgent person → stalled goal → this-week mood → fallback.
function getAttentionHeadline({ name, currentWeek, checkins, people, goals, weeklyGoalHours, weeklyReflections }) {
  const who = name ? name.split(' ')[0] : null
  const greet = who ? `${who}, ` : ''

  // 1) Momentum: consecutive prior weeks marked yes/somewhat
  let streak = 0
  for (let i = currentWeek - 1; i >= 0; i--) {
    if (checkins[i] === 'yes' || checkins[i] === 'somewhat') streak++
    else break
  }
  if (streak >= 3) {
    return { text: `${greet}you're on a ${streak}-week roll. Protect the streak.`, tone: 'positive' }
  }

  // 2) Urgent person — fewest visits left
  if (people && people.length) {
    const ranked = people
      .map(p => ({ name: p.name, visits: getRemainingVisits(p.age, p.visitsPerYear, p.lifeExpectancy || 82) }))
      .sort((a, b) => a.visits - b.visits)
    const top = ranked[0]
    if (top && top.visits <= 60) {
      return { text: `${greet}only about ${top.visits} visits left with ${top.name}. Reach out this week?`, tone: 'urgent' }
    }
  }

  // 3) Stalled goal — has goals but no hours logged this week
  if (goals && goals.length) {
    const thisWeekHours = weeklyGoalHours[currentWeek] || {}
    const logged = Object.values(thisWeekHours).reduce((s, h) => s + h, 0)
    if (logged === 0) {
      const g = goals[0]
      return { text: `${greet}you haven't logged time toward "${g.title}" yet this week.`, tone: 'nudge' }
    }
  }

  // 4) This week's mood so far
  const sentiments = (weeklyReflections[currentWeek] || {}).dailySentiments || {}
  const vals = Object.values(sentiments).filter(Boolean)
  if (vals.length >= 3) {
    const pos = vals.filter(v => v === 'positive').length
    if (pos >= vals.length * 0.6) return { text: `${greet}this week is shaping up well. Keep going.`, tone: 'positive' }
    const neg = vals.filter(v => v === 'negative').length
    if (neg >= vals.length * 0.6) return { text: `${greet}a heavy stretch. What's one small thing that would help?`, tone: 'urgent' }
  }

  return null
}

const VERDICT_OPTIONS = [
  { value: 'yes',      label: 'Yes',      sub: 'Real progress', color: '#2e7d32', bg: '#e8f5e9' },
  { value: 'somewhat', label: 'Somewhat', sub: 'Some drift',    color: '#b8860b', bg: '#fff8e1' },
  { value: 'no',       label: 'No',       sub: 'It slipped',    color: '#c62828', bg: '#fbe9e7' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MOODS = [
  { value: 'positive', icon: '☺', label: 'Good',  color: '#2e7d32', bg: '#e8f5e9' },
  { value: 'neutral',  icon: '•', label: 'Okay',  color: '#b8860b', bg: '#fff8e1' },
  { value: 'negative', icon: '☹', label: 'Hard',  color: '#c62828', bg: '#fbe9e7' },
]

function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getWeekImpression(sentiments) {
  if (!sentiments || Object.keys(sentiments).length === 0) return null
  const values = Object.values(sentiments).filter(Boolean)
  if (!values.length) return null
  const pos = values.filter(v => v === 'positive').length
  const neg = values.filter(v => v === 'negative').length
  const total = values.length

  if (pos >= total * 0.7) return { text: 'A great stretch — most days felt good.', tone: 'positive' }
  if (pos >= total * 0.5) return { text: 'More good days than hard ones. Nice momentum.', tone: 'positive' }
  if (neg >= total * 0.7) return { text: 'A heavy week. Be gentle with yourself.', tone: 'negative' }
  if (neg >= total * 0.5) return { text: 'More hard days than easy. What weighed on you?', tone: 'negative' }
  return { text: 'A mixed week — some ups, some downs.', tone: 'neutral' }
}

function toneColor(tone) {
  return tone === 'positive' ? 'var(--success)' : tone === 'negative' ? 'var(--danger)' : 'var(--accent)'
}

export default function CheckIn({
  birthday, lifeExpectancy, name, goals, people = [], checkins, weeklyIntentions,
  weeklyGoalHours, weeklyReflections, customThemes = [], onCheckin, onIntention,
  onGoalHours, onReflection, onAddTheme,
}) {
  const currentWeek = getWeeksLived(birthday)
  const lastWeek = currentWeek - 1

  const [view, setView] = useState('this')

  // Real calendar weeks (Sunday → Saturday), not birthday-anchored.
  const { start: weekStart, end: weekEnd } = getCurrentCalendarWeek()
  const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(weekEnd); lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)

  const perspective = getWeeklyPerspective(birthday, lifeExpectancy, currentWeek)
  const headline = getAttentionHeadline({
    name, currentWeek, checkins, people, goals, weeklyGoalHours, weeklyReflections,
  })

  return (
    <div style={s.page}>
      {/* Personalized attention banner — driven by the user's own data */}
      {headline && (
        <div style={{
          ...s.attention,
          borderColor: headline.tone === 'urgent' ? 'var(--danger)' : headline.tone === 'positive' ? 'var(--success)' : 'var(--accent)',
        }}>
          <span style={{
            ...s.attentionDot,
            background: headline.tone === 'urgent' ? 'var(--danger)' : headline.tone === 'positive' ? 'var(--success)' : 'var(--accent)',
          }} />
          <span style={s.attentionText}>{headline.text}</span>
        </div>
      )}

      <p style={s.perspective}>{perspective}</p>

      {/* Segmented control */}
      <div style={s.segmented}>
        <button
          style={{ ...s.segment, ...(view === 'this' ? s.segmentActive : {}) }}
          onClick={() => setView('this')}
        >
          This week
        </button>
        {lastWeek >= 0 && (
          <button
            style={{ ...s.segment, ...(view === 'last' ? s.segmentActive : {}) }}
            onClick={() => setView('last')}
          >
            Last week
          </button>
        )}
      </div>

      {view === 'this' ? (
        <ThisWeekView
          currentWeek={currentWeek}
          weekStart={weekStart}
          weekEnd={weekEnd}
          goals={goals}
          weeklyIntentions={weeklyIntentions}
          weeklyGoalHours={weeklyGoalHours}
          weeklyReflections={weeklyReflections}
          customThemes={customThemes}
          onIntention={onIntention}
          onGoalHours={onGoalHours}
          onReflection={onReflection}
          onAddTheme={onAddTheme}
        />
      ) : (
        <LastWeekView
          lastWeek={lastWeek}
          lastWeekStart={lastWeekStart}
          lastWeekEnd={lastWeekEnd}
          checkins={checkins}
          weeklyReflections={weeklyReflections}
          customThemes={customThemes}
          onCheckin={onCheckin}
          onReflection={onReflection}
          onAddTheme={onAddTheme}
        />
      )}
    </div>
  )
}

// ─── This Week: daily driver ───────────────────────────────────────────────
function ThisWeekView({
  currentWeek, weekStart, weekEnd, goals, weeklyIntentions,
  weeklyGoalHours, weeklyReflections, customThemes, onIntention, onGoalHours,
  onReflection, onAddTheme,
}) {
  const existing = weeklyReflections[currentWeek] || {}
  const sentiments = existing.dailySentiments || {}
  const [intention, setIntention] = useState(weeklyIntentions[currentWeek] || '')
  const [focusSaved, setFocusSaved] = useState(false)
  const focusTheme = existing.focusTheme || null

  useEffect(() => { setIntention(weeklyIntentions[currentWeek] || '') }, [currentWeek, weeklyIntentions])

  const setFocusTheme = (theme) => {
    onReflection(currentWeek, { ...existing, focusTheme: theme })
  }

  const thisWeekHours = weeklyGoalHours[currentWeek] || {}
  const totalHoursLogged = Object.values(thisWeekHours).reduce((sum, h) => sum + h, 0)

  const today = new Date()
  const daysSinceWeekStart = Math.floor((today - weekStart) / (24 * 60 * 60 * 1000))
  const currentDayIndex = Math.max(0, Math.min(6, daysSinceWeekStart))

  const handleDayMood = (dayIndex, mood) => {
    const updated = { ...sentiments, [dayIndex]: mood }
    if (mood === null) delete updated[dayIndex]
    onReflection(currentWeek, { ...existing, dailySentiments: updated })
  }

  const saveFocus = () => {
    onIntention(currentWeek, intention.trim())
    setFocusSaved(true)
    setTimeout(() => setFocusSaved(false), 1800)
  }

  const impression = getWeekImpression(sentiments)

  return (
    <div style={s.view}>
      <p style={s.weekRange}>{formatShortDate(weekStart)} – {formatShortDate(weekEnd)}, {weekStart.getFullYear()}</p>

      {/* Daily mood — the hero */}
      <section style={s.card}>
        <h2 style={s.cardTitle}>How are your days going?</h2>
        <p style={s.cardHint}>Tap to log how each day felt</p>
        <div style={s.moodGrid}>
          {DAYS.map((day, i) => {
            const dayDate = new Date(weekStart)
            dayDate.setDate(dayDate.getDate() + i)
            const current = sentiments[i]
            const isFuture = i > currentDayIndex
            const isToday = i === currentDayIndex
            return (
              <div key={day} style={s.dayCol}>
                <span style={{ ...s.dayLabel, color: isToday ? 'var(--accent)' : 'var(--text3)', fontWeight: isToday ? 700 : 500 }}>
                  {day[0]}
                </span>
                <span style={s.dayNum}>{dayDate.getDate()}</span>
                <div style={s.moodStack}>
                  {MOODS.map(mood => {
                    const active = current === mood.value
                    return (
                      <button
                        key={mood.value}
                        aria-label={`${day} ${mood.label}`}
                        style={{
                          ...s.moodBtn,
                          background: active ? mood.bg : 'transparent',
                          borderColor: active ? mood.color : 'var(--border)',
                          color: active ? mood.color : 'var(--text3)',
                          opacity: isFuture ? 0.3 : 1,
                        }}
                        onClick={() => !isFuture && handleDayMood(i, active ? null : mood.value)}
                        disabled={isFuture}
                      >
                        {mood.icon}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        {impression && (
          <p style={{ ...s.impression, color: toneColor(impression.tone) }}>{impression.text}</p>
        )}
      </section>

      {/* What matters this week */}
      <section style={s.card}>
        <h2 style={s.cardTitle}>What matters most this week?</h2>
        <div style={s.focusRow}>
          <input
            type="text"
            style={s.input}
            value={intention}
            onChange={e => setIntention(e.target.value)}
            onBlur={saveFocus}
            placeholder="One thing worth protecting..."
            onKeyDown={e => e.key === 'Enter' && e.target.blur()}
          />
          {focusSaved && <span style={s.savedTag}>Saved</span>}
        </div>
        <div style={s.themeBlock}>
          <span style={s.themeBlockLabel}>Theme</span>
          <ThemePicker
            value={focusTheme}
            onChange={setFocusTheme}
            customThemes={customThemes}
            onAddTheme={onAddTheme}
          />
        </div>
      </section>

      {/* Goal hours — only if goals exist */}
      {goals.length > 0 && (
        <section style={s.card}>
          <div style={s.cardTitleRow}>
            <h2 style={s.cardTitle}>Hours on your goals</h2>
            {totalHoursLogged > 0 && <span style={s.badge}>{totalHoursLogged}h</span>}
          </div>
          <div style={s.goalList}>
            {goals.map(goal => {
              const hours = thisWeekHours[goal.id] || ''
              const pct = goal.hoursPerWeek > 0 ? Math.min(100, ((hours || 0) / goal.hoursPerWeek) * 100) : 0
              return (
                <div key={goal.id} style={s.goalRow}>
                  <div style={s.goalInfo}>
                    <span style={s.goalTitle}>{goal.title}</span>
                    <div style={s.goalBarTrack}>
                      <div style={{ ...s.goalBarFill, width: `${pct}%` }} />
                    </div>
                    <span style={s.goalTarget}>{hours || 0} of {goal.hoursPerWeek}h target</span>
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
        </section>
      )}
    </div>
  )
}

// ─── Last Week: the weekly ritual ──────────────────────────────────────────
function LastWeekView({
  lastWeek, lastWeekStart, lastWeekEnd, checkins, weeklyReflections,
  customThemes, onCheckin, onReflection, onAddTheme,
}) {
  const existing = weeklyReflections[lastWeek] || {}
  const sentiments = existing.dailySentiments || {}
  const [reflection, setReflection] = useState({
    wins: existing.wins || '',
    struggles: existing.struggles || '',
    change: existing.change || '',
  })
  const [saved, setSaved] = useState(false)
  const reflectionTheme = existing.theme || null

  useEffect(() => {
    const e = weeklyReflections[lastWeek] || {}
    setReflection({ wins: e.wins || '', struggles: e.struggles || '', change: e.change || '' })
  }, [lastWeek, weeklyReflections])

  const verdict = checkins[lastWeek]
  const impression = getWeekImpression(sentiments)

  const saveReflection = () => {
    onReflection(lastWeek, { ...existing, ...reflection, dailySentiments: sentiments })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const setReflectionTheme = (theme) => {
    onReflection(lastWeek, { ...existing, ...reflection, theme, dailySentiments: sentiments })
  }

  return (
    <div style={s.view}>
      <p style={s.weekRange}>{formatShortDate(lastWeekStart)} – {formatShortDate(lastWeekEnd)}, {lastWeekStart.getFullYear()}</p>

      {/* Verdict */}
      <section style={s.card}>
        <h2 style={s.cardTitle}>Did last week move you forward?</h2>
        {impression && (
          <p style={{ ...s.impression, color: toneColor(impression.tone), marginBottom: 4 }}>{impression.text}</p>
        )}
        <div style={s.verdictRow}>
          {VERDICT_OPTIONS.map(opt => {
            const active = verdict === opt.value
            return (
              <button
                key={opt.value}
                style={{
                  ...s.verdict,
                  background: active ? opt.bg : 'var(--surface)',
                  borderColor: active ? opt.color : 'var(--border)',
                }}
                onClick={() => onCheckin(lastWeek, opt.value)}
              >
                <span style={{ ...s.verdictLabel, color: active ? opt.color : 'var(--text)' }}>{opt.label}</span>
                <span style={s.verdictSub}>{opt.sub}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Reflection */}
      <section style={s.card}>
        <h2 style={s.cardTitle}>Reflect</h2>
        <div style={s.reflectionGrid}>
          <div style={s.reflectionField}>
            <label style={s.fieldLabel}>What went well?</label>
            <textarea style={s.textarea} value={reflection.wins}
              onChange={e => setReflection(r => ({ ...r, wins: e.target.value }))}
              onBlur={saveReflection}
              placeholder="Wins, progress, good decisions..." rows={2} />
          </div>
          <div style={s.reflectionField}>
            <label style={s.fieldLabel}>What didn't go as planned?</label>
            <textarea style={s.textarea} value={reflection.struggles}
              onChange={e => setReflection(r => ({ ...r, struggles: e.target.value }))}
              onBlur={saveReflection}
              placeholder="Missed targets, distractions..." rows={2} />
          </div>
          <div style={s.reflectionField}>
            <label style={s.fieldLabel}>One thing to change</label>
            <textarea style={s.textarea} value={reflection.change}
              onChange={e => setReflection(r => ({ ...r, change: e.target.value }))}
              onBlur={saveReflection}
              placeholder="A specific, actionable change..." rows={2} />
          </div>
        </div>
        <div style={s.themeBlock}>
          <span style={s.themeBlockLabel}>What did this week center on?</span>
          <ThemePicker
            value={reflectionTheme}
            onChange={setReflectionTheme}
            customThemes={customThemes}
            onAddTheme={onAddTheme}
          />
        </div>
        {saved && <span style={s.savedTag}>Saved</span>}
      </section>
    </div>
  )
}

const s = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  view: { display: 'flex', flexDirection: 'column', gap: 16 },

  perspective: {
    fontFamily: 'var(--font-serif)', fontSize: 19, color: 'var(--text)',
    lineHeight: 1.5, fontStyle: 'normal', fontWeight: 400, margin: 0,
    paddingBottom: 16, borderBottom: '1px solid var(--border)',
  },

  // Personalized attention banner
  attention: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--surface)', border: '1.5px solid', borderRadius: 'var(--radius)',
    padding: '14px 16px',
  },
  attentionDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  attentionText: { fontSize: 15, color: 'var(--text)', fontWeight: 500, lineHeight: 1.4 },

  // Segmented control
  segmented: {
    display: 'flex', background: 'var(--surface2)', borderRadius: 10, padding: 4, gap: 4,
  },
  segment: {
    flex: 1, padding: '10px 12px', borderRadius: 8, border: 'none',
    background: 'transparent', color: 'var(--text3)', fontSize: 15, fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.15s',
  },
  segmentActive: {
    background: 'var(--surface)', color: 'var(--text)', fontWeight: 600,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },

  weekRange: { fontSize: 14, color: 'var(--text3)', margin: 0, textAlign: 'center' },

  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: 20,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  cardTitleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 17, color: 'var(--text)', fontWeight: 600, margin: 0, lineHeight: 1.3 },
  cardHint: { fontSize: 13, color: 'var(--text3)', margin: '-6px 0 0' },

  impression: {
    fontSize: 14, fontWeight: 500, margin: 0, lineHeight: 1.4,
  },

  // Daily mood
  moodGrid: { display: 'flex', gap: 4, justifyContent: 'space-between' },
  dayCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 },
  dayLabel: { fontSize: 13, fontWeight: 500 },
  dayNum: { fontSize: 10, color: 'var(--text3)', marginBottom: 2 },
  moodStack: { display: 'flex', flexDirection: 'column', gap: 4 },
  moodBtn: {
    width: 34, height: 34, borderRadius: 9, border: '1.5px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 17, cursor: 'pointer', transition: 'all 0.12s', padding: 0,
  },

  // Focus
  focusRow: { display: 'flex', alignItems: 'center', gap: 10 },
  input: {
    flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '12px 16px', borderRadius: 8, fontSize: 16,
  },
  savedTag: { fontSize: 13, color: 'var(--success)', fontWeight: 500, flexShrink: 0 },

  // Theme block
  themeBlock: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 },
  themeBlockLabel: { fontSize: 13, color: 'var(--text2)', fontWeight: 500 },

  // Goals
  badge: {
    fontSize: 13, background: 'var(--surface2)', color: 'var(--accent)',
    padding: '2px 10px', borderRadius: 12, fontWeight: 600,
  },
  goalList: { display: 'flex', flexDirection: 'column', gap: 10 },
  goalRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  goalInfo: { display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 0 },
  goalTitle: { fontSize: 15, color: 'var(--text)', fontWeight: 500 },
  goalBarTrack: { height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' },
  goalBarFill: { height: '100%', background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s ease' },
  goalTarget: { fontSize: 12, color: 'var(--text3)' },
  hoursInput: { display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 },
  hoursField: {
    width: 60, background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '10px 8px', borderRadius: 8, fontSize: 16, textAlign: 'center',
  },
  hoursLabel: { fontSize: 12, color: 'var(--text3)' },

  // Verdict
  verdictRow: { display: 'flex', gap: 8 },
  verdict: {
    flex: 1, padding: '14px 8px', borderRadius: 10, border: '2px solid', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'center',
    transition: 'all 0.12s', minWidth: 0,
  },
  verdictLabel: { fontSize: 16, fontWeight: 600 },
  verdictSub: { fontSize: 12, color: 'var(--text3)' },

  // Reflection
  reflectionGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
  reflectionField: { display: 'flex', flexDirection: 'column', gap: 5 },
  fieldLabel: { fontSize: 13, color: 'var(--text2)', fontWeight: 500 },
  textarea: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '12px 14px', borderRadius: 8,
    fontSize: 15, lineHeight: 1.5, resize: 'vertical',
  },
}
