<!-- 班级列表组件 StudySpecialized.vue -->
<template>
  <el-card class="specialized-card">
    <template #header>
      <div class="card-header">
        <el-button style="margin-right: 2%" type="primary" @click="$emit('back')"
          >查看学情总览</el-button
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
      <el-table-column prop="id" label="学号" width="180" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="major" label="专业" />
      <el-table-column prop="email" label="邮箱" />
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted, watchEffect } from 'vue'
import { ElLoading, ElMessage } from 'element-plus'
import axios from '@/services/api'

const classes = ref([])
const selectedClass = ref('')
const students = ref([])
// 获取教师班级信息
const fetchClasses = async () => {
  try {
    const res = await axios.get('/api/teacher')
    // 确保 data.classes 存在
    const data = res.data
    if (data && Array.isArray(data.classes)) {
      classes.value = data.classes

      // 如果有班级数据，自动选择第一个班级
      if (classes.value.length > 0) {
        selectedClass.value = classes.value[0].className
        await handleClassChange(classes.value[0].className)
      }
    }

    // 添加空数据提示
    if (!classes.value.length) {
      ElMessage.warning('暂无班级信息')
    }
  } catch (error) {
    console.error('获取班级失败:', error)
    ElMessage.error('班级信息加载失败')
  }
}

// 班级选择变化处理
const handleClassChange = async (className) => {
  if (!className) {
    students.value = []
    return
  }

  const loading = ElLoading.service()
  try {
    const res = await axios.get(`/api/teacher/class?className=${className}`)
    const data = res.data
    // 修改这里：从返回的 classes 数组中找到对应班级的学生列表
    const targetClass = data.classes.find((c) => c.className === className)
    students.value = targetClass?.students || []

    if (!students.value.length) {
      ElMessage.info(`${className}暂无学生信息`)
    }
  } catch (error) {
    console.error('获取学生列表失败:', error)
    ElMessage.error('学生信息加载失败')
  } finally {
    loading.close()
  }
}

// 学生行点击处理
const handleRowClick = (student) => {
  emit('show-detail', student.id)
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
