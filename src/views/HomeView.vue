<template>
  <div class="min-h-screen bg-base-200">
    <!-- 导航栏 -->
    <nav class="navbar bg-base-100 shadow-lg px-4">
      <div class="navbar-start">
        <h1 class="text-xl font-bold text-primary">管理系统</h1>
      </div>
      <div class="navbar-end gap-2">
        <!-- 登录按钮触发模态框 -->
        <button class="btn btn-primary btn-sm" @click="loginModal.showModal()">登录</button>
        <button class="btn btn-secondary btn-sm">注册</button>
      </div>
    </nav>

    <!-- 登录模态框 -->
    <dialog ref="loginModal" class="modal">
      <div class="modal-box border-2 border-primary">
        <!-- 红色边框 -->
        <h3 class="font-bold text-lg text-primary mb-4">用户登录</h3>

        <!-- 登录表单 -->
        <form method="dialog" class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">账号</span>
            </label>
            <input type="text" placeholder="请输入账号" class="input input-bordered" />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">密码</span>
            </label>
            <input type="password" placeholder="请输入密码" class="input input-bordered" />
          </div>

          <div class="modal-action">
            <button class="btn btn-primary">登录</button>
            <button class="btn">取消</button>
          </div>
        </form>
      </div>

      <!-- 点击背景关闭 -->
      <form method="dialog" class="modal-backdrop">
        <button>关闭</button>
      </form>
    </dialog>

    <!-- 主内容区域 -->
    <main class="container mx-auto p-4">
      <!-- 数据表格 -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-0">
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr class="bg-base-200">
                  <th class="text-primary">序号</th>
                  <th class="text-primary">姓名</th>
                  <th class="text-primary">年龄</th>
                  <th class="text-primary">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in items" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.age }}</td>
                  <td>
                    <div class="flex gap-2">
                      <button class="btn btn-xs btn-primary">修改</button>
                      <button class="btn btn-xs btn-error">删除</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const loginModal = ref(null) // 模态框引用

// 示例数据
const items = ref([
  { name: '张三', age: 28 },
  { name: '李四', age: 32 },
  { name: '王五', age: 25 },
  { name: '赵六', age: 30 },
])
</script>

<style>
@import url('https://cdn.jsdelivr.net/npm/daisyui@5/dist/styled.css');
/* 自定义模态框动画 */
.modal-box {
  animation: modalSlide 0.3s ease-out;
}

@keyframes modalSlide {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
