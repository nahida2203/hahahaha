<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { STORAGE_KEYS } from '../api/types'
import type { Project } from '../api/types'
import LoadingState from '../components/states/LoadingState.vue'
import EmptyState from '../components/states/EmptyState.vue'
import ErrorState from '../components/states/ErrorState.vue'
import ProjectCard from '../components/projects/ProjectCard.vue'
import { useProjectsStore } from '../stores/projects'
import { sleep } from '../utils/format'

type TimeFilter = 'all' | 'recent' | 'older'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

const router = useRouter()
const projectsStore = useProjectsStore()
const { projects } = storeToRefs(projectsStore)

const loading = ref(true)
const loadError = ref(false)
const filter = ref<TimeFilter>('all')

const filters: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'recent', label: '最近7天' },
  { value: 'older', label: '更早' },
]

function timestamp(value: string): number {
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

/** 排序：新 → 旧 */
const sortedProjects = computed(() =>
  [...projects.value].sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt)),
)

const filteredProjects = computed(() => {
  if (filter.value === 'all') return sortedProjects.value
  const wantRecent = filter.value === 'recent'
  return sortedProjects.value.filter((item) => {
    const time = timestamp(item.createdAt)
    if (time <= 0) return false
    return wantRecent ? Date.now() - time <= SEVEN_DAYS_MS : Date.now() - time > SEVEN_DAYS_MS
  })
})

async function loadProjects(): Promise<void> {
  loading.value = true
  loadError.value = false
  try {
    // 演示异步读取：localStorage 读取本身为同步，延时仅用于展示加载态
    await sleep(400)
    // 真实读取一次，读取异常（如存储被禁用）时进入失败态
    localStorage.getItem(STORAGE_KEYS.projects)
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

function openProject(id: string): void {
  router.push({ name: 'project-detail', params: { id } })
}

onMounted(() => {
  void loadProjects()
})
</script>

<template>
  <div class="projects-page immersive-content-page">
    <section class="page-head">
      <div class="head-row"><h1>资产</h1></div>
      <p class="muted">共 {{ projects.length }} 条创作资产，点击卡片可查看详情</p>
    </section>

    <div v-if="!loading && !loadError" class="filter-bar" role="tablist" aria-label="按创作时间筛选">
      <button
        v-for="item in filters"
        :key="item.value"
        type="button"
        class="filter-btn"
        :class="{ 'is-active': filter === item.value }"
        role="tab"
        :aria-selected="filter === item.value"
        @click="filter = item.value"
      >
        {{ item.label }}
      </button>
    </div>

    <LoadingState v-if="loading" text="正在加载创作记录…" />
    <ErrorState v-else-if="loadError" message="创作记录加载失败" @retry="loadProjects" />
    <EmptyState v-else-if="projects.length === 0" description="还没有创作记录，去创作第一条内容吧">
      <template #action>
        <el-button type="primary" @click="router.push({ name: 'create-home' })">开始创作</el-button>
      </template>
    </EmptyState>
    <EmptyState v-else-if="filteredProjects.length === 0" description="该分类下暂无创作记录">
      <template #action>
        <el-button @click="filter = 'all'">查看全部</el-button>
      </template>
    </EmptyState>
    <ul v-else class="project-list">
      <li v-for="project in filteredProjects" :key="project.id">
        <ProjectCard :project="project" @open="openProject" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.projects-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.immersive-content-page { min-height: 100dvh; padding: 18px 12px 108px; color: #f7faf7; background: #090b0c; }

.page-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.head-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.head-row h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.4;
}

.page-head .muted {
  margin: 0;
  color: #8d9992;
  font-size: 13px;
  line-height: 1.6;
}

.filter-bar {
  display: flex;
  gap: 8px;
}

.filter-btn {
  flex: 1;
  min-height: 44px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 10px;
  background: rgba(255,255,255,.06);
  color: #9ba69f;
  font-size: 14px;
  cursor: pointer;
}

.filter-btn.is-active {
  border-color: rgba(185,223,197,.55);
  background: rgba(185,223,197,.12);
  color: #d8f0dd;
  font-weight: 600;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
