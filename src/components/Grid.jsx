import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getWeeksLived, getAgeAtWeek, getDateAtWeek, formatDate,
  getLifePhase, getSecondsSinceBirth, formatNumber, LIFE_PHASES
} from '../utils'

const CELL = 9   // cell size px (8px + 1px gap)
const COLS = 52  // weeks per row

export default function Grid({
  birthday, lifeExpectancy, name,
  milestones, checkins, weeklyIntentions,
  onMilestone, onDeleteMilestone, onIntention,
}) {
  const totalWeeks = lifeExpectancy * 52
  const weeksLived = getWeeksLived(birthday)
  const weeksRemaining = Math.max(0, totalWeeks - weeksLived)

  const [tooltip, setTooltip] = useState(null)
  const [modal, setModal] = useState(null)
  const [milestoneText, setMilestoneText] = useState('')
  const [intentionText, setIntentionText] = useState('')
  const [seconds, setSeconds] = useState(getSecondsSinceBirth(birthday))

  useEffect(() => {
    const id = setInterval(() => setSeconds(getSecondsSinceBirth(birthday)), 1000)
    return () => clearInterval(id)
  }, [birthday])

  const openModal = useCallback((weekIndex) => {
    setModal({ weekIndex })
    setMilestoneText(milestones[weekIndex] || '')
    setIntentionText(weeklyIntentions[weekIndex] || '')
  }, [milestones, weeklyIntentions])

  const saveModal = () => {
    if (milestoneText.trim()) onMilestone(modal.weekIndex, milestoneText.trim())
    else onDeleteMilestone(modal.weekIndex)
    if (intentionText.trim()) onIntention(modal.weekIndex, intentionText.trim())
    setModal(null)
  }

  const shareText = () => {
    const pct = ((weeksLived / totalWeeks) * 100).toFixed(1)
    return `I've lived ${weeksLived.toLocaleString()} of my ${totalWeeks.toLocaleString()} weeks (${pct}%). ${weeksRemaining.toLocaleString()} remain. Every one counts. — Your Life in Weeks`
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'My Life in Weeks', text: shareText() }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareText()).then(() => alert('Copied to clipboard!'))
    }
  }

  const gridRef = useRef(null)

  // Scroll current week into view once
  useEffect(() => {
    if (!gridRef.current) return
    const currentRow = Math.floor(weeksLived / COLS)
    const rowHeight = CELL
    const scrollTarget = currentRow * rowHeight - 100
    setTimeout(() => {
      if (gridRef.current) gridRef.current.scrollTop = Math.max(0, scrollTarget)
    }, 200)
  }, [])

  const cells = []
  for (let i = 0; i < totalWeeks; i++) {
    const age = getAgeAtWeek(birthday, i)
    const phase = getLifePhase(age)
    const isPast = i < weeksLived
    const isCurrent = i === weeksLived
    const hasMilestone = !!milestones[i]
    const checkin = checkins[i]

    let bg = '#161614'
    let border = '#222220'
    if (isCurrent) {
      bg = 'var(--accent)'
      border = 'var(--accent)'
    } else if (isPast) {
      if (checkin === 'yes') { bg = '#2a4a2a'; border = '#3a6a3a' }
      else if (checkin === 'somewhat') { bg = '#3a2e10'; border = '#5a4818' }
      else if (checkin === 'no') { bg = '#242424'; border = '#2e2e2e' }
      else { bg = phase.color + 'b0'; border = phase.color + '40' }
    }

    cells.push(
      <div
        key={i}
        title=""
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
            date: formatDate(date),
            age: age.toFixed(1),
            phase: phase.name,
            isPast, isCurrent,
            milestone: milestones[i],
          })
        }}
        onMouseLeave={() => setTooltip(null)}
        onClick={() => openModal(i)}
      >
        {hasMilestone && (
          <div data-testid="milestone-dot" style={{
            position: 'absolute', top: -1, right: -1,
            width: 3, height: 3,
            background: '#e74c3c',
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
          <div style={{ ...s.dot, background: '#e74c3c' }} />
          <span style={s.legendLabel}>Milestone</span>
        </div>
      </div>

      {/* Year labels + Grid */}
      <div style={s.gridOuter}>
        {/* Year axis */}
        <div style={s.yearAxis}>
          {Array.from({ length: lifeExpectancy }, (_, year) => (
            <div key={year} style={s.yearLabel}>
              {year % 5 === 0 ? year : ''}
            </div>
          ))}
        </div>

        {/* Grid scroll area */}
        <div style={s.gridScroll} ref={gridRef}>
          <div style={{ ...s.grid, width: `${COLS * CELL - 1}px` }}>
            {cells}
          </div>
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
          top: Math.min(tooltip.y + 14, window.innerHeight - 140),
        }}>
          <div style={s.tooltipStatus}>
            {tooltip.isCurrent ? '● This week' : tooltip.isPast ? 'Past week' : 'Future week'}
          </div>
          <div style={s.tooltipRow}>{tooltip.date}</div>
          <div style={s.tooltipRow}>Age {tooltip.age} · {tooltip.phase}</div>
          <div style={s.tooltipRow}>Week {tooltip.weekIndex + 1} of {totalWeeks}</div>
          {tooltip.milestone && (
            <div style={{ ...s.tooltipRow, color: '#e74c3c', marginTop: 4 }}>
              ★ {tooltip.milestone}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (() => {
        const age = getAgeAtWeek(birthday, modal.weekIndex)
        const date = getDateAtWeek(birthday, modal.weekIndex)
        const phase = getLifePhase(age)
        return (
          <div data-testid="modal-overlay" style={s.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div style={s.modal} className="slide-up">
              <p style={s.modalTitle}>Week {modal.weekIndex + 1}</p>
              <p style={s.modalMeta}>{formatDate(date)} · Age {age.toFixed(1)} · {phase.name}</p>

              <div style={s.field}>
                <label style={s.label}>Milestone / memory</label>
                <input
                  value={milestoneText}
                  onChange={e => setMilestoneText(e.target.value)}
                  placeholder="Got married, First day at new job, Dad's birthday..."
                  autoFocus
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Intention for this week</label>
                <input
                  value={intentionText}
                  onChange={e => setIntentionText(e.target.value)}
                  placeholder="What matters most this week?"
                />
              </div>

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
  legend: { display: 'flex', flexWrap: 'wrap', gap: '6px 18px', },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 2, flexShrink: 0 },
  legendLabel: { fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  gridOuter: {
    display: 'flex', gap: 8,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '16px 12px',
    overflowX: 'auto',
  },
  yearAxis: {
    display: 'flex', flexDirection: 'column',
    flexShrink: 0,
  },
  yearLabel: {
    height: 8, marginBottom: 1,
    fontSize: 8, color: 'var(--text3)',
    lineHeight: '8px', textAlign: 'right',
    minWidth: 16, paddingRight: 4,
  },
  gridScroll: { overflowY: 'auto', maxHeight: '70vh' },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 1,
  },
  hint: { fontSize: 11, color: 'var(--text3)', textAlign: 'center', letterSpacing: '0.02em' },
  tooltip: {
    position: 'fixed',
    background: '#1e1e1c',
    border: '1px solid #383836',
    borderRadius: 8,
    padding: '10px 14px',
    pointerEvents: 'none',
    zIndex: 9999,
    minWidth: 190,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
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
    background: '#141414',
    border: '1px solid var(--border)',
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
