const BASE = '/api'

export async function createUser() {
  const res = await fetch(`${BASE}/users`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to create user')
  return res.json() // { userId }
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
