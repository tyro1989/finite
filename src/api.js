const BASE = '/api'

export async function register(email, passphrase) {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, passphrase }),
  })
  if (res.status === 409) throw new Error('Email already registered')
  if (!res.ok) throw new Error('Registration failed')
  return res.json()
}

export async function login(email, passphrase) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, passphrase }),
  })
  if (res.status === 401) {
    const data = await res.json()
    throw new Error(data.error)
  }
  if (!res.ok) throw new Error('Login failed')
  return res.json()
}

export async function linkAccount(userId, email, passphrase) {
  const res = await fetch(`${BASE}/users/${userId}/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, passphrase }),
  })
  if (res.status === 409) throw new Error('Email already in use')
  if (!res.ok) throw new Error('Failed to link account')
  return res.json()
}

export async function createUser() {
  const res = await fetch(`${BASE}/users`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to create user')
  return res.json()
}

export async function loadUser(userId) {
  const res = await fetch(`${BASE}/users/${userId}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to load user')
  return res.json()
}

export async function saveUser(userId, state) {
  const res = await fetch(`${BASE}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  })
  if (!res.ok) throw new Error('Failed to save')
}
