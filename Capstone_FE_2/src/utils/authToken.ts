type JwtPayload = Record<string, unknown>

function isAdminRoleValue(role?: string): boolean {
  if (!role) return false
  const normalized = role.trim().toLowerCase()
  return (
    normalized === 'admin' ||
    normalized === 'administrator' ||
    normalized.includes('admin')
  )
}

function extractRoleFromPayload(payload: JwtPayload | null): string {
  if (!payload) return ''

  const directKeys = [
    'role',
    'Role',
    'roles',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role',
  ]

  for (const key of directKeys) {
    const value = payload[key]
    if (typeof value === 'string') return value.toLowerCase()
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0].toLowerCase()
  }

  // Fallback for unknown claim names that still contain "role".
  for (const [key, value] of Object.entries(payload)) {
    if (!key.toLowerCase().includes('role')) continue
    if (typeof value === 'string') return value.toLowerCase()
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0].toLowerCase()
  }

  return ''
}

export function decodeJwtPayload(token?: string): JwtPayload | null {
  if (!token) return null

  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return JSON.parse(atob(padded)) as JwtPayload
  } catch {
    return null
  }
}

export function getRoleFromAccessToken(accessToken?: string): string {
  return extractRoleFromPayload(decodeJwtPayload(accessToken))
}

export function isTokenExpired(accessToken?: string): boolean {
  const payload = decodeJwtPayload(accessToken)
  const exp = payload?.exp
  if (typeof exp !== 'number') return false

  const nowInSeconds = Math.floor(Date.now() / 1000)
  return exp <= nowInSeconds
}

export function getTokenFromCookie(): string {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : ''
}

export function getTokenFromPersistedStore(): string {
  try {
    const raw = localStorage.getItem('fastfix-auth-storage')
    if (!raw) return ''

    const parsed = JSON.parse(raw) as { state?: { token?: string } }
    return parsed?.state?.token || ''
  } catch {
    return ''
  }
}

export function getRoleFromPersistedStore(): string {
  try {
    const raw = localStorage.getItem('fastfix-auth-storage')
    if (!raw) return ''

    const parsed = JSON.parse(raw) as { state?: { user?: { role?: string } } }
    return parsed?.state?.user?.role?.toLowerCase?.() || ''
  } catch {
    return ''
  }
}

export function getAnyAccessToken(): string {
  const accessToken = localStorage.getItem('accessToken') || ''
  const legacyToken = localStorage.getItem('fastfix_token') || ''
  const persistedToken = getTokenFromPersistedStore()
  const persistedRole = getRoleFromPersistedStore()
  const cookieToken = getTokenFromCookie()

  // For admin flows, prefer the persisted admin token first.
  if (persistedRole === 'admin' && persistedToken && !isTokenExpired(persistedToken)) {
    return persistedToken
  }

  return accessToken || legacyToken || persistedToken || cookieToken || ''
}

export function isAdminAccessToken(accessToken?: string): boolean {
  if (!accessToken || isTokenExpired(accessToken)) return false

  const tokenRole = getRoleFromAccessToken(accessToken)
  if (tokenRole) return isAdminRoleValue(tokenRole)

  // Fallback for backends returning role outside JWT payload.
  return isAdminRoleValue(getRoleFromPersistedStore())
}
