<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FolderOpened, HomeFilled, MagicStick, Plus, User } from '@element-plus/icons-vue'
import CreateModeMenu from './creation/CreateModeMenu.vue'

const route = useRoute()
const router = useRouter()
const createMenuOpen = ref(false)

function isActive(name: 'home' | 'templates' | 'projects' | 'account'): boolean {
  if (name === 'projects') return route.name === 'projects' || route.name === 'project-detail'
  if (name === 'account') return route.name === 'account' || route.name === 'account-settings'
  return route.name === name
}

function selectCreateMode(mode: 'chat' | 'image' | 'video'): void {
  createMenuOpen.value = false
  router.push({
    name: mode === 'image' ? 'create-image' : mode === 'video' ? 'create-video' : 'create-chat',
  })
}
</script>

<template>
  <nav class="immersive-tabbar" aria-label="主导航">
    <button class="immersive-tab" :class="{ active: isActive('home') }" type="button" :aria-current="isActive('home') ? 'page' : undefined" @click="router.push({ name: 'home' })">
      <el-icon :size="22"><HomeFilled /></el-icon><span>首页</span>
    </button>
    <button class="immersive-tab" :class="{ active: isActive('templates') }" type="button" :aria-current="isActive('templates') ? 'page' : undefined" @click="router.push({ name: 'templates' })">
      <el-icon :size="22"><MagicStick /></el-icon><span>模板库</span>
    </button>
    <button class="compose-button" type="button" aria-label="开始创作" :aria-expanded="createMenuOpen" @click="createMenuOpen = true">
      <el-icon :size="31"><Plus /></el-icon>
    </button>
    <button class="immersive-tab" :class="{ active: isActive('projects') }" type="button" :aria-current="isActive('projects') ? 'page' : undefined" @click="router.push({ name: 'projects' })">
      <el-icon :size="22"><FolderOpened /></el-icon><span>资产</span>
    </button>
    <button class="immersive-tab" :class="{ active: isActive('account') }" type="button" :aria-current="isActive('account') ? 'page' : undefined" @click="router.push({ name: 'account' })">
      <el-icon :size="22"><User /></el-icon><span>我的</span>
    </button>
  </nav>
  <CreateModeMenu v-model="createMenuOpen" @select="selectCreateMode" />
</template>

<style scoped>
.immersive-tabbar { position: fixed; right: 0; bottom: 0; left: 0; z-index: 40; display: grid; grid-template-columns: repeat(5, 1fr); align-items: end; width: min(100%, 720px); min-height: 76px; margin: 0 auto; padding: 8px 8px calc(8px + env(safe-area-inset-bottom)); border-top: 1px solid rgba(255,255,255,.08); background: rgba(10,12,12,.9); backdrop-filter: blur(18px); }
.immersive-tab { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 4px; min-height: 54px; padding: 4px; border: 0; background: transparent; color: #76817b; font-size: 11px; cursor: pointer; }
.immersive-tab.active { color: #f3f7f4; }
.compose-button { display: flex; align-items: center; justify-content: center; width: 62px; height: 62px; margin: -18px auto 0; border: 1px solid rgba(255,255,255,.72); border-radius: 50%; background: #f6f8f7; color: #121716; box-shadow: 0 8px 26px rgba(0,0,0,.34); cursor: pointer; }
.immersive-tab:active, .compose-button:active { transform: scale(.98); }
</style>
