import { defineStore } from 'pinia'
import axios from 'axios'

// 与后端返回结构保持一致
export interface Attribute {
  attribute: string
  value: string
}
export interface Entity {
  entity: string
  category: string
  attributes: Attribute[]
  count: number
  weight: number | null
}
export interface Relation {
  subject: string
  object: string
  predicate: string
}
export interface GraphResponse {
  entities: Entity[]
  relations: Relation[]
}

export const useGraphStore = defineStore('graph', {
  state: () => ({
    graphData: null as GraphResponse | null,
    loading: false as boolean,
    error: '' as string,
  }),
  actions: {
    async fetchGraph() {
      this.loading = true
      this.error = ''
      try {
        const { data } = await axios.get<GraphResponse>('/api/graph')

        // 1. 处理非法 count 值
        data.entities.forEach((e) => {
          e.count = e.count === null || isNaN(e.count as any) ? 1 : e.count
        })

        // 1. 先确定目标权重范围
        const minWeight = 0.5
        const maxWeight = 3

        // 2. 统计 count 的最小值和最大值（此处最小值通常是 1）
        const counts = data.entities.map((e) => e.count)
        const minCount = Math.min(...counts)
        const maxCount = Math.max(...counts)

        // 3. 计算 log 域的最小/最大值，防止除 0
        const logMin = Math.log(minCount + 1)
        const logMax = Math.log(maxCount + 1)
        const logRange = logMax - logMin || 1

        // 4. 赋值 weight：先做 log 归一化，再映射到 [minWeight, maxWeight]
        data.entities.forEach((e) => {
          const logVal = Math.log(e.count + 1)
          const t = (logVal - logMin) / logRange // 归一化到 [0,1]
          e.weight = minWeight + t * (maxWeight - minWeight)
        })

        this.graphData = data
      } catch (err: any) {
        console.error('[GraphStore] fetchGraph failed', err)
        this.error = err.message || 'Unknown error'
      } finally {
        this.loading = false
      }
    },
  },
})
