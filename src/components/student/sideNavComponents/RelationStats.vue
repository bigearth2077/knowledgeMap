<template>
  <div class="card bg-base-100 shadow-md w-full">
    <div class="card-body">
      <h3 class="card-title">关系分布</h3>
      <ul class="space-y-2">
        <li
          v-for="(count, predicate) in relationCounts"
          :key="predicate"
          class="flex justify-between items-center"
        >
          <span>{{ predicate }}</span>
          <span class="badge badge-primary">{{ count }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useGraphStore } from '@/stores/graphStore'

const graphStore = useGraphStore()

// 确保数据已加载
onMounted(() => {
  if (!graphStore.graphData) {
    graphStore.fetchGraph()
  }
})

// 计算每种关系的数量
const relationCounts = computed(() => {
  const map = new Map<string, number>()
  graphStore.graphData?.relations.forEach((r) => {
    map.set(r.predicate, (map.get(r.predicate) || 0) + 1)
  })
  return Object.fromEntries(map)
})
</script>
