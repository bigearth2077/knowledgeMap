<template>
  <el-row class="tac">
    <el-menu
      :default-active="$route.path"
      router
      class="el-menu-vertical-demo"
      @open="handleOpen"
      @close="handleClose"
      :default-openeds="['1', '2']"
    >
      <!-- 添加缩放控制按钮组 -->
      <div class="zoom-controls flex justify-center items-center py-4 border-b border-base-300">
        <el-button-group>
          <el-button @click="zoomOut" :icon="Minus" circle />
          <el-button class="zoom-text">{{ zoomPercentage }}</el-button>
          <el-button @click="zoomIn" :icon="Plus" circle />
        </el-button-group>
      </div>

      <!-- 现有的菜单内容 -->
      <el-sub-menu index="1">
        <template #title>
          <el-icon><DataBoard /></el-icon>
          <span>图表</span>
        </template>
        <el-menu-item index="/teacher/knowledge-graph">知识图谱</el-menu-item>
        <el-menu-item index="/teacher/heatmap">热力图</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="2">
        <template #title>
          <el-icon><icon-menu /></el-icon>
          <span>管理</span>
        </template>
        <el-menu-item index="/teacher/graph-manage">图谱管理</el-menu-item>
        <el-menu-item index="/teacher/question">题库管理</el-menu-item>
      </el-sub-menu>
      <el-menu-item index="/teacher/study-stats">
        <el-icon><document /></el-icon>
        <span>学情统计</span>
      </el-menu-item>
    </el-menu>
  </el-row>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import {
  Document,
  Menu as IconMenu,
  Location,
  Setting,
  DataBoard,
  Plus,
  Minus,
} from '@element-plus/icons-vue'
import { useGraphStore } from '@/stores/graphStore'

// 保持现有的事件处理器
const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}

// 添加缩放相关的逻辑
const zoom = ref(100)
const zoomPercentage = computed(() => `${zoom.value}%`)
const graphStore = useGraphStore()

function zoomIn() {
  zoom.value = Math.min(zoom.value + 10, 200)
  graphStore.setZoom(zoom.value / 100)
}

function zoomOut() {
  zoom.value = Math.max(zoom.value - 10, 10)
  graphStore.setZoom(zoom.value / 100)
}
</script>

<style scoped>
.zoom-controls {
  padding: 1rem;
}

.zoom-text {
  width: 70px;
  pointer-events: none;
}

/* 保持现有样式 */
.el-menu-vertical-demo {
  width: 200px;
}
</style>
