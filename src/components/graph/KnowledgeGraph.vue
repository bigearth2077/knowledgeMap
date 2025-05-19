<template>
  <!-- Responsive container for the D3 canvas -->
  <div
    ref="graphContainer"
    class="flex-1 w-full h-full bg-base-200 rounded-lg"
    :style="{ height: `calc(100vh - 4rem - 2rem)` }"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
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

const graphContainer = ref<HTMLElement | null>(null)
const graphData = ref<GraphResponse | null>(null)

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
  }
})

function drawGraph() {
  const container = graphContainer.value!
  const { entities, relations } = graphData.value!
  const width = container.clientWidth
  const height = container.clientHeight || 600

  d3.select(container).select('svg').remove()
  d3.select(container).selectAll('.kg-tooltip').remove()

  const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)

  const tooltip = d3
    .select('body')
    .append('div')
    .attr(
      'class',
      'kg-tooltip bg-base-100 text-base-content border border-base-300 p-2 rounded-lg shadow-lg hidden absolute z-50',
    )

  const nodes: any[] = entities.map((e) => ({ ...e, id: e.entity }))
  const links: any[] = relations.map((r) => ({
    source: r.subject,
    target: r.object,
    predicate: r.predicate,
  }))

  const radiusScale = d3.scaleSqrt<number, number>().domain([0, 1]).range([6, 26])
  const colorScale = d3.scaleOrdinal<string, string>(d3.schemeTableau10)

  // 增加向心力：使用 forceX 和 forceY 并设置较高 strength
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
    .force('x', d3.forceX(width / 2).strength(0.03))
    .force('y', d3.forceY(height / 2).strength(0.03))
    .force(
      'collision',
      d3
        .forceCollide()
        .radius((d: any) => radiusScale(d.weight!) + 4)
        .strength(1),
    )

  const link = svg
    .append('g')
    .attr('stroke', '#9CA3AF')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke-width', 1.5)

  const nodeGroup = svg
    .append('g')
    .selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .call(drag(simulation))

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
    .on('mouseout', function () {
      tooltip.classed('hidden', true)
    })
    .on('click', function (event: MouseEvent, d: any) {
      d.weight = Math.min(1, (d.weight ?? 0) + 0.05)
      d3.select(this).transition().attr('r', radiusScale(d.weight!))
      simulation.alpha(0.3).restart()
    })

  nodeGroup
    .append('text')
    .text((d: any) => d.entity)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('class', 'text-xs fill-current pointer-events-none')

  simulation.on('tick', () => {
    link
      .attr('x1', (d: any) => (d.source as any).x)
      .attr('y1', (d: any) => (d.source as any).y)
      .attr('x2', (d: any) => (d.target as any).x)
      .attr('y2', (d: any) => (d.target as any).y)

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
