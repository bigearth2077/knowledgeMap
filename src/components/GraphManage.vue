<template>
  <div class="graph-management">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="输入节点名称/类别/属性"
        clearable
        style="width: 300px"
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">
            <el-icon><Search /></el-icon>
          </el-button>
        </template>
      </el-input>
    </div>

    <!-- 数据表格 -->
    <el-table :data="currentTableData" border style="width: 100%">
      <el-table-column prop="entity" label="节点名称" width="180" />
      <el-table-column prop="category" label="类别" width="120" />
      <el-table-column label="属性">
        <template #default="{ row }">
          <div v-for="(attr, index) in row.attributes" :key="index">
            {{ attr.attribute }}: {{ attr.value }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="count" label="关联数量" width="100" />
      <el-table-column prop="weight" label="权重" width="100" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="filteredEntities.length"
        layout="total, prev, pager, next"
      />
    </div>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑节点" width="600px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="节点名称">
          <el-input v-model="editForm.entity" disabled />
        </el-form-item>
        <el-form-item label="类别">
          <el-input v-model="editForm.category" />
        </el-form-item>
        <el-form-item label="属性">
          <div v-for="(attr, index) in editForm.attributes" :key="index" class="attribute-item">
            <el-input v-model="attr.attribute" placeholder="属性名" style="width: 200px" />
            <el-input
              v-model="attr.value"
              placeholder="属性值"
              style="width: 200px; margin-left: 10px"
            />
            <el-button type="danger" link @click="removeAttribute(index)">删除</el-button>
          </div>
          <el-button type="primary" link @click="addAttribute">+ 添加属性</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

// 数据相关
const entities = ref([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 编辑相关
const editDialogVisible = ref(false)
const editForm = ref({
  entity: '',
  category: '',
  attributes: [],
})

// 计算属性
const filteredEntities = computed(() => {
  const keyword = searchKeyword.value.toLowerCase().trim()
  if (!keyword) return entities.value

  return entities.value.filter((item) => {
    const entityStr = item.entity?.toLowerCase() ?? ''
    const categoryStr = item.category?.toLowerCase() ?? ''

    // 安全处理各种类型的属性值
    const attrMatch =
      item.attributes?.some((attr) => {
        const attrKey = attr.attribute?.toLowerCase() ?? ''
        const attrValue = String(attr.value ?? '').toLowerCase()
        return attrKey.includes(keyword) || attrValue.includes(keyword)
      }) ?? false

    return entityStr.includes(keyword) || categoryStr.includes(keyword) || attrMatch
  })
})

// 分页后的数据
const currentTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredEntities.value.slice(start, end)
})

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1 // 重置到第一页
}

// 获取数据（只需加载一次）
const fetchGraphData = async () => {
  try {
    const res = await axios.get('/api/graph')
    entities.value = res.data.entities
  } catch (error) {
    ElMessage.error('获取数据失败')
  }
}

const handleEdit = (row) => {
  editForm.value = {
    entity: row.entity,
    category: row.category,
    attributes: [...row.attributes],
  }
  editDialogVisible.value = true
}

const addAttribute = () => {
  editForm.value.attributes.push({ attribute: '', value: '' })
}

const removeAttribute = (index) => {
  editForm.value.attributes.splice(index, 1)
}

const submitEdit = async () => {
  try {
    await axios.put('/api/teacher/entity', editForm.value)
    ElMessage.success('修改成功')
    fetchGraphData()
    editDialogVisible.value = false
  } catch (error) {
    ElMessage.error('修改失败')
  }
}

onMounted(() => {
  fetchGraphData()
})
</script>

<style scoped>
.attribute-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
