<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Pear } from '@element-plus/icons-vue'
import { useSessionStore } from '../stores/session'
import DefaultAvatar from './DefaultAvatar.vue'

const router = useRouter()
const { user } = storeToRefs(useSessionStore())
const displayName = computed(() => user.value?.name ?? '未登录')
</script>

<template>
  <header class="app-header">
    <button class="brand" type="button" aria-label="返回首页" @click="router.push({ name: 'home' })">
      <span class="brand-mark" aria-hidden="true"><el-icon><Pear /></el-icon></span>
      <span class="brand-title">福农AI创</span>
    </button>
    <button class="user-chip" type="button" aria-label="打开我的" @click="router.push({ name: 'account' })">
      <span class="user-avatar"><DefaultAvatar /></span>
      <span class="user-name">{{ displayName }}</span>
    </button>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: var(--header-height);
  padding: 0 var(--page-pad);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
}

.brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: var(--color-brand);
  color: #fff;
  font-size: 18px;
}

.brand-title {
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: var(--color-ink-secondary);
  cursor: pointer;
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
}

.user-name {
  max-width: 72px;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 380px) {
  .brand-title {
    font-size: 13px;
  }
}
</style>
