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

export default function CheckIn({ birthday, goals, checkins, weeklyIntentions, onCheckin, onIntention }) {
  const currentWeek = getWeeksLived(birthday)
  const [intention, setIntention] = useState(weeklyIntentions[currentWeek] || '')
  const [saved, setSaved] = useState(false)

  const quote = QUOTES[currentWeek % QUOTES.length]
  const currentCheckin = checkins[currentWeek]
  const weekDate = getDateAtWeek(birthday, currentWeek)

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

  // Recent 16 weeks for mini grid
  const recentWeeks = Array.from({ length: Math.min(16, currentWeek + 1) }, (_, i) => currentWeek - i).reverse()

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.badge}>Week {currentWeek + 1}</div>
        <h1 style={s.headline}>This Week</h1>
        <p style={s.date}>{formatDate(weekDate)}</p>
      </div>

      {/* Quote */}
      <div style={s.quoteBox}>
        <p style={s.quoteText}>"{quote.text}"</p>
        <p style={s.quoteAuthor}>— {quote.author}</p>
      </div>

      {/* Intention */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>What matters most this week?</h2>
        {goals.length > 0 && (
          <p style={s.goalHint}>Your goals: {goals.map(g => g.title).join(' · ')}</p>
        )}
        <textarea
          style={s.textarea}
          value={intention}
          onChange={e => setIntention(e.target.value)}
          placeholder="This week I will focus on..."
          rows={3}
        />
        <button style={s.saveBtn} onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save intention'}
        </button>
      </section>

      {/* Check-in */}
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

      {/* Stats */}
      <div style={s.statsRow}>
        {[
          { val: streak,            label: 'week streak',   color: 'var(--accent)', testId: 'streak-value' },
          { val: counts.yes || 0,   label: 'great weeks',   color: '#6a9a5a',       testId: 'great-weeks-value' },
          { val: counts.somewhat || 0, label: 'partial weeks', color: 'var(--accent)', testId: 'partial-weeks-value' },
          { val: counts.no || 0,    label: 'lost weeks',    color: 'var(--text3)',  testId: 'lost-weeks-value' },
        ].map(stat => (
          <div key={stat.label} style={s.statCard}>
            <span data-testid={stat.testId} style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: stat.color, lineHeight: 1 }}>{stat.val}</span>
            <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Recent weeks */}
      {Object.keys(checkins).length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Recent weeks</h2>
          <div style={s.recentGrid}>
            {recentWeeks.map(wk => {
              const val = checkins[wk]
              const dt = getDateAtWeek(birthday, wk)
              const isCur = wk === currentWeek
              return (
                <div key={wk} style={{
                  ...s.recentCell,
                  background: val === 'yes' ? '#2a4a2a' : val === 'somewhat' ? '#3a3010' : val === 'no' ? '#2a1a1a' : 'var(--surface)',
                  border: `1px solid ${isCur ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>Wk {wk + 1}</span>
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{formatDate(dt).slice(0, -6)}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {val === 'yes' ? '✓' : val === 'somewhat' ? '~' : val === 'no' ? '✗' : '—'}
                  </span>
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
  header: { display: 'flex', flexDirection: 'column', gap: 4 },
  badge: { fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em' },
  headline: { fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 44px)', color: 'var(--text)', fontWeight: 400 },
  date: { fontSize: 13, color: 'var(--text3)' },
  quoteBox: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '24px 28px',
    borderLeft: '3px solid var(--accent)',
  },
  quoteText: { fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.7 },
  quoteAuthor: { fontSize: 12, color: 'var(--text3)', marginTop: 8, letterSpacing: '0.04em' },
  section: { display: 'flex', flexDirection: 'column', gap: 12 },
  sectionTitle: { fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text)', fontWeight: 400 },
  goalHint: { fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' },
  textarea: {
    background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)',
    padding: '14px 16px', borderRadius: 8, fontSize: 15, lineHeight: 1.6, resize: 'vertical',
  },
  saveBtn: {
    background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)',
    padding: '8px 18px', borderRadius: 6, fontSize: 13, alignSelf: 'flex-start',
  },
  options: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  option: {
    flex: '1 1 160px', padding: '16px 18px', borderRadius: 8, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 5, textAlign: 'left', transition: 'all 0.2s',
  },
  optionLabel: { fontSize: 16, fontWeight: 600, color: 'var(--text)' },
  optionSub: { fontSize: 12, color: 'var(--text2)' },
  statsRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  statCard: {
    flex: '1 1 100px', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '16px 12px',
    display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
  },
  recentGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  recentCell: {
    borderRadius: 6, padding: '8px 12px',
    display: 'flex', flexDirection: 'column', gap: 2, minWidth: 80,
  },
}
