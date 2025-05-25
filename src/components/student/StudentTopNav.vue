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
      <button class="btn btn-outline btn-primary">学习仪表盘</button>

      <!-- 搜索框 -->
      <div class="relative">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="搜索实体名称"
          class="input input-bordered w-70"
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
          <li><a>学习记录</a></li>
          <li><a>设置</a></li>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import StudentProfile from '@/components/student/StudentProfile.vue'

const emit = defineEmits<{
  (e: 'select-entity', entity: string): void
  (e: 'search-results', list: string[]): void
}>()

// 本地搜索关键词
const searchTerm = ref('')
// 控制结果列表显示
const openResults = ref(false)
// 引入 Pinia store，获取全局图数据
const graphStore = useGraphStore()

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
</script>

<style scoped>
/* 可根据需要添加其他样式 */
</style>
