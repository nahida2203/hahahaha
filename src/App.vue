<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import TabBar from './components/TabBar.vue'
import ImmersiveTabBar from './components/ImmersiveTabBar.vue'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'login')
const isCreationFlow = computed(() => route.path === '/create' || route.path.startsWith('/create/'))
const isImmersiveHome = computed(() => ['home', 'templates', 'projects', 'project-detail', 'account', 'account-settings'].includes(String(route.name)))
const showImmersiveTabBar = computed(() => isImmersiveHome.value && route.name !== 'account-settings')
</script>

<template>
  <div class="app-shell" :class="{ 'is-login': isLoginPage, 'is-creation': isCreationFlow, 'is-immersive-home': isImmersiveHome }">
    <template v-if="!isLoginPage">
      <AppHeader v-if="!isCreationFlow && !isImmersiveHome" />
      <main id="main-content" class="app-main" :class="{ 'is-creation-flow': isCreationFlow, 'is-immersive-home': isImmersiveHome }" tabindex="-1">
        <RouterView />
      </main>
      <ImmersiveTabBar v-if="showImmersiveTabBar" />
      <TabBar v-if="!isCreationFlow && !isImmersiveHome" />
    </template>
    <RouterView v-else />
  </div>
</template>
