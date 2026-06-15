import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getWeeksLived, getAgeAtWeek, getDateAtWeek, formatDate,
  getLifePhase, getSecondsSinceBirth, LIFE_PHASES
} from '../utils'
import { getAllThemes, themeMeta as themeMetaShared } from '../themes'
import ThemePicker from './ThemePicker'

const CELL = 9   // cell size px (8px + 1px gap)
const COLS = 52  // weeks per row

// Handle both legacy string format and { text, sentiment, theme } format
function parseMilestone(m) {
  if (!m) return null
  if (typeof m === 'string') return { text: m, sentiment: 'neutral', theme: 'other' }
  return { theme: 'other', sentiment: 'neutral', ...m }
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

const MEMORY_COLOR = '#b8860b'  // single gold marker for ALL memories — no sentiment color noise on the grid

export default function Grid({
  birthday, lifeExpectancy, name,
  milestones, checkins, weeklyIntentions,
  goals = [], people = [], customThemes = [],
  onMilestone, onDeleteMilestone, onIntention, onAddTheme, onNavigate,
}) {
  const THEMES = getAllThemes(customThemes)
  const themeMeta = (v) => themeMetaShared(v, customThemes)
  const totalWeeks = lifeExpectancy * 52
  const weeksLived = getWeeksLived(birthday)
  const weeksRemaining = Math.max(0, totalWeeks - weeksLived)
  const pctLived = totalWeeks > 0 ? ((weeksLived / totalWeeks) * 100).toFixed(1) : 0
  const currentPhase = getLifePhase(getAgeAtWeek(birthday, weeksLived))

  // Add-by-date modal
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ date: '', text: '', sentiment: 'enjoyed', theme: 'family', intention: '' })
  const [formWeekIdx, setFormWeekIdx] = useState(null)
  const [formIsPast, setFormIsPast] = useState(null)

  // Cell modal + tooltip
  const [tooltip, setTooltip] = useState(null)
  const [modal, setModal] = useState(null)
  const [milestoneText, setMilestoneText] = useState('')
  const [milestoneSentiment, setMilestoneSentiment] = useState('enjoyed')
  const [milestoneTheme, setMilestoneTheme] = useState('family')
  const [intentionText, setIntentionText] = useState('')
  const [seconds, setSeconds] = useState(getSecondsSinceBirth(birthday))

  // Filters for the memories panel (also highlights the grid)
  const [themeFilter, setThemeFilter] = useState(null)      // theme value or null
  const [sentimentFilter, setSentimentFilter] = useState(null) // 'enjoyed' | 'regret' | null

  useEffect(() => {
    const id = setInterval(() => setSeconds(getSecondsSinceBirth(birthday)), 1000)
    return () => clearInterval(id)
  }, [birthday])

  useEffect(() => {
    if (!form.date || !birthday) { setFormWeekIdx(null); setFormIsPast(null); return }
    const idx = dateToWeekIndex(birthday, form.date)
    if (idx < 0 || idx >= totalWeeks) { setFormWeekIdx(null); setFormIsPast(null); return }
    setFormWeekIdx(idx)
    setFormIsPast(idx < weeksLived)
  }, [form.date, birthday, weeksLived, totalWeeks])

  const closeAdd = () => {
    setAddOpen(false)
    setForm({ date: '', text: '', sentiment: 'enjoyed', theme: 'family', intention: '' })
  }

  const handleAddSubmit = () => {
    if (formWeekIdx === null) return
    if (formIsPast) {
      if (form.text.trim()) onMilestone(formWeekIdx, form.text.trim(), form.sentiment, form.theme)
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
    setMilestoneTheme(m?.theme || 'family')
    setIntentionText(weeklyIntentions[weekIndex] || '')
  }, [milestones, weeklyIntentions])

  const saveModal = () => {
    if (milestoneText.trim()) onMilestone(modal.weekIndex, milestoneText.trim(), milestoneSentiment, milestoneTheme)
    else onDeleteMilestone(modal.weekIndex)
    if (intentionText.trim()) onIntention(modal.weekIndex, intentionText.trim())
    setModal(null)
  }

  // ── Memory list, sorted most-recent-first, with parsed fields ──
  const memories = Object.entries(milestones)
    .map(([wi, raw]) => {
      const m = parseMilestone(raw)
      const idx = parseInt(wi, 10)
      return { weekIndex: idx, ...m, date: getDateAtWeek(birthday, idx), age: getAgeAtWeek(birthday, idx) }
    })
    .sort((a, b) => b.weekIndex - a.weekIndex)

  const matchesFilter = (m) =>
    (!themeFilter || m.theme === themeFilter) &&
    (!sentimentFilter || m.sentiment === sentimentFilter)

  const filteredMemories = memories.filter(matchesFilter)
  const hasActiveFilter = themeFilter || sentimentFilter

  // Theme counts for the breakdown
  const themeCounts = THEMES.map(t => ({
    ...t,
    count: memories.filter(m => m.theme === t.value).length,
  })).filter(t => t.count > 0)

  // Summary stats
  const enjoyedCount = memories.filter(m => m.sentiment === 'enjoyed').length
  const regretCount  = memories.filter(m => m.sentiment === 'regret').length
  const intentionCount = Object.values(weeklyIntentions).filter(Boolean).length

  const toggleSentiment = (val) => {
    setSentimentFilter(prev => prev === val ? null : val)
  }
  const toggleTheme = (val) => {
    setThemeFilter(prev => prev === val ? null : val)
  }

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

  // ── Build cells: phase backdrop + single memory marker (no sentiment noise) ──
  const cells = []
  for (let i = 0; i < totalWeeks; i++) {
    const age = getAgeAtWeek(birthday, i)
    const phase = getLifePhase(age)
    const isPast = i < weeksLived
    const isCurrent = i === weeksLived
    const m = parseMilestone(milestones[i])
    const hasIntention = !!weeklyIntentions[i]

    // When a filter is active, fade non-matching cells so the pattern pops
    const dimmed = hasActiveFilter && !(m && matchesFilter(m))

    let bg, border
    if (isCurrent) {
      bg = 'var(--accent)'; border = 'var(--accent)'
    } else if (m) {
      bg = MEMORY_COLOR; border = '#9c7209'
    } else if (hasIntention) {
      bg = '#bbdefb'; border = '#90caf9'
    } else if (isPast) {
      bg = phase.color + '70'; border = phase.color + '40'
    } else {
      bg = '#eceae6'; border = '#e0ddd7'
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
          opacity: dimmed ? 0.15 : 1,
          transition: 'opacity 0.2s',
          animation: isCurrent ? 'pulse 2.5s ease-in-out infinite' : 'none',
        }}
        onMouseEnter={(e) => {
          const date = getDateAtWeek(birthday, i)
          setTooltip({
            weekIndex: i, x: e.clientX, y: e.clientY,
            date: formatDate(date), age: age.toFixed(1), phase: phase.name,
            isPast, isCurrent, milestone: m?.text, theme: m?.theme,
            intention: weeklyIntentions[i], sentiment: m?.sentiment,
          })
        }}
        onMouseLeave={() => setTooltip(null)}
        onClick={() => openModal(i)}
      >
        {m && (
          <div data-testid="milestone-dot" style={{
            position: 'absolute', top: -1, right: -1,
            width: 3, height: 3, background: MEMORY_COLOR,
            borderRadius: '50%', pointerEvents: 'none',
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

      {/* Simplified legend — three life stages + the three things that matter on the grid */}
      <div style={s.legend}>
        {LIFE_PHASES.map(p => (
          <div key={p.name} style={s.legendItem}>
            <div style={{ ...s.dot, background: p.color }} />
            <span style={s.legendLabel}>{p.name}</span>
          </div>
        ))}
        <div style={s.legendDivider} />
        <div style={s.legendItem}>
          <div style={{ ...s.dot, background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
          <span style={s.legendLabel}>Now</span>
        </div>
        <div style={s.legendItem}>
          <div style={{ ...s.dot, background: MEMORY_COLOR }} />
          <span style={s.legendLabel}>Memory</span>
        </div>
        <div style={s.legendItem}>
          <div style={{ ...s.dot, background: '#bbdefb', border: '1px solid #90caf9' }} />
          <span style={s.legendLabel}>Intention</span>
        </div>
      </div>

      {/* Main area: grid + info panel */}
      <div style={s.mainArea}>

        <div style={s.gridOuter}>
          <div style={s.yearAxis}>
            {Array.from({ length: lifeExpectancy }, (_, year) => {
              const isBoundary = year === 5 || year === 18  // key life-stage demarcations
              const show = isBoundary || year % 10 === 0
              return (
                <div key={year} style={{ ...s.yearLabel, ...(isBoundary ? s.yearLabelBoundary : {}) }}>
                  {show ? year : ''}
                </div>
              )
            })}
          </div>
          <div style={s.gridScroll} ref={gridRef}>
            <div style={{ ...s.grid, width: `${COLS * CELL - 1}px` }}>{cells}</div>
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

          {/* Your moments — now clickable filters */}
          <div style={s.infoSection}>
            <div style={s.infoLabel}>Your moments</div>
            <div style={s.momentBtns}>
              <button
                style={{ ...s.momentBtn, ...(sentimentFilter === 'enjoyed' ? s.momentBtnActive : {}) }}
                onClick={() => toggleSentiment('enjoyed')}
              >
                <span style={{ ...s.momentNum, color: '#2e7d32' }}>{enjoyedCount}</span>
                <span style={s.momentLabel}>enjoyed</span>
              </button>
              <button
                style={{ ...s.momentBtn, ...(sentimentFilter === 'regret' ? s.momentBtnActive : {}) }}
                onClick={() => toggleSentiment('regret')}
              >
                <span style={{ ...s.momentNum, color: '#c62828' }}>{regretCount}</span>
                <span style={s.momentLabel}>regrets</span>
              </button>
              <button style={s.momentBtn} onClick={() => onNavigate?.('checkin')}>
                <span style={{ ...s.momentNum, color: '#1976d2' }}>{intentionCount}</span>
                <span style={s.momentLabel}>intentions</span>
              </button>
            </div>
            {(enjoyedCount + regretCount) > 0 && (
              <div style={s.momentRatio}>
                {Math.round((enjoyedCount / (enjoyedCount + regretCount)) * 100)}% contentment ratio
              </div>
            )}
          </div>

          {/* Themes breakdown — tap to filter / spot patterns */}
          {themeCounts.length > 0 && (
            <div style={s.infoSection}>
              <div style={s.infoLabel}>Themes</div>
              <div style={s.themeList}>
                {themeCounts.map(t => (
                  <button
                    key={t.value}
                    data-testid={`theme-chip-${t.value}`}
                    style={{ ...s.themeChip, ...(themeFilter === t.value ? s.themeChipActive : {}) }}
                    onClick={() => toggleTheme(t.value)}
                  >
                    <span style={s.themeIcon}>{t.icon}</span>
                    <span style={s.themeName}>{t.label}</span>
                    <span style={s.themeCount}>{t.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
        </div>
      </div>

      {/* Your memories — the readable log of what you've added */}
      <div style={s.memoriesSection}>
        <div style={s.memoriesHeader}>
          <h2 style={s.memoriesTitle}>
            Your memories {memories.length > 0 && <span style={s.memoriesCount}>{filteredMemories.length}</span>}
          </h2>
          {hasActiveFilter && (
            <button style={s.clearFilter} onClick={() => { setThemeFilter(null); setSentimentFilter(null) }}>
              Clear filter
            </button>
          )}
        </div>

        {memories.length === 0 ? (
          <p style={s.memoriesEmpty}>
            No memories yet. Tap <strong>“Add a life event”</strong> above or any week in the grid to record what mattered.
          </p>
        ) : filteredMemories.length === 0 ? (
          <p style={s.memoriesEmpty}>No memories match this filter.</p>
        ) : (
          <div style={s.memoryList}>
            {filteredMemories.map(m => {
              const tm = themeMeta(m.theme)
              const sentColor = m.sentiment === 'enjoyed' ? '#2e7d32' : m.sentiment === 'regret' ? '#c62828' : '#9a9490'
              return (
                <button key={m.weekIndex} style={s.memoryRow} onClick={() => openModal(m.weekIndex)}>
                  <span style={s.memoryThemeIcon} title={tm.label}>{tm.icon}</span>
                  <div style={s.memoryBody}>
                    <span style={s.memoryText}>{m.text}</span>
                    <span style={s.memoryMeta}>
                      {formatDate(m.date)} · Age {Math.floor(m.age)} · {tm.label}
                    </span>
                  </div>
                  <span style={{ ...s.memorySentiment, color: sentColor }}>
                    {m.sentiment === 'enjoyed' ? 'Enjoyed' : m.sentiment === 'regret' ? 'Regret' : 'Neutral'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
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
            <div style={{ ...s.tooltipRow, color: 'var(--accent)', marginTop: 4 }}>
              ★ {tooltip.milestone} {tooltip.theme && `(${themeMeta(tooltip.theme).label})`}
            </div>
          )}
          {tooltip.intention && (
            <div style={{ ...s.tooltipRow, color: '#1976d2', marginTop: 4 }}>→ {tooltip.intention}</div>
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
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} autoFocus />
            </div>

            {formWeekIdx !== null && formIsPast && (
              <>
                <div style={s.field}>
                  <label style={s.label}>What happened? <span style={s.weekTag}>Week {formWeekIdx + 1}</span></label>
                  <input value={form.text}
                    onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                    placeholder="First day at new job, trip to Japan, Dad's birthday..."
                    onKeyDown={e => e.key === 'Enter' && handleAddSubmit()} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Theme</label>
                  <ThemePicker
                    value={form.theme}
                    onChange={(v) => setForm(f => ({ ...f, theme: v }))}
                    customThemes={customThemes}
                    onAddTheme={onAddTheme}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>How do you feel about it?</label>
                  <div style={s.sentimentBtns}>
                    {SENTIMENTS.map(sv => (
                      <button key={sv.value}
                        style={{
                          ...s.sentimentBtn,
                          borderColor: form.sentiment === sv.value ? sv.color : 'var(--border)',
                          color: form.sentiment === sv.value ? sv.color : 'var(--text3)',
                          background: form.sentiment === sv.value ? sv.bg : 'transparent',
                        }}
                        onClick={() => setForm(f => ({ ...f, sentiment: sv.value }))}>
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
                <input value={form.intention}
                  onChange={e => setForm(f => ({ ...f, intention: e.target.value }))}
                  placeholder="What matters most this week?"
                  onKeyDown={e => e.key === 'Enter' && handleAddSubmit()} />
              </div>
            )}

            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={closeAdd}>Cancel</button>
              <button
                style={{
                  ...s.saveBtn,
                  opacity: formWeekIdx !== null && (formIsPast ? form.text.trim() : form.intention.trim()) ? 1 : 0.4,
                }}
                onClick={handleAddSubmit}>Save</button>
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
                    <input value={milestoneText}
                      onChange={e => setMilestoneText(e.target.value)}
                      placeholder="Got married, First day at new job, Dad's birthday..." autoFocus />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Theme</label>
                    <ThemePicker
                      value={milestoneTheme}
                      onChange={setMilestoneTheme}
                      customThemes={customThemes}
                      onAddTheme={onAddTheme}
                    />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>How do you feel about this week?</label>
                    <div style={s.sentimentBtns}>
                      {SENTIMENTS.map(sv => (
                        <button key={sv.value}
                          style={{
                            ...s.sentimentBtn,
                            borderColor: milestoneSentiment === sv.value ? sv.color : 'var(--border)',
                            color: milestoneSentiment === sv.value ? sv.color : 'var(--text3)',
                            background: milestoneSentiment === sv.value ? sv.bg : 'transparent',
                          }}
                          onClick={() => setMilestoneSentiment(sv.value)}>
                          {sv.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={s.field}>
                  <label style={s.label}>Intention for this week</label>
                  <input value={intentionText}
                    onChange={e => setIntentionText(e.target.value)}
                    placeholder="What matters most this week?" autoFocus />
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
        fontFamily: 'var(--font-serif)', fontSize: 26, lineHeight: 1,
        color: accent ? 'var(--accent)' : 'var(--text)', letterSpacing: '-0.01em',
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
    background: 'var(--accent)', color: '#fff', padding: '8px 18px',
    borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', flexShrink: 0,
  },

  addEventBtn: {
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    background: 'var(--surface)', border: '2px solid var(--accent)',
    borderRadius: 'var(--radius)', padding: '16px 20px',
    cursor: 'pointer', textAlign: 'left', width: '100%',
  },
  addEventPlus: {
    fontSize: 24, color: 'var(--accent)', fontWeight: 300, lineHeight: 1,
    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  addEventText: { fontSize: 16, color: 'var(--text)', fontWeight: 600 },
  addEventNote: { fontSize: 13, color: 'var(--text3)', flex: 1 },

  // Simplified legend
  legend: { display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center' },
  legendDivider: { width: 1, height: 16, background: 'var(--border)' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 2, flexShrink: 0 },
  legendLabel: { fontSize: 11, color: 'var(--text3)', letterSpacing: '0.02em' },

  mainArea: { display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' },
  gridOuter: {
    display: 'flex', gap: 8, flex: '1 1 320px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '16px 12px', overflow: 'hidden', minWidth: 0,
  },
  yearAxis: { display: 'flex', flexDirection: 'column', flexShrink: 0 },
  yearLabel: {
    height: 8, marginBottom: 1, fontSize: 8, color: 'var(--text3)',
    lineHeight: '8px', textAlign: 'right', minWidth: 16, paddingRight: 4,
  },
  yearLabelBoundary: { color: 'var(--accent)', fontWeight: 700 },
  gridScroll: { overflowY: 'auto', overflowX: 'auto', maxHeight: '70vh' },
  grid: { display: 'flex', flexWrap: 'wrap', gap: 1 },
  infoPanel: { flex: '1 1 200px', minWidth: 200, display: 'flex', flexDirection: 'column', gap: 12 },
  infoSection: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  infoLabel: { fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  progressBar: { height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 1s ease' },
  infoValue: { fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--accent)', lineHeight: 1 },
  infoPhaseBadge: { fontSize: 12, color: 'var(--text3)', letterSpacing: '0.02em' },

  // Moments as filter buttons
  momentBtns: { display: 'flex', gap: 8 },
  momentBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start',
    background: 'var(--surface2)', border: '1.5px solid transparent', borderRadius: 8,
    padding: '8px 10px', cursor: 'pointer',
  },
  momentBtnActive: { borderColor: 'var(--accent)', background: '#fdf6e3' },
  momentNum: { fontFamily: 'var(--font-serif)', fontSize: 22, lineHeight: 1 },
  momentLabel: { fontSize: 11, color: 'var(--text3)' },
  momentRatio: { fontSize: 12, color: 'var(--text3)', paddingTop: 6, borderTop: '1px solid var(--border)' },

  // Themes
  themeList: { display: 'flex', flexDirection: 'column', gap: 6 },
  themeChip: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--surface2)', border: '1.5px solid transparent', borderRadius: 8,
    padding: '8px 10px', cursor: 'pointer', width: '100%', textAlign: 'left',
  },
  themeChipActive: { borderColor: 'var(--accent)', background: '#fdf6e3' },
  themeIcon: { fontSize: 14, color: 'var(--accent)', width: 16, textAlign: 'center', flexShrink: 0 },
  themeName: { fontSize: 14, color: 'var(--text)', flex: 1 },
  themeCount: { fontSize: 13, color: 'var(--text3)', fontWeight: 600 },

  infoDivider: { height: 1, background: 'var(--border)' },
  quickLink: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '12px 14px',
    display: 'flex', alignItems: 'center', gap: 10,
    textAlign: 'left', cursor: 'pointer', width: '100%', transition: 'border-color 0.15s',
  },
  quickLinkIcon: { fontSize: 16, color: 'var(--accent)', flexShrink: 0, lineHeight: 1 },
  quickLinkTitle: { fontSize: 14, color: 'var(--text)', fontWeight: 500 },
  quickLinkNote: { fontSize: 12, color: 'var(--text3)', marginTop: 1 },

  // Memories section
  memoriesSection: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: 20,
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  memoriesHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  memoriesTitle: { fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text)', fontWeight: 400, margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  memoriesCount: { fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--accent)', background: '#fdf6e3', borderRadius: 12, padding: '2px 10px', fontWeight: 600 },
  clearFilter: { background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' },
  memoriesEmpty: { fontSize: 14, color: 'var(--text3)', lineHeight: 1.6, margin: 0 },
  memoryList: { display: 'flex', flexDirection: 'column', gap: 8 },
  memoryRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10,
    padding: '12px 14px', cursor: 'pointer', textAlign: 'left', width: '100%',
  },
  memoryThemeIcon: {
    fontSize: 16, color: 'var(--accent)', width: 28, height: 28, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#fdf6e3', borderRadius: 8,
  },
  memoryBody: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  memoryText: { fontSize: 15, color: 'var(--text)', fontWeight: 500 },
  memoryMeta: { fontSize: 12, color: 'var(--text3)' },
  memorySentiment: { fontSize: 12, fontWeight: 600, flexShrink: 0 },

  tooltip: {
    position: 'fixed', background: 'var(--text)', border: '1px solid var(--text)',
    borderRadius: 8, padding: '10px 14px', pointerEvents: 'none', zIndex: 9999,
    minWidth: 190, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  tooltipStatus: { fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
  tooltipRow: { fontSize: 12, color: '#faf9f7', lineHeight: 1.8 },

  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 9998,
  },
  modal: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 16, padding: 28, width: '100%', maxWidth: 440,
    display: 'flex', flexDirection: 'column', gap: 16,
    boxShadow: '0 16px 48px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto',
  },
  modalTitle: { fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text)' },
  modalMeta: { fontSize: 13, color: 'var(--text3)', marginTop: -10 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, color: 'var(--text2)', fontWeight: 500 },
  weekTag: { color: 'var(--text3)', fontWeight: 400 },
  sentimentBtns: { display: 'flex', gap: 8 },
  sentimentBtn: {
    flex: 1, padding: '10px 8px', borderRadius: 8, border: '1.5px solid',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
  },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  cancelBtn: {
    background: 'none', border: '1px solid var(--border)', color: 'var(--text2)',
    padding: '10px 18px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
  },
  saveBtn: {
    background: 'var(--accent)', color: '#fff', padding: '10px 24px',
    borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none',
  },
}
