<template>
  <div :class="{ dark: isDark }">
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <!-- 导航栏 -->
      <nav class="bg-white dark:bg-gray-800 shadow-lg">
        <div class="max-w-7xl mx-auto px-4">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                TailwindDemo
              </span>
            </div>

            <!-- 导航菜单 -->
            <div class="hidden md:flex space-x-8">
              <a
                v-for="item in navItems"
                :key="item"
                class="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {{ item }}
              </a>
            </div>

            <!-- 暗黑模式切换 -->
            <button
              @click="toggleDarkMode"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span v-if="isDark" class="text-xl">🌙</span>
              <span v-else class="text-xl">☀️</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- 主要内容区域 -->
      <main class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold text-gray-800 dark:text-white mb-8">
          Welcome to Tailwind Demo
        </h1>

        <!-- 卡片网格布局 -->
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="card in cards"
            :key="card.title"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
          >
            <div class="flex items-center mb-4">
              <div :class="`p-3 rounded-full ${card.iconColor} bg-opacity-20`">
                <span :class="`text-2xl ${card.icon}`"></span>
              </div>
              <h3 class="ml-4 text-xl font-semibold text-gray-800 dark:text-white">
                {{ card.title }}
              </h3>
            </div>
            <p class="text-gray-600 dark:text-gray-300">
              {{ card.description }}
            </p>
            <button
              class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
              :disabled="card.disabled"
            >
              {{ card.buttonText }}
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isDark = ref(false)
const toggleDarkMode = () => (isDark.value = !isDark.value)

const navItems = ref(['Home', 'Products', 'About', 'Contact'])

const cards = ref([
  {
    title: '响应式设计',
    description: '使用Tailwind的响应式工具类轻松创建自适应布局',
    icon: '📱',
    iconColor: 'text-blue-500',
    buttonText: 'Learn More',
    disabled: false,
  },
  {
    title: '深色模式',
    description: '原生支持深色主题切换，轻松实现夜间模式',
    icon: '🌓',
    iconColor: 'text-purple-500',
    buttonText: 'Toggle Dark',
    disabled: false,
  },
  {
    title: '动画效果',
    description: '内置过渡动画和hover效果，提升用户体验',
    icon: '🎭',
    iconColor: 'text-pink-500',
    buttonText: 'Coming Soon',
    disabled: true,
  },
])
</script>
