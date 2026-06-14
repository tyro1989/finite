import { useState } from 'react'
import { getAllThemes, THEME_ICONS, slugifyTheme } from '../themes'

// Reusable chip-style theme selector with inline "add custom theme".
// Props:
//   value        — currently selected theme value
//   onChange     — (themeValue) => void
//   customThemes — array of user-defined { value, label, icon }
//   onAddTheme   — (theme) => void  (persists a new custom theme upstream)
export default function ThemePicker({ value, onChange, customThemes = [], onAddTheme }) {
  const [creating, setCreating] = useState(false)
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState(THEME_ICONS[0])

  const themes = getAllThemes(customThemes)

  const handleCreate = () => {
    const trimmed = label.trim()
    if (!trimmed) return
    let valueSlug = slugifyTheme(trimmed) || `theme-${themes.length}`
    // Avoid collisions with existing values
    if (themes.some(t => t.value === valueSlug)) valueSlug = `${valueSlug}-${Date.now().toString(36)}`
    const theme = { value: valueSlug, label: trimmed, icon }
    onAddTheme?.(theme)
    onChange?.(valueSlug)
    setLabel('')
    setIcon(THEME_ICONS[0])
    setCreating(false)
  }

  return (
    <div style={s.wrap}>
      <div style={s.picker}>
        {themes.map(t => (
          <button
            key={t.value}
            type="button"
            data-testid={`theme-pick-${t.value}`}
            style={{ ...s.chip, ...(value === t.value ? s.chipActive : {}) }}
            onClick={() => onChange?.(t.value)}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
        {!creating && (
          <button type="button" style={s.addChip} onClick={() => setCreating(true)}>
            + Custom
          </button>
        )}
      </div>

      {creating && (
        <div style={s.creator}>
          <div style={s.iconRow}>
            {THEME_ICONS.map(ic => (
              <button
                key={ic}
                type="button"
                style={{ ...s.iconBtn, ...(icon === ic ? s.iconBtnActive : {}) }}
                onClick={() => setIcon(ic)}
              >
                {ic}
              </button>
            ))}
          </div>
          <div style={s.creatorRow}>
            <input
              style={s.creatorInput}
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Name your theme (e.g. Faith, Fitness)"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <button type="button" style={{ ...s.creatorAdd, opacity: label.trim() ? 1 : 0.4 }}
              onClick={handleCreate} disabled={!label.trim()}>
              Add
            </button>
            <button type="button" style={s.creatorCancel} onClick={() => { setCreating(false); setLabel('') }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  picker: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  chip: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 11px', borderRadius: 20, fontSize: 13,
    border: '1.5px solid var(--border)', background: 'transparent',
    color: 'var(--text2)', cursor: 'pointer',
  },
  chipActive: { borderColor: 'var(--accent)', background: '#fdf6e3', color: 'var(--accent)', fontWeight: 600 },
  addChip: {
    padding: '7px 11px', borderRadius: 20, fontSize: 13,
    border: '1.5px dashed var(--border)', background: 'transparent',
    color: 'var(--text3)', cursor: 'pointer',
  },
  creator: {
    display: 'flex', flexDirection: 'column', gap: 8,
    background: 'var(--surface2)', borderRadius: 10, padding: 12,
  },
  iconRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 8, fontSize: 15,
    border: '1.5px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  iconBtnActive: { borderColor: 'var(--accent)', color: 'var(--accent)', background: '#fdf6e3' },
  creatorRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  creatorInput: {
    flex: 1, minWidth: 140, background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '10px 12px', borderRadius: 8, fontSize: 15,
  },
  creatorAdd: {
    background: 'var(--accent)', color: '#fff', border: 'none',
    padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  creatorCancel: {
    background: 'none', border: '1px solid var(--border)', color: 'var(--text2)',
    padding: '10px 16px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
  },
}
