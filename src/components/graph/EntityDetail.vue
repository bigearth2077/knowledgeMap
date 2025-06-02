<template>
  <div
    class="fixed top-0 right-0 h-full transition-transform duration-300 ease-in-out"
    :style="{
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      'pointer-events': isOpen ? 'auto' : 'none',
    }"
  >
    <section
      class="min-w-[480px] lg:w-[640px] h-full p-6 bg-base-100 flex flex-col gap-6 overflow-y-auto shadow-xl"
    >
      <!-- Header 部分调整：将按钮分组并添加间距 -->
      <header class="flex justify-between items-center">
        <h2 class="text-2xl font-bold truncate max-w-[360px]" :title="detail?.entity">
          {{ detail?.entity || '加载中…' }}
        </h2>
        <div class="flex items-center space-x-2">
          <!-- Favorite/Unfavorite button -->
          <button
            v-if="!favoriteLoading && detail"
            class="btn btn-sm"
            :class="isFavorite ? 'btn-secondary' : 'btn-primary'"
            @click="toggleFavorite"
          >
            {{ isFavorite ? '取消收藏' : '收藏' }}
          </button>
          <button v-else-if="favoriteLoading" class="btn btn-primary btn-sm" disabled>
            <span class="loading loading-spinner loading-xs mr-2"></span>
            {{ isFavorite ? '取消收藏' : '收藏' }}
          </button>
          <!-- Close button -->
          <button class="btn btn-sm btn-circle" @click="close">✕</button>
        </div>
      </header>

      <!-- Loading spinner 保持不变 -->
      <div v-if="loading" class="flex flex-1 items-center justify-center">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Main detail -->
      <div v-else-if="detail" class="flex flex-col gap-6">
        <!-- Stats - 修改显示内容 -->
        <div class="stats shadow">
          <div class="stat">
            <div class="stat-title">类别</div>
            <div class="stat-value text-primary">{{ detail.category }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">权重</div>
            <div class="stat-value">{{ detail.weight?.toFixed(2) }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">点击</div>
            <div class="stat-value">{{ detail.count }}</div>
          </div>
        </div>

        <!-- Relations - 改为表格显示 -->
        <div class="card bg-base-200">
          <div class="card-body p-4">
            <h3 class="card-title text-lg mb-2">关系</h3>
            <div class="overflow-x-auto">
              <table class="table table-zebra">
                <thead>
                  <tr>
                    <th>起点</th>
                    <th>关系</th>
                    <th>终点</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(rel, idx) in detail.relations" :key="idx">
                    <td>{{ rel[0] }}</td>
                    <td>
                      <span class="badge badge-primary">{{ rel[2] }}</span>
                    </td>
                    <td>{{ rel[1] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Attributes - 根据不同类型显示不同样式 -->
        <div class="card bg-base-200">
          <div class="card-body p-4">
            <h3 class="card-title text-lg mb-2">属性</h3>
            <div class="space-y-4">
              <div v-for="attr in detail.attributes" :key="attr.attribute" class="attribute-item">
                <div class="font-medium text-sm opacity-75 mb-1">{{ attr.attribute }}</div>

                <!-- 主要内容 -->
                <div v-if="attr.attribute === '主要内容'" class="prose max-w-none">
                  {{ attr.value }}
                </div>

                <!-- 代码 -->
                <pre
                  v-else-if="attr.attribute === '代码'"
                  class="mockup-code bg-neutral text-neutral-content p-4"
                >
                    <code>{{ attr.value }}</code>
                  </pre>

                <!-- 描述 -->
                <div v-else-if="attr.attribute === '描述'" class="alert alert-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    class="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>{{ attr.value }}</span>
                </div>

                <!-- 定义 -->
                <div v-else-if="attr.attribute === '定义'" class="alert alert-success">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{{ attr.value }}</span>
                </div>

                <!-- 地址 -->
                <div v-else-if="attr.attribute === '地址'" class="link link-primary">
                  {{ attr.value }}
                </div>

                <!-- 领域 -->
                <div v-else-if="attr.attribute === '领域'" class="badge badge-outline gap-2">
                  {{ attr.value }}
                </div>

                <!-- 来源 -->
                <div v-else-if="attr.attribute === '来源'" class="italic text-base-content/70">
                  {{ attr.value }}
                </div>

                <!-- 默认样式 -->
                <div v-else class="text-base-content">
                  {{ attr.value }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import axios from '@/services/api'

/** -----------------------------
 *  Types
 *  ----------------------------*/
interface Attribute {
  attribute: string
  value: string
}

interface DetailResponse {
  entity: string
  category: string
  count: number
  weight: number
  attributes: Attribute[]
  relations: [string, string, string][]
}

interface FavoriteItem {
  entity: string
}

/** -----------------------------
 *  Props / Emits
 *  ----------------------------*/
const props = defineProps<{ entity: string | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

/** -----------------------------
 *  State
 *  ----------------------------*/
const isOpen = ref(false)
const loading = ref(false)
const favoriteLoading = ref(false)
const detail = ref<DetailResponse | null>(null)
const isFavorite = ref(false)

/** -----------------------------
 *  Watch entity prop
 *  ----------------------------*/
watch(
  () => props.entity,
  async (newEntity) => {
    if (newEntity) {
      isOpen.value = true
      await fetchDetail(newEntity)
      await checkFavorite(newEntity)
    } else {
      isOpen.value = false
      detail.value = null
      isFavorite.value = false
    }
  },
  { immediate: true },
)

/** -----------------------------
 *  API calls
 *  ----------------------------*/
async function fetchDetail(entity: string) {
  loading.value = true
  try {
    const { data } = await axios.post<DetailResponse>('/api/search', { entity })
    detail.value = data
  } catch (error) {
    console.error('[EntityDetail] 获取详情失败', error)
  } finally {
    loading.value = false
    axios.post('/api/click', { entity })
  }
}

async function checkFavorite(entity: string) {
  try {
    const response = await axios.get<FavoriteItem[]>('/api/favorites')
    const favorites = response.data || []
    isFavorite.value = favorites.some((item) => item.entity === entity)
  } catch (error) {
    console.error('[EntityDetail] 检查收藏状态失败', error)
    isFavorite.value = false
  }
}

async function addFavorite() {
  if (!detail.value) return
  favoriteLoading.value = true
  try {
    await axios.post('/api/favorites/add', { entity: detail.value.entity })
    isFavorite.value = true
  } catch (error) {
    console.error('[EntityDetail] 收藏失败', error)
  } finally {
    favoriteLoading.value = false
  }
}

async function removeFavorite() {
  if (!detail.value) return
  favoriteLoading.value = true
  try {
    await axios.post('/api/favorites/delete', { entity: detail.value.entity })
    isFavorite.value = false
  } catch (error) {
    console.error('[EntityDetail] 取消收藏失败', error)
  } finally {
    favoriteLoading.value = false
  }
}

function toggleFavorite() {
  if (isFavorite.value) {
    removeFavorite()
  } else {
    addFavorite()
  }
}

function close() {
  isOpen.value = false
  emit('close')
}
</script>
