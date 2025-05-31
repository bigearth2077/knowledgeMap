<template>
  <div class="relative flex min-h-screen">
    <!-- Top navigation + main graph area -->
    <div class="flex-1 flex flex-col">
      <!-- 监听 select-entity 事件 -->
      <StudentTopNav
        @select-entity="onSelectEntity"
        @search-results="onSearchResults"
        class="bg-base-300"
      />
      <main class="flex-1 p-0 flex">
        <!-- 将 selectedEntity 传入 KnowledgeGraph -->
        <KnowledgeGraph
          class="flex-1"
          :zoom="zoom"
          :selectedEntity="selectedEntity"
          :filteredEntities="searchResults"
        />
      </main>
    </div>

    <!-- Floating SideNav -->
    <SideNav
      class="fixed top-60 left-5 z-50 rounded-4xl shadow-md"
      @update-zoom="onZoom"
      @show-relationships="toggleRelations"
      @show-categories="toggleCategories"
      @show-favorites="toggleFavorites"
      @show-assessments="toggleAssessments"
    />

    <transition name="fade">
      <div v-if="panelComponent" class="fixed top-60 left-24">
        <component
          :is="panelComponent"
          class="card bg-base-100 shadow-lg rounded-lg overflow-hidden"
        />
      </div>
    </transition>

    <!-- Floating AI Chat Button -->
    <button
      @click="toggleChat"
      class="btn btn-primary btn-xl btn-circle shadow-lg fixed bottom-8 right-8 z-50 hover:scale-105 transition-transform"
      aria-label="AI 助教"
    >
      <botIcon class="w-10 h-10 rounded-2xl" />
    </button>

    <transition name="slide-fade">
      <div
        v-if="showAssessment"
        class="fixed top-1/2 left-1/2 z-50 transform -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-6xl h-[90vh] bg-base-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <Assessment @close="showAssessment = false" />
      </div>
    </transition>

    <!-- AI Chat Panel -->
    <transition name="slide-fade">
      <div
        v-if="showChat"
        class="fixed top-1/2 left-1/2 z-50 transform -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-6xl h-[90vh] bg-base-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <AiChat @close="showChat = false" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import StudentTopNav from '@/components/student/StudentTopNav.vue'
import KnowledgeGraph from '@/components/graph/KnowledgeGraph.vue'
import SideNav from '@/components/student/StudentSideNav.vue'
import RelationStats from '@/components/student/sideNavComponents/RelationStats.vue'
import CategoryStats from '@/components/student/sideNavComponents/CategoryStats.vue'
import Favorites from '@/components/student/sideNavComponents/Favorites.vue'
import AiChat from '@/components/student/AiChat.vue'
import Assessment from '@/components/student/sideNavComponents/Assessment.vue'
import { Bot as botIcon } from 'lucide-vue-next'
import axios from '@/services/api'

// 缩放状态
const zoom = ref(1)
function onZoom(scale: number) {
  zoom.value = scale
}

const searchResults = ref<string[]>([])
function onSearchResults(list: string[]) {
  searchResults.value = list
}

// 监听并存储选中的实体名称
const selectedEntity = ref<string | null>(null)
function onSelectEntity(entity: string) {
  selectedEntity.value = entity
}

// 面板切换
const activePanel = ref<'relations' | 'categories' | 'favorites' | null>(null)
const showChat = ref(false)
const showAssessment = ref(false)

function toggleRelations() {
  activePanel.value = activePanel.value === 'relations' ? null : 'relations'
}
function toggleCategories() {
  activePanel.value = activePanel.value === 'categories' ? null : 'categories'
}
function toggleFavorites() {
  activePanel.value = activePanel.value === 'favorites' ? null : 'favorites'
}
function toggleChat() {
  showChat.value = !showChat.value
}
function toggleAssessments() {
  showAssessment.value = !showAssessment.value
}

// 决定显示哪个侧边面板
const panelComponent = computed(() => {
  switch (activePanel.value) {
    case 'relations':
      return RelationStats
    case 'categories':
      return CategoryStats
    case 'favorites':
      return Favorites
    default:
      return null
  }
})

// Heartbeat: periodically POST to /api/heartbeat to keep session alive
let heartbeatTimer: number | null = null
async function sendHeartbeat() {
  try {
    await axios.post('/api/heartbeat')
  } catch (err) {
    console.error('[Heartbeat]', err)
  }
}

onMounted(() => {
  // Initial heartbeat
  sendHeartbeat()
  // Repeat every 60 seconds
  heartbeatTimer = window.setInterval(sendHeartbeat, 60000)
})

onBeforeUnmount(() => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.25s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.slide-fade-leave-active {
  transition: all 0.2s ease;
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
