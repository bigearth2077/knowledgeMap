<template>
  <div class="relative w-full h-full p-4">
    <!-- 关闭按钮 -->
    <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2" @click="$emit('close')">
      ✕
    </button>

    <!-- 历史测评记录 -->
    <h2 class="text-2xl font-bold mb-4">历史测评记录</h2>
    <div v-if="isLoadingHistory" class="flex justify-center items-center h-32">
      <span class="loading loading-dots loading-lg"></span>
    </div>
    <div v-else>
      <div v-if="history.length" class="space-y-2">
        <div
          v-for="rec in history"
          :key="rec.id"
          class="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box"
        >
          <input type="checkbox" />
          <div class="collapse-title flex justify-between items-center">
            <span>{{ formatDate(rec.estimate_time) }}</span>
            <span :class="['badge', badgeClass(rec.score)]">{{ rec.score }}</span>
          </div>
          <div class="collapse-content">
            <p><strong>原因：</strong>{{ rec.reason }}</p>
            <p><strong>薄弱环节：</strong>{{ rec.weakness }}</p>
            <p><strong>学习方向：</strong>{{ rec.learning_direction }}</p>
            <div class="mt-4">
              <h3 class="font-semibold">问题与答案：</h3>
              <ul class="list-decimal list-inside">
                <li v-for="(q, i) in rec.questions" :key="i">
                  <p><strong>Q:</strong> {{ q }}</p>
                  <p><strong>A:</strong> {{ rec.answers[i] }}</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-gray-500">暂无测评记录</div>
    </div>

    <!-- 开始测评按钮 -->
    <button class="btn btn-primary mt-6" @click="openCountModal">开始测评</button>
  </div>

  <!-- 题数选择 Modal -->
  <div :class="['modal', showCountModal ? 'modal-open' : '']">
    <div class="modal-box relative max-w-sm">
      <button class="btn btn-sm btn-circle absolute right-2 top-2" @click="showCountModal = false">
        ✕
      </button>
      <h3 class="font-bold text-lg">选择题目数量</h3>
      <input
        type="number"
        v-model.number="questionCount"
        min="2"
        max="20"
        class="input input-bordered w-full mt-4"
        placeholder="2–20 之间"
      />
      <div class="modal-action">
        <button class="btn" @click="showCountModal = false">取消</button>
        <button class="btn btn-primary" @click="confirmQuestionCount">确定</button>
      </div>
    </div>
  </div>

  <!-- 答题 & 结果 Modal（更大） -->
  <div :class="['modal modal-bottom sm:modal-middle', showAnswerModal ? 'modal-open' : '']">
    <div class="modal-box relative w-full max-w-7xl max-h-[85vh] p-6 overflow-hidden">
      <!-- 取消/关闭 -->
      <button class="btn btn-sm btn-circle absolute right-2 top-2 z-10" @click="cancelAssessment">
        ✕
      </button>

      <!-- 答题区 -->
      <template v-if="!showResult">
        <h3 class="font-bold text-xl mb-4">请回答以下 {{ questions.length }} 道问题</h3>
        <div class="overflow-y-auto max-h-[70vh] pr-4 space-y-6">
          <div v-for="(q, i) in questions" :key="q.id">
            <p class="font-medium flex items-center space-x-2">
              <span>{{ i + 1 }}.</span>
              <span class="badge badge-xs" :class="levelClass(q.level)">
                {{ q.level }}
              </span>
              <span>{{ q.content }}</span>
            </p>
            <textarea
              v-model="answers[i]"
              class="textarea textarea-bordered w-full mt-2"
              rows="4"
              placeholder="请输入答案"
            ></textarea>
          </div>
        </div>
        <div class="mt-4 text-right">
          <button
            class="btn btn-success"
            :disabled="answers.some((a) => !a) || isLoading"
            @click="submitAnswers"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-sm mr-2"></span>
            {{ isLoading ? '提交中...' : '提交答案' }}
          </button>
        </div>
      </template>

      <!-- 结果展示区 -->
      <template v-else>
        <h3 class="font-bold text-xl mb-4">测评结果</h3>
        <div class="overflow-y-auto max-h-[70vh] pr-4 space-y-3">
          <p>
            <strong>等级：</strong>
            <span class="badge badge-lg" :class="badgeClass(result.score)">
              {{ result.score }}
            </span>
          </p>
          <p><strong>原因：</strong> {{ result.reason }}</p>
          <p><strong>薄弱环节：</strong> {{ result.weakness }}</p>
          <p><strong>学习方向：</strong> {{ result.learning_direction }}</p>
        </div>
        <div class="mt-4 text-right">
          <button class="btn btn-primary" @click="finishAssessment">确定</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/services/api'

const emit = defineEmits(['close'])

// --- 状态 ---
const history = ref([])
const isLoadingHistory = ref(false)

const showCountModal = ref(false)
const showAnswerModal = ref(false)
const questionCount = ref(5)

const questions = ref([]) // [{ id, content, level }, ...]
const answers = ref([])
const isLoading = ref(false)

const showResult = ref(false)
const result = ref({
  score: '',
  reason: '',
  weakness: '',
  learning_direction: '',
})

// --- 样式映射 ---
const badgeClass = (score) => {
  if (score === 'A') return 'badge-success'
  if (score === 'B') return 'badge-primary'
  if (score === 'C') return 'badge-warning'
  return 'badge-error'
}
const levelClass = (lvl) => {
  if (lvl === 'easy') return 'badge-success'
  if (lvl === 'medium') return 'badge-warning'
  return 'badge-error' // hard
}

// --- 时间格式化 ---
const pad = (n) => n.toString().padStart(2, '0')
const formatDate = (s) => {
  const d = new Date(s)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}
      ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// --- API 调用 ---
const fetchHistory = async () => {
  isLoadingHistory.value = true
  try {
    const { data } = await axios.get('/api/student/getScoreHistory')
    history.value = data.records
  } catch (e) {
    console.error(e)
  } finally {
    isLoadingHistory.value = false
  }
}

const openCountModal = () => {
  questionCount.value = 5
  showCountModal.value = true
}

const confirmQuestionCount = async () => {
  if (questionCount.value < 2 || questionCount.value > 20) {
    return alert('请输入 2–20 之间的题目数量')
  }
  showCountModal.value = false
  isLoading.value = true
  try {
    const { data } = await axios.post('/api/student/question', null, {
      params: { number: questionCount.value },
    })
    // data.questions 是 [{id, content, level}, ...]
    questions.value = data.questions
    answers.value = questions.value.map(() => '')
    showAnswerModal.value = true
  } catch (e) {
    alert('获取题目失败，请重试')
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

const submitAnswers = async () => {
  isLoading.value = true
  try {
    const payload = {
      question: questions.value.map((q) => q.content),
      answer: answers.value,
    }
    const { data } = await axios.post('/api/score', payload)
    result.value = data
    showResult.value = true
  } catch (e) {
    alert('提交失败，请重试')
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

const cancelAssessment = () => {
  showCountModal.value = false
  showAnswerModal.value = false
  showResult.value = false
}

const finishAssessment = () => {
  showAnswerModal.value = false
  showResult.value = false
  fetchHistory()
}

onMounted(fetchHistory)
</script>
