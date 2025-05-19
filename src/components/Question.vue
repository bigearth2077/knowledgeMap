<template>
  <div class="question-manage">
    <!-- 操作工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">添加题目</el-button>
    </div>

    <!-- 题目表格 -->
    <el-table :data="questionList" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="question" label="题目内容" min-width="300" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑题目' : '添加题目'" width="600px">
      <el-form :model="formData" :rules="rules" ref="formRef">
        <el-form-item label="题目内容" prop="question">
          <el-input
            v-model="formData.question"
            type="textarea"
            :rows="4"
            placeholder="请输入题目内容"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

// 题目列表数据
const questionList = ref([])

// 对话框相关状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = reactive({
  id: null,
  question: '',
})

// 表单验证规则
const rules = reactive({
  question: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
})

// 获取题目列表
const fetchQuestions = async () => {
  try {
    const res = await axios.get('/api/teacher/questions')
    questionList.value = res.data.questions
  } catch (error) {
    ElMessage.error('获取题目列表失败')
  }
}

// 添加题目
const addQuestion = async () => {
  try {
    await axios.post('/api/teacher/questions', {
      question: formData.question,
    })
    ElMessage.success('添加成功')
    fetchQuestions()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

// 修改题目
const updateQuestion = async () => {
  try {
    await axios.put('/api/teacher/questions', {
      id: formData.id,
      question: formData.question,
    })
    ElMessage.success('修改成功')
    fetchQuestions()
  } catch (error) {
    ElMessage.error('修改失败')
  }
}

// 删除题目
const deleteQuestion = async (id) => {
  try {
    await axios.delete('/api/teacher/questions', {
      data: { id },
    })
    ElMessage.success('删除成功')
    fetchQuestions()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 操作处理
const handleAdd = () => {
  isEdit.value = false
  formData.id = null
  formData.question = ''
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  formData.id = row.id
  formData.question = row.question
  dialogVisible.value = true
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定删除该题目吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteQuestion(id)
  })
}

// 表单提交
const formRef = ref()
const submitForm = async () => {
  await formRef.value.validate()
  isEdit.value ? await updateQuestion() : await addQuestion()
  dialogVisible.value = false
}

// 初始化加载
onMounted(() => {
  fetchQuestions()
})
</script>

<style scoped>
.question-manage {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.el-textarea {
  width: 80%;
}
</style>
