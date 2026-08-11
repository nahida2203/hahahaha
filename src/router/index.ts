import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '../stores/session'
import { createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: '登录 - 福农AI创' },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { title: '首页 - 福农AI创' },
    },
    {
      path: '/create',
      name: 'create-home',
      component: () => import('../views/create/CreateHomeView.vue'),
      meta: { title: '开始创作 - 福农AI创' },
    },
    {
      path: '/create/quick',
      name: 'create-quick',
      component: () => import('../views/create/CreateQuickView.vue'),
      meta: { title: '一键创作 - 福农AI创' },
    },
    {
      path: '/create/chat',
      name: 'create-chat',
      component: () => import('../views/create/CreateChatView.vue'),
      meta: { title: '对话创作 - 福农AI创' },
    },
    {
      path: '/create/image',
      name: 'create-image',
      component: () => import('../views/create/CreateMediaView.vue'),
      props: { mediaType: 'image' },
      meta: { title: '图片生成 - 福农AI创' },
    },
    {
      path: '/create/video',
      name: 'create-video',
      component: () => import('../views/create/CreateMediaView.vue'),
      props: { mediaType: 'video' },
      meta: { title: '视频生成 - 福农AI创' },
    },
    {
      path: '/create/confirm',
      name: 'create-confirm',
      component: () => import('../views/create/CreateConfirmView.vue'),
      meta: { title: '确认生成 - 福农AI创' },
    },
    {
      path: '/create/channel',
      name: 'create-channel',
      component: () => import('../views/create/CreateChannelView.vue'),
      meta: { title: '选择渠道 - 开始创作' },
    },
    {
      path: '/create/assets',
      name: 'create-assets',
      component: () => import('../views/create/CreateAssetsView.vue'),
      meta: { title: '上传素材 - 开始创作' },
    },
    {
      path: '/create/prompt',
      name: 'create-prompt',
      component: () => import('../views/create/CreatePromptView.vue'),
      meta: { title: '生成提示词 - 开始创作' },
    },
    {
      path: '/create/result',
      name: 'create-result',
      component: () => import('../views/create/CreateResultView.vue'),
      meta: { title: '生成结果 - 开始创作' },
    },
    {
      path: '/templates',
      name: 'templates',
      component: () => import('../views/TemplateCenterView.vue'),
      meta: { title: '模板中心 - 福农AI创' },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('../views/ProjectsView.vue'),
      meta: { title: '我的创作 - 福农AI创' },
    },
    {
      path: '/projects/:id',
      name: 'project-detail',
      component: () => import('../views/ProjectDetailView.vue'),
      meta: { title: '创作详情 - 福农AI创' },
    },
    {
      path: '/me',
      name: 'account',
      component: () => import('../views/AccountView.vue'),
      meta: { title: '我的 - 福农AI创' },
    },
    {
      path: '/me/settings',
      name: 'account-settings',
      component: () => import('../views/AccountSettingsView.vue'),
      meta: { title: '账号设置 - 福农AI创' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const session = useSessionStore()
  if (!session.isAuthenticated) {
    if (to.name === 'login') return true
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login') return { path: '/' }
  return true
})

router.afterEach((to) => {
  document.title = typeof to.meta.title === 'string' ? to.meta.title : '福农AI创'
})

export default router
