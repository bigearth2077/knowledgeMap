<template>
  <!-- Responsive container for the D3 canvas -->
  <div
    ref="graphContainer"
    class="flex-1 w-full h-full bg-base-200 rounded-lg"
    :style="{ height: `calc(100vh - 4rem - 2rem)` }"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import axios from 'axios'
import * as d3 from 'd3'

interface Attribute {
  attribute: string
  value: string
}
interface Entity {
  entity: string
  category: string
  attributes: Attribute[]
  count: number
  weight: number | null
}
interface Relation {
  subject: string
  object: string
  predicate: string
}
interface GraphResponse {
  entities: Entity[]
  relations: Relation[]
}

// 接收 zoom 及选中实体
const props = defineProps<{ zoom: number; selectedEntity: string | null }>()

const graphContainer = ref<HTMLElement | null>(null)
const graphData = ref<GraphResponse | null>(null)
const svgRef = ref<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null)
const zoomBehaviorRef = ref<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
const zoomGroupRef = ref<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
const tooltipRef = ref<d3.Selection<HTMLDivElement, unknown, null, undefined> | null>(null)

const fetchGraph = async () => {
  try {
    const { data } = await axios.get<GraphResponse>('/api/graph')
    data.entities.forEach((e) => {
      if (e.weight == null || isNaN(e.weight as any)) {
        e.weight = Math.random()
      }
    })
    graphData.value = data
  } catch (err) {
    console.error('[KnowledgeGraph] 读取图数据失败', err)
  }
}

onMounted(async () => {
  await fetchGraph()
  await nextTick()
  if (graphContainer.value && graphData.value) {
    drawGraph()
    // 初始应用 zoom
    if (props.zoom !== 1 && zoomBehaviorRef.value && svgRef.value) {
      svgRef.value.call(zoomBehaviorRef.value.scaleTo as any, props.zoom)
    }
  }
})

// 监听 zoom 变化
watch(
  () => props.zoom,
  (newScale) => {
    if (zoomBehaviorRef.value && svgRef.value) {
      svgRef.value.transition().duration(300).call(zoomBehaviorRef.value.scaleTo as any, newScale)
    }
  }
)

// 监听选中实体变化，高亮并触发悬浮提示
watch(
  () => props.selectedEntity,
  (entity) => {
    const zoomGroup = zoomGroupRef.value
    if (!zoomGroup) return
    // 重置样式
    zoomGroup.selectAll('circle')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
    if (entity) {
      // 找到对应节点
      const target = zoomGroup.selectAll<SVGCircleElement, any>('circle').filter((d) => d.entity === entity)
      if (!target.empty()) {
        // 高亮
        target.attr('stroke', '#f43f5e').attr('stroke-width', 4)
        // 触发鼠标悬浮，显示 tooltip
        target.dispatch('mouseover')
      }
    } else {
      // 隐藏 tooltip
      tooltipRef.value?.classed('hidden', true)
    }
  }
)

function drawGraph() {
  const container = graphContainer.value!
  const { entities, relations } = graphData.value!
  const width = container.clientWidth
  const height = container.clientHeight || 600

  // 清理旧图与 tooltip
  d3.select(container).select('svg').remove()
  d3.select(container).selectAll('.kg-tooltip').remove()

  const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
  svgRef.value = svg

  // 初始化 tooltip
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'kg-tooltip bg-base-100 text-base-content border border-base-300 p-2 rounded-lg shadow-lg hidden absolute z-50')
  tooltipRef.value = tooltip

  // 初始化 zoom
  const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 2])
    .on('zoom', (event) => {
      zoomGroupRef.value?.attr('transform', event.transform)
    })
  zoomBehaviorRef.value = zoomBehavior
  svg.call(zoomBehavior)

  // 数据转换
  const nodes: any[] = entities.map((e) => ({ ...e, id: e.entity }))
  const links: any[] = relations.map((r) => ({ source: r.subject, target: r.object, predicate: r.predicate }))

  const radiusScale = d3.scaleSqrt<number, number>().domain([0, 1]).range([6, 26])
  const colorScale = d3.scaleOrdinal<string, string>(d3.schemeTableau10)

  // 力导模拟，增强向心
  const simulation = d3
    .forceSimulation(nodes)
    .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-100))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('x', d3.forceX(width / 2).strength(0.05))
    .force('y', d3.forceY(height / 2).strength(0.05))
    .force('collision', d3.forceCollide().radius((d: any) => radiusScale(d.weight!) + 4).strength(1))

  // 创建 zoom-group
  const zoomGroup = svg.append('g').attr('class', 'zoom-group')
  zoomGroupRef.value = zoomGroup

  // 绘制连线
  const link = zoomGroup
    .append('g')
    .attr('stroke', '#9CA3AF')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke-width', 1.5)

  // 绘制节点组
  const nodeGroup = zoomGroup
    .append('g')
    .selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .call(drag(simulation))

  // 圆与提示
  nodeGroup
    .append('circle')
    .attr('r', (d: any) => radiusScale(d.weight!))
    .attr('fill', (d: any) => colorScale(d.category))
    .attr('class', 'cursor-pointer stroke-base-100 stroke-2')
    .on('mouseover', function(event: MouseEvent, d: any) {
      tooltip
        .html(
          `<div class="font-bold text-sm">${d.entity}</div>
           <div class="text-xs">类型: ${d.category}</div>
           <div class="text-xs">权重: ${d.weight!.toFixed(2)}</div>
           <div class="text-sm text-primary cursor-pointer mt-1">点击查看完整详情</div>`
        )
        .classed('hidden', false)
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY + 10 + 'px')
    })
    .on('mousemove', function(event: MouseEvent) {
      tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY + 10 + 'px')
    })
    .on('mouseout', function() {
      tooltip.classed('hidden', true)
    })
    .on('click', function(event: MouseEvent, d: any) {
      d.weight = Math.min(1, (d.weight ?? 0) + 0.05)
      d3.select(this).transition().attr('r', radiusScale(d.weight!))
      simulation.alpha(0.3).restart()
    })

  // 标注文本
  nodeGroup
    .append('text')
    .text((d: any) => d.entity)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('class', 'text-xs fill-current pointer-events-none')

  // tick 布局和边界
  simulation.on('tick', () => {
    link
      .attr('x1', (d: any) => (d.source as any).x)
      .attr('y1', (d: any) => (d.source as any).y)
      .attr('x2', (d: any) => (d.target as any).x)
      .attr('y2', (d: any) => (d.target as any).y)

    nodes.forEach((d: any) => {
      const r = radiusScale(d.weight!)
      if (d.x - r < 0) { d.x = r; d.vx *= -1 }
      if (d.x + r > width) { d.x = width - r; d.vx *= -1 }
      if (d.y - r < 0) { d.y = r; d.vy *= -1 }
      if (d.y + r > height) { d.y = height - r; d.vy *= -1 }
    })

    nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
  })
}

function drag(sim: d3.Simulation<any, undefined>) {
  function dragstarted(event: d3.D3DragEvent<any, any, any>) {
    if (!event.active) sim.alphaTarget(0.3).restart()
    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }
  function dragged(event: d3.D3DragEvent<any, any, any>) {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }
  function dragended(event: d3.D3DragEvent<any, any, any>) {
    if (!event.active) sim.alphaTarget(0)
    event.subject.fx = null
    event.subject.fy = null
  }
  return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended)
}
</script>

<style scoped>
.title {
  pointer-events: none;
}
</style>
