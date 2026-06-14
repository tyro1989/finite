// Shared life themes used by both "Your Life" (memories) and "This Week"
// (focus + reflection). Users can extend this set with their own custom themes,
// which are persisted in app state as { value, label, icon }.

export const BASE_THEMES = [
  { value: 'family',        label: 'Family',        icon: '♡' },
  { value: 'relationships', label: 'Relationships', icon: '⚭' },
  { value: 'career',        label: 'Career',        icon: '◆' },
  { value: 'health',        label: 'Health',        icon: '✛' },
  { value: 'travel',        label: 'Travel',        icon: '✈' },
  { value: 'growth',        label: 'Growth',        icon: '↑' },
  { value: 'other',         label: 'Other',         icon: '•' },
]

// A small palette of icons offered when creating a custom theme.
export const THEME_ICONS = ['★', '✦', '✿', '☼', '⚑', '♫', '⚙', '✎', '⛰', '◎', '❤', '☕']

// Merge base + custom themes. Custom themes are inserted before "Other".
export function getAllThemes(customThemes = []) {
  const base = BASE_THEMES.filter(t => t.value !== 'other')
  const other = BASE_THEMES.find(t => t.value === 'other')
  return [...base, ...customThemes, other]
}

export function themeMeta(value, customThemes = []) {
  const all = getAllThemes(customThemes)
  return all.find(t => t.value === value) || all[all.length - 1]
}

// Turn a free-text label into a stable slug for `value`.
export function slugifyTheme(label) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
