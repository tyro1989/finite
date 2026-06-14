import { useState, useEffect } from 'react'

const DISMISS_KEY = 'finite_install_dismissed'

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream
}

// Explicit "Add to Home Screen" banner.
// - Android/Chrome: captures `beforeinstallprompt` and triggers the native installer.
// - iOS Safari: shows instructions (iOS has no programmatic install).
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [show, setShow] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem(DISMISS_KEY)) return

    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    // iOS never fires beforeinstallprompt — offer the manual hint instead.
    if (isIOS()) {
      const t = setTimeout(() => setShow(true), 1200)
      return () => { clearTimeout(t); window.removeEventListener('beforeinstallprompt', onPrompt) }
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const dismiss = () => {
    setShow(false)
    setIosHint(false)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  const install = async () => {
    if (deferred) {
      deferred.prompt()
      await deferred.userChoice
      setDeferred(null)
      dismiss()
    } else if (isIOS()) {
      setIosHint(true)
    }
  }

  if (!show) return null

  return (
    <div style={s.bar} role="dialog" aria-label="Install Finite">
      <div style={s.left}>
        <span style={s.icon}>◷</span>
        <div style={s.copy}>
          <span style={s.title}>Add Finite to your home screen</span>
          {iosHint
            ? <span style={s.note}>Tap the Share icon, then “Add to Home Screen”.</span>
            : <span style={s.note}>Open it like a real app — full screen, works offline.</span>}
        </div>
      </div>
      <div style={s.actions}>
        {!iosHint && <button style={s.installBtn} onClick={install}>Install</button>}
        <button style={s.dismissBtn} onClick={dismiss} aria-label="Dismiss">✕</button>
      </div>
    </div>
  )
}

const s = {
  bar: {
    position: 'sticky', top: 0, zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    background: 'var(--text)', color: '#faf9f7',
    padding: 'calc(12px + var(--safe-top)) 16px 12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
  },
  left: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 },
  icon: { fontSize: 22, color: 'var(--accent)', flexShrink: 0 },
  copy: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  title: { fontSize: 15, fontWeight: 600, lineHeight: 1.2 },
  note: { fontSize: 12.5, color: 'rgba(250,249,247,0.7)', lineHeight: 1.3 },
  actions: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  installBtn: {
    background: 'var(--accent)', color: '#1a1a1a', border: 'none',
    padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  dismissBtn: {
    background: 'transparent', color: 'rgba(250,249,247,0.7)', border: 'none',
    fontSize: 16, padding: '6px 8px', cursor: 'pointer', lineHeight: 1,
  },
}
