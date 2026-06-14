import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getWeeksLived, getAgeAtWeek, getDateAtWeek, formatDate,
  getLifePhase, getSecondsSinceBirth, LIFE_PHASES
} from '../utils'

const CELL = 9   // cell size px (8px + 1px gap)
const COLS = 52  // weeks per row

// Handle both legacy string format and new { text, sentiment } format
function parseMilestone(m) {
  if (!m) return null
  if (typeof m === 'string') return { text: m, sentiment: 'neutral' }
  return m
}

function dateToWeekIndex(birthday, dateStr) {
  const birth = new Date(birthday)
  const target = new Date(dateStr)
  return Math.floor((target - birth) / (7 * 24 * 60 * 60 * 1000))
}

const SENTIMENTS = [
  { value: 'enjoyed', label: 'Enjoyed', color: '#2e7d32', bg: '#e8f5e9' },
  { value: 'neutral', label: 'Neutral', color: '#9a9490', bg: '#f3f1ee' },
  { value: 'regret',  label: 'Regret',  color: '#c62828', bg: '#fbe9e7' },
]

export default function Grid({
  birthday, lifeExpectancy, name,
  milestones, checkins, weeklyIntentions,
  goals = [], people = [],
  onMilestone, onDeleteMilestone, onIntention, onNavigate,
}) {
  const totalWeeks = lifeExpectancy * 52
  const weeksLived = getWeeksLived(birthday)
  const weeksRemaining = Math.max(0, totalWeeks - weeksLived)
  const pctLived = totalWeeks > 0 ? ((weeksLived / totalWeeks) * 100).toFixed(1) : 0
  const currentPhase = getLifePhase(getAgeAtWeek(birthday, weeksLived))

  // Add-by-date modal
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ date: '', text: '', sentiment: 'enjoyed', intention: '' })
  const [formWeekIdx, setFormWeekIdx] = useState(null)
  const [formIsPast, setFormIsPast] = useState(null)

  // Cell modal + tooltip
  const [tooltip, setTooltip] = useState(null)
  const [modal, setModal] = useState(null)
  const [milestoneText, setMilestoneText] = useState('')
  const [milestoneSentiment, setMilestoneSentiment] = useState('enjoyed')
  const [intentionText, setIntentionText] = useState('')
  const [seconds, setSeconds] = useState(getSecondsSinceBirth(birthday))

  useEffect(() => {
    const id = setInterval(() => setSeconds(getSecondsSinceBirth(birthday)), 1000)
    return () => clearInterval(id)
  }, [birthday])

  // Recompute form week when date changes
  useEffect(() => {
    if (!form.date || !birthday) { setFormWeekIdx(null); setFormIsPast(null); return }
    const idx = dateToWeekIndex(birthday, form.date)
    if (idx < 0 || idx >= totalWeeks) { setFormWeekIdx(null); setFormIsPast(null); return }
    setFormWeekIdx(idx)
    setFormIsPast(idx < weeksLived)
  }, [form.date, birthday, weeksLived, totalWeeks])

  const closeAdd = () => {
    setAddOpen(false)
    setForm({ date: '', text: '', sentiment: 'enjoyed', intention: '' })
  }

  const handleAddSubmit = () => {
    if (formWeekIdx === null) return
    if (formIsPast) {
      if (form.text.trim()) onMilestone(formWeekIdx, form.text.trim(), form.sentiment)
    } else {
      if (form.intention.trim()) onIntention(formWeekIdx, form.intention.trim())
    }
    closeAdd()
  }

  const openModal = useCallback((weekIndex) => {
    const m = parseMilestone(milestones[weekIndex])
    setModal({ weekIndex })
    setMilestoneText(m?.text || '')
    setMilestoneSentiment(m?.sentiment || 'enjoyed')
    setIntentionText(weeklyIntentions[weekIndex] || '')
  }, [milestones, weeklyIntentions])

  const saveModal = () => {
    if (milestoneText.trim()) onMilestone(modal.weekIndex, milestoneText.trim(), milestoneSentiment)
    else onDeleteMilestone(modal.weekIndex)
    if (intentionText.trim()) onIntention(modal.weekIndex, intentionText.trim())
    setModal(null)
  }

  // Summary stats
  const enjoyedCount = Object.values(milestones).filter(m => parseMilestone(m)?.sentiment === 'enjoyed').length
  const regretCount  = Object.values(milestones).filter(m => parseMilestone(m)?.sentiment === 'regret').length
  const intentionCount = Object.values(weeklyIntentions).filter(Boolean).length

  const shareText = () => {
    const pct = ((weeksLived / totalWeeks) * 100).toFixed(1)
    return `I've lived ${weeksLived.toLocaleString()} of my ${totalWeeks.toLocaleString()} weeks (${pct}%). ${weeksRemaining.toLocaleString()} remain. Every one counts. — Finite`
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'My Life in Weeks', text: shareText() }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareText()).then(() => alert('Copied to clipboard!'))
    }
  }

  const gridRef = useRef(null)

  useEffect(() => {
    if (!gridRef.current) return
    const currentRow = Math.floor(weeksLived / COLS)
    setTimeout(() => {
      if (gridRef.current) gridRef.current.scrollTop = Math.max(0, currentRow * CELL - 100)
    }, 200)
  }, [])

  // Build cells
  const cells = []
  for (let i = 0; i < totalWeeks; i++) {
    const age = getAgeAtWeek(birthday, i)
    const phase = getLifePhase(age)
    const isPast = i < weeksLived
    const isCurrent = i === weeksLived
    const m = parseMilestone(milestones[i])
    const checkin = checkins[i]

    let bg = '#eceae6'
    let border = '#e0ddd7'

    if (isCurrent) {
      bg = 'var(--accent)'; border = 'var(--accent)'
    } else if (isPast) {
      if (m?.sentiment === 'enjoyed')      { bg = '#a5d6a7'; border = '#81c784' }
      else if (m?.sentiment === 'regret') { bg = '#ef9a9a'; border = '#e57373' }
      else if (checkin === 'yes')         { bg = '#c8e6c9'; border = '#a5d6a7' }
      else if (checkin === 'somewhat')    { bg = '#ffe6a3'; border = '#ffd470' }
      else if (checkin === 'no')          { bg = '#e0ddd7'; border = '#d0cdc7' }
      else                                { bg = phase.color + '88'; border = phase.color + '55' }
    } else if (m || weeklyIntentions[i]) {
      bg = '#bbdefb'; border = '#90caf9'
    }

    cells.push(
      <div
        key={i}
        style={{
          width: 8, height: 8,
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 1,
          cursor: 'pointer',
          flexShrink: 0,
          position: 'relative',
          animation: isCurrent ? 'pulse 2.5s ease-in-out infinite' : 'none',
        }}
        onMouseEnter={(e) => {
          const date = getDateAtWeek(birthday, i)
          setTooltip({
            weekIndex: i, x: e.clientX, y: e.clientY,
            date: formatDate(date), age: age.toFixed(1), phase: phase.name,
            isPast, isCurrent, milestone: m?.text,
            intention: weeklyIntentions[i],
            sentiment: m?.sentiment,
          })
        }}
        onMouseLeave={() => setTooltip(null)}
        onClick={() => openModal(i)}
      >
        {m && (
          <div data-testid="milestone-dot" style={{
            position: 'absolute', top: -1, right: -1,
            width: 3, height: 3,
            background: m.sentiment === 'enjoyed' ? '#4ade80' : m.sentiment === 'regret' ? '#f87171' : '#e74c3c',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />
        )}
      </div>
    )
  }

  return (
    <div style={s.container}>

      {/* Live ticker */}
      <div style={s.ticker}>
        <TickerItem value={seconds.toLocaleString()} label="seconds alive" />
        <div style={s.tickerDiv} />
        <TickerItem value={weeksLived.toLocaleString()} label="weeks lived" accent />
        <div style={s.tickerDiv} />
        <TickerItem value={weeksRemaining.toLocaleString()} label="weeks remain" />
        <div style={{ flex: 1 }} />
        <button style={s.shareBtn} onClick={handleShare}>Share →</button>
      </div>

      {/* Prominent add-event CTA */}
      <button style={s.addEventBtn} onClick={() => setAddOpen(true)}>
        <span style={s.addEventPlus}>+</span>
        <span style={s.addEventText}>Add a life event</span>
        <span style={s.addEventNote}>Mark a milestone, memory, or turning point</span>
      </button>

      {/* Phase legend */}
      <div style={s.legend}>
        {LIFE_PHASES.map(p => (
          <div key={p.name} style={s.legendItem}>
            <div style={{ ...s.dot, background: p.color }} />
            <span style={s.legendLabel}>{p.name}</span>
          </div>
        ))}
        <div style={s.legendItem}>
          <div style={{ ...s.dot, background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
          <span style={s.legendLabel}>Now</span>
        </div>
        <div style={s.legendItem}>
          <div style={{ ...s.dot, background: '#4ade80' }} />
          <span style={s.legendLabel}>Enjoyed</span>
        </div>
        <div style={s.legendItem}>
          <div style={{ ...s.dot, background: '#f87171' }} />
          <span style={s.legendLabel}>Regret</span>
        </div>
        <div style={s.legendItem}>
          <div style={{ ...s.dot, background: '#bbdefb', border: '1px solid #90caf9' }} />
          <span style={s.legendLabel}>Intention</span>
        </div>
      </div>

      {/* Main area: grid + info panel (stacks on mobile via flexWrap) */}
      <div style={s.mainArea}>

        <div style={s.gridOuter}>
          <div style={s.yearAxis}>
            {Array.from({ length: lifeExpectancy }, (_, year) => (
              <div key={year} style={s.yearLabel}>
                {year % 5 === 0 ? year : ''}
              </div>
            ))}
          </div>
          <div style={s.gridScroll} ref={gridRef}>
            <div style={{ ...s.grid, width: `${COLS * CELL - 1}px` }}>
              {cells}
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div style={s.infoPanel}>

          <div style={s.infoSection}>
            <div style={s.infoLabel}>Life progress</div>
            <div style={s.progressBar}>
              <div style={{ ...s.progressFill, width: `${pctLived}%` }} />
            </div>
            <div style={s.infoValue}>{pctLived}%</div>
            <div style={s.infoPhaseBadge}>{currentPhase.name}</div>
          </div>

          <div style={s.infoSection}>
            <div style={s.infoLabel}>Your moments</div>
            <div style={s.momentRow}>
              <span style={s.momentEnjoyed}>{enjoyedCount}</span>
              <span style={s.momentLabel}>enjoyed</span>
            </div>
            <div style={s.momentRow}>
              <span style={s.momentRegret}>{regretCount}</span>
              <span style={s.momentLabel}>regrets</span>
            </div>
            <div style={s.momentRow}>
              <span style={s.momentIntention}>{intentionCount}</span>
              <span style={s.momentLabel}>intentions set</span>
            </div>
            {(enjoyedCount + regretCount) > 0 && (
              <div style={s.momentRatio}>
                {Math.round((enjoyedCount / (enjoyedCount + regretCount)) * 100)}% contentment ratio
              </div>
            )}
          </div>

          <div style={s.infoDivider} />

          {goals.length > 0 && (
            <button style={s.quickLink} onClick={() => onNavigate?.('goals')}>
              <span style={s.quickLinkIcon}>◎</span>
              <div>
                <div style={s.quickLinkTitle}>{goals.length} goal{goals.length !== 1 ? 's' : ''}</div>
                <div style={s.quickLinkNote}>View your goals →</div>
              </div>
            </button>
          )}

          {people.length > 0 && (
            <button style={s.quickLink} onClick={() => onNavigate?.('people')}>
              <span style={s.quickLinkIcon}>♡</span>
              <div>
                <div style={s.quickLinkTitle}>{people.length} people who matter</div>
                <div style={s.quickLinkNote}>See time remaining →</div>
              </div>
            </button>
          )}

          <button style={s.quickLink} onClick={() => onNavigate?.('reality')}>
            <span style={s.quickLinkIcon}>◷</span>
            <div>
              <div style={s.quickLinkTitle}>Reality check</div>
              <div style={s.quickLinkNote}>How free time breaks down →</div>
            </div>
          </button>

          <button style={s.quickLink} onClick={() => onNavigate?.('checkin')}>
            <span style={s.quickLinkIcon}>↻</span>
            <div>
              <div style={s.quickLinkTitle}>This week</div>
              <div style={s.quickLinkNote}>Set your intention →</div>
            </div>
          </button>

          {goals.length === 0 && people.length === 0 && (
            <div style={s.setupNudge}>
              Add <button style={s.nudgeLink} onClick={() => onNavigate?.('goals')}>goals</button> and{' '}
              <button style={s.nudgeLink} onClick={() => onNavigate?.('people')}>people</button> to see them here.
            </div>
          )}

        </div>
      </div>

      <div style={s.hint}>
        Tap any week to add a milestone or intention · Hover to inspect
      </div>

      {/* Tooltip (desktop hover) */}
      {tooltip && (
        <div style={{
          ...s.tooltip,
          left: Math.min(tooltip.x + 14, window.innerWidth - 230),
          top: Math.min(tooltip.y + 14, window.innerHeight - 160),
        }}>
          <div style={s.tooltipStatus}>
            {tooltip.isCurrent ? '● This week' : tooltip.isPast ? 'Past week' : 'Future week'}
          </div>
          <div style={s.tooltipRow}>{tooltip.date}</div>
          <div style={s.tooltipRow}>Age {tooltip.age} · {tooltip.phase}</div>
          <div style={s.tooltipRow}>Week {tooltip.weekIndex + 1} of {totalWeeks}</div>
          {tooltip.milestone && (
            <div style={{
              ...s.tooltipRow, marginTop: 4,
              color: tooltip.sentiment === 'enjoyed' ? '#2e7d32' : tooltip.sentiment === 'regret' ? '#c62828' : 'var(--accent)',
            }}>
              ★ {tooltip.milestone}
            </div>
          )}
          {tooltip.intention && (
            <div style={{ ...s.tooltipRow, color: '#1976d2', marginTop: 4 }}>
              → {tooltip.intention}
            </div>
          )}
        </div>
      )}

      {/* Add-by-date modal */}
      {addOpen && (
        <div data-testid="add-overlay" style={s.overlay} onClick={e => e.target === e.currentTarget && closeAdd()}>
          <div style={s.modal} className="fade-in">
            <p style={s.modalTitle}>Add a life event by date</p>
            <p style={s.modalMeta}>Pick any date — past for a memory, future for an intention.</p>

            <div style={s.field}>
              <label style={s.label}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                autoFocus
              />
            </div>

            {formWeekIdx !== null && formIsPast && (
              <>
                <div style={s.field}>
                  <label style={s.label}>What happened? <span style={s.weekTag}>Week {formWeekIdx + 1}</span></label>
                  <input
                    value={form.text}
                    onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                    placeholder="First day at new job, trip to Japan, Dad's birthday..."
                    onKeyDown={e => e.key === 'Enter' && handleAddSubmit()}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>How do you feel about it?</label>
                  <div style={s.sentimentBtns}>
                    {SENTIMENTS.map(sv => (
                      <button
                        key={sv.value}
                        style={{
                          ...s.sentimentBtn,
                          borderColor: form.sentiment === sv.value ? sv.color : 'var(--border)',
                          color: form.sentiment === sv.value ? sv.color : 'var(--text3)',
                          background: form.sentiment === sv.value ? sv.bg : 'transparent',
                        }}
                        onClick={() => setForm(f => ({ ...f, sentiment: sv.value }))}
                      >
                        {sv.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {formWeekIdx !== null && !formIsPast && (
              <div style={s.field}>
                <label style={s.label}>Intention for this week <span style={s.weekTag}>Week {formWeekIdx + 1}</span></label>
                <input
                  value={form.intention}
                  onChange={e => setForm(f => ({ ...f, intention: e.target.value }))}
                  placeholder="What matters most this week?"
                  onKeyDown={e => e.key === 'Enter' && handleAddSubmit()}
                />
              </div>
            )}

            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={closeAdd}>Cancel</button>
              <button
                style={{
                  ...s.saveBtn,
                  opacity: formWeekIdx !== null && (formIsPast ? form.text.trim() : form.intention.trim()) ? 1 : 0.4,
                }}
                onClick={handleAddSubmit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cell modal */}
      {modal && (() => {
        const age = getAgeAtWeek(birthday, modal.weekIndex)
        const date = getDateAtWeek(birthday, modal.weekIndex)
        const phase = getLifePhase(age)
        const isPastWeek = modal.weekIndex < weeksLived
        return (
          <div data-testid="modal-overlay" style={s.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div style={s.modal} className="fade-in">
              <p style={s.modalTitle}>Week {modal.weekIndex + 1}</p>
              <p style={s.modalMeta}>{formatDate(date)} · Age {age.toFixed(1)} · {phase.name}</p>

              {isPastWeek ? (
                <>
                  <div style={s.field}>
                    <label style={s.label}>Life event / memory</label>
                    <input
                      value={milestoneText}
                      onChange={e => setMilestoneText(e.target.value)}
                      placeholder="Got married, First day at new job, Dad's birthday..."
                      autoFocus
                    />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>How do you feel about this week?</label>
                    <div style={s.sentimentBtns}>
                      {SENTIMENTS.map(sv => (
                        <button
                          key={sv.value}
                          style={{
                            ...s.sentimentBtn,
                            borderColor: milestoneSentiment === sv.value ? sv.color : 'var(--border)',
                            color: milestoneSentiment === sv.value ? sv.color : 'var(--text3)',
                            background: milestoneSentiment === sv.value ? sv.bg : 'transparent',
                          }}
                          onClick={() => setMilestoneSentiment(sv.value)}
                        >
                          {sv.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={s.field}>
                  <label style={s.label}>Intention for this week</label>
                  <input
                    value={intentionText}
                    onChange={e => setIntentionText(e.target.value)}
                    placeholder="What matters most this week?"
                    autoFocus
                  />
                </div>
              )}

              <div style={s.modalActions}>
                <button style={s.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
                <button style={s.saveBtn} onClick={saveModal}>Save</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function TickerItem({ value, label, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 26, lineHeight: 1,
        color: accent ? 'var(--accent)' : 'var(--text)',
        letterSpacing: '-0.01em',
      }}>{value}</span>
      <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    </div>
  )
}

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },
  ticker: {
    display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 20px',
  },
  tickerDiv: { width: 1, height: 32, background: 'var(--border)', flexShrink: 0 },
  shareBtn: {
    background: 'var(--accent)', color: '#fff',
    padding: '8px 18px', borderRadius: 8, fontSize: 13,
    fontWeight: 600, border: 'none', flexShrink: 0,
  },

  // Add-event CTA
  addEventBtn: {
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    background: 'var(--surface)', border: '2px solid var(--accent)',
    borderRadius: 'var(--radius)', padding: '16px 20px',
    cursor: 'pointer', textAlign: 'left', width: '100%',
  },
  addEventPlus: {
    fontSize: 24, color: 'var(--accent)', fontWeight: 300, lineHeight: 1,
    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  addEventText: { fontSize: 16, color: 'var(--text)', fontWeight: 600 },
  addEventNote: { fontSize: 13, color: 'var(--text3)', flex: 1 },

  legend: { display: 'flex', flexWrap: 'wrap', gap: '6px 18px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 2, flexShrink: 0 },
  legendLabel: { fontSize: 11, color: 'var(--text3)', letterSpacing: '0.02em' },

  mainArea: { display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' },
  gridOuter: {
    display: 'flex', gap: 8, flex: '1 1 320px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '16px 12px',
    overflow: 'hidden', minWidth: 0,
  },
  yearAxis: { display: 'flex', flexDirection: 'column', flexShrink: 0 },
  yearLabel: {
    height: 8, marginBottom: 1,
    fontSize: 8, color: 'var(--text3)',
    lineHeight: '8px', textAlign: 'right',
    minWidth: 16, paddingRight: 4,
  },
  gridScroll: { overflowY: 'auto', overflowX: 'auto', maxHeight: '70vh' },
  grid: { display: 'flex', flexWrap: 'wrap', gap: 1 },
  infoPanel: {
    flex: '1 1 200px', minWidth: 200,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  infoSection: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  infoLabel: { fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  progressBar: { height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 1s ease' },
  infoValue: { fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--accent)', lineHeight: 1 },
  infoPhaseBadge: { fontSize: 12, color: 'var(--text3)', letterSpacing: '0.02em' },
  momentRow: { display: 'flex', alignItems: 'baseline', gap: 6 },
  momentEnjoyed: { fontFamily: 'var(--font-serif)', fontSize: 22, color: '#2e7d32', lineHeight: 1 },
  momentRegret: { fontFamily: 'var(--font-serif)', fontSize: 22, color: '#c62828', lineHeight: 1 },
  momentIntention: { fontFamily: 'var(--font-serif)', fontSize: 22, color: '#1976d2', lineHeight: 1 },
  momentLabel: { fontSize: 12, color: 'var(--text3)' },
  momentRatio: { fontSize: 12, color: 'var(--text3)', paddingTop: 6, borderTop: '1px solid var(--border)' },
  infoDivider: { height: 1, background: 'var(--border)' },
  quickLink: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '12px 14px',
    display: 'flex', alignItems: 'center', gap: 10,
    textAlign: 'left', cursor: 'pointer', width: '100%',
    transition: 'border-color 0.15s',
  },
  quickLinkIcon: { fontSize: 16, color: 'var(--accent)', flexShrink: 0, lineHeight: 1 },
  quickLinkTitle: { fontSize: 14, color: 'var(--text)', fontWeight: 500 },
  quickLinkNote: { fontSize: 12, color: 'var(--text3)', marginTop: 1 },
  setupNudge: { fontSize: 13, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6 },
  nudgeLink: { background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline' },
  hint: { fontSize: 12, color: 'var(--text3)', textAlign: 'center', letterSpacing: '0.01em' },

  tooltip: {
    position: 'fixed',
    background: 'var(--text)', border: '1px solid var(--text)',
    borderRadius: 8, padding: '10px 14px',
    pointerEvents: 'none', zIndex: 9999,
    minWidth: 190, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  tooltipStatus: { fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
  tooltipRow: { fontSize: 12, color: '#faf9f7', lineHeight: 1.8 },

  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, zIndex: 9998,
  },
  modal: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 16, padding: 28,
    width: '100%', maxWidth: 420,
    display: 'flex', flexDirection: 'column', gap: 16,
    boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
  },
  modalTitle: { fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text)' },
  modalMeta: { fontSize: 13, color: 'var(--text3)', marginTop: -10 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, color: 'var(--text2)', fontWeight: 500 },
  weekTag: { color: 'var(--text3)', fontWeight: 400 },
  sentimentBtns: { display: 'flex', gap: 8 },
  sentimentBtn: {
    flex: 1, padding: '10px 8px', borderRadius: 8,
    border: '1.5px solid', fontSize: 13, fontWeight: 500,
    cursor: 'pointer',
  },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  cancelBtn: {
    background: 'none', border: '1px solid var(--border)', color: 'var(--text2)',
    padding: '10px 18px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
  },
  saveBtn: {
    background: 'var(--accent)', color: '#fff',
    padding: '10px 24px', borderRadius: 8, fontSize: 14,
    fontWeight: 600, border: 'none',
  },
}
