<template>
  <!-- 包裹图谱与实体详情抽屉 -->
  <div class="relative flex-1 w-full h-full">
    <!-- D3 知识图谱容器 -->
    <div
      ref="graphContainer"
      class="flex-1 w-full h-full bg-base-200 rounded-lg"
      :style="{ height: `calc(100vh - 4rem - 2rem)` }"
    ></div>

    <!-- 实体详情抽屉 -->
    <EntityDetail
      v-if="selectedEntity"
      :entity="selectedEntity"
      @close="selectedEntity = null"
      style="z-index: 100"
    />
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

/** 渲染主流程 **/
function drawGraph(data: GraphResponse) {
  const container = graphContainer.value!
  const { entities, relations } = data
  const width = container.clientWidth
  const height = container.clientHeight || 600

  // 清理旧图及 tooltip
  d3.select(container).select('svg').remove()
  d3.select(container).selectAll('.kg-tooltip').remove()

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

  // Zoom 行为
  const zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 2])
    .on('zoom', (event) => {
      zoomGroupRef.value?.attr('transform', event.transform)
    })
  zoomBehaviorRef.value = zoomBehavior
  svg.call(zoomBehavior)

  // 数据转换
  const nodes: any[] = entities.map((e) => ({ ...e, id: e.entity }))
  const links: any[] = relations.map((r) => ({
    source: r.subject,
    target: r.object,
    predicate: r.predicate,
  }))

  const radiusScale = d3.scaleSqrt<number, number>().domain([0, 1]).range([6, 26])
  const colorScale = d3.scaleOrdinal<string, string>(d3.schemeTableau10)

  // 力导模拟
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id((d: any) => d.id)
        .distance(100),
    )
    .force('charge', d3.forceManyBody().strength(-100))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force(
      'collision',
      d3
        .forceCollide()
        .radius((d: any) => radiusScale(d.weight!) + 4)
        .strength(1),
    )

  // 画布容器
  const zoomGroup = svg.append('g').attr('class', 'zoom-group')
  zoomGroupRef.value = zoomGroup

  const link = zoomGroup
    .append('g')
    .attr('class', 'links')
    .selectAll('path')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('fill', 'none')
    .attr('stroke', '#9CA3AF')
    .attr('stroke-width', 1.5)
    .attr('marker-end', 'url(#arrow)')
    .attr('id', (_d, i) => `linkPath${i}`) // ← 这里

  const linkLabels = zoomGroup
    .append('g')
    .attr('class', 'link-labels')
    .selectAll('text')
    .data(links)
    .enter()
    .append('text')
    .attr('font-size', '10px')
    .attr('fill', '#6B7280')
    .append('textPath')
    .attr('href', (_d, i) => `#linkPath${i}`) // ← 对应上面的 id
    .attr('startOffset', '50%') // 居中
    .attr('text-anchor', 'middle')
    .text((d) => d.predicate)

  svg
    .append('defs')
    .append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 15) // 箭头位置，可根据节点半径微调
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#9CA3AF')

  // 连线
  zoomGroup
    .append('g')
    .attr('stroke', '#9CA3AF')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke-width', 1.5)

  // 节点组
  const nodeGroup = zoomGroup
    .append('g')
    .selectAll('g')
    .data(nodes)
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

  // 圆和文字
  nodeGroup
    .append('circle')
    .attr('r', (d: any) => radiusScale(d.weight!))
    .attr('fill', (d: any) => colorScale(d.category))
    .attr('class', 'cursor-pointer stroke-base-100 stroke-2')
    .on('mouseover', function (event: MouseEvent, d: any) {
      tooltip
        .html(
          `
          <div class="font-bold text-sm">${d.entity}</div>
          <div class="text-xs">类型: ${d.category}</div>
          <div class="text-xs">权重: ${d.weight!.toFixed(2)}</div>
          <div class="text-sm text-primary cursor-pointer mt-1">点击查看完整详情</div>
        `,
        )
        .classed('hidden', false)
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY + 10 + 'px')
    })
    .on('mousemove', function (event: MouseEvent) {
      tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY + 10 + 'px')
    })
    .on('mouseout', () => tooltip.classed('hidden', true))
    .on('click', (_event, d: any) => {
      selectedEntity.value = d.entity
    })

  nodeGroup
    .append('text')
    .text((d: any) => d.entity)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('class', 'text-xs fill-current pointer-events-none')

  // 布局更新
  simulation.on('tick', () => {
    link.attr('d', (d: any) => {
      let sx = d.source.x,
        sy = d.source.y,
        tx = d.target.x,
        ty = d.target.y
      const dx = tx - sx,
        dy = ty - sy,
        dr = Math.sqrt(dx * dx + dy * dy)
      // 如果目标在左边，就调换起点和终点，并反向弧度标记
      let sweep = 1
      if (tx < sx) {
        ;[sx, sy, tx, ty] = [tx, ty, sx, sy]
        sweep = 0
      }
      return `M${sx},${sy}A${dr},${dr} 0 0,${sweep} ${tx},${ty}`
    })

    // 更新标签位置到连线中点
    linkLabels
      .attr('x', (d: any) => ((d.source as any).x + (d.target as any).x) / 2)
      .attr('y', (d: any) => ((d.source as any).y + (d.target as any).y) / 2)

    nodes.forEach((d: any) => {
      const r = radiusScale(d.weight!)
      if (d.x - r < 0) {
        d.x = r
        d.vx *= -1
      }
      if (d.x + r > width) {
        d.x = width - r
        d.vx *= -1
      }
      if (d.y - r < 0) {
        d.y = r
        d.vy *= -1
      }
      if (d.y + r > height) {
        d.y = height - r
        d.vy *= -1
      }
    })

    nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
  })
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
