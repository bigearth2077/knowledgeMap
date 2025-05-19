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
        <el-statistic class="stat-item" title="总学习时长" :value="detailData.totalStudyTime">
          <template #suffix>
            <span class="stat-unit">小时</span>
          </template>
        </el-statistic>

        <el-statistic class="stat-item" title="本周学习时长" :value="detailData.weekStudyTime">
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
        <h3 class="section-title">历史测评记录</h3>
        <el-collapse v-model="activeNames" accordion>
          <el-collapse-item
            v-for="(record, index) in detailData.scoreHistories"
            :key="index"
            :title="`${record.judgement} - ${record.timestamp}`"
            :name="index"
          >
            <el-table :data="record.history">
              <el-table-column prop="question" label="问题" width="300" />
              <el-table-column prop="answer" label="学生回答" />
              <el-table-column prop="score" label="得分" width="100" />
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElLoading } from 'element-plus'
import axios from 'axios'

const props = defineProps({
  studentId: {
    type: String,
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

// 获取学生详情
const fetchStudentDetail = async () => {
  const loading = ElLoading.service()
  try {
    const res = await axios.get(`/api/teacher/student?number=${props.studentId}`)
    const data = await res.data
    Object.assign(detailData, data)
  } finally {
    loading.close()
  }
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
