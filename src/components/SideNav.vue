<template>
  <el-row class="tac">
    <el-menu
      :default-active="$route.path"
      router
      class="el-menu-vertical-demo"
      @open="handleOpen"
      @close="handleClose"
    >
      <el-sub-menu index="1">
        <template #title>
          <el-icon><DataBoard /></el-icon>
          <span>图表</span>
        </template>
        <el-menu-item index="/knowledge-graph">知识图谱</el-menu-item>
        <el-menu-item index="/heatmap">热力图</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="2">
        <template #title>
          <el-icon><icon-menu /></el-icon>
          <span>管理</span>
        </template>
        <el-menu-item index="/graph-manage">图谱管理</el-menu-item>
        <el-menu-item index="/heatmap">班级管理</el-menu-item>
        <el-menu-item index="/question">题库管理</el-menu-item>
      </el-sub-menu>
      <el-menu-item index="/study-stats">
        <el-icon><document /></el-icon>
        <span>学情统计</span>
      </el-menu-item>
      <el-menu-item index="4">
        <el-icon><setting /></el-icon>
        <span>Navigator Four</span>
      </el-menu-item>
    </el-menu>
  </el-row>
</template>

<script lang="ts" setup>
import { Document, Menu as IconMenu, Location, Setting, DataBoard } from '@element-plus/icons-vue'
const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>
