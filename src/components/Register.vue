<template>
  <!-- 学生注册 Modal -->
  <dialog id="register" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">学生注册</h3>

      <!-- 学号 / 学生 ID -->
      <label class="input input-bordered mb-3 flex items-center gap-2">
        <input v-model="studentId" type="text" placeholder="学号 (ID)" class="grow" />
      </label>

      <!-- 邮箱 -->
      <label class="input input-bordered mb-3 flex items-center gap-2">
        <input v-model="email" type="email" placeholder="邮箱地址" class="grow" />
      </label>

      <!-- 密码 -->
      <label class="input input-bordered mb-6 flex items-center gap-2">
        <input v-model="password" type="password" placeholder="密码" class="grow" />
      </label>

      <div class="modal-action">
        <form method="dialog" class="space-x-2">
          <button class="btn btn-primary" @click.prevent="onRegister" :disabled="loading">
            {{ loading ? '注册中…' : '注册' }}
          </button>
          <button class="btn btn-ghost">关闭</button>
        </form>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '@/services/api'

const studentId = ref('')
const password = ref('')
const email = ref('')
const loading = ref(false)

/* 暴露 show() 给父组件调起弹窗 */
function show() {
  document.getElementById('register')?.showModal()
}

async function onRegister() {
  loading.value = true
  try {
    await api.post('/api/student/register', {
      id: studentId.value,
      password: password.value,
      email: email.value,
    })
    alert('注册成功，请登录')
    document.getElementById('register')?.close()
    // 可选：清空表单
    studentId.value = password.value = email.value = ''
  } catch (e) {
    alert(e.response?.data?.message || '注册失败')
  } finally {
    loading.value = false
  }
}

/* 对父组件公开方法 */
defineExpose({ show })
</script>
