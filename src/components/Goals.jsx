import { useState } from 'react'
import { getFreeWeeksToGoal, getCurrentAge, getRealityBreakdown, formatNumber } from '../utils'

const emptyForm = { title: '', description: '', targetAge: '', hoursPerWeek: 5 }

export default function Goals({ birthday, lifeExpectancy, goals, onUpdate }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const currentAge = getCurrentAge(birthday)
  const { freeWeeks: totalFreeWeeks } = getRealityBreakdown(birthday, lifeExpectancy)

  const handleAdd = () => {
    if (!form.title.trim() || !form.targetAge) return
    onUpdate([...goals, {
      id: Date.now(),
      title: form.title.trim(),
      description: form.description.trim(),
      targetAge: parseFloat(form.targetAge),
      hoursPerWeek: parseFloat(form.hoursPerWeek) || 1,
    }])
    setForm(emptyForm)
    setAdding(false)
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={s.headline}>Life Goals</h1>
        <p style={s.sub}>
          Define what matters. See exactly how many free weeks and hours you have to make it real.
        </p>
      </div>

      {goals.length === 0 && !adding && (
        <div style={s.empty}>
          <p style={s.emptyText}>No goals yet.</p>
          <p style={s.emptyNote}>Every week without a goal is a week that drifts.</p>
        </div>
      )}

      <div style={s.goalList}>
        {goals.map(goal => {
          const { weeksToGoal, freeWeeks } = getFreeWeeksToGoal(birthday, lifeExpectancy, goal.targetAge)
          const totalHours = Math.round(freeWeeks * goal.hoursPerWeek)
          const isPast = goal.targetAge < currentAge
          const weeksNeeded = goal.hoursPerWeek > 0 ? Math.round(10000 / goal.hoursPerWeek) : null

          return (
            <div key={goal.id} style={{ ...s.card, ...(isPast ? s.pastCard : {}) }}>
              <div style={s.cardTop}>
                <h3 style={s.cardTitle}>{goal.title}</h3>
                <button style={s.deleteBtn} onClick={() => onUpdate(goals.filter(g => g.id !== goal.id))}>×</button>
              </div>

              {goal.description && <p style={s.cardDesc}>{goal.description}</p>}

              <div style={s.stats}>
                <Stat label="weeks to deadline" value={isPast ? '—' : formatNumber(weeksToGoal)} />
                <Stat label="free weeks" value={isPast ? '—' : formatNumber(freeWeeks)} accent />
                <Stat label="free hours" value={isPast ? '—' : formatNumber(totalHours)} />
                <Stat label="hrs/week" value={goal.hoursPerWeek} />
              </div>

              <div style={s.insight}>
                {isPast ? (
                  <span style={{ color: 'var(--text3)' }}>This deadline has passed.</span>
                ) : (
                  <>
                    By age <strong style={{ color: 'var(--accent)' }}>{goal.targetAge}</strong>, committing{' '}
                    <strong>{goal.hoursPerWeek}h/week</strong>, you'll have{' '}
                    <strong style={{ color: 'var(--accent)' }}>{formatNumber(totalHours)} hours</strong> to pursue this goal.{' '}
                    {weeksNeeded && freeWeeks < weeksNeeded
                      ? <span style={{ color: 'var(--accent2)' }}>Mastery (10k hrs) needs more hours/week.</span>
                      : <span style={{ color: 'var(--success)' }}>Mastery is within reach.</span>
                    }
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {adding ? (
        <div style={s.form}>
          <h3 style={s.formTitle}>Add a life goal</h3>

          <div style={s.field}>
            <label style={s.label}>Goal</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Write a novel, Learn piano, Build a company, Travel 50 countries..."
              autoFocus
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Why this matters to you (optional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What does achieving this mean to your life?"
              rows={3}
              style={{ resize: 'vertical', minHeight: 72 }}
            />
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Achieve by age</label>
              <input
                type="number"
                value={form.targetAge}
                onChange={e => setForm(f => ({ ...f, targetAge: e.target.value }))}
                placeholder={Math.round(currentAge + 10)}
                min={Math.ceil(currentAge + 1)}
                max={lifeExpectancy}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Hours/week committed</label>
              <input
                type="number"
                value={form.hoursPerWeek}
                onChange={e => setForm(f => ({ ...f, hoursPerWeek: e.target.value }))}
                min={0.5}
                max={40}
                step={0.5}
              />
            </div>
          </div>

          {form.targetAge && form.hoursPerWeek && (
            <div style={s.preview}>
              {(() => {
                const { freeWeeks } = getFreeWeeksToGoal(birthday, lifeExpectancy, parseFloat(form.targetAge))
                const hours = Math.round(freeWeeks * parseFloat(form.hoursPerWeek))
                return (
                  <>
                    You'll have <strong style={{ color: 'var(--accent)' }}>{formatNumber(freeWeeks)} free weeks</strong>{' '}
                    and <strong style={{ color: 'var(--accent)' }}>{formatNumber(hours)} hours</strong> to make this happen.
                  </>
                )
              })()}
            </div>
          )}

          <div style={s.formActions}>
            <button style={s.cancelBtn} onClick={() => { setAdding(false); setForm(emptyForm) }}>Cancel</button>
            <button
              style={{ ...s.addBtn, opacity: form.title && form.targetAge ? 1 : 0.4 }}
              onClick={handleAdd}
              disabled={!form.title || !form.targetAge}
            >
              Add goal
            </button>
          </div>
        </div>
      ) : (
        <button style={s.newBtn} onClick={() => setAdding(true)}>+ Add a life goal</button>
      )}

      <div style={s.footer}>
        <p style={s.footerText}>
          You have <strong style={{ color: 'var(--accent)' }}>{formatNumber(totalFreeWeeks)} truly free weeks</strong> remaining.
          Each goal is a claim on that finite number. Choose carefully.
        </p>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{
        fontFamily: 'var(--font-serif)', fontSize: 30,
        color: accent ? 'var(--accent)' : 'var(--text)',
        lineHeight: 1, letterSpacing: '-0.01em',
      }}>{value}</span>
      <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
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
  goalList: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: 24,
    display: 'flex', flexDirection: 'column', gap: 16,
    animation: 'fadeIn 0.3s ease',
  },
  pastCard: { opacity: 0.45 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text)', fontWeight: 400, lineHeight: 1.3 },
  deleteBtn: { background: 'none', color: 'var(--text3)', fontSize: 20, lineHeight: 1, padding: '0 4px', border: 'none', flexShrink: 0 },
  cardDesc: { fontSize: 14, color: 'var(--text3)', lineHeight: 1.6 },
  stats: { display: 'flex', gap: 24, flexWrap: 'wrap' },
  insight: {
    background: '#181816', borderLeft: '2px solid var(--accent)',
    borderRadius: '0 6px 6px 0', padding: '12px 14px',
    fontSize: 13, color: 'var(--text2)', lineHeight: 1.6,
  },
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
    background: '#181816', borderRadius: 6, padding: '12px 14px',
    fontSize: 14, color: 'var(--text2)', lineHeight: 1.6,
    borderLeft: '2px solid var(--accent)',
  },
  formActions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', padding: '8px 16px', borderRadius: 6, fontSize: 13 },
  addBtn: { background: 'var(--accent)', color: '#0a0a0a', padding: '8px 22px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none' },
  newBtn: {
    background: 'none', border: '2px dashed var(--border)', color: 'var(--text3)',
    padding: '16px 24px', borderRadius: 10, fontSize: 14,
    textAlign: 'left', transition: 'border-color 0.2s',
  },
  footer: { borderTop: '1px solid var(--border)', paddingTop: 24 },
  footerText: { fontSize: 14, color: 'var(--text3)', lineHeight: 1.7, fontFamily: 'var(--font-serif)', fontStyle: 'italic' },
}
