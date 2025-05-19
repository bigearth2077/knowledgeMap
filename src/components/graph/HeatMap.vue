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

// 处理数据为矩阵格式
const processData = (data) => {
  const categoryMap = data.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {})

  // 对每个分类按热度排序
  Object.values(categoryMap).forEach((category) => {
    category.sort((a, b) => b.count - a.count)
  })

  // 获取所有分类和最大行数
  const categories = Object.keys(categoryMap)
  const maxRows = Math.max(...Object.values(categoryMap).map((c) => c.length))

  // 生成二维矩阵数据
  const heatData = []
  categories.forEach((category, xIndex) => {
    categoryMap[category].forEach((item, yIndex) => {
      heatData.push({
        value: [xIndex, yIndex, item.count],
        name: item.entity,
        rawData: item,
      })
    })
  })

  return {
    categories,
    maxRows,
    heatData,
  }
}

const initChart = async () => {
  const { data } = await axios.get('/api/graph')
  originalData.value = data.entities
  categories.value = [...new Set(data.entities.map((item) => item.category))]

  // 数据过滤
  const filteredData =
    selectedCategory.value === 'all'
      ? originalData.value
      : originalData.value.filter((item) => item.category === selectedCategory.value)

  // 处理数据为矩阵格式
  const { categories: axisCategories, maxRows, heatData } = processData(filteredData)

  const option = {
    title: {
      text: '知识节点访问热力图',
      subtext: '分类维度 × 热度排名',
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
            <p>排名：${params.value[1] + 1}</p>
          </div>
        `
      },
    },
    xAxis: {
      type: 'category',
      name: '知识分类',
      data: axisCategories,
      axisLabel: {
        rotate: 45,
        interval: 0,
      },
    },
    yAxis: {
      type: 'category',
      name: '热度排名',
      inverse: true,
      data: Array.from({ length: maxRows }, (_, i) => i + 1),
      axisLabel: {
        formatter: (value) => `TOP ${value}`,
      },
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
    },
    series: [
      {
        type: 'heatmap',
        data: heatData,
        itemStyle: {
          borderWidth: 1,
          borderColor: '#fff',
        },
        label: {
          show: true,
          formatter: ({ data }) => {
            const name = data.name
            return name.length > 8 ? `${name.substring(0, 7)}...` : name
          },
          fontSize: 10,
          align: 'center',
          verticalAlign: 'middle',
          color: (params) => {
            try {
              // 统一处理颜色格式
              let color = params.color

              // 转换rgba为hex格式（假设透明度为1）
              if (color.startsWith('rgba')) {
                const rgba = color.match(/(\d+)/g)
                const hex = rgba
                  .slice(0, 3)
                  .map((n) => parseInt(n).toString(16).padStart(2, '0'))
                  .join('')
                color = `#${hex}`
              }

              // 处理简写格式（如#fff）
              if (color.length === 4) {
                color =
                  '#' +
                  color
                    .slice(1)
                    .split('')
                    .map((c) => c + c)
                    .join('')
              }

              // 解析HEX颜色
              const hex = color.replace('#', '')
              const r = parseInt(hex.substring(0, 2), 16)
              const g = parseInt(hex.substring(2, 4), 16)
              const b = parseInt(hex.substring(4, 6), 16)

              // 计算亮度（使用WCAG标准公式）
              const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

              // 动态阈值（深色背景用白字，浅色用黑字）
              return luminance > 0.6 ? '#333' : '#fff'
            } catch (e) {
              console.warn('颜色解析失败:', e)
              return '#333' // 默认颜色
            }
          },
          textStyle: {
            fontWeight: 'bold',
            textShadowColor: 'rgba(0,0,0,0.3)',
            textShadowBlur: 2,
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.3)',
          },
        },
      },
    ],
    dataZoom: [
      {
        type: 'slider',
        show: true,
        yAxisIndex: 0,
        right: 15,
        start: 0,
        end: 100,
      },
      {
        type: 'inside',
        yAxisIndex: 0,
      },
    ],
  }

  chartInstance.setOption(option)
}

const updateChart = () => {
  // 先清空实例再重新初始化
  if (chartInstance) {
    chartInstance.dispose()
  }
  chartInstance = echarts.init(heatmapRef.value)
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
