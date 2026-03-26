import { type AuthTokens, type User } from '../types/auth'

type PersistedSession = {
  user: User
  tokens: AuthTokens
}

const STORAGE_KEY = 'ecom_ims_session_v1'

let mem: PersistedSession | null = null

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

function isAuthTokens(value: unknown): value is AuthTokens {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.accessToken === 'string' &&
    typeof v.refreshToken === 'string' &&
    typeof v.expiresAtMs === 'number'
  )
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.email === 'string' &&
    typeof v.role === 'string'
  )
}

function isPersistedSession(value: unknown): value is PersistedSession {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return isUser(v.user) && isAuthTokens(v.tokens)
}

export const tokenStorage = {
  hydrate(): PersistedSession | null {
    if (mem) return mem
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = safeJsonParse(raw)
    if (!isPersistedSession(parsed)) return null
    mem = parsed
    return mem
  },

  setSession(session: PersistedSession, opts: { persist: boolean }) {
    mem = session
    if (opts.persist) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  },

  setTokens(tokens: AuthTokens) {
    if (!mem) return
    mem = { ...mem, tokens }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = safeJsonParse(raw)
    if (!isPersistedSession(parsed)) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, tokens }))
  },

  clear() {
    mem = null
    localStorage.removeItem(STORAGE_KEY)
  },

  getAccessToken(): string | null {
    return mem?.tokens.accessToken ?? null
  },

  getRefreshToken(): string | null {
    return mem?.tokens.refreshToken ?? null
  },
}

