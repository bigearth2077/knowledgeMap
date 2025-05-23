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
        // 后端若返回 weight=null，则随机分配
        data.entities.forEach((e) => {
          if (e.weight == null || isNaN(e.weight as any)) {
            e.weight = Math.random()
          }
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
