<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import Register from '@/components/Register.vue'

const role = ref('student') // 默认学生
const username = ref('')
const userId = ref('')
const password = ref('')
const email = ref('')
const newPwd = ref('')
const code = ref('')
const auth = useAuthStore()
const router = useRouter()
const loading = ref(false)
const errorMsg = ref('')

/* 状态 */
const verified = ref(false) // ✔️ 邮箱验证码通过？
const loadingVerify = ref(false) // 验证按钮 Loading
const loadingChange = ref(false) // 提交按钮 Loading

const registerRef = ref(null) // ← ② ref
function openRegister() {
  registerRef.value?.show()
}

async function onLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.login(role.value, { username: username.value, password: password.value })
    router.push({ name: role.value })
  } catch (e) {
    errorMsg.value = e.response?.data?.message || '登录失败'
  } finally {
    loading.value = false
  }
}

/* 发送验证码（若接口仍是 sendCode，请按需改名） */
async function sendCode() {
  try {
    await api.post('/api/user/sendCode', { email: email.value })
    alert('验证码已发送，请查收')
  } catch (e) {
    const status = e.response?.status
    if (status === 429) alert('发送过于频繁，请稍后再试')
    else if (status === 400) alert('邮箱未注册')
    else alert('发送失败')
  }
}

/* ① 验证邮箱验证码 */
async function verify() {
  loadingVerify.value = true
  try {
    await api.post('/api/user/verifyCode', {
      email: email.value,
      code: code.value,
    })
    verified.value = true
    alert('邮箱验证成功，请输入新密码')
  } catch (e) {
    alert('验证码错误或已过期')
  } finally {
    loadingVerify.value = false
  }
}

/* ② 验证通过后才能修改密码 */
async function changePwd() {
  if (!verified.value) return

  loadingChange.value = true
  try {
    await api.put('/api/user/password', {
      id: userId.value, // ★ 后端要求 id 字段
      password: newPwd.value,
    })
    alert('密码已修改，请重新登录')
    verified.value = false // 重置流程
    // forgot.close()  // 如果想自动关闭弹窗
  } catch (e) {
    const status = e.response?.status
    if (status === 404) alert('用户不存在')
    else alert('修改失败，请稍后再试')
  } finally {
    loadingChange.value = false
  }
}
</script>

<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content flex-col">
      <h1 class="text-3xl font-bold mb-4">教/学平台登录</h1>

      <!-- 角色切换 -->
      <div role="tablist" class="tabs tabs-boxed join mb-4">
        <a
          role="tab"
          class="tab join-item"
          :class="{ 'tab-active': role === 'student' }"
          @click="role = 'student'"
          >学生</a
        >
        <a
          role="tab"
          class="tab join-item"
          :class="{ 'tab-active': role === 'teacher' }"
          @click="role = 'teacher'"
          >教师</a
        >
      </div>

      <!-- 表单 -->
      <div class="card w-96 bg-base-100 shadow-xl">
        <div class="card-body">
          <form @submit.prevent="onLogin" class="space-y-3">
            <label class="input input-bordered flex items-center gap-2 w-full">
              <input v-model="username" type="text" placeholder="用户名" class="grow" required />
            </label>
            <label class="input input-bordered flex items-center gap-2 w-full">
              <input v-model="password" type="password" placeholder="密码" class="grow" required />
            </label>

            <button class="btn btn-primary w-full" :disabled="loading">
              {{ loading ? '登录中…' : '登录' }}
            </button>
          </form>

          <div v-if="errorMsg" class="text-error mt-2">{{ errorMsg }}</div>
          <div class="text-sm mt-2 flex justify-between">
            <a class="link link-primary" href="#" onclick="forgot.showModal()">忘记密码？</a>
            <a
              v-if="role === 'student'"
              class="link link-secondary"
              href="#"
              @click.prevent="openRegister"
              >注册</a
            >
          </div>
          <!-- 挂载注册组件 -->
          <Register ref="registerRef" />
        </div>
      </div>
    </div>
  </div>

  <!-- 修改密码 Modal -->
  <dialog id="forgot" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-2">修改密码</h3>

      <!-- 用户 ID -->
      <label class="input input-bordered mb-2 flex items-center gap-2">
        <input v-model="userId" type="text" placeholder="用户 ID" class="grow" />
      </label>

      <!-- 邮箱 + 获取验证码 -->
      <label class="input input-bordered mb-2 flex items-center gap-2">
        <input v-model="email" type="email" placeholder="邮箱地址" class="grow" />
        <button class="btn btn-sm" @click="sendCode">获取验证码</button>
      </label>

      <!-- 验证码 -->
      <label class="input input-bordered mb-4 flex items-center gap-2">
        <input v-model="code" type="text" maxlength="6" placeholder="验证码" class="grow" />
        <button class="btn btn-sm" :disabled="loadingVerify" @click="verify">
          {{ loadingVerify ? '验证中…' : '验证' }}
        </button>
      </label>

      <!-- 新密码（只有 verified 后才显示） -->
      <template v-if="verified">
        <label class="input input-bordered mb-4 flex items-center gap-2">
          <input v-model="newPwd" type="password" placeholder="新密码" class="grow" />
        </label>
      </template>

      <!-- 操作按钮 -->
      <div class="modal-action">
        <form method="dialog" class="space-x-2">
          <button class="btn" :disabled="!verified || loadingChange" @click="changePwd">
            {{ loadingChange ? '提交中…' : '提交' }}
          </button>
          <button class="btn btn-ghost">关闭</button>
        </form>
      </div>
    </div>
  </dialog>
</template>
