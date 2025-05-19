<!-- 班级列表组件 StudySpecialized.vue -->
<template>
  <el-card class="specialized-card">
    <template #header>
      <div class="card-header">
        <el-button style="margin-right: 2%" icon="ArrowLeft" @click="$emit('back')"
          >返回总览</el-button
        >
        <span>班级学生列表</span>
      </div>
    </template>

    <el-select
      v-model="selectedClass"
      placeholder="请选择班级"
      class="class-selector"
      @change="handleClassChange"
    >
      <el-option
        v-for="item in classes"
        :key="item.classCode"
        :label="item.className"
        :value="item.className"
      />
    </el-select>

    <el-table :data="students" highlight-current-row @row-click="handleRowClick">
      <el-table-column prop="number" label="学号" width="180" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="major" label="专业" />
      <el-table-column label="性别">
        <template #default="{ row }">
          {{ row.sex === 0 ? '男' : '女' }}
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted, watchEffect } from 'vue'
import { ElLoading } from 'element-plus'
import axios from 'axios'

const classes = ref([])
const selectedClass = ref('')
const students = ref([])

watchEffect(() => {
  if (classes.value.length > 0) {
    selectedClass.value = classes.value[0].className
    // 自动加载第一个班级的学生
    handleClassChange(classes.value[0].className)
  }
})
// 获取教师班级信息
const fetchClasses = async () => {
  try {
    const res = await axios.get('/api/teacher')
    const data = res.data.data
    classes.value = data.classes

    // 如果接口返回空数组需要处理
    if (classes.value.length === 0) {
      console.warn('未找到班级信息')
    }
  } catch (error) {
    console.error('获取班级失败:', error)
    // 可以添加用户提示
    ElMessage.error('班级信息加载失败')
  }
}

// 班级选择变化处理
const handleClassChange = async (className) => {
  const loading = ElLoading.service()
  try {
    const res = await axios.get(`/api/teacher/class?className=${className}`)
    const data = res.data
    students.value = data.students
  } finally {
    loading.close()
  }
}

// 学生行点击处理
const handleRowClick = (student) => {
  emit('show-detail', student.number)
}

const emit = defineEmits(['back', 'show-detail'])

onMounted(async () => {
  await fetchClasses()
})
</script>

<style scoped>
.class-selector {
  margin-bottom: 20px;
  width: 300px;
}
</style>
