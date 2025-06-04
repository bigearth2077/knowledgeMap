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
    <el-menu-item index="1">
      <el-icon><Grid /></el-icon>
      <span>工作台</span>
    </el-menu-item>
    <el-sub-menu index="2">
      <template #title>
        <el-icon><Avatar /></el-icon>
        <span>我的</span>
      </template>
      <el-menu-item index="2-1">个人信息</el-menu-item>
      <el-menu-item index="2-2" @click="onLogout">登出</el-menu-item>
    </el-sub-menu>
    <TeacherInfo v-model="infoVisible" />
  </el-menu>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import TeacherInfo from './TeacherInfo.vue'
import { Avatar, Grid } from '@element-plus/icons-vue'

import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const activeIndex = ref('1')
const infoVisible = ref(false)
const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
  if (key === '2-1') {
    infoVisible.value = true
  }
}

const authStore = useAuthStore()
const router = useRouter()

// 登出
function onLogout() {
  authStore.logout()
  // 登出后跳转到登录页
  router.push('/')
}
</script>

<style scoped>
.el-menu--horizontal > .el-menu-item:nth-child(1) {
  margin-right: auto;
}
</style>
