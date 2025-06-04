<!-- 学生详情组件 StudentDetail.vue -->
<template>
  <el-card class="detail-card">
    <template #header>
      <div class="card-header">
        <el-button style="margin-right: 2%" icon="ArrowLeft" @click="$emit('back')"
          >返回列表</el-button
        >
        <span>学生学情详情 - {{ studentId }}</span>
      </div>
    </template>

    <div class="content-wrapper">
      <!-- 统计信息区域 -->
      <div class="summary-grid">
        <el-statistic class="stat-item" title="总学习时长" :value="computedData.totalStudyHours">
          <template #suffix>
            <span class="stat-unit">小时</span>
          </template>
        </el-statistic>

        <el-statistic class="stat-item" title="本周学习时长" :value="computedData.weekStudyHours">
          <template #suffix>
            <span class="stat-unit">小时</span>
          </template>
        </el-statistic>

        <div class="progress-item">
          <el-progress
            type="dashboard"
            :percentage="
              Math.round((detailData.completedEntities / detailData.totalEntities) * 100)
            "
            :color="progressColors"
          />
          <div class="progress-label">
            <span>完成进度</span>
            <span>{{ detailData.completedEntities }}/{{ detailData.totalEntities }}</span>
          </div>
        </div>
      </div>

      <!-- 测评记录区域 -->
      <div class="records-section">
        <h3 class="text-gray-800 mb-5 pl-2 border-l-4 border-blue-500">历史测评记录</h3>
        <div class="space-y-4">
          <div
            v-for="(record, index) in detailData.scoreHistories"
            :key="index"
            class="mb-4 border border-gray-200 rounded-lg overflow-hidden"
          >
            <div
              class="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              @click="toggleRecord(index)"
            >
              <div class="flex justify-between items-center">
                <span>{{ formatTimestamp(record.timestamp) }}</span>
                <span
                  class="px-2 py-1 rounded text-white text-sm font-medium"
                  :class="{
                    'bg-green-500': getLevel(record.judgement) === 'A',
                    'bg-blue-500': getLevel(record.judgement) === 'B',
                    'bg-yellow-500': getLevel(record.judgement) === 'C',
                    'bg-red-500': getLevel(record.judgement) === 'D',
                  }"
                >
                  {{ getLevel(record.judgement) }}
                </span>
              </div>
            </div>
            <div v-show="activeNames.includes(index)" class="p-4">
              <!-- 问答列表 -->
              <div class="space-y-4 mb-4">
                <div
                  v-for="(question, qIndex) in record.history.questions"
                  :key="qIndex"
                  class="p-4 bg-gray-50 rounded-lg"
                >
                  <div class="flex items-center space-x-2 font-medium">
                    <span class="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {{ qIndex + 1 }}
                    </span>
                    <span>Q{{ qIndex + 1 }}：{{ question }}</span>
                  </div>
                  <div class="mt-2 pl-6 text-gray-600">A：{{ record.history.answers[qIndex] }}</div>
                </div>
              </div>
              <!-- 评语 -->
              <div class="p-4 bg-gray-100 rounded-lg mt-4">
                <p class="font-medium">评语：</p>
                <p class="mt-2 text-gray-600">{{ stripJudgement(record.judgement) }}</p>
              </div>
            </div>
          </div>

          <!-- 无记录提示 -->
          <div v-if="!detailData.scoreHistories.length" class="text-center text-gray-500 py-8">
            暂无测评记录
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElLoading, ElMessage } from 'element-plus'
import axios from '@/services/api'

const props = defineProps({
  studentId: {
    type: [String, Number], // 允许字符串或数字类型
    required: true,
  },
})

const emit = defineEmits(['back'])

const activeNames = ref([])
const detailData = reactive({
  scoreHistories: [],
  completedEntities: 0,
  totalEntities: 0,
  weekStudyTime: 0,
  totalStudyTime: 0,
})
const progressColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 },
]

const computedData = computed(() => ({
  totalStudyHours: Number((detailData.totalStudyTime / 60).toFixed(1)),
  weekStudyHours: Number((detailData.weekStudyTime / 60).toFixed(1)),
}))

// 获取学生详情
const fetchStudentDetail = async () => {
  if (!props.studentId) {
    ElMessage.error('学生ID不能为空')
    return
  }

  const loading = ElLoading.service()
  try {
    const res = await axios.get(`/api/teacher/student?number=${props.studentId}`)
    const data = res.data

    // 移除不必要的数据转换，保持原始数据结构
    Object.assign(detailData, data)
  } catch (error) {
    console.error('获取学生详情失败:', error)
    ElMessage.error('获取学生详情失败')
  } finally {
    loading.close()
  }
}

const toggleRecord = (index) => {
  const pos = activeNames.value.indexOf(index)
  if (pos > -1) {
    activeNames.value.splice(pos, 1)
  } else {
    activeNames.value.push(index)
  }
}

function formatTimestamp(iso) {
  const date = new Date(iso)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

function getLevel(judgement) {
  const match = judgement.trim().charAt(0)
  return ['A', 'B', 'C', 'D'].includes(match) ? match : 'D'
}

function stripJudgement(judgement) {
  return judgement.replace(/^[A-D]\.\s*/, '')
}

onMounted(async () => {
  await fetchStudentDetail()
})
</script>

<style scoped>
.detail-card {
  min-height: 80vh;
  padding: 24px;
  --el-card-border-radius: 12px;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 统计信息网格布局 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-item {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  :deep(.el-statistic__head) {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }

  :deep(.el-statistic__number) {
    font-size: 28px;
    color: #333;
  }
}

.stat-unit {
  font-size: 14px;
  color: #999;
  margin-left: 4px;
}

/* 进度面板样式 */
.progress-item {
  position: relative;
  padding: 20px;
  background: white;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  :deep(.el-progress__text) {
    font-size: 24px !important;
    color: #333 !important;
  }
}

.progress-label {
  margin-top: 12px;

  span:first-child {
    display: block;
    color: #666;
    font-size: 14px;
    margin-bottom: 4px;
  }

  span:last-child {
    color: #409eff;
    font-weight: 500;
  }
}

/* 测评记录区域 */
.records-section {
  .section-title {
    color: #333;
    margin-bottom: 20px;
    padding-left: 8px;
    border-left: 4px solid #409eff;
  }

  :deep(.el-collapse-item__header) {
    font-weight: 500;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 6px;
    margin-bottom: 8px;
  }

  :deep(.el-collapse-item__content) {
    padding: 0;
  }
}

/* 表格优化 */
:deep(.el-table) {
  margin: 12px 0;

  th.el-table__cell {
    background: #f8fafc;
  }

  .el-table__row:hover td {
    background-color: #f5f7fa !important;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .stat-item {
    padding: 16px;

    :deep(.el-statistic__number) {
      font-size: 24px;
    }
  }

  .detail-card {
    padding: 16px;
  }
}
</style>
