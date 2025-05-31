<template>
    <div class="p-6">
      <!-- 统计卡片 -->
      <div class="card bg-base-100 shadow-lg mb-6">
        <div class="card-body">
          <h2 class="card-title">学习统计</h2>
          <!-- 知识点进度 -->
          <div class="mt-4">
            <p class="text-sm mb-1">
              知识点进度：{{ completedEntities }} / {{ totalEntities }} （{{ progressPercentage }}%）
            </p>
            <progress
              class="progress progress-success w-full"
              :value="completedEntities"
              :max="totalEntities"
            ></progress>
          </div>
          <!-- 学习时长统计 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div class="bg-base-200 p-4 rounded-lg">
              <p class="text-sm">总学习时长</p>
              <p class="text-2xl font-bold">{{ formattedTotalStudyTime }}</p>
            </div>
            <div class="bg-base-200 p-4 rounded-lg">
              <p class="text-sm">本周学习时长</p>
              <p class="text-2xl font-bold">{{ formattedWeekStudyTime }}</p>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 历史测评记录 -->
      <div>
        <h2 class="text-2xl font-bold mb-4">历史测评记录</h2>
        <div class="space-y-4">
          <div
            v-for="(record, index) in scoreHistories"
            :key="index"
            class="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box"
          >
            <input type="checkbox" />
            <!-- Collapse 标题：时间戳 + 等级徽章 -->
            <div class="collapse-title flex justify-between items-center px-4 py-2 pr-12">
              <span>{{ formatTimestamp(record.timestamp) }}</span>
              <span
                class="badge text-white ml-2"
                :class="{
                  'badge-success': getLevel(record.judgement) === 'A',
                  'badge-primary': getLevel(record.judgement) === 'B',
                  'badge-warning': getLevel(record.judgement) === 'C',
                  'badge-error': getLevel(record.judgement) === 'D'
                }"
              >
                {{ getLevel(record.judgement) }}
              </span>
            </div>
  
            <!-- Collapse 内容：问答 + 评语 -->
            <div class="collapse-content px-4 pb-4 pt-2">
              <!-- 问答列表 -->
              <div class="space-y-4 mb-4">
                <div
                  v-for="(question, qIndex) in record.history.questions"
                  :key="qIndex"
                  class="p-4 bg-base-200 rounded-lg"
                >
                  <p class="font-semibold flex items-center space-x-2">
                    <span class="badge badge-xs badge-primary">{{ qIndex + 1 }}</span>
                    <span>Q{{ qIndex + 1 }}：{{ question }}</span>
                  </p>
                  <p class="mt-2 pl-6">A：{{ record.history.answers[qIndex] }}</p>
                </div>
              </div>
              <!-- 平台评语 -->
              <div class="p-4 bg-base-300 rounded-lg">
                <p class="font-semibold">评语：</p>
                <p class="mt-2">{{ stripJudgement(record.judgement) }}</p>
              </div>
            </div>
          </div>
          <!-- 无记录时的提示 -->
          <div v-if="!scoreHistories.length" class="text-center text-gray-500">
            暂无测评记录
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import axios from '@/services/api'
  
  interface History {
    questions: string[]
    answers: string[]
  }
  
  interface ScoreRecord {
    judgement: string
    history: History
    timestamp: string
  }
  
  const scoreHistories = ref<ScoreRecord[]>([])
  const completedEntities = ref<number>(0)
  const totalEntities = ref<number>(0)
  const totalStudyTime = ref<number>(0)
  const weekStudyTime = ref<number>(0)
  
  onMounted(async () => {
    try {
      const response = await axios.get('/api/student/study')
      const data = response.data
      scoreHistories.value = data.scoreHistories
      completedEntities.value = data.completedEntities
      totalEntities.value = data.totalEntities
      totalStudyTime.value = data.totalStudyTime
      weekStudyTime.value = data.weekStudyTime
    } catch (error) {
      console.error('获取学习记录失败：', error)
    }
  })
  
  const progressPercentage = computed(() => {
    if (totalEntities.value === 0) return 0
    return Math.round((completedEntities.value / totalEntities.value) * 100)
  })
  
  function formatTime(minutes: number): string {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) {
      return `${hrs}小时 ${mins}分钟`
    }
    return `${mins}分钟`
  }
  
  const formattedTotalStudyTime = computed(() => formatTime(totalStudyTime.value))
  const formattedWeekStudyTime = computed(() => formatTime(weekStudyTime.value))
  
  function formatTimestamp(iso: string): string {
    const date = new Date(iso)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
  }
  
  // 从评语中提取等级（A/B/C/D）
  function getLevel(judgement: string): string {
    const match = judgement.trim().charAt(0)
    return ['A', 'B', 'C', 'D'].includes(match) ? match : 'D'
  }
  
  // 去掉评语开头的 “X.”
  function stripJudgement(judgement: string): string {
    return judgement.replace(/^[A-D]\.\s*/, '')
  }
  </script>
  