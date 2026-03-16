import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getWeeksLived, getAgeAtWeek, getDateAtWeek, formatDate,
  getLifePhase, getSecondsSinceBirth, formatNumber, LIFE_PHASES
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
  { value: 'enjoyed', label: 'Enjoyed', color: '#4ade80' },
  { value: 'neutral', label: 'Neutral', color: 'var(--text3)' },
  { value: 'regret',  label: 'Regret',  color: '#f87171' },
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

  // Date-entry form
  const [form, setForm] = useState({ date: '', text: '', sentiment: 'enjoyed', intention: '' })
  const [formWeekIdx, setFormWeekIdx] = useState(null)
  const [formIsPast, setFormIsPast] = useState(null)

  // Modal (cell click)
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

  const handleFormSubmit = () => {
    if (formWeekIdx === null) return
    if (formIsPast) {
      if (form.text.trim()) onMilestone(formWeekIdx, form.text.trim(), form.sentiment)
    } else {
      if (form.intention.trim()) onIntention(formWeekIdx, form.intention.trim())
    }
    setForm({ date: '', text: '', sentiment: 'enjoyed', intention: '' })
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

    let bg = '#161614'
    let border = '#222220'

    if (isCurrent) {
      bg = 'var(--accent)'; border = 'var(--accent)'
    } else if (isPast) {
      if (m?.sentiment === 'enjoyed')      { bg = '#1a3d24'; border = '#2a5e38' }
      else if (m?.sentiment === 'regret') { bg = '#3d1a1a'; border = '#5e2828' }
      else if (checkin === 'yes')         { bg = '#2a4a2a'; border = '#3a6a3a' }
      else if (checkin === 'somewhat')    { bg = '#3a2e10'; border = '#5a4818' }
      else if (checkin === 'no')          { bg = '#242424'; border = '#2e2e2e' }
      else                                { bg = phase.color + 'b0'; border = phase.color + '40' }
    } else if (m || weeklyIntentions[i]) {
      bg = '#1e2a3d'; border = '#2a3d5e'
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

      {/* Date entry form */}
      <div style={s.entryForm}>
        <div style={s.entryTitle}>Add a life event by date</div>
        <div style={s.entryRow}>
          <div style={s.entryField}>
            <label style={s.entryLabel}>Date</label>
            <input
              type="date"
              style={s.entryInput}
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>

          {formWeekIdx !== null && formIsPast && (
            <>
              <div style={{ ...s.entryField, flex: 2 }}>
                <label style={s.entryLabel}>
                  What happened? <span style={{ color: 'var(--text3)' }}>Week {formWeekIdx + 1}</span>
                </label>
                <input
                  style={s.entryInput}
                  value={form.text}
                  onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                  placeholder="First day at new job, trip to Japan, Dad's birthday..."
                  onKeyDown={e => e.key === 'Enter' && handleFormSubmit()}
                />
              </div>
              <div style={s.entryField}>
                <label style={s.entryLabel}>How do you feel about it?</label>
                <div style={s.sentimentBtns}>
                  {SENTIMENTS.map(sv => (
                    <button
                      key={sv.value}
                      style={{
                        ...s.sentimentBtn,
                        borderColor: form.sentiment === sv.value ? sv.color : 'var(--border)',
                        color: form.sentiment === sv.value ? sv.color : 'var(--text3)',
                        background: form.sentiment === sv.value ? sv.color + '18' : 'none',
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
            <div style={{ ...s.entryField, flex: 2 }}>
              <label style={s.entryLabel}>
                Intention for this week <span style={{ color: 'var(--text3)' }}>Week {formWeekIdx + 1}</span>
              </label>
              <input
                style={s.entryInput}
                value={form.intention}
                onChange={e => setForm(f => ({ ...f, intention: e.target.value }))}
                placeholder="What matters most this week?"
                onKeyDown={e => e.key === 'Enter' && handleFormSubmit()}
              />
            </div>
          )}

          {formWeekIdx !== null && (
            <div style={s.entryField}>
              <label style={s.entryLabel}>&nbsp;</label>
              <button
                style={{
                  ...s.entrySubmit,
                  opacity: (formIsPast ? form.text.trim() : form.intention.trim()) ? 1 : 0.4,
                }}
                onClick={handleFormSubmit}
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>

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
          <div style={{ ...s.dot, background: '#1e2a3d', border: '1px solid #2a3d5e' }} />
          <span style={s.legendLabel}>Intention</span>
        </div>
      </div>

      {/* Main area: grid + right panel */}
      <div style={s.mainArea}>

        {/* Year labels + Grid */}
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

        {/* Right info panel */}
        <div style={s.infoPanel}>

          {/* Life progress */}
          <div style={s.infoSection}>
            <div style={s.infoLabel}>Life progress</div>
            <div style={s.progressBar}>
              <div style={{ ...s.progressFill, width: `${pctLived}%` }} />
            </div>
            <div style={s.infoValue}>{pctLived}%</div>
            <div style={s.infoPhaseBadge}>{currentPhase.name}</div>
          </div>

          {/* Moments summary */}
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

          {/* Quick links */}
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
        Hover to inspect any week · Click to add a milestone or intention
      </div>

      {/* Tooltip */}
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
              color: tooltip.sentiment === 'enjoyed' ? '#4ade80' : tooltip.sentiment === 'regret' ? '#f87171' : '#e74c3c',
            }}>
              ★ {tooltip.milestone}
            </div>
          )}
          {tooltip.intention && (
            <div style={{ ...s.tooltipRow, color: '#93c5fd', marginTop: 4 }}>
              → {tooltip.intention}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (() => {
        const age = getAgeAtWeek(birthday, modal.weekIndex)
        const date = getDateAtWeek(birthday, modal.weekIndex)
        const phase = getLifePhase(age)
        const isPastWeek = modal.weekIndex < weeksLived
        return (
          <div data-testid="modal-overlay" style={s.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div style={s.modal} className="slide-up">
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
                            background: milestoneSentiment === sv.value ? sv.color + '18' : 'none',
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
  container: { display: 'flex', flexDirection: 'column', gap: 20 },
  ticker: {
    display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '14px 20px',
  },
  tickerDiv: { width: 1, height: 32, background: 'var(--border)', flexShrink: 0 },
  shareBtn: {
    background: 'var(--accent)', color: '#0a0a0a',
    padding: '8px 18px', borderRadius: 6, fontSize: 12,
    fontWeight: 600, border: 'none', flexShrink: 0,
  },
  entryForm: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '16px 20px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  entryTitle: { fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  entryRow: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' },
  entryField: { display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 140px' },
  entryLabel: { fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  entryInput: { fontSize: 13, padding: '8px 12px', borderRadius: 6, background: '#111', border: '1px solid var(--border)', color: 'var(--text)' },
  entrySubmit: {
    background: 'var(--accent)', color: '#0a0a0a',
    border: 'none', borderRadius: 6, padding: '8px 20px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  sentimentBtns: { display: 'flex', gap: 6 },
  sentimentBtn: {
    flex: 1, padding: '6px 8px', borderRadius: 5,
    border: '1px solid', fontSize: 11, fontWeight: 500,
    cursor: 'pointer', letterSpacing: '0.03em',
  },
  legend: { display: 'flex', flexWrap: 'wrap', gap: '6px 18px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 2, flexShrink: 0 },
  legendLabel: { fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  mainArea: {
    display: 'flex', gap: 20, alignItems: 'flex-start',
  },
  gridOuter: {
    display: 'flex', gap: 8, flex: '1 1 0',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '16px 12px',
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
    flexShrink: 0, width: 220,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  infoSection: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  infoLabel: { fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  progressBar: { height: 4, background: '#1a1a18', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--accent)', borderRadius: 2, transition: 'width 1s ease' },
  infoValue: { fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--accent)', lineHeight: 1 },
  infoPhaseBadge: { fontSize: 11, color: 'var(--text3)', letterSpacing: '0.04em' },
  momentRow: { display: 'flex', alignItems: 'baseline', gap: 6 },
  momentEnjoyed: { fontFamily: 'var(--font-serif)', fontSize: 22, color: '#4ade80', lineHeight: 1 },
  momentRegret: { fontFamily: 'var(--font-serif)', fontSize: 22, color: '#f87171', lineHeight: 1 },
  momentIntention: { fontFamily: 'var(--font-serif)', fontSize: 22, color: '#93c5fd', lineHeight: 1 },
  momentLabel: { fontSize: 11, color: 'var(--text3)' },
  momentRatio: { fontSize: 11, color: 'var(--text3)', paddingTop: 4, borderTop: '1px solid var(--border)' },
  infoDivider: { height: 1, background: 'var(--border)' },
  quickLink: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '12px 14px',
    display: 'flex', alignItems: 'center', gap: 10,
    textAlign: 'left', cursor: 'pointer', width: '100%',
    transition: 'border-color 0.15s',
  },
  quickLinkIcon: { fontSize: 16, color: 'var(--accent)', flexShrink: 0, lineHeight: 1 },
  quickLinkTitle: { fontSize: 13, color: 'var(--text)', fontWeight: 500 },
  quickLinkNote: { fontSize: 11, color: 'var(--text3)', marginTop: 1 },
  setupNudge: { fontSize: 12, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6 },
  nudgeLink: { background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', padding: 0, textDecoration: 'underline' },
  hint: { fontSize: 11, color: 'var(--text3)', textAlign: 'center', letterSpacing: '0.02em' },
  tooltip: {
    position: 'fixed',
    background: '#1e1e1c', border: '1px solid #383836',
    borderRadius: 8, padding: '10px 14px',
    pointerEvents: 'none', zIndex: 9999,
    minWidth: 190, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  tooltipStatus: { fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
  tooltipRow: { fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.82)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, zIndex: 9998,
  },
  modal: {
    background: '#141414', border: '1px solid var(--border)',
    borderRadius: 12, padding: 28,
    width: '100%', maxWidth: 420,
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  modalTitle: { fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text)' },
  modalMeta: { fontSize: 12, color: 'var(--text3)' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  cancelBtn: {
    background: 'none', border: '1px solid var(--border)', color: 'var(--text3)',
    padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
  },
  saveBtn: {
    background: 'var(--accent)', color: '#0a0a0a',
    padding: '8px 22px', borderRadius: 6, fontSize: 13,
    fontWeight: 600, border: 'none',
  },
}
