import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/TeacherView.vue'),
      children: [
        {
          path: '/knowledge-graph',
          component: () => import('../components/graph/KnowledgeGraph.vue'),
        },
        {
          path: '/heatmap',
          component: () => import('../components/graph/HeatMap.vue'),
        },
        {
          path: '/study-stats',
          component: () => import('../components/StudyStats.vue'),
        },
        {
          path: '/question',
          component: () => import('../components/Question.vue'),
        },
      ],
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
