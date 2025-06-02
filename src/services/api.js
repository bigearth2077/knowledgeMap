import axios from 'axios'
import { useAuthStore } from '../stores/auth'

export const api = axios.create({
  baseURL: '/',
  timeout: 100_000,
})

// 请求拦截：自动带上 access-token
api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) config.headers.Authorization = `Bearer ${auth.accessToken}`

  // 若距离过期 ≤ 1 分钟，先行刷新
  if (auth.refreshToken && Date.now() > auth.expiresAt - 60_000) {
    return refreshAndReplay(config)
  }
  return config
})

// 响应拦截：401 时刷新后重放
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error
    if (response?.status === 401 && !config._retry) {
      config._retry = true
      try {
        await refreshTokens()
        return api(config) // 重放原请求
      } catch (e) {
        useAuthStore().logout()
      }
    }
    return Promise.reject(error)
  },
)

// 辅助函数
async function refreshTokens() {
  const auth = useAuthStore()

  // 发送纯字符串格式的 refresh token
  const { data } = await axios.post(
    '/api/refresh',
    // JSON.stringify 直接发送纯字符串
    JSON.stringify(auth.refreshToken),
    {
      headers: {
        'Content-Type': 'application/json', // 保持 Content-Type 不变
      },
    },
  )

  // 只更新 access token（后端不会返回新的 refresh token）
  auth.updateTokens({
    access_token: data.access_token,
    // 保留原有 refresh token（不需要更新）
  })
}

async function refreshAndReplay(originalConfig) {
  await refreshTokens()
  return api(originalConfig)
}

export default api
