<template>
  <!-- 包裹图谱与实体详情抽屉 -->
  <div class="relative flex-1 w-full h-full">
    <!-- D3 知识图谱容器 -->
    <div ref="graphContainer" class="flex-1 w-full h-full bg-base-200 rounded-lg"></div>

    <!-- 实体详情抽屉 -->
    <EntityDetail v-if="selectedEntity" :entity="selectedEntity" @close="selectedEntity = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import * as d3 from 'd3'
import { useGraphStore } from '@/stores/graphStore'
import EntityDetail from '@/components/graph/EntityDetail.vue'
import debounce from 'lodash/debounce'
import isEqual from 'lodash/isEqual'

/** 类型定义 **/
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

// Pinia store
const graphStore = useGraphStore()

// 接收外部Props
const props = defineProps<{
  zoom: number
  selectedEntity: string | null
  filteredEntities?: string[]
}>()
// 发射打开详情事件
const emit = defineEmits<{ (e: 'open-details', entity: string): void }>()

// DOM & D3 引用
const graphContainer = ref<HTMLElement | null>(null)
const svgRef = ref<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null)
const zoomBehaviorRef = ref<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
const zoomGroupRef = ref<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
const prevFilter = ref<string[]>([])

// 当前选中，用于详情抽屉
const selectedEntity = ref<string | null>(null)

// 初始加载图数据并渲染
onMounted(async () => {
  await graphStore.fetchGraph()
  await nextTick()
  const data = graphStore.graphData
  if (graphContainer.value && data) {
    drawGraph(data)
    // 初始应用 zoom
    if (props.zoom !== 1 && zoomBehaviorRef.value && svgRef.value) {
      svgRef.value.call(zoomBehaviorRef.value.scaleTo as any, props.zoom)
    }
  }
})

// 响应 zoom 改变
watch(
  () => props.zoom,
  (newScale) => {
    if (zoomBehaviorRef.value && svgRef.value) {
      svgRef.value
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.value.scaleTo as any, newScale)
    }
  },
)

// 若全局数据更新，重绘
watch(
  () => graphStore.graphData,
  (data) => {
    if (data && graphContainer.value) {
      drawGraph(data)
    }
  },
)

// 选中实体变化，展示抽屉
watch(
  () => props.selectedEntity,
  (entity) => {
    if (entity) {
      selectedEntity.value = entity
    }
  },
)

//防抖函数
const doFilterDraw = debounce((list: string[]) => {
  // 如果和上一次列表相同，就不用重绘
  if (isEqual(list, prevFilter.value)) return

  // 否则更新缓存、计算子图并重绘
  prevFilter.value = [...list]
  const data = graphStore.graphData!
  const sub = getSubgraph(data, list)
  drawGraph(sub)
}, 300)

// 搜索过滤列表变化，生成子图并重绘
watch(
  () => props.filteredEntities,
  (list) => {
    doFilterDraw(list || [])
  },
)

// 在 <script setup> 的末尾，紧跟其他 watch 逻辑后面，添加：
watch(selectedEntity, (val) => {
  if (val === null) {
    // 清空上一次的过滤缓存
    prevFilter.value = []
    // 用全量数据重绘
    const fullData = graphStore.graphData
    if (fullData && graphContainer.value) {
      drawGraph(fullData)
      // 并且恢复到当前的 zoom 比例（如果有需要）
      if (props.zoom !== 1 && zoomBehaviorRef.value && svgRef.value) {
        svgRef.value.call(zoomBehaviorRef.value.scaleTo as any, props.zoom)
      }
    }
  }
})

