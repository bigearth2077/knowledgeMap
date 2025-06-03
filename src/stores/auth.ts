// src/stores/auth.ts
import { defineStore } from 'pinia'
import { api } from '../services/api'
import qs from 'qs'

export interface AuthState {
  userRole: 'student' | 'teacher' | null
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
}

export interface AuthActions {
  login(role: 'student' | 'teacher', creds: { username: string; password: string }): Promise<void>
  logout(): void
  updateTokens(payload: { access_token?: string; refresh_token?: string }): void
}

export const useAuthStore = defineStore<'auth', AuthState, {}, AuthActions>('auth', {
  state: (): AuthState => ({
    userRole: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  }),
  actions: {
    async login(role, creds) {
      const url = role === 'student' ? '/api/student/login' : '/api/teacher/login'

      const form = qs.stringify({
        username: creds.username,
        password: creds.password,
      })

      const { data } = await api.post(url, form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      this.$patch({
        userRole: role,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + 1000 * 60 * 55, // 55 分钟后过期
      })
    },

    logout() {
      this.$reset()
    },

    updateTokens(payload) {
      if (payload.access_token) {
        this.accessToken = payload.access_token
      }
      if (payload.refresh_token) {
        this.refreshToken = payload.refresh_token
      }
      // 刷新成功后，重置过期时间
      this.expiresAt = Date.now() + 1000 * 60 * 55
    },
  },
})
