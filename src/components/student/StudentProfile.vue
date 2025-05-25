<template>
  <div class="max-w-2xl mx-auto p-4">
    <!-- Loading 状态 -->
    <div v-if="!profile" class="flex justify-center items-center py-10">
      <span class="loading loading-spinner text-primary text-4xl"></span>
    </div>

    <!-- 资料表单 -->
    <div v-else class="card bg-base-100">
      <div class="card-body">
        <h2 class="card-title">个人资料</h2>
        <form @submit.prevent="saveProfile" class="space-y-4">
          <!-- 姓名 -->
          <div>
            <label class="label">
              <span class="label-text">姓名</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="请输入姓名"
              class="input input-bordered w-full"
              required
            />
          </div>

          <!-- 专业 -->
          <div>
            <label class="label">
              <span class="label-text">专业</span>
            </label>
            <input
              v-model="form.major"
              type="text"
              placeholder="请输入专业"
              class="input input-bordered w-full"
              required
            />
          </div>

          <!-- 班级代号 -->
          <div>
            <label class="label">
              <span class="label-text">班级代号</span>
            </label>
            <input
              v-model="form.classCode"
              type="text"
              placeholder="请输入班级代号"
              class="input input-bordered w-full"
              @change="onClassCodeChange"
              required
            />
            <p v-if="showClassWarning" class="text-warning text-sm mt-1">
              ⚠️ 更改班级代号将会加入新的班级，是否确认？
            </p>
          </div>

          <!-- 班级名称（只读） -->
          <div>
            <label class="label">
              <span class="label-text">班级名称</span>
            </label>
            <input
              :value="profile.classes.className"
              type="text"
              class="input input-bordered w-full bg-base-200"
              disabled
            />
          </div>

          <!-- 邮箱 -->
          <div>
            <label class="label">
              <span class="label-text">邮箱</span>
            </label>
            <input
              v-model="form.email"
              type="email"
              placeholder="请输入邮箱"
              class="input input-bordered w-full"
              required
            />
          </div>

          <!-- 保存按钮 -->
          <div class="card-actions justify-end">
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from '@/services/api'

/** 接口返回的完整 profile */
const profile = ref(null)

/** 表单数据 */
const form = reactive({
  name: '',
  major: '',
  classCode: '',
  email: '',
})

/** 用于对比是否修改过班级代号 */
const originalClassCode = ref('')

/** 是否展示修改班级代号时的警告文字 */
const showClassWarning = ref(false)

/** 拉取学生信息 */
const fetchProfile = async () => {
  try {
    const { data } = await axios.get('/api/student')
    profile.value = data
    form.name = data.name
    form.major = data.major
    form.classCode = data.classes.classCode
    form.email = data.email
    originalClassCode.value = data.classes.classCode
  } catch (err) {
    console.error(err)
    // 也可以考虑全局通知组件提示错误
  }
}

/** 检测班级代号变化以展示警告 */
const onClassCodeChange = () => {
  showClassWarning.value = form.classCode.trim() !== originalClassCode.value.trim()
}

/** 提交保存 */
const saveProfile = async () => {
  // 如果修改了班级代号，弹确认框
  if (form.classCode.trim() !== originalClassCode.value.trim()) {
    const ok = window.confirm('⚠️ 您确定要更改班级代号吗？此操作会将您加入新的班级。')
    if (!ok) {
      // 用户取消则恢复原值并退出
      form.classCode = originalClassCode.value
      showClassWarning.value = false
      return
    }
  }

  try {
    await axios.put('/api/student', {
      name: form.name,
      major: form.major,
      classCode: form.classCode,
      email: form.email,
    })
    // 保存后重新拉取并更新原始值
    await fetchProfile()
    alert('✅ 保存成功')
  } catch (err) {
    console.error(err)
    alert('❌ 保存失败，请重试')
  }
}

onMounted(fetchProfile)
</script>

<style scoped>
/* 如需覆盖 daisyUI 样式，可在此新增 */
</style>
