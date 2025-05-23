<template>
  <aside class="w-20 bg-base-100 shadow flex flex-col items-center py-4 space-y-6">
    <!-- 主题切换 -->
    <div>
      <label class="swap swap-rotate">
        <input type="checkbox" @change="toggleTheme" :checked="isDark" />
        <!-- Sun icon -->
        <svg
          class="swap-off h-10 w-10 fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"
          />
        </svg>
        <!-- Moon icon -->
        <svg
          class="swap-on h-10 w-10 fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"
          />
        </svg>
      </label>
    </div>

    <!-- 缩放控制 -->
    <div class="flex flex-col items-center space-y-1">
      <button @click="zoomOut" class="btn btn-ghost btn-circle">-</button>
      <span class="text-sm font-medium">{{ zoomPercentage }}</span>
      <button @click="zoomIn" class="btn btn-ghost btn-circle">+</button>
    </div>

    <!-- 功能菜单 -->
    <nav class="flex flex-col items-center space-y-4 mt-auto">
      <button
        @click="$emit('show-relationships')"
        class="btn btn-ghost btn-circle tooltip"
        data-tip="关系"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <!-- chart-bar icon -->
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 3v18m6-4v-8m6 8v-4m6 4V7"
          />
        </svg>
      </button>
      <button
        @click="$emit('show-categories')"
        class="btn btn-ghost btn-circle tooltip"
        data-tip="分类"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <!-- view-grid icon -->
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 3h4a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm10 0h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V5a2 2 0 012-2zm-10 10h4a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2zm10 0h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4a2 2 0 012-2z"
          />
        </svg>
      </button>
      <button
        @click="$emit('show-favorites')"
        class="btn btn-ghost btn-circle tooltip"
        data-tip="收藏"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <!-- star icon -->
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.562 4.823a1 1 0 00.95.69h5.064c.969 0 1.371 1.24.588 1.81l-4.095 2.973a1 1 0 00-.364 1.118l1.562 4.823c.3.921-.755 1.688-1.54 1.118L12 17.347l-4.095 2.973c-.784.57-1.838-.197-1.539-1.118l1.562-4.823a1 1 0 00-.364-1.118L3.47 10.25c-.783-.57-.38-1.81.588-1.81h5.064a1 1 0 00.95-.69l1.562-4.823z"
          />
        </svg>
      </button>
      <button
        @click="$emit('show-assessments')"
        class="btn btn-ghost btn-circle tooltip"
        data-tip="测评"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <!-- clipboard-check icon -->
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5V3a3 3 0 013-3h0a3 3 0 013 3v2m-6 0h6m-7 7l3 3 5-5"
          />
        </svg>
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'update-zoom', scale: number): void
  (e: 'show-relationships'): void
  (e: 'show-categories'): void
  (e: 'show-favorites'): void
  (e: 'show-assessments'): void
}>()

const zoom = ref(100)
const zoomPercentage = computed(() => `${zoom.value}%`)

function zoomIn() {
  zoom.value = Math.min(zoom.value + 10, 200)
  emit('update-zoom', zoom.value / 100)
}

function zoomOut() {
  zoom.value = Math.max(zoom.value - 10, 10)
  emit('update-zoom', zoom.value / 100)
}

const isDark = ref(false)
function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const current = document.documentElement.getAttribute('data-theme')
  isDark.value = current === 'dark'
})
</script>

<style scoped>
/* 根据需要可在此添加自定义样式 */
</style>
