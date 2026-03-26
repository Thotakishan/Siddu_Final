import { type AxiosError, type AxiosInstance } from 'axios'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../stores/authStore'
import { tokenStorage } from '../auth/tokenStorage'
import { rawHttp } from './client'
import { isRefreshRequest, refreshSession } from './refresh'

export const http: AxiosInstance = rawHttp

let isRefreshing = false
let refreshWaiters: Array<(token: string | null) => void> = []

function notifyError(title: string, message: string) {
  notifications.show({ color: 'red', title, message })
}

http.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken()
  if (accessToken) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  async (err: unknown) => {
    const error = err as AxiosError
    const status = error.response?.status
    const original = error.config

    if (!original || status !== 401) {
      notifyError('Request failed', 'Please try again.')
      return Promise.reject(err)
    }

    if (isRefreshRequest(original)) {
      useAuthStore.getState().clear()
      tokenStorage.clear()
      notifyError('Session expired', 'Please log in again.')
      return Promise.reject(err)
    }

    if (original.headers && 'x-retried' in original.headers) {
      useAuthStore.getState().clear()
      tokenStorage.clear()
      return Promise.reject(err)
    }

    if (isRefreshing) {
      const newToken = await new Promise<string | null>((resolve) => {
        refreshWaiters.push(resolve)
      })
      if (!newToken) return Promise.reject(err)
      original.headers = original.headers ?? {}
      original.headers.Authorization = `Bearer ${newToken}`
      original.headers['x-retried'] = '1'
      return http.request(original)
    }

    isRefreshing = true
    try {
      const refreshed = await refreshSession()
      if (!refreshed) {
        refreshWaiters.forEach((w) => w(null))
        refreshWaiters = []
        useAuthStore.getState().clear()
        tokenStorage.clear()
        return Promise.reject(err)
      }

      refreshWaiters.forEach((w) => w(refreshed.accessToken))
      refreshWaiters = []

      original.headers = original.headers ?? {}
      original.headers.Authorization = `Bearer ${refreshed.accessToken}`
      original.headers['x-retried'] = '1'
      return http.request(original)
    } catch {
      refreshWaiters.forEach((w) => w(null))
      refreshWaiters = []
      useAuthStore.getState().clear()
      tokenStorage.clear()
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  },
)

