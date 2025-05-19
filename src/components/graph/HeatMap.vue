<template>
  <div ref="heatmapRef" class="heatmap-container">
    <div class="filter-container">
      <label>分类筛选：</label>
      <select v-model="selectedCategory" @change="updateChart">
        <option value="all">全部</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

const heatmapRef = ref(null)
let chartInstance = null
const categories = ref([])
const selectedCategory = ref('all')
const originalData = ref([])

// 生成智能坐标轴标签
const generateAxisLabels = (data) => {
  const labels = new Set()
  data.forEach((item) => {
    const shortName = item.entity.length > 6 ? `${item.entity.substring(0, 6)}...` : item.entity
    labels.add(shortName)
  })
  return Array.from(labels)
}

// 数据分组算法
const groupData = (data, groupSize = 10) => {
  const grouped = []
  let currentGroup = []

  data.sort((a, b) => b.count - a.count) // 按热度排序

  data.forEach((item, index) => {
    if (index % groupSize === 0 && currentGroup.length > 0) {
      grouped.push(currentGroup)
      currentGroup = []
    }
    currentGroup.push(item)
  })

  if (currentGroup.length > 0) grouped.push(currentGroup)
  return grouped
}

const initChart = async () => {
  const { data } = await axios.get('/api/graph')
  originalData.value = data.entities
  categories.value = [...new Set(data.entities.map((item) => item.category))]

  // 数据预处理
  const filteredData =
    selectedCategory.value === 'all'
      ? originalData.value
      : originalData.value.filter((item) => item.category === selectedCategory.value)

  const groupedData = groupData(filteredData)
  const axisLabels = generateAxisLabels(filteredData)

  // 生成二维热力数据
  const heatData = []
  groupedData.forEach((group, groupIndex) => {
    group.forEach((item, itemIndex) => {
      heatData.push({
        value: [groupIndex, itemIndex, item.count],
        name: item.entity,
        rawData: item,
      })
    })
  })

  const option = {
    title: {
      text: '知识节点访问热力图',
      subtext: '组别维度 × 知识点热度排序',
      left: 'center',
    },
    tooltip: {
      formatter: (params) => {
        const data = params.data.rawData
        return `
          <div class="tooltip-content">
            <h4>${data.entity}</h4>
            <p>分类：${data.category}</p>
            <p>访问次数：${data.count}</p>
            <p>关联知识点：${data.related?.join(', ') || '无'}</p>
          </div>
        `
      },
    },
    xAxis: {
      type: 'category',
      name: '知识组别',
      data: groupedData.map((_, i) => `第 ${i + 1} 组`),
      axisLabel: { rotate: 45 },
    },
    yAxis: {
      type: 'category',
      name: '知识点热度排序',
      data: axisLabels,
      axisLabel: { width: 100, overflow: 'truncate' },
    },
    visualMap: {
      min: 0,
      max: Math.max(...filteredData.map((item) => item.count)),
      calculable: true,
      orient: 'vertical',
      right: 30,
      top: 'center',
      inRange: {
        color: [
          '#fff7fb',
          '#ece7f2',
          '#d0d1e6',
          '#a6bddb',
          '#74a9cf',
          '#3690c0',
          '#0570b0',
          '#045a8d',
          '#023858',
        ],
      },
      textStyle: { color: '#666' },
    },
    series: [
      {
        type: 'heatmap',
        data: heatData,
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
      },
    ],
    dataZoom: [
      { type: 'slider', show: true, yAxisIndex: 0, right: 15 },
      { type: 'inside', yAxisIndex: 0 },
    ],
  }

  chartInstance.setOption(option)
}

const updateChart = () => {
  initChart()
}

onMounted(() => {
  chartInstance = echarts.init(heatmapRef.value)
  initChart()
  window.addEventListener('resize', () => chartInstance.resize())
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', () => chartInstance.resize())
  chartInstance.dispose()
})
</script>

<style scoped>
.heatmap-container {
  width: 100%;
  height: calc(100vh - 120px);
  min-height: 600px;
  position: relative;
}

.filter-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.filter-container select {
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style>
