import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

/**
 * 应用路由
 *
 * 1. 入口：LoginView
 * 2. 登录成功后，根据角色跳转到 /teacher 或 /student
 * 3. 用 Pinia（useAuthStore）管理鉴权与角色
 */

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/teacher',
    name: 'teacher',
    component: () => import('../views/TeacherView.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
    children: [
      {
        path: 'knowledge-graph',
        component: () => import('../components/graph/KnowledgeGraph.vue'),
      },
      { path: 'heatmap', component: () => import('../components/graph/HeatMap.vue') },
      { path: 'study-stats', component: () => import('../components/StudyStats.vue') },
      { path: 'question', component: () => import('../components/Question.vue') },
      { path: 'graph-manage', component: () => import('../components/GraphManage.vue') },
    ],
  },
  {
    path: '/student',
    name: 'student',
    component: () => import('../views/StudentView.vue'),
    meta: { requiresAuth: true, role: 'student' },
    children: [],
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

/**
 * 全局前置守卫：基于 Pinia 状态做鉴权与角色校验
 */
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  const { accessToken, userRole } = auth

  if (to.meta.requiresAuth && !accessToken) {
    return next({ name: 'login' })
  }
  if (to.meta.role && to.meta.role !== userRole) {
    return next({ name: userRole }) // student / teacher
  }
  next()
})

export default router
