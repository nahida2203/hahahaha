import { defineStore } from 'pinia'

export type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'funong-mvp.theme.v1'

function readTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'
  return window.localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
}

function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: readTheme() as ThemeMode,
  }),
  getters: {
    isLight: (state) => state.mode === 'light',
  },
  actions: {
    initialize(): void {
      this.mode = readTheme()
      applyTheme(this.mode)
    },
    setMode(mode: ThemeMode): void {
      this.mode = mode
      applyTheme(mode)
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, mode)
    },
    toggle(): void {
      this.setMode(this.mode === 'dark' ? 'light' : 'dark')
    },
  },
})
