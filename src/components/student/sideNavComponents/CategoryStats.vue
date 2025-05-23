<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Chart card -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <h3 class="card-title">分类统计</h3>
        <svg ref="chart" class="w-full h-72 select-none"></svg>
        <!-- Legend -->
        <div ref="legend" class="flex flex-wrap gap-3 mt-4"></div>
      </div>
    </div>

    <!-- Table card -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body p-0">
        <h3 class="card-title px-4 pt-4">类别详情</h3>
        <div class="overflow-x-auto">
          <table class="table table-zebra table-sm lg:table-md">
            <thead>
              <tr>
                <th>类别</th>
                <th class="text-right">数量</th>
                <th class="text-right">占比</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="{ category, count, percent } in categoryCounts" :key="category">
                <td class="w-26 truncate" title="{{ category }}">{{ category }}</td>
                <td class="text-right">
                  <span class="badge badge-outline">{{ count }}</span>
                </td>
                <td class="text-right">{{ percent.toFixed(1) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { useGraphStore } from '@/stores/graphStore'

const graphStore = useGraphStore()
const chart = ref<SVGSVGElement | null>(null)
const legend = ref<HTMLDivElement | null>(null)

// Load data then draw chart
onMounted(async () => {
  if (!graphStore.graphData) {
    await graphStore.fetchGraph()
  }
  await nextTick()
  drawChart()
})

// Total entity count
const totalCount = computed(() => graphStore.graphData?.entities.length ?? 0)

// Aggregate counts & percentage
const categoryCounts = computed(() => {
  const map = new Map<string, number>()
  graphStore.graphData?.entities.forEach((e) => {
    map.set(e.category, (map.get(e.category) || 0) + 1)
  })
  return Array.from(map.entries())
    .map(([category, count]) => ({ category, count, percent: (count / totalCount.value) * 100 }))
    .sort((a, b) => b.count - a.count)
})

function drawChart() {
  if (!chart.value) return
  const data = categoryCounts.value
  if (!data.length) return

  const svg = d3.select(chart.value)
  const width = chart.value.clientWidth
  const height = chart.value.clientHeight
  // 调整左右 margin，留更多空间给柱子
  const margin = { top: 20, right: 10, bottom: 60, left: 40 }

  svg.selectAll('*').remove()

  // Dynamic color palette
  const palette =
    data.length <= 10
      ? (d3.schemeTableau10 as string[])
      : data.map((_, i) => d3.interpolateRainbow(i / data.length))
  const color = d3
    .scaleOrdinal<string>()
    .domain(data.map((d) => d.category))
    .range(palette)

  // 缩小 padding 提升柱宽
  const x = d3
    .scaleBand<string>()
    .domain(data.map((d) => d.category))
    .range([margin.left, width - margin.right])
    .padding(0.05)

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.count) || 0])
    .nice()
    .range([height - margin.bottom, margin.top])

  // Bars with entry animation
  svg
    .append('g')
    .selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', (d) => x(d.category)!)
    .attr('y', y(0))
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .attr('rx', 4)
    .attr('fill', (d) => color(d.category))
    .transition()
    .duration(600)
    .attr('y', (d) => y(d.count))
    .attr('height', (d) => y(0) - y(d.count))
    .selection()
    .append('title')
    .text((d) => `${d.category}: ${d.count} (${d.percent.toFixed(1)}%)`)

  // X-axis (倾斜度更小，避免遮挡)
  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'rotate(-30)')
    .style('text-anchor', 'end')
    .style('font-size', '12px')

  // Y-axis
  svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5))

  // Build legend
  if (legend.value) {
    legend.value.innerHTML = ''
    color.domain().forEach((cat) => {
      const item = document.createElement('div')
      item.className = 'flex items-center gap-1 text-sm'

      const swatch = document.createElement('span')
      swatch.className = 'inline-block w-3 h-3 rounded'
      swatch.style.backgroundColor = color(cat) as string

      const label = document.createElement('span')
      label.textContent = cat

      item.appendChild(swatch)
      item.appendChild(label)
      legend.value!.appendChild(item)
    })
  }
}

// Redraw when data changes
watch(categoryCounts, () => drawChart(), { immediate: true })
</script>

<style scoped>
rect {
  transition:
    y 0.6s ease,
    height 0.6s ease;
}
rect:hover {
  opacity: 0.85;
}
</style>
