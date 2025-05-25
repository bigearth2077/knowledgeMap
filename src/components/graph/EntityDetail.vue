<template>
  <!-- DaisyUI end‑drawer -->
  <div class="drawer drawer-end fixed inset-0 z-40" :class="{ 'drawer-open': isOpen }">
    <!-- Hidden checkbox keeps drawer reactive to v-model -->
    <input id="entity-detail-drawer" type="checkbox" class="drawer-toggle" v-model="isOpen" />

    <!-- Drawer side panel -->
    <div class="drawer-side">
      <!-- Click overlay to close -->
      <label for="entity-detail-drawer" class="drawer-overlay"></label>

      <!-- Panel content -->
      <section
        class="min-w-[360px] lg:w-[420px] h-full p-6 bg-base-100 flex flex-col gap-4 overflow-y-auto"
      >
        <!-- Header -->
        <header class="flex justify-between items-center">
          <h2 class="text-2xl font-bold truncate max-w-[260px]" :title="detail?.entity">
            {{ detail?.entity || '加载中…' }}
          </h2>
          <button class="btn btn-sm btn-circle" @click="close">✕</button>
        </header>

        <!-- Loading spinner -->
        <div v-if="loading" class="flex flex-1 items-center justify-center">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <!-- Main detail -->
        <div v-else-if="detail" class="flex flex-col gap-4">
          <!-- Stats -->
          <div class="stats shadow">
            <div class="stat">
              <div class="stat-title">类别</div>
              <div class="stat-value text-primary">{{ detail.category }}</div>
            </div>
            <div class="stat">
              <div class="stat-title">出现次数</div>
              <div class="stat-value">{{ detail.count }}</div>
            </div>
            <div class="stat">
              <div class="stat-title">点击次数</div>
              <div class="stat-value">{{ detail.weight }}</div>
            </div>
          </div>

          <!-- Relations -->
          <div>
            <h3 class="font-semibold mb-2">关系</h3>
            <ul class="list-disc list-inside space-y-1">
              <li v-for="(rel, idx) in detail.relations" :key="idx">
                {{ rel[0] }} <span class="badge badge-outline mx-1">{{ rel[2] }}</span> {{ rel[1] }}
              </li>
            </ul>
          </div>

          <!-- Attributes -->
          <div>
            <h3 class="font-semibold mb-2">属性</h3>
            <ul class="list-disc list-inside space-y-1">
              <li v-for="attr in detail.attributes" :key="attr.attribute">
                <strong>{{ attr.attribute }}：</strong>{{ attr.value }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Favorite button -->
        <button
          class="btn btn-primary mt-auto"
          :disabled="favoriteLoading || !detail"
          @click="addFavorite"
        >
          <span v-if="favoriteLoading" class="loading loading-spinner loading-xs mr-2"></span>
          收藏
        </button>
      </section>
    </div>
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

/** -----------------------------
 *  Watch entity prop
 *  ----------------------------*/
watch(
  () => props.entity,
  async (newEntity) => {
    if (newEntity) {
      isOpen.value = true
      await fetchDetail(newEntity)
    } else {
      isOpen.value = false
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

async function addFavorite() {
  if (!detail.value) return
  favoriteLoading.value = true
  try {
    await axios.post('/api/favorites/add', { entity: detail.value.entity })
    // TODO: 可使用 toast / Alert 反馈成功信息
  } catch (error) {
    console.error('[EntityDetail] 收藏失败', error)
  } finally {
    favoriteLoading.value = false
  }
}

function close() {
  isOpen.value = false
  emit('close')
}
</script>
