<!-- 父组件 ParentComponent.vue -->
<template>
  <div class="study-container">
    <StudyOverView
      v-if="currentView === 'overview'"
      :chart-data="chartData"
      @show-specialized="handleShowSpecialized"
    />
    <StudySpecialized
      v-if="currentView === 'specialized'"
      @show-detail="handleShowDetail"
      @back="currentView = 'overview'"
    />
    <StudentDetail
      v-if="currentView === 'detail'"
      :student-id="selectedStudentId"
      @back="currentView = 'specialized'"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import StudyOverView from './study/StudyOverView.vue'
import StudySpecialized from './study/StudySpecialized.vue'
import StudentDetail from './study/StudentDetail.vue'

const currentView = ref('overview')
const selectedStudentId = ref(null)
const chartData = reactive({
  A: 0,
  B: 0,
  C: 0,
  D: 0,
  E: 0,
  F: 0,
  comment_ai: '',
})

// 处理视图切换
const handleShowSpecialized = () => {
  currentView.value = 'specialized'
}

const handleShowDetail = (studentId) => {
  selectedStudentId.value = studentId
  currentView.value = 'detail'
}
</script>

<style scoped>
.study-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}
</style>
