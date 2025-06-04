<template>
  <el-dialog v-model="visible" title="个人信息" width="600px" :close-on-click-modal="false">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <!-- 基本信息 -->
      <el-form-item label="姓名" prop="name">
        <el-input v-model="formData.name" />
      </el-form-item>

      <el-form-item label="性别" prop="sex">
        <el-select v-model="formData.sex">
          <el-option label="男" :value="0" />
          <el-option label="女" :value="1" />
          <el-option label="其他" :value="2" />
        </el-select>
      </el-form-item>

      <!-- 将“手机号”改为“邮箱” -->
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" />
      </el-form-item>

      <!-- 我的班级 分隔线 -->
      <el-divider>我的班级</el-divider>
      <!-- 班级信息 -->
      <div class="class-list">
        <div v-for="(cls, index) in formData.classes" :key="cls.classCode" class="class-item">
          <el-form-item
            :label="`班级 ${index + 1}`"
            :prop="`classes.${index}.className`"
            :rules="{ required: true, message: '班级名称不能为空', trigger: 'blur' }"
          >
            <div class="class-inputs">
              <el-input v-model="cls.className" placeholder="班级名称" style="flex: 1" />
              <el-input
                :model-value="cls.classCode"
                placeholder="班级代码"
                style="width: 120px; margin-left: 10px"
                disabled
              />
            </div>
          </el-form-item>
        </div>
      </div>

      <el-form-item>
        <el-button type="primary" @click="submitForm">保存修改</el-button>
        <el-button @click="visible = false">取消</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import axios from '@/services/api'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(false)
const formRef = ref<FormInstance>()
const formData = ref({
  name: '',
  sex: 0,
  email: '',
  classes: [] as Array<{ className: string; classCode: string }>,
})

// 表单验证规则：将手机号规则改为邮箱规则
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
}

// 获取教师信息
const fetchData = async () => {
  try {
    const response = await axios.get('/api/teacher')
    const data = response.data

    // 当后端直接返回 { name, email, classes } 时，classes 可能不存在或非数组，此处做安全校验
    if (!Array.isArray(data.classes)) {
      console.error('接口返回数据结构异常:', data)
      ElMessage.error('数据格式错误')
      return
    }

    formData.value = {
      name: data.name || '',
      // 如果后端没有 sex 字段，保持默认 0
      sex: typeof data.sex === 'number' ? data.sex : 0,
      email: data.email || '',
      classes: data.classes.map((c: any) => ({
        className: c.className || '未命名班级',
        classCode: c.classCode || '',
      })),
    }
  } catch (error) {
    console.error('获取数据失败', error)
    ElMessage.error('数据加载失败')
  }
}

// 提交修改
const submitForm = async () => {
  try {
    await formRef.value?.validate()
    // 这里直接把 formData.value 传给后端，后端会接收 name、sex、email、classes
    await axios.put('/api/teacher', formData.value)
    ElMessage.success('修改成功')
    visible.value = false
  } catch (error) {
    console.error('提交失败', error)
    ElMessage.error('修改失败')
  }
}

// 监听弹窗显示状态
watch(
  () => props.modelValue,
  async (val) => {
    visible.value = val
    if (val) {
      await fetchData()
    }
  },
)

watch(visible, (val) => {
  emit('update:modelValue', val)
})
</script>

<style scoped>
.class-list {
  margin: 20px 0;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.class-item {
  margin-bottom: 15px;
}

.class-inputs {
  display: flex;
  align-items: center;
}
</style>
