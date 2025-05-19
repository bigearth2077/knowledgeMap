<template>
  <div ref="chartRef" class="knowledge-graph"></div>

  <!-- 添加抽屉组件 -->
  <el-drawer
    v-model="drawerVisible"
    title="节点详情"
    direction="rtl"
    size="40%"
    @closed="handleDrawerClose"
  >
    <AboutView :entity-detail="currentDetail" />
  </el-drawer>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'
import { ElDrawer } from 'element-plus'
import AboutView from '@/views/AboutView.vue' // 新建的详情内容组件

const chartRef = ref(null)
let chartInstance = null

const drawerVisible = ref(false)
const currentDetail = ref(null)

// 分类颜色配置
const categoryColors = {
  概念: '#5470c6',
  算法与方法: '#91cc75',
  实际应用: '#fac858',
  实战案例: '#ee6666',
  论文: '#73c0de',
  教材: '#3ba272',
}

// 关系线样式配置
const predicateStyles = {
  包含: { color: '#dd6b66', lineStyle: 'solid' },
  参考: { color: '#759aa0', lineStyle: 'dashed' },
  平行: { color: '#e69d87', lineStyle: 'dotted' },
  后继: { color: '#8dc1a9', lineStyle: 'solid' },
  前驱: { color: '#ea7e53', lineStyle: 'solid' },
}

const initChart = async () => {
  // 获取数据
  const { data } = await axios.get('/api/graph')

  // 转换节点数据
  const nodes = data.entities.map((entity) => ({
    id: entity.entity,
    name: entity.entity,
    category: entity.category,
    symbolSize: entity.weight * 30 + 20,
    itemStyle: { color: categoryColors[entity.category] },
    attributes: entity.attributes,
  }))

  // 转换关系数据
  const links = data.relations.map((relation) => ({
    source: relation.subject,
    target: relation.object,
    label: {
      show: true,
      formatter: relation.predicate,
      fontSize: 12,
    },
    lineStyle: {
      color: predicateStyles[relation.predicate]?.color || '#999',
      type: predicateStyles[relation.predicate]?.lineStyle || 'solid',
    },
  }))

  // 配置图表
  const option = {
    title: {
      text: '强化学习知识图谱',
      subtext: '数据来源于模拟接口',
      left: 'center',
    },
    tooltip: {
      formatter: (params) => {
        if (params.dataType === 'node') {
          const attrs = params.data.attributes
            .map((attr) => `${attr.attribute}: ${attr.value}`)
            .join('<br>')
          return `${params.name}<hr/>${attrs}`
        }
        return `${params.data.source} → ${params.data.target}<br>关系：${params.data.label?.formatter}`
      },
    },
    legend: {
      top: 'bottom',
      data: Object.keys(categoryColors).map((name) => ({
        name,
        itemStyle: { color: categoryColors[name] },
        icon: 'circle', // 使用圆形图标
      })),
      // 添加图例悬浮事件处理
      emphasis: {
        itemStyle: {
          opacity: 1,
        },
        label: {
          show: true,
        },
      },
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        force: {
          repulsion: 400,
          gravity: 0.05,
          edgeLength: 150,
          friction: 0.2,
        },
        draggable: true,
        nodes,
        links: links.map((link) => ({
          ...link,
          lineStyle: {
            ...link.lineStyle,
            opacity: 0.6, // 降低连线默认透明度
          },
        })),
        categories: Object.keys(categoryColors).map((name) => ({ name })),
        edgeLabel: {
          show: true,
          position: 'middle',
        },
        lineStyle: {
          opacity: 0.8,
          curveness: 0.3,
        },
        emphasis: {
          focus: 'adjacency',
          label: {
            show: true,
            position: 'right',
            fontSize: 14,
          },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  }

  chartInstance.setOption(option)

  chartInstance.on('click', async (params) => {
    if (params.dataType === 'node') {
      await showNodeDetail(params.data)
    }
  })
}

// 显示节点详情
const showNodeDetail = async (nodeData) => {
  try {
    const { data } = await axios.post('/api/search', {
      entity: nodeData.name,
    })
    console.log(data)
    currentDetail.value = data
    drawerVisible.value = true
  } catch (error) {
    console.error('详情加载失败', error)
  }
}

// 关闭抽屉处理
const handleDrawerClose = () => {
  currentDetail.value = null
}

onMounted(() => {
  chartInstance = echarts.init(chartRef.value)
  initChart()

  // 窗口变化自适应
  window.addEventListener('resize', () => chartInstance.resize())
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', () => chartInstance.resize())
  chartInstance.dispose()
})
</script>

<style scoped>
.knowledge-graph {
  width: 100%;
  height: calc(100vh - 120px); /* 根据页面布局调整 */
  min-height: 600px;
  background: #f8f9fa;
}
</style>
