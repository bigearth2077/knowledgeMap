import { defineStore } from 'pinia'
import { api } from '../services/api'
import qs from 'qs'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userRole: null, // 'student' | 'teacher'
    accessToken: null,
    refreshToken: null,
    expiresAt: null, // unix ms
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
        expiresAt: Date.now() + 1000 * 60 * 55,
      })
    },
    logout() {
      this.$reset()
    },
    updateTokens({ access_token, refresh_token }) {
      this.accessToken = access_token
      this.refreshToken = refresh_token
      this.expiresAt = Date.now() + 1000 * 60 * 55
    },
  },
  persist: true, // 若用 pinia-plugin-persist
})
