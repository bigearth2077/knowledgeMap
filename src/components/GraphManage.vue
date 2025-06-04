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
      <!-- 保留 count 和 weight 显示 -->
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
    <el-dialog v-model="editDialogVisible" title="编辑节点" width="700px">
      <el-form :model="editForm" label-width="80px">
        <!-- 节点名称（不可编辑） -->
        <el-form-item label="节点名称">
          <el-input v-model="editForm.entity" disabled />
        </el-form-item>

        <!-- 类别 -->
        <el-form-item label="类别">
          <el-input v-model="editForm.category" />
        </el-form-item>

        <!-- 属性编辑 -->
        <el-form-item label="属性">
          <div v-for="(attr, index) in editForm.attributes" :key="index" class="attribute-item">
            <el-input v-model="attr.attribute" placeholder="属性名" style="width: 200px" />
            <el-input
              v-model="attr.value"
              placeholder="属性值"
              style="width: 200px; margin-left: 10px"
            />
            <el-button type="danger" link @click="removeAttribute(index)"> 删除 </el-button>
          </div>
          <el-button type="primary" link @click="addAttribute"> + 添加属性 </el-button>
        </el-form-item>

        <!-- 关系编辑 -->
        <el-form-item label="关系">
          <div
            v-for="(rel, index) in editForm.relations"
            :key="index"
            class="relation-item"
            style="display: flex; align-items: center; margin-bottom: 10px"
          >
            <!-- subject 固定为当前实体，只展示不可编辑 -->
            <div style="width: 150px">
              <el-input v-model="rel.subject" disabled placeholder="主题实体" />
            </div>
            <el-input
              v-model="rel.predicate"
              placeholder="谓词（关系类型）"
              style="width: 150px; margin: 0 10px"
            />
            <el-input v-model="rel.object" placeholder="客体实体" style="width: 150px" />
            <el-button type="danger" link style="margin-left: 10px" @click="removeRelation(index)">
              删除
            </el-button>
          </div>
          <el-button type="primary" link @click="addRelation"> + 添加关系 </el-button>
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
import axios from '@/services/api'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

// 所有实体数据
const entities = ref([])
// 所有关系数据（原始从后端拿到的二维数组形式或者对象数组形式都可以，但这里只是先暂存在前端）
const relations = ref([])

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 编辑对话框控制 & 表单数据
const editDialogVisible = ref(false)
const editForm = ref({
  entity: '',
  category: '',
  attributes: [],
  relations: [], // 前端内部固化为对象数组：{ subject, predicate, object }
})

// 过滤后的实体列表
const filteredEntities = computed(() => {
  const keyword = searchKeyword.value.toLowerCase().trim()
  if (!keyword) return entities.value

  return entities.value.filter((item) => {
    const entityStr = item.entity?.toLowerCase() ?? ''
    const categoryStr = item.category?.toLowerCase() ?? ''

    const attrMatch =
      item.attributes?.some((attr) => {
        const attrKey = attr.attribute?.toLowerCase() ?? ''
        const attrValue = String(attr.value ?? '').toLowerCase()
        return attrKey.includes(keyword) || attrValue.includes(keyword)
      }) ?? false

    return entityStr.includes(keyword) || categoryStr.includes(keyword) || attrMatch
  })
})

// 分页后展示的数据
const currentTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredEntities.value.slice(start, end)
})

const handleSearch = () => {
  currentPage.value = 1
}

// 从后端获取图数据
const fetchGraphData = async () => {
  try {
    const res = await axios.get('/api/graph')
    // 后端返回示例：{"entities":[…],"relations":[ {subject,…}, {…} ]}
    // 我们先把 entities 放进去
    entities.value = res.data.entities || []
    // 把 relations 也塞进去，前端后续会把它筛选到 editForm.relations
    relations.value = res.data.relations || []
  } catch (error) {
    ElMessage.error('获取数据失败')
  }
}

// 点击编辑时，把当前行的内容加载到 editForm
const handleEdit = (row) => {
  editForm.value.entity = row.entity
  editForm.value.category = row.category
  // 深拷贝属性
  editForm.value.attributes = row.attributes ? row.attributes.map((a) => ({ ...a })) : []
  // 从 relations.value 中筛选出 subject === row.entity 的那几条，映射为 { subject, predicate, object }
  const related = relations.value
    .filter((r) => r.subject === row.entity)
    .map((r) => ({
      subject: r.subject,
      predicate: r.predicate,
      object: r.object,
    }))
  editForm.value.relations = related
  editDialogVisible.value = true
}

// 属性添加/删除
const addAttribute = () => {
  editForm.value.attributes.push({ attribute: '', value: '' })
}
const removeAttribute = (index) => {
  editForm.value.attributes.splice(index, 1)
}

// 关系添加/删除
const addRelation = () => {
  editForm.value.relations.push({
    subject: editForm.value.entity,
    predicate: '',
    object: '',
  })
}
const removeRelation = (index) => {
  editForm.value.relations.splice(index, 1)
}

// 提交修改：关键在于把对象数组转换为后台期望的二维数组格式
const submitEdit = async () => {
  try {
    // 把 editForm.value.relations (对象数组) 转成 [ [subject, predicate, object], … ]
    const relationsAsList = editForm.value.relations.map((r) => [r.subject, r.predicate, r.object])

    // 构造要发送的 payload
    const payload = {
      entity: editForm.value.entity,
      category: editForm.value.category,
      attributes: editForm.value.attributes,
      relations: relationsAsList,
    }

    await axios.put('/api/teacher/entity', payload)
    ElMessage.success('修改成功')
    fetchGraphData()
    editDialogVisible.value = false
  } catch (error) {
    if (error.response && error.response.status === 422) {
      const msg = error.response.data.detail
        ? JSON.stringify(error.response.data.detail)
        : '字段校验失败'
      ElMessage.error(`修改失败：${msg}`)
    } else {
      ElMessage.error('修改失败')
    }
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
.relation-item {
  /* 如需额外样式可在此处添加 */
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
