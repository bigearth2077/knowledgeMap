<template>
  <div class="question-manage">
    <!-- 操作工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">添加题目</el-button>
      <el-button type="success" @click="handleBatchAdd" style="margin-left: 10px">
        批量添加题目
      </el-button>
    </div>

    <!-- 题目表格 -->
    <el-table :data="questionList" border stripe>
      <!-- ID 列 -->
      <el-table-column prop="id" label="ID" width="80" />

      <!-- 内容列 -->
      <el-table-column prop="content" label="题目内容" min-width="300" />

      <!-- 难度列，用 el-tag 显示徽章 -->
      <el-table-column label="难度" width="120">
        <template #default="{ row }">
          <el-tag
            :type="row.level === 'easy' ? 'success' : row.level === 'medium' ? 'warning' : 'danger'"
            effect="plain"
          >
            {{ row.level === 'easy' ? '简单' : row.level === 'medium' ? '中等' : '困难' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 操作列 -->
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
        <!-- 题目内容 -->
        <el-form-item label="题目内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="4"
            placeholder="请输入题目内容"
          />
        </el-form-item>

        <!-- 难度选择 -->
        <el-form-item label="难度" prop="level">
          <el-select v-model="formData.level" placeholder="请选择难度">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 批量添加对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批量添加题目" width="700px">
      <div style="margin-bottom: 16px; line-height: 1.6">
        <p>
          请按如下格式粘贴文本，每行表示一条题目，并用半角竖线
          <code>|</code> 分隔“题目内容”和“难度”：
        </p>
        <pre style="background: #f5f7fa; padding: 10px; border-radius: 4px">
内容1|easy
内容2|medium
内容3|hard
        </pre>
        <p>其中“难度”只能是 <code>easy</code>、<code>medium</code> 或 <code>hard</code>。</p>
      </div>
      <el-form ref="batchFormRef">
        <el-form-item label="批量文本" required>
          <el-input
            v-model="batchText"
            type="textarea"
            :rows="10"
            placeholder="请按格式每行输入：题目内容|难度"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatch">确认上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from '@/services/api'

// -------------------- 列表与单条增删改相关 --------------------
const questionList = ref([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = reactive({
  id: null,
  content: '',
  level: '',
})
const rules = reactive({
  content: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
  level: [{ required: true, message: '请选择题目难度', trigger: 'change' }],
})
const formRef = ref()

const fetchQuestions = async () => {
  try {
    const res = await axios.get('/api/teacher/questions')
    questionList.value = res.data.questions
  } catch (error) {
    ElMessage.error('获取题目列表失败')
  }
}

const addQuestion = async (payload) => {
  // payload: { content, level }
  try {
    await axios.post('/api/teacher/questions', payload)
  } catch (error) {
    throw error
  }
}

const updateQuestion = async () => {
  try {
    await axios.put('/api/teacher/questions', {
      id: formData.id,
      content: formData.content,
      level: formData.level,
    })
    ElMessage.success('修改成功')
    fetchQuestions()
  } catch (error) {
    ElMessage.error('修改失败')
  }
}

const deleteQuestion = async (id) => {
  try {
    await axios.delete(`/api/teacher/questions?id=${id}`)
    ElMessage.success('删除成功')
    fetchQuestions()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const handleAdd = () => {
  isEdit.value = false
  formData.id = null
  formData.content = ''
  formData.level = ''
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  formData.id = row.id
  formData.content = row.content
  formData.level = row.level
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

const submitForm = async () => {
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      await updateQuestion()
    } else {
      // 单条添加
      try {
        await addQuestion({
          content: formData.content,
          level: formData.level,
        })
        ElMessage.success('添加成功')
        fetchQuestions()
      } catch (err) {
        ElMessage.error('添加失败')
      }
    }
    dialogVisible.value = false
  } catch (e) {
    // 表单校验未通过时，不执行任何操作
  }
}

// -------------------- 批量添加相关 --------------------
const batchDialogVisible = ref(false)
const batchText = ref('')
const batchFormRef = ref()

const handleBatchAdd = () => {
  batchText.value = ''
  batchDialogVisible.value = true
}

/**
 * submitBatch：
 * 1. 按行拆分 batchText，去除空白行
 * 2. 每行按 '|' 拆分：左侧当 content，右侧当 level
 * 3. 校验：必须有且仅有两部分；level 必须是 easy/medium/hard
 * 4. 如果任意行不合法，提示并返回
 * 5. 否则构造成数组，遍历调用 addQuestion（或 Promise.all 批量请求）
 */
const submitBatch = async () => {
  const raw = batchText.value.trim()
  if (!raw) {
    ElMessage.error('请先输入或粘贴批量题目数据')
    return
  }

  // 1. 拆行
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  if (lines.length === 0) {
    ElMessage.error('无有效行，请检查输入')
    return
  }

  // 2. 解析并校验每行
  const parsedList = [] // 每一项：{ content, level, _lineNum }
  const errors = [] // 校验错误信息
  const allowedLevels = ['easy', 'medium', 'hard']

  lines.forEach((line, idx) => {
    const lineNum = idx + 1
    const parts = line.split('|')
    if (parts.length !== 2) {
      errors.push(`第 ${lineNum} 行格式错误：应当用“|”一分为二，共两部分`)
      return
    }
    const content = parts[0].trim()
    const level = parts[1].trim().toLowerCase()
    if (!content) {
      errors.push(`第 ${lineNum} 行的题目内容为空`)
      return
    }
    if (!allowedLevels.includes(level)) {
      errors.push(
        `第 ${lineNum} 行的难度“${parts[1].trim()}”不合法，应当是 easy、medium 或 hard 中之一`,
      )
      return
    }
    parsedList.push({ content, level, _lineNum: lineNum })
  })

  if (errors.length > 0) {
    // 将所有错误合并后提示
    ElMessageBox.alert(errors.join('\n'), '批量添加格式校验未通过', {
      confirmButtonText: '确定',
      type: 'error',
    })
    return
  }

  // 3. 批量提交：用 Promise.all 并行调用单条新增接口
  const addPromises = parsedList.map((item) =>
    addQuestion({ content: item.content, level: item.level }).catch((err) => {
      return { __error: true, line: item._lineNum }
    }),
  )

  const results = await Promise.all(addPromises)
  const failedLines = results
    .map((res, i) => (res && res.__error ? parsedList[i]._lineNum : null))
    .filter((x) => x !== null)

  if (failedLines.length > 0) {
    ElMessage.error(`部分题目上传失败（行：${failedLines.join('、')}）`)
  } else {
    ElMessage.success('批量添加全部成功')
  }
  batchDialogVisible.value = false
  fetchQuestions()
}

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

/* 让多行输入框更宽一些 */
.el-textarea {
  width: 90%;
}
</style>
