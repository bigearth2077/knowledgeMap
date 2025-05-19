<template>
  <!-- Top navigation bar -->
  <div class="navbar bg-base-100 shadow">
    <!-- Left: logo / title placeholder -->
    <div class="navbar-start">
      <a class="btn btn-ghost text-xl">Student&nbsp;Portal</a>
    </div>

    <!-- Right side controls -->
    <div class="navbar-end gap-4">
      <!-- Learning Dashboard trigger (component to be implemented later) -->
      <button class="btn btn-outline btn-primary">学习仪表盘</button>

      <!-- Search box (logic to be added later) -->
      <label class="input input-bordered flex items-center gap-2 w-56">
        <input type="text" placeholder="搜索课程/知识点" class="grow" />
        <!-- Search icon -->
        <svg
          class="w-4 h-4 opacity-70"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-5.2-5.2M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
          />
        </svg>
      </label>

      <!-- "My" dropdown menu with profile modal trigger -->
      <details class="dropdown dropdown-end">
        <summary class="btn">我的</summary>
        <ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
          <!-- Trigger profile modal -->
          <li>
            <button @click="openProfileModal">个人资料</button>
          </li>
          <li><a>学习记录</a></li>
          <li><a>设置</a></li>
        </ul>
      </details>
    </div>
  </div>

  <!-- Profile Modal -->
  <teleport to="body">
    <div class="modal" :class="{ 'modal-open': showProfileModal }" @click.self="closeProfileModal">
      <div class="modal-box relative max-w-3xl">
        <!-- Close Button -->
        <button class="btn btn-sm btn-circle absolute right-2 top-2" @click="closeProfileModal">
          ✕
        </button>
        <!-- StudentProfile component -->
        <StudentProfile />
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import StudentProfile from '@/components/student/StudentProfile.vue'

// 控制模态框显示
const showProfileModal = ref(false)

function openProfileModal() {
  showProfileModal.value = true
}

function closeProfileModal() {
  showProfileModal.value = false
}
</script>

<style scoped>
/* 使背景层更明显 */
.modal.modal-open {
  background-color: rgba(0, 0, 0, 0.4);
}
</style>
