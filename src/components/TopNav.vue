<template>
  <el-menu
    :default-active="activeIndex"
    class="el-menu-demo"
    mode="horizontal"
    :ellipsis="false"
    @select="handleSelect"
  >
    <el-menu-item index="0">
      <span>教师管理端</span>
    </el-menu-item>
    <el-menu-item index="1">工作台</el-menu-item>
    <el-sub-menu index="2">
      <template #title>我的</template>
      <el-menu-item index="2-1">个人信息</el-menu-item>
      <el-menu-item index="2-2">登出</el-menu-item>
    </el-sub-menu>
    <TeacherInfo v-model="infoVisible" />
  </el-menu>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import TeacherInfo from './TeacherInfo.vue'

const activeIndex = ref('1')
const infoVisible = ref(false)
const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
  if (key === '2-1') {
    infoVisible.value = true
  }
}
</script>

<style scoped>
.el-menu--horizontal > .el-menu-item:nth-child(1) {
  margin-right: auto;
}
</style>
