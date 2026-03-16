import { useState } from 'react'
import { getRemainingVisits, formatNumber } from '../utils'

const RELATIONSHIPS = ['Parent', 'Grandparent', 'Sibling', 'Partner', 'Child', 'Close friend', 'Mentor', 'Other']
const emptyForm = { name: '', age: '', relationship: 'Parent', visitsPerYear: 12, lifeExpectancy: 82, hoursPerVisit: 3 }

export default function People({ people, onUpdate }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const handleAdd = () => {
    if (!form.name.trim() || !form.age) return
    onUpdate([...people, {
      id: Date.now(),
      name: form.name.trim(),
      relationship: form.relationship,
      age: parseFloat(form.age),
      visitsPerYear: parseFloat(form.visitsPerYear) || 1,
      lifeExpectancy: parseFloat(form.lifeExpectancy) || 82,
      hoursPerVisit: parseFloat(form.hoursPerVisit) || 3,
    }])
    setForm(emptyForm)
    setAdding(false)
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={s.headline}>The People Who Matter</h1>
        <p style={s.sub}>
          How many times will you actually see the people you love? How many hours does that add up to?
          The number is always smaller than you think.
        </p>
      </div>

      {people.length === 0 && !adding && (
        <div style={s.empty}>
          <p style={s.emptyText}>No one added yet.</p>
          <p style={s.emptyNote}>Add the people who matter most and see how many visits — and hours — you have left.</p>
        </div>
      )}

      <div style={s.list}>
        {people.map(person => {
          const visits = getRemainingVisits(person.age, person.visitsPerYear, person.lifeExpectancy)
          const hoursPerVisit = person.hoursPerVisit || 3
          const totalHours = Math.round(visits * hoursPerVisit)
          const yearsLeft = Math.max(0, person.lifeExpectancy - person.age)
          const urgency = visits < 50 ? 'critical' : visits < 200 ? 'moderate' : 'ok'
          const urgencyColor = urgency === 'critical' ? '#e74c3c' : urgency === 'moderate' ? 'var(--accent)' : 'var(--text)'
          const urgencyMsg = urgency === 'critical'
            ? 'Make every visit sacred.'
            : urgency === 'moderate'
            ? 'Time is more limited than it feels.'
            : 'Keep nurturing this relationship.'

          return (
            <div key={person.id} style={s.card}>
              <div style={s.cardTop}>
                <div>
                  <h3 style={s.personName}>{person.name}</h3>
                  <p style={s.personMeta}>{person.relationship} · Age {person.age}</p>
                </div>
                <button style={s.deleteBtn} onClick={() => onUpdate(people.filter(p => p.id !== person.id))}>×</button>
              </div>

              <div style={s.statsRow}>
                <div style={s.statBlock}>
                  <div style={{ ...s.statNum, color: urgencyColor }}>{formatNumber(visits)}</div>
                  <p style={s.statLabel}>visits remaining</p>
                </div>
                <div style={s.statDivider} />
                <div style={s.statBlock}>
                  <div style={{ ...s.statNum, color: urgencyColor, fontSize: 'clamp(32px, 7vw, 52px)' }}>
                    {formatNumber(totalHours)}
                  </div>
                  <p style={s.statLabel}>hours together</p>
                  <p style={s.statNote}>at {hoursPerVisit}h per visit</p>
                </div>
              </div>

              <div style={s.hoursPerspective}>
                {totalHours < 100
                  ? `That's less than a long weekend total. Every hour counts.`
                  : totalHours < 500
                  ? `That's about ${Math.round(totalHours / 24)} days together — total.`
                  : `That's ${Math.round(totalHours / 24)} full days across all remaining visits.`}
              </div>

              <div style={s.meta}>
                <span style={s.metaItem}>{person.visitsPerYear}× per year</span>
                <span style={s.metaDot}>·</span>
                <span style={s.metaItem}>~{Math.round(yearsLeft)} years left</span>
                <span style={s.metaDot}>·</span>
                <span style={{ ...s.metaItem, color: urgencyColor, fontWeight: urgency !== 'ok' ? 600 : 400 }}>
                  {urgencyMsg}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {adding ? (
        <div style={s.form}>
          <h3 style={s.formTitle}>Add someone who matters</h3>

          <div style={s.field}>
            <label style={s.label}>Their name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Mom, Dad, Sarah, Marcus..."
              autoFocus
            />
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Relationship</label>
              <select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}>
                {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Their current age</label>
              <input
                type="number"
                value={form.age}
                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                placeholder="65"
                min={0} max={120}
              />
            </div>
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Visits per year</label>
              <input
                type="number"
                value={form.visitsPerYear}
                onChange={e => setForm(f => ({ ...f, visitsPerYear: e.target.value }))}
                min={0.1} step={0.5}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Hours per visit</label>
              <input
                type="number"
                data-testid="hours-per-visit-input"
                value={form.hoursPerVisit}
                onChange={e => setForm(f => ({ ...f, hoursPerVisit: e.target.value }))}
                min={0.5} step={0.5}
                placeholder="3"
              />
            </div>
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Their life expectancy</label>
              <input
                type="number"
                value={form.lifeExpectancy}
                onChange={e => setForm(f => ({ ...f, lifeExpectancy: e.target.value }))}
                min={50} max={110}
              />
            </div>
          </div>

          {form.age && form.visitsPerYear && (
            <div style={s.preview}>
              {(() => {
                const v = getRemainingVisits(parseFloat(form.age), parseFloat(form.visitsPerYear), parseFloat(form.lifeExpectancy) || 82)
                const h = Math.round(v * (parseFloat(form.hoursPerVisit) || 3))
                return (
                  <>
                    If {form.name || 'they'} {parseFloat(form.visitsPerYear) >= 1 ? `visits you ${form.visitsPerYear} times a year` : `visits you roughly ${Math.round(parseFloat(form.visitsPerYear) * 12)} times a year`},{' '}
                    you have roughly <strong style={{ color: 'var(--accent)' }}>{formatNumber(v)} visits</strong> left —{' '}
                    about <strong style={{ color: 'var(--accent)' }}>{formatNumber(h)} hours</strong> together.
                  </>
                )
              })()}
            </div>
          )}

          <div style={s.formActions}>
            <button style={s.cancelBtn} onClick={() => { setAdding(false); setForm(emptyForm) }}>Cancel</button>
            <button
              style={{ ...s.addBtn, opacity: form.name && form.age ? 1 : 0.4 }}
              onClick={handleAdd}
              disabled={!form.name || !form.age}
            >
              Add person
            </button>
          </div>
        </div>
      ) : (
        <button style={s.newBtn} onClick={() => setAdding(true)}>+ Add someone who matters</button>
      )}

      <blockquote style={s.insight}>
        <p style={s.insightText}>
          "Most people overestimate how much time they have with the people they love.
          Distance, careers, health — life conspires to reduce visits.
          The number above is probably optimistic. Call them today."
        </p>
      </blockquote>
    </div>
  )
}

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 24 },
  header: { display: 'flex', flexDirection: 'column', gap: 8 },
  headline: { fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 44px)', color: 'var(--text)', fontWeight: 400 },
  sub: { fontSize: 16, color: 'var(--text2)', lineHeight: 1.7 },
  empty: { textAlign: 'center', padding: '40px 0' },
  emptyText: { fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text3)', fontStyle: 'italic' },
  emptyNote: { fontSize: 13, color: 'var(--text3)', marginTop: 8 },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: 24,
    display: 'flex', flexDirection: 'column', gap: 12,
    animation: 'fadeIn 0.3s ease',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  personName: { fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text)', fontWeight: 400 },
  personMeta: { fontSize: 12, color: 'var(--text3)', marginTop: 2 },
  deleteBtn: { background: 'none', color: 'var(--text3)', fontSize: 20, lineHeight: 1, padding: '0 4px', border: 'none', flexShrink: 0 },
  statsRow: { display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' },
  statBlock: { display: 'flex', flexDirection: 'column', gap: 2 },
  statNum: { fontFamily: 'var(--font-serif)', fontSize: 'clamp(40px, 9vw, 64px)', lineHeight: 1, letterSpacing: '-0.02em' },
  statLabel: { fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 },
  statNote: { fontSize: 11, color: 'var(--text3)' },
  statDivider: { width: 1, height: 60, background: 'var(--border)', flexShrink: 0, alignSelf: 'center' },
  hoursPerspective: { fontSize: 13, color: 'var(--accent)', lineHeight: 1.5, fontStyle: 'italic' },
  meta: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  metaItem: { fontSize: 13, color: 'var(--text2)' },
  metaDot: { color: 'var(--text3)' },
  form: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: 24,
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  formTitle: { fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text)', fontWeight: 400 },
  field: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  label: { fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  row: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  preview: {
    background: '#181816', borderLeft: '2px solid var(--accent)',
    borderRadius: '0 6px 6px 0', padding: '12px 14px',
    fontSize: 14, color: 'var(--text2)', lineHeight: 1.6,
  },
  formActions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', padding: '8px 16px', borderRadius: 6, fontSize: 13 },
  addBtn: { background: 'var(--accent)', color: '#0a0a0a', padding: '8px 22px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none' },
  newBtn: {
    background: 'none', border: '2px dashed var(--border)', color: 'var(--text3)',
    padding: '16px 24px', borderRadius: 10, fontSize: 14, textAlign: 'left',
  },
  insight: { borderLeft: '2px solid var(--border)', paddingLeft: 20 },
  insightText: { fontSize: 14, color: 'var(--text3)', lineHeight: 1.7, fontFamily: 'var(--font-serif)', fontStyle: 'italic' },
}
