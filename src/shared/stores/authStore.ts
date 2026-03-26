import { create } from 'zustand'
import { type AuthTokens, type User } from '../types/auth'

type AuthState = {
  user: User | null
  tokens: AuthTokens | null
  setSession: (args: { user: User; tokens: AuthTokens }) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  setSession: ({ user, tokens }) => set({ user, tokens }),
  clear: () => set({ user: null, tokens: null }),
}))

