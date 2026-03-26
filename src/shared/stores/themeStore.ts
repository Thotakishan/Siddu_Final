import { create } from 'zustand'

export type AppColorScheme = 'light' | 'dark'

type ThemeState = {
  colorScheme: AppColorScheme
  toggle: () => void
  set: (scheme: AppColorScheme) => void
  hydrate: () => void
}

const STORAGE_KEY = 'ecom_ims_color_scheme'

function isAppColorScheme(value: unknown): value is AppColorScheme {
  return value === 'light' || value === 'dark'
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  colorScheme: 'light',
  toggle: () => {
    const next: AppColorScheme = get().colorScheme === 'light' ? 'dark' : 'light'
    set({ colorScheme: next })
    localStorage.setItem(STORAGE_KEY, next)
  },
  set: (scheme) => {
    set({ colorScheme: scheme })
    localStorage.setItem(STORAGE_KEY, scheme)
  },
  hydrate: () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isAppColorScheme(saved)) set({ colorScheme: saved })
  },
}))

