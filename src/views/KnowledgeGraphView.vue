<template>
  <div class="w-full h-full">
    <KnowledgeGraph
      v-if="graphStore.graphData"
      :zoom="graphStore.zoom"
      :selectedEntity="selectedEntity"
      :filteredEntities="filteredEntities"
      @open-details="handleOpenDetails"
    />
    <div v-else class="flex items-center justify-center h-full">
      <el-empty description="加载中..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import KnowledgeGraph from '@/components/graph/KnowledgeGraph.vue'
import { useGraphStore } from '@/stores/graphStore'

const graphStore = useGraphStore()
const selectedEntity = ref<string | null>(null)
const filteredEntities = ref<string[]>([])

// 处理实体详情打开
const handleOpenDetails = (entity: string) => {
  selectedEntity.value = entity
}

// 确保数据加载
const initData = async () => {
  if (!graphStore.graphData) {
    await graphStore.fetchGraph()
  }
}

// 组件挂载时初始化数据
onMounted(() => {
  initData()
})

// 监听数据变化时重新加载
watch(
  () => graphStore.graphData,
  (newData) => {
    if (!newData) {
      initData()
    }
  },
)
</script>
