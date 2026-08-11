<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { EditPen, HomeFilled, User, Grid } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

interface TabItem {
  label: string
  icon: unknown
  routeName: string
  active: (path: string) => boolean
}

const tabs: TabItem[] = [
  { label: '首页', icon: HomeFilled, routeName: 'home', active: (path) => path === '/' },
  { label: '开始创作', icon: EditPen, routeName: 'create-home', active: (path) => path.startsWith('/create') },
  { label: '模板中心', icon: Grid, routeName: 'templates', active: (path) => path === '/templates' },
  { label: '我的', icon: User, routeName: 'account', active: (path) => path === '/me' },
]
</script>

<template>
  <nav class="tab-bar" aria-label="主导航">
    <button
      v-for="tab in tabs"
      :key="tab.routeName"
      class="tab-item"
      :class="{ 'is-active': tab.active(route.path) }"
      type="button"
      :aria-current="tab.active(route.path) ? 'page' : undefined"
      @click="router.push({ name: tab.routeName })"
    >
      <el-icon :size="22" aria-hidden="true"><component :is="tab.icon" /></el-icon>
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 100;
  display: flex;
  width: 100%;
  max-width: 640px;
  transform: translateX(-50%);
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.tab-item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: var(--tabbar-height);
  padding: 6px 0;
  border: 0;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
}

.tab-item.is-active {
  color: var(--color-brand);
}

.tab-label {
  font-size: 11px;
  line-height: 1.2;
}
</style>
