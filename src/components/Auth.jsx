import { useState } from 'react'
import { register, login } from '../api'

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = mode === 'login'
        ? await login(email, passphrase)
        : await register(email, passphrase)
      onAuth(result.userId)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <h1 style={s.brand}>Finite</h1>
        <p style={s.subtitle}>Your life in weeks</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <h2 style={s.title}>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={s.input}
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Passphrase"
            value={passphrase}
            onChange={e => setPassphrase(e.target.value)}
            style={s.input}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={4}
            required
          />

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          style={s.toggle}
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
        >
          {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}

export function LinkAccount({ userId, onLinked }) {
  const [email, setEmail] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { linkAccount } = await import('../api')
      await linkAccount(userId, email, passphrase)
      setDone(true)
      if (onLinked) onLinked(email)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={s.linkCard}>
        <p style={s.linkDone}>Account linked to {email}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={s.linkCard}>
      <p style={s.linkTitle}>Link your account to access from any device</p>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={s.input}
        required
      />
      <input
        type="password"
        placeholder="Choose a passphrase (4+ chars)"
        value={passphrase}
        onChange={e => setPassphrase(e.target.value)}
        style={s.input}
        minLength={4}
        required
      />
      {error && <p style={s.error}>{error}</p>}
      <button type="submit" style={s.linkBtn} disabled={loading}>
        {loading ? '...' : 'Link account'}
      </button>
    </form>
  )
}

const s = {
  page: {
    minHeight: '100vh', background: 'var(--bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
  },
  container: {
    maxWidth: 360, width: '100%', textAlign: 'center',
    display: 'flex', flexDirection: 'column', gap: 24,
  },
  brand: {
    fontFamily: 'var(--font-serif)', fontSize: 36, color: 'var(--accent)',
    fontWeight: 400, margin: 0,
  },
  subtitle: {
    fontSize: 15, color: 'var(--text3)', margin: '-12px 0 0',
  },
  form: {
    display: 'flex', flexDirection: 'column', gap: 12,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '24px 20px',
  },
  title: {
    fontSize: 18, fontWeight: 500, color: 'var(--text)', margin: '0 0 4px',
  },
  input: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '12px 16px', borderRadius: 8,
    fontSize: 16, outline: 'none', width: '100%',
  },
  error: {
    fontSize: 14, color: 'var(--danger)', margin: 0,
  },
  btn: {
    background: 'var(--accent)', border: 'none', color: '#fff',
    padding: '12px', borderRadius: 8, fontSize: 15, fontWeight: 600,
    cursor: 'pointer', marginTop: 4,
  },
  toggle: {
    background: 'none', border: 'none', color: 'var(--text2)',
    fontSize: 14, cursor: 'pointer', padding: 8,
  },

  // Link account (inline)
  linkCard: {
    display: 'flex', flexDirection: 'column', gap: 10,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '16px',
  },
  linkTitle: {
    fontSize: 14, color: 'var(--text2)', margin: 0, fontWeight: 500,
  },
  linkBtn: {
    background: 'var(--accent)', border: 'none', color: '#fff',
    padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 500,
    cursor: 'pointer',
  },
  linkDone: {
    fontSize: 14, color: 'var(--success)', margin: 0, fontWeight: 500,
  },
}
