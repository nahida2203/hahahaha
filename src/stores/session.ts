import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getDemoAccountsSync } from '../api/accounts'

const SESSION_KEY = 'funong-mvp.session.v1'
const PROFILE_KEY = 'funong-mvp.profile.v1'

export interface SessionUser {
  id: string
  username: string
  name: string
  role: string
  organization: string | null
  phone: string
}

function readStoredSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionUser
    if (!parsed || !parsed.id || !parsed.username) return null
    const account = getDemoAccountsSync().find((item) => item.username === parsed.username)
    if (!account) return parsed
    const profiles = readStoredProfiles()
    const profile = profiles[account.id] ?? {}
    return {
      id: account.id,
      username: account.username,
      name: profile.name ?? parsed.name ?? account.name,
      role: account.role,
      organization: account.organization,
      phone: profile.phone ?? parsed.phone ?? account.phone,
    }
  } catch {
    return null
  }
}

function readStoredProfiles(): Record<string, Partial<Pick<SessionUser, 'name' | 'phone'>>> {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, Partial<Pick<SessionUser, 'name' | 'phone'>>>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export const useSessionStore = defineStore('session', () => {
  const user = ref<SessionUser | null>(readStoredSession())
  const isAuthenticated = computed(() => user.value !== null)

  function login(username: string, password: string): { ok: boolean; message?: string } {
    const account = getDemoAccountsSync().find((item) => item.username === username.trim())
    if (!account || account.password !== password) {
      return { ok: false, message: '账号或密码错误，请重试' }
    }
    const profile = readStoredProfiles()[account.id] ?? {}
    user.value = {
      id: account.id,
      username: account.username,
      name: profile.name ?? account.name,
      role: account.role,
      organization: account.organization,
      phone: profile.phone ?? account.phone,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(user.value))
    return { ok: true }
  }

  function logout() {
    user.value = null
    localStorage.removeItem(SESSION_KEY)
  }

  function updateProfile(profile: Pick<SessionUser, 'name' | 'phone'>) {
    if (!user.value) return
    const nextProfile = {
      name: profile.name.trim(),
      phone: profile.phone.trim(),
    }
    const profiles = readStoredProfiles()
    profiles[user.value.id] = nextProfile
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles))
    user.value = { ...user.value, ...nextProfile }
    localStorage.setItem(SESSION_KEY, JSON.stringify(user.value))
  }

  return { user, isAuthenticated, login, logout, updateProfile }
})
