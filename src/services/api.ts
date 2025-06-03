// api.ts
import axios from 'axios'
import { useAuthStore } from '../stores/auth'

/**
 * 注意：为了避免并发刷新，这里加了一个简单的刷新锁。如果你不需要并发控制，可以去掉相关逻辑，
 *      只保留基本的 refreshTokens 即可。
 */

// 刷新锁相关
let isRefreshing = false
let refreshSubscribers: Array<() => void> = []

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb())
  refreshSubscribers = []
}

function addRefreshSubscriber(cb: () => void) {
  refreshSubscribers.push(cb)
}

// 创建 axios 实例
export const api = axios.create({
  baseURL: '/',
  timeout: 100_000,
})

// 请求拦截：只负责在 Header 加上最新的 access token
api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

// 响应拦截：遇到 401 或 500（后端 token 失效返回 500）的情况，先刷新 Token 再重试
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error
    const auth = useAuthStore()

    // 如果没拿到 response 或者已经重试过，就直接抛错
    if (!response || config._retry) {
      return Promise.reject(error)
    }

    // 只有 401 或 500 状态码才尝试刷新
    if (response.status === 401 || response.status === 500) {
      config._retry = true

      try {
        // 如果已有一次刷新在进行，则等待那次刷新结束
        if (isRefreshing) {
          await new Promise<void>((resolve, reject) => {
            addRefreshSubscriber(() => {
              // 刷新完成后直接 resolve，让当前请求继续
              resolve()
            })
          })
        } else {
          // 开始新的刷新操作
          isRefreshing = true
          await refreshTokens()
          isRefreshing = false
          onRefreshed()
        }

        // 刷新成功后，accessToken 已更新，重新设置 Header 并重放原请求
        config.headers.Authorization = `Bearer ${auth.accessToken}`
        return api(config)
      } catch (e) {
        // 刷新失败，退出登录
        auth.logout()
        return Promise.reject(e)
      }
    }

    return Promise.reject(error)
  },
)

// 真正发起 refresh 请求并更新 store 中的 token
async function refreshTokens() {
  const auth = useAuthStore()

  // 注意：这里把 refreshToken 放到 Authorization 头里，并且 body 只传 refreshToken 的字符串
  const { data } = await axios.post('/api/refresh', JSON.stringify(auth.refreshToken), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.refreshToken}`,
    },
  })

  // 假设后端返回 { access_token: 'xxx' }
  auth.updateTokens({
    access_token: data.access_token,
  })
}

export default api
