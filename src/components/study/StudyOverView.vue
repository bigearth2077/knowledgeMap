<template>
  <el-card class="overview-card">
    <template #header>
      <div class="card-header">
        <span>学情总览</span>
        <el-button style="margin-left: 2%" type="primary" @click="$emit('show-specialized')"
          >查看班级列表</el-button
        >
      </div>
    </template>

    <div v-loading="loading" class="content-container">
      <div class="chart-wrapper">
        <div ref="chartRef" class="chart"></div>
      </div>

      <el-card class="ai-comment">
        <div class="comment-header">
          <svg-icon icon-class="ai" class="ai-icon" />
          <h3>AI学情分析</h3>
        </div>
        <div class="comment-content">
          <p>{{ chartData.comment_ai || '暂无AI分析评语' }}</p>
        </div>
      </el-card>
    </div>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import axios from '@/services/api'

// 组件状态
const chartRef = ref(null)
const loading = ref(true)
let chartInstance = null
const chartData = reactive({
  A: 0,
  B: 0,
  C: 0,
  D: 0,
  E: 0,
  F: 0,
  comment_ai: '',
})

// 添加缓存相关函数
const CACHE_KEY = 'study_overview_data'
const CACHE_EXPIRY = 1000 * 60 * 30 // 30分钟缓存

const getCachedData = () => {
  const cached = localStorage.getItem(CACHE_KEY)
  if (!cached) return null

  const { data, timestamp } = JSON.parse(cached)
  if (Date.now() - timestamp > CACHE_EXPIRY) {
    localStorage.removeItem(CACHE_KEY)
    return null
  }
  return data
}

const setCacheData = (data) => {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      data,
      timestamp: Date.now(),
    }),
  )
}

// 获取学情数据
const fetchStudyData = async () => {
  const cachedData = getCachedData()
  if (cachedData) {
    Object.assign(chartData, cachedData)
    loading.value = false
    return
  }

  try {
    const res = await axios.get('/api/teacher/study')
    Object.assign(chartData, res.data)
    setCacheData(res.data)
  } catch (error) {
    ElMessage.error('数据加载失败')
    console.error('接口请求错误:', error)
  } finally {
    loading.value = false
  }
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

// 更新图表配置
const updateChart = () => {
  const option = {
    title: {
      text: '成绩分布统计',
      left: 'center',
      textStyle: {
        color: '#333',
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}级: {c}人',
    },
    xAxis: {
      type: 'category',
      data: ['A', 'B', 'C', 'D', 'E', 'F'],
      axisLabel: {
        color: '#666',
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#666',
      },
    },
    series: [
      {
        data: Object.values(chartData).slice(0, 6),
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 1, color: '#188df0' },
          ]),
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#188df0' },
              { offset: 1, color: '#83bff6' },
            ]),
          },
        },
      },
    ],
  }

  chartInstance.setOption(option)
}

// 响应式更新
watch(
  () => [...Object.values(chartData).slice(0, 6)],
  () => {
    if (chartInstance) updateChart()
  },
)

// 生命周期
onMounted(async () => {
  await fetchStudyData()
  initChart()
})

onBeforeUnmount(() => {
  if (chartInstance) chartInstance.dispose()
})
</script>

<style scoped>
.content-container {
  display: flex;
  gap: 30px;
  min-height: 400px;
}

.chart-wrapper {
  flex: 2;
  min-width: 600px;
}

.chart {
  width: 100%;
  height: 400px;
}

.ai-comment {
  flex: 1;
  min-width: 300px;
  background: #f8fafc;
  border: none;
  box-shadow: none;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;

  .ai-icon {
    width: 24px;
    height: 24px;
    margin-right: 10px;
    color: #409eff;
  }

  h3 {
    margin: 0;
    font-size: 16px;
    color: #333;
  }
}

.comment-content {
  line-height: 1.8;
  color: #666;
  font-size: 14px;

  p {
    margin: 0;
    text-indent: 2em;
  }
}

@media (max-width: 1200px) {
  .content-container {
    flex-direction: column;
  }

  .chart-wrapper {
    min-width: auto;
  }

  .ai-comment {
    min-width: auto;
  }
}
</style>
