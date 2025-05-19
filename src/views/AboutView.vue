<template>
  <div v-loading="!entityDetail" class="detail-content">
    <template v-if="entityDetail">
      <h2 class="entity-title">{{ entityDetail.entity }}</h2>
      <el-descriptions :column="{ xs: 1, sm: 1, md: 2 }" border class="custom-descriptions">
        <el-descriptions-item label="分类" label-align="right" align="center">
          <el-tag effect="plain" type="info">{{ entityDetail.category }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关联数" label-align="right" align="center">
          <el-text type="primary">{{ entityDetail.count }}</el-text>
        </el-descriptions-item>
        <el-descriptions-item label="权重" label-align="right" align="center">
          <el-text :type="entityDetail.weight > 50 ? 'success' : 'warning'">
            {{ entityDetail.weight }}
          </el-text>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left"><h3 class="section-title">属性信息</h3></el-divider>
      <el-table :data="entityDetail.attributes" height="250" stripe border class="custom-table">
        <el-table-column
          prop="attribute"
          label="属性"
          width="160"
          header-align="center"
          align="center"
        />
        <el-table-column prop="value" label="值" header-align="center" />
      </el-table>

      <el-divider content-position="left"><h3 class="section-title">关联关系</h3></el-divider>
      <el-scrollbar height="350px" class="custom-scrollbar">
        <div v-for="(rel, index) in entityDetail.relations" :key="index" class="relation-item">
          <el-tag size="small" type="primary" effect="plain">{{ rel[2] }}</el-tag>
          <el-text class="rel-from">{{ rel[0] }}</el-text>
          <el-icon class="mx-2"><Right /></el-icon>
          <el-text class="rel-to" type="primary">{{ rel[1] }}</el-text>
        </div>
      </el-scrollbar>
    </template>
  </div>
</template>

<script setup>
import { Right } from '@element-plus/icons-vue'

defineProps({
  entityDetail: {
    type: Object,
    default: null,
  },
})
</script>

<style scoped>
.detail-content {
  padding: 24px;
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
}

.entity-title {
  color: var(--el-text-color-primary);
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.section-title {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 500;
}

.custom-descriptions {
  margin-top: 12px;
  :deep(.el-descriptions__header) {
    padding-bottom: 12px;
  }
}

.custom-table {
  margin: 16px 0;
  :deep(th) {
    background-color: var(--el-color-primary-light-90);
  }
  :deep(.el-table__row) {
    transition: all 0.3s var(--el-transition-function-ease-in-out-bezier);
  }
}

.custom-scrollbar {
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: 12px;
}

.relation-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  margin: 8px 0;
  background: var(--el-color-primary-light-90);
  border-radius: var(--el-border-radius-base);
  transition: all 0.2s ease;

  &:hover {
    transform: translateX(4px);
    box-shadow: var(--el-box-shadow-light);
  }
}

.rel-from {
  color: var(--el-text-color-secondary);
  margin-left: 12px;
}

.rel-to {
  font-weight: 500;
  margin-left: 8px;
}

.mx-2 {
  margin: 0 8px;
  color: var(--el-text-color-secondary);
}
</style>