/** 渲染主流程 **/
function drawGraph(data: GraphResponse) {
  const container = graphContainer.value!
  const { entities, relations } = data
  const width = container.clientWidth
  const height = container.clientHeight || 600

  // 清理旧图及 tooltip
  d3.select(container).select('svg').remove()
  d3.select('body').selectAll('.kg-tooltip').remove()

  // 新建 SVG
  const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
  svgRef.value = svg

  // Tooltip
  const tooltip = d3
    .select('body')
    .append('div')
    .attr(
      'class',
      'kg-tooltip bg-base-100 text-base-content border border-base-300 p-2 rounded-lg shadow-lg hidden absolute z-50',
    )

  // --- 数据预处理：实体节点 + 中间虚拟节点 ---
  const entityNodes = entities.map((e) => ({
    id: e.entity,
    weight: e.weight!,
    category: e.category,
    isMid: false,
    original: e,
  }))

  const midNodes: any[] = []
  const linkPairs: { source: string; target: string; relIndex: number }[] = []

  relations.forEach((r, i) => {
    const midId = `mid-${i}`
    midNodes.push({ id: midId, isMid: true })
    linkPairs.push(
      { source: r.subject, target: midId, relIndex: i },
      { source: midId, target: r.object, relIndex: i },
    )
  })

  const allNodes = [...entityNodes, ...midNodes]
  const allLinks = linkPairs.map((lp) => ({
    source: lp.source,
    target: lp.target,
    relIndex: lp.relIndex,
  }))

  // 比例尺 & 颜色
  const radiusScale = d3.scaleSqrt<number, number>().domain([0, 1]).range([6, 26])
  const colorScale = d3.scaleOrdinal<string, string>(d3.schemeTableau10)

  // 力导模拟
  const simulation = d3
    .forceSimulation(allNodes as any)
    .force(
      'link',
      d3
        .forceLink(allLinks as any)
        .id((d: any) => d.id)
        .distance((d) => (d.isMid ? 50 : 0))
        .strength(1),
    )
    .force('charge', d3.forceManyBody().strength(-200))
    .force(
      'collision',
      d3.forceCollide().radius((d: any) => (d.isMid ? 8 : radiusScale(d.weight) + 8)),
    )
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('x', d3.forceX(width / 2).strength(0.1))
    .force('y', d3.forceY(height / 2).strength(0.1))
    .alphaTarget(0.1)
    .alphaDecay(0.05)
    .velocityDecay(0.5)

  // 画布容器
  const zoomGroup = svg.append('g').attr('class', 'zoom-group')
  zoomGroupRef.value = zoomGroup

  // Zoom 行为
  const zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 2])
    .on('zoom', (event) => zoomGroup.attr('transform', event.transform))
  zoomBehaviorRef.value = zoomBehavior
  svg.call(zoomBehavior)

  // 箭头定义
  svg
    .append('defs')
    .append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 10)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#9CA3AF')

  // 绘制关系曲线 path（不包含中点节点）
  const relData = relations.map((r, i) => ({ ...r, index: i }))
  const linkCurves = zoomGroup
    .append('g')
    .attr('class', 'link-curves')
    .selectAll('path')
    .data(relData)
    .enter()
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', '#9CA3AF')
    .attr('stroke-width', 1.5)
    .attr('marker-end', 'url(#arrow)')
    .attr('id', (d) => `curvePath${d.index}`)

  // 关系标签
  const linkLabels = zoomGroup
    .append('g')
    .attr('class', 'link-labels')
    .selectAll('text')
    .data(relData)
    .enter()
    .append('text')
    .attr('font-size', '10px')
    .attr('fill', '#6B7280')
    .attr('text-anchor', 'middle')
    .text((d) => d.predicate)

  // 绘制实体节点
  const nodeGroup = zoomGroup
    .append('g')
    .selectAll('g')
    .data(entityNodes)
    .enter()
    .append('g')
    .call(
      d3
        .drag<SVGGElement, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }),
    )

  nodeGroup
    .append('circle')
    .attr('r', (d) => radiusScale(d.weight))
    .attr('fill', (d) => colorScale(d.category))
    .attr('class', 'cursor-pointer stroke-base-100 stroke-2')
    .on('mouseover', (event, d) => {
      tooltip
        .html(
          `
        <div class="font-bold text-sm">${d.id}</div>
        <div class="text-xs">类型: ${d.category}</div>
        <div class="text-xs">权重: ${d.weight.toFixed(2)}</div>
        <div class="text-sm text-primary cursor-pointer mt-1">点击查看完整详情</div>
      `,
        )
        .classed('hidden', false)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`)
    })
    .on('mousemove', (event) => {
      tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY + 10}px`)
    })
    .on('mouseout', () => tooltip.classed('hidden', true))
    .on('click', (_e, d: any) => {
      selectedEntity.value = d.id
      // 用已有的 doFilterDraw 过滤，只显示和当前节点有关的子图
      doFilterDraw([d.id])
    })

  nodeGroup
    .append('text')
    .text((d) => d.id)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('class', 'text-xs fill-current pointer-events-none')

  // Tick: 更新实体节点、曲线和标签
  simulation.on('tick', () => {
    linkCurves.attr('d', (d) => {
      const src = allNodes.find((n) => n.id === d.subject)!
      const mid = allNodes.find((n) => n.id === `mid-${d.index}`)!
      const tgt = allNodes.find((n) => n.id === d.object)!

      // 1. 计算 src–tgt 中点
      const mx = (src.x + tgt.x) / 2
      const my = (src.y + tgt.y) / 2

      // 2. 放大 mid 节点相对于中点的偏移量（factor 越大，曲度越大）
      const factor = 1.5 // 默认 1; 推荐 1.2 ~ 2 之间调试
      const cx = mx + (mid.x - mx) * factor
      const cy = my + (mid.y - my) * factor

      // 3. 二次贝塞尔
      return `M${src.x},${src.y} Q${cx},${cy} ${tgt.x},${tgt.y}`
    })

    // 关系文字放 mid
    linkLabels
      .attr('x', (d) => {
        const mid = allNodes.find((n) => n.id === `mid-${d.index}`)!
        return mid.x
      })
      .attr('y', (d) => {
        const mid = allNodes.find((n) => n.id === `mid-${d.index}`)!
        return mid.y
      })

    nodeGroup.attr('transform', (d) => `translate(${d.x},${d.y})`)
  })

  // 响应容器尺寸变化
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const newW = entry.contentRect.width
      const newH = entry.contentRect.height
      svg.attr('width', newW).attr('height', newH)
      simulation.force('center', d3.forceCenter(newW / 2, newH / 2))
      simulation.alpha(0.3).restart()
    }
  })
  resizeObserver.observe(container)
}

// 获取子图函数
function getSubgraph(data: GraphResponse, matched: string[]): GraphResponse {
  if (!matched?.length) return data
  const hit = new Set(matched)
  const neighbors = new Set<string>(matched)
  data.relations.forEach((r) => {
    if (hit.has(r.subject) || hit.has(r.object)) {
      neighbors.add(r.subject)
      neighbors.add(r.object)
    }
  })
  const ents = data.entities.filter((e) => neighbors.has(e.entity))
  const rels = data.relations.filter((r) => hit.has(r.subject) || hit.has(r.object))
  return { entities: ents, relations: rels }
}
</script>

<style scoped>
.title {
  pointer-events: none;
}
</style>
