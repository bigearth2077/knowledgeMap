<template>
  <div class="flex flex-col min-h-screen">
    <!-- Top navigation -->
    <StudentTopNav />

    <!-- Main content -->
    <main class="flex-1 p-0 flex flex-col">
      <!-- 知识图谱可视化组件 -->
      <div class="flex-1">
        <KnowledgeGraph class="flex-1" />
      </div>
      <!-- 如果将来还需配合其他页面，可启用 router-view -->
      <!-- <router-view /> -->
    </main>
  </div>
</template>

<script setup lang="ts">
// Adjust import paths according to your project structure
import StudentTopNav from '@/components/student/StudentTopNav.vue'
import KnowledgeGraph from '@/components/graph/KnowledgeGraph.vue'
</script>
