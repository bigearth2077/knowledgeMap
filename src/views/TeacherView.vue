<template>
  <el-container class="main-container">
    <!-- 顶部导航 -->
    <el-header height="60px">
      <TopNav style="width: 100%" />
    </el-header>

    <el-container>
      <!-- 侧边栏 -->
      <SideNav />

      <!-- 主内容区 -->
      <el-main>
        <router-view />
        <!-- 或直接放置页面内容 -->
      </el-main>
    </el-container>

    <!-- 如果需要底部 -->
    <!-- <el-footer height="60px">Footer</el-footer> -->
  </el-container>
</template>

<script setup>
import TopNav from '@/components/TopNav.vue'
import SideNav from '@/components/SideNav.vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // 如果当前路径就是 /teacher，则跳转到知识图谱页面
  if (router.currentRoute.value.path === '/teacher') {
    router.push('/teacher/knowledge-graph')
  }
})
</script>

<style scoped>
.main-container {
  height: 100vh;
}

.el-header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.el-aside {
  background: #fff;
  border-right: 1px solid #e6e6e6;
  height: calc(100vh - 60px); /* 根据 header 高度调整 */
}

.el-main {
  padding: 20px;
  background: #f5f7fa;
}
</style>
