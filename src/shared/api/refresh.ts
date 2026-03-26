import { tokenStorage } from '../auth/tokenStorage'
import { useAuthStore } from '../stores/authStore'
import { type AuthTokens, type User } from '../types/auth'
import { rawHttp } from './client'

type RefreshResponse = { user: User; tokens: AuthTokens }

export function isRefreshRequest(config: { url?: string }): boolean {
  return (config.url ?? '').includes('/auth/refresh')
}

export async function refreshSession(): Promise<AuthTokens | null> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) return null

  const res = await rawHttp.post<RefreshResponse>('/auth/refresh', { refreshToken })
  const next = res.data
  tokenStorage.setTokens(next.tokens)
  useAuthStore.getState().setSession(next)
  return next.tokens
}

