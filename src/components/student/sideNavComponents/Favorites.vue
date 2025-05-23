<template>
  <div class="card bg-base-100 shadow-md w-full h-full">
    <div class="card-body p-4 space-y-4">
      <h3 class="card-title">我的收藏</h3>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner text-primary"></span>
      </div>

      <!-- Empty state -->
      <p v-else-if="favorites.length === 0" class="text-center text-sm text-base-content/60">
        暂无收藏~
      </p>

      <!-- Favorites table -->
      <div v-else class="overflow-y-auto max-h-80">
        <table class="table w-full">
          <thead>
            <tr>
              <th>实体</th>
              <th>类别</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fav in favorites" :key="fav.entity">
              <td>{{ fav.entity }}</td>
              <td>
                <span class="badge" :class="getBadgeClass(fav.category)">
                  {{ fav.category }}
                </span>
              </td>
              <td class="text-right">
                <button
                  class="btn btn-error rounded-1xl btn-sm"
                  @click="removeFavorite(fav.entity)"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from '@/services/api'

interface FavoriteEntity {
  entity: string
  category: string
}

const favorites = ref<FavoriteEntity[]>([])
const loading = ref(false)
const error = ref('')

// 预定义分类到 badge 颜色映射
const badgeClassMap: Record<string, string> = {
  概念: 'badge-primary',
  实战案例: 'badge-success',
  教材: 'badge-warning',
  论文: 'badge-error',
  实际应用: 'badge-info',
  算法与方法: 'badge-warning',
  // 其他分类默认样式
}

/** 根据类别返回对应的 badge 样式 */
function getBadgeClass(category: string): string {
  return badgeClassMap[category] || 'badge-accent'
}

async function fetchFavorites() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await axios.get<FavoriteEntity[]>('/api/favorites')
    favorites.value = data
  } catch (err: any) {
    console.error('[Favorites] fetch failed', err)
    error.value = err.message || '未知错误'
  } finally {
    loading.value = false
  }
}

async function removeFavorite(entity: string) {
  const ok = window.confirm(`确定要删除收藏 «${entity}» 吗？`)
  if (!ok) return
  try {
    await axios.post('/api/favorites/delete', { entity })
    favorites.value = favorites.value.filter((f) => f.entity !== entity)
  } catch (err: any) {
    console.error('[Favorites] delete failed', err)
    alert('删除失败，请稍后重试')
  }
}

onMounted(fetchFavorites)
</script>

<style scoped>
/* 可自定义滚动条等样式 */
</style>
