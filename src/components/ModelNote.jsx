// A small, consistent orienting strip shown atop Goals & People.
// Makes the app's mental model explicit ("what goes where") and cross-links
// the related tabs — so People, experiences, and Goals feel connected without
// being merged. Designed to be a lightweight, dismissible-feeling nudge.

const PIECES = {
  goals:   { icon: '◎', label: 'Goals',   note: 'what to achieve' },
  people:  { icon: '♡', label: 'People',  note: 'who to cherish' },
  grid:    { icon: '▦', label: 'Your Life', note: 'what you lived' },
}

export default function ModelNote({ active, onNavigate }) {
  const order = ['goals', 'people', 'grid']
  return (
    <div style={s.wrap}>
      <p style={s.lead}>
        {active === 'goals'
          ? 'Goals are what you want to achieve. The people you want to share them with live in People — keep them in sync as your plans grow.'
          : 'People is who you want time with. What you want to do — alone or together — lives in Goals. Connect the two as you go.'}
      </p>
      <div style={s.row}>
        {order.map((key, i) => {
          const p = PIECES[key]
          const isActive = key === active
          return (
            <span key={key} style={s.itemWrap}>
              <button
                style={{ ...s.chip, ...(isActive ? s.chipActive : {}) }}
                onClick={() => !isActive && onNavigate?.(key === 'grid' ? 'grid' : key)}
                disabled={isActive}
              >
                <span style={s.chipIcon}>{p.icon}</span>
                <span style={s.chipLabel}>{p.label}</span>
                <span style={s.chipNote}>{p.note}</span>
              </button>
              {i < order.length - 1 && <span style={s.sep}>·</span>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  wrap: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  lead: { fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 },
  row: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  itemWrap: { display: 'flex', alignItems: 'center', gap: 6 },
  chip: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 20, padding: '6px 12px', cursor: 'pointer',
  },
  chipActive: { borderColor: 'var(--accent)', background: '#fdf6e3', cursor: 'default' },
  chipIcon: { fontSize: 13, color: 'var(--accent)' },
  chipLabel: { fontSize: 13, color: 'var(--text)', fontWeight: 600 },
  chipNote: { fontSize: 12, color: 'var(--text3)' },
  sep: { color: 'var(--text3)', fontSize: 12 },
}
