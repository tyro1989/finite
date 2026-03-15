import { getRealityBreakdown, formatNumber } from '../utils'

const BREAKDOWN = [
  { key: 'sleepWeeks',       label: 'Asleep',        desc: '~8 hours every day', color: '#4a7fa5' },
  { key: 'workWeeks',        label: 'Working',       desc: 'Until retirement (age 65)', color: '#c97a4c' },
  { key: 'maintenanceWeeks', label: 'Daily tasks',   desc: 'Chores, errands, hygiene, commute', color: '#7a5fa5' },
  { key: 'eatingWeeks',      label: 'Eating & meals',desc: 'Including cooking & meal prep', color: '#5a9a7a' },
]

export default function RealityCheck({ birthday, lifeExpectancy, name }) {
  const b = getRealityBreakdown(birthday, lifeExpectancy)

  const summers = Math.round(b.freeWeeks / 13)
  const freeWeekends = Math.round(b.freeWeeks * 2)
  const holidays = Math.round(b.freeWeeks / 52 * 8)

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={s.headline}>The Reality Check</h1>
        <p style={s.sub}>
          Of your <strong style={{ color: 'var(--text)' }}>{formatNumber(b.remaining)}</strong> remaining weeks,
          here is what's already spoken for — before you choose anything.
        </p>
      </div>

      {/* Free weeks hero */}
      <div style={s.hero}>
        <p style={s.heroLabel}>Your truly free weeks</p>
        <div style={s.heroNum}>{formatNumber(b.freeWeeks)}</div>
        <p style={s.heroSub}>{b.freePercent}% of your remaining time is truly yours.</p>
        <div style={s.heroRow}>
          <span>{summers} summers left</span>
          <span style={s.dot}>·</span>
          <span>{freeWeekends} free weekends</span>
          <span style={s.dot}>·</span>
          <span>{holidays} holiday seasons</span>
        </div>
      </div>

      {/* Breakdown bars */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Where your remaining time goes</h2>
        <div style={s.bars}>
          {BREAKDOWN.map(item => {
            const weeks = b[item.key]
            const pct = b.remaining > 0 ? (weeks / b.remaining * 100) : 0
            return (
              <div key={item.key} style={s.barRow}>
                <div style={s.barTop}>
                  <span style={s.barLabel}>{item.label}</span>
                  <span style={s.barWeeks}>{formatNumber(weeks)} weeks</span>
                </div>
                <p style={s.barDesc}>{item.desc}</p>
                <div style={s.track}>
                  <div style={{ ...s.fill, width: `${pct}%`, background: item.color }} />
                </div>
              </div>
            )
          })}

          <div style={{ ...s.barRow, marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={s.barTop}>
              <span style={{ ...s.barLabel, color: 'var(--accent)' }}>Truly free</span>
              <span style={{ ...s.barWeeks, color: 'var(--accent)' }}>{formatNumber(b.freeWeeks)} weeks</span>
            </div>
            <p style={s.barDesc}>Time that is fully yours to direct</p>
            <div style={s.track}>
              <div style={{ ...s.fill, width: `${b.freePercent}%`, background: 'var(--accent)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* What you could do */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>What {formatNumber(b.freeWeeks)} free weeks can become</h2>
        <div style={s.cards}>
          {[
            { label: 'Books you could read',        val: Math.round(b.freeWeeks * 0.5), note: 'at one every 2 weeks' },
            { label: 'Skills you could master',     val: Math.round(b.freeWeeks / 52 * 2), note: '~10,000 hours each' },
            { label: 'People you could cherish deeply', val: Math.round(b.freeWeeks / 52 * 4), note: 'at 1hr/week sustained' },
            { label: 'Projects you could finish',   val: Math.round(b.freeWeeks / 8), note: 'if each takes ~8 weeks' },
          ].map(c => (
            <div key={c.label} style={s.card}>
              <div style={s.cardNum}>{formatNumber(c.val)}</div>
              <p style={s.cardLabel}>{c.label}</p>
              <p style={s.cardNote}>{c.note}</p>
            </div>
          ))}
        </div>
      </section>

      <blockquote style={s.quote}>
        <p style={s.quoteText}>"The key is not spending time, but in investing it."</p>
        <footer style={s.quoteAuthor}>— Stephen R. Covey</footer>
      </blockquote>
    </div>
  )
}

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 40 },
  header: { display: 'flex', flexDirection: 'column', gap: 8 },
  headline: { fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 44px)', color: 'var(--text)', fontWeight: 400 },
  sub: { fontSize: 16, color: 'var(--text2)', lineHeight: 1.7 },
  hero: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '40px 32px',
    textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  heroLabel: { fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' },
  heroNum: {
    fontFamily: 'var(--font-serif)',
    fontSize: 'clamp(72px, 16vw, 120px)',
    color: 'var(--accent)', lineHeight: 1, letterSpacing: '-0.02em',
  },
  heroSub: { fontSize: 16, color: 'var(--text2)' },
  heroRow: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', fontSize: 13, color: 'var(--text2)' },
  dot: { color: 'var(--text3)' },
  section: { display: 'flex', flexDirection: 'column', gap: 20 },
  sectionTitle: { fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text)', fontWeight: 400 },
  bars: { display: 'flex', flexDirection: 'column', gap: 18 },
  barRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  barTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  barLabel: { fontSize: 14, color: 'var(--text)', fontWeight: 500 },
  barWeeks: { fontSize: 13, color: 'var(--text2)' },
  barDesc: { fontSize: 12, color: 'var(--text3)' },
  track: { height: 5, background: '#1a1a18', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, transition: 'width 1.2s ease' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '20px 16px',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  cardNum: { fontFamily: 'var(--font-serif)', fontSize: 36, color: 'var(--text)', lineHeight: 1 },
  cardLabel: { fontSize: 13, color: 'var(--text2)', lineHeight: 1.4 },
  cardNote: { fontSize: 11, color: 'var(--text3)', marginTop: 2 },
  quote: { borderLeft: '2px solid var(--border)', paddingLeft: 20 },
  quoteText: { fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.7 },
  quoteAuthor: { fontSize: 12, color: 'var(--text3)', marginTop: 8, letterSpacing: '0.04em' },
}
