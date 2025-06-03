<template>
  <!-- Top navigation bar -->
  <div class="navbar bg-base-100 shadow relative">
    <!-- 左侧：logo / 标题占位 -->
    <div class="navbar-start">
      <a class="btn btn-ghost text-xl">Student&nbsp;Portal</a>
    </div>

    <!-- 右侧控件 -->
    <div class="navbar-end gap-4 flex items-center">
      <!-- 学习仪表盘按钮 -->
      <button class="btn btn-outline btn-primary" @click="onToggleView">
        {{ buttonLabel }}
      </button>

      <!-- 搜索框 -->
      <div class="relative">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="搜索实体名称"
          class="input input-bordered w-70"
          :disabled="props.viewMode === 'heatmap'"
          @input="onSearch"
          @focus="openResults = true"
          @blur="onBlur"
        />
        <!-- 下拉结果列表 -->
        <ul
          v-if="openResults"
          class="absolute bg-base-100 border border-base-300 rounded shadow-lg w-full mt-1 max-h-60 overflow-auto z-50"
        >
          <!-- 无匹配提示 -->
          <li
            v-if="!filteredResults.length && searchTerm.trim()"
            class="p-2 text-center text-gray-500"
          >
            没有匹配的结果哦
          </li>
          <!-- 匹配结果 -->
          <li
            v-for="item in filteredResults"
            :key="item.entity"
            class="p-2 cursor-pointer hover:bg-base-200 flex justify-between items-center"
            @mousedown.prevent="selectEntity(item.entity)"
          >
            <span>{{ item.entity }}</span>
            <span :class="['badge', getBadgeClass(item.category), 'text-xs']">
              {{ item.category }}
            </span>
          </li>
        </ul>
      </div>

      <!-- "我的" 下拉菜单 -->
      <details class="dropdown dropdown-end">
        <summary class="btn">我的</summary>
        <ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
          <li><button @click="openProfileModal">个人资料</button></li>
          <li><button @click="openStudyRecord">学习记录</button></li>
          <li><button @click="onLogout">登出</button></li>
        </ul>
      </details>
    </div>

    <!-- 个人资料模态框 -->
    <teleport to="body">
      <div
        class="modal"
        :class="{ 'modal-open': showProfileModal }"
        @click.self="closeProfileModal"
      >
        <div class="modal-box relative">
          <button class="btn btn-sm btn-circle absolute right-2 top-2" @click="closeProfileModal">
            ✕
          </button>
          <StudentProfile />
        </div>
      </div>
    </teleport>

    <!-- 学习记录模态框 -->
    <teleport to="body">
      <div
        class="modal"
        :class="{ 'modal-open': showStudyRecordModal }"
        @click.self="closeStudyRecord"
      >
        <div class="modal-box max-w-5xl w-full relative">
          <button class="btn btn-sm btn-circle absolute right-2 top-2" @click="closeStudyRecord">
            ✕
          </button>
          <StudentStudyRecord />
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGraphStore } from '@/stores/graphStore'

import StudentProfile from '@/components/student/StudentProfile.vue'
import StudentStudyRecord from '@/components/student/StudentStudyRecord.vue'

// 定义接收父组件传来的 prop：
const props = defineProps<{
  /** 当前视图模式：'knowledge'（知识图谱） 或 'heatmap'（热力图） */
  viewMode: 'knowledge' | 'heatmap'
}>()

const emit = defineEmits<{
  /** 点击切换视图时触发，由父组件来切换 viewMode */
  (e: 'toggle-view'): void
  (e: 'select-entity', entity: string): void
  (e: 'search-results', list: string[]): void
}>()

// 本地搜索关键词
const searchTerm = ref('')
// 控制结果列表显示
const openResults = ref(false)
// 引入 Pinia store，获取全局图数据
const graphStore = useGraphStore()

// 引入 authStore 和 router
const authStore = useAuthStore()
const router = useRouter()

// 根据 prop.viewMode 计算按钮要显示的文字
const buttonLabel = computed(() => {
  return props.viewMode === 'knowledge' ? '知识图谱' : '热力图'
})

// 点击按钮时，派发 toggle-view，让父组件去真正切换
function onToggleView() {
  emit('toggle-view')
}

// Badge 颜色映射
const badgeClassMap: Record<string, string> = {
  概念: 'badge-primary',
  实战案例: 'badge-success',
  教材: 'badge-warning',
  论文: 'badge-error',
  实际应用: 'badge-info',
  算法与方法: 'badge-warning',
}

// 根据类别返回 badge 样式
function getBadgeClass(category: string): string {
  return badgeClassMap[category] || 'badge-accent'
}

// 模糊匹配实体名称，最多显示 10 条
const filteredResults = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term || !graphStore.graphData) return []
  return graphStore.graphData.entities
    .filter((e) => e.entity.toLowerCase().includes(term))
    .slice(0, 10)
})

function onSearch() {
  openResults.value = true
  const names = filteredResults.value.map((item) => item.entity)
  emit('search-results', names)
}

// 解决点击选项时 blur 导致列表先隐藏的问题
function onBlur() {
  setTimeout(() => {
    openResults.value = false
  }, 100)
}

// 选择实体，发射事件，并清空搜索
function selectEntity(entity: string) {
  emit('select-entity', entity)
  searchTerm.value = ''
  openResults.value = false
}

// Profile Modal 控制
const showProfileModal = ref(false)
function openProfileModal() {
  showProfileModal.value = true
}
function closeProfileModal() {
  showProfileModal.value = false
}

// Study Record Modal 控制
const showStudyRecordModal = ref(false)
function openStudyRecord() {
  showStudyRecordModal.value = true
}
function closeStudyRecord() {
  showStudyRecordModal.value = false
}

// 登出
function onLogout() {
  authStore.logout()
  // 登出后跳转到登录页
  router.push('/')
}
</script>

<style scoped>
/* 可根据需要添加其他样式 */
</style>
