<!-- TeacherInfo.vue -->
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

      <el-form-item label="手机号" prop="phone">
        <el-input v-model="formData.phone" />
      </el-form-item>

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
import axios from 'axios'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(false)
const formRef = ref<FormInstance>()
const formData = ref({
  name: '',
  sex: 0,
  phone: '',
  classes: [] as Array<{ className: string; classCode: string }>,
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
}

// 获取教师信息
const fetchData = async () => {
  try {
    const { data } = await axios.get('/api/teacher')

    // 添加安全校验
    if (!data?.data.classes) {
      console.error('接口返回数据结构异常:', data)
      ElMessage.error('数据格式错误')
      return
    }

    formData.value = {
      name: data.data.name || '',
      sex: data.data.sex ?? 0, // 使用空值合并运算符
      phone: data.data.phone || '',
      classes: (data.data.classes || []).map((c) => ({
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
    await axios.put('/api/teacher', formData.value)
    ElMessage.success('修改成功')
    visible.value = false
  } catch (error) {
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
