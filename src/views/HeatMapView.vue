<template>
  <div class="w-full h-full">
    <HeatMap
      v-if="graphStore.graphData"
      :entities="graphStore.graphData.entities"
      :zoom="graphStore.zoom"
    />
    <div v-else class="flex items-center justify-center h-full">
      <el-empty description="加载中..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import HeatMap from '@/components/graph/HeatMap.vue'
import { useGraphStore } from '@/stores/graphStore'

const graphStore = useGraphStore()

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

// 监听路由变化时重新加载数据
watch(
  () => graphStore.graphData,
  (newData) => {
    if (!newData) {
      initData()
    }
  },
)
</script>
