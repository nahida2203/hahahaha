<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Delete, EditPen, Picture } from '@element-plus/icons-vue'
import type { ChannelId, CreationAssetSelection, Project } from '../api/types'
import { isChannelId, STORAGE_KEYS } from '../api/types'
import { getSampleAssetSync } from '../api/assets'
import { getChannelSync } from '../api/channels'
import { getAppDataSync } from '../utils/appDataLoader'
import LoadingState from '../components/states/LoadingState.vue'
import EmptyState from '../components/states/EmptyState.vue'
import ErrorState from '../components/states/ErrorState.vue'
import ProjectResultCard from '../components/projects/ProjectResultCard.vue'
import { useCreationStore } from '../stores/creation'
import { useProjectsStore } from '../stores/projects'
import { sleep } from '../utils/format'
import { formatDateTime } from '../utils/id'

const route = useRoute()
const router = useRouter()
const creation = useCreationStore()
const projectsStore = useProjectsStore()

const loading = ref(true)
const loadError = ref(false)

const projectId = computed(() => String(route.params.id ?? ''))
const project = computed<Project | null>(
  () => projectsStore.projects.find((item) => item.id === projectId.value) ?? null,
)

const channelLabels = computed(() =>
  (project.value?.channels ?? []).map((id) => getChannelSync(id)?.name ?? id),
)

const createdText = computed(() => {
  if (!project.value) return ''
  const date = new Date(project.value.createdAt)
  if (Number.isNaN(date.getTime())) return project.value.createdAt
  const base = formatDateTime(project.value.createdAt)
  return date.getFullYear() === new Date().getFullYear() ? base : `${date.getFullYear()}-${base}`
})

/**
 * 创作记录中的素材仅存 id/name（数据契约限制），
 * 内置示例图可按 id 找回缩略图；相册/拍照素材无法恢复原图，用占位展示。
 */
const draftAssets = computed<CreationAssetSelection[]>(() =>
  (project.value?.assets ?? []).map((ref) => {
    const sample = getSampleAssetSync(ref.id)
    if (sample) {
      return { id: sample.id, name: sample.name, size: sample.size, url: sample.url, source: sample.source }
    }
    // 相册/拍照素材：优先使用保存时写入的压缩图地址恢复预览
    return {
      id: ref.id,
      name: ref.name,
      size: 0,
      url: ref.url ?? undefined,
      source: ref.source ?? 'album',
    }
  }),
)

async function loadDetail(): Promise<void> {
  loading.value = true
  loadError.value = false
  try {
    // 演示异步读取：localStorage 读取本身为同步，延时仅用于展示加载态
    await sleep(350)
    // 真实读取一次，读取异常（如存储被禁用）时进入失败态
    localStorage.getItem(STORAGE_KEYS.projects)
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

/** 继续创作：把该项目回填为创作草稿，跳到可继续编辑生成的一步 */
function continueCreation(): void {
  const target = project.value
  if (!target) return
  creation.reset()
  const validChannels = target.channels.filter((id): id is ChannelId => isChannelId(id))
  creation.setChannels(validChannels)
  creation.setAssets(draftAssets.value)
  creation.setPrompt(target.prompt)
  if (target.templateId) {
    const template = getAppDataSync()?.templates.find((item) => item.id === target.templateId)
    creation.setTemplate(target.templateId, template?.title ?? target.templateId, template?.promptExample)
  }
  ElMessage.success('已载入创作草稿，可继续编辑并生成')
  if (validChannels.length === 0) {
    router.push({ name: 'create-channel' })
  } else if (target.assets.length === 0) {
    router.push({ name: 'create-assets' })
  } else {
    router.push({ name: 'create-prompt' })
  }
}

/** 删除（二次确认），删除后持久化并返回列表 */
async function removeProject(): Promise<void> {
  const target = project.value
  if (!target) return
  try {
    await ElMessageBox.confirm(
      `确定删除「${target.title}」吗？删除后不可恢复。`,
      '删除创作',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
      },
    )
  } catch {
    return
  }
  projectsStore.deleteProject(projectId.value)
  ElMessage.success('已删除创作记录')
  router.replace({ name: 'projects' })
}

onMounted(() => {
  void loadDetail()
})

watch(projectId, () => {
  void loadDetail()
})
</script>

<template>
  <div class="project-detail-page">
    <button type="button" class="back-btn" @click="router.push({ name: 'projects' })">
      <el-icon :size="16" aria-hidden="true"><ArrowLeft /></el-icon>
      返回列表
    </button>

    <LoadingState v-if="loading" text="正在加载创作详情…" />
    <ErrorState v-else-if="loadError" message="创作详情加载失败" @retry="loadDetail" />
    <section v-else-if="!project" class="page-panel">
      <EmptyState description="未找到该创作记录，可能已被删除">
        <template #action>
          <el-button type="primary" @click="router.push({ name: 'projects' })">返回我的创作</el-button>
        </template>
      </EmptyState>
    </section>

    <template v-else>
      <section class="page-panel detail-head">
        <div class="head-row"><h1>{{ project.title }}</h1></div>
        <div v-if="channelLabels.length > 0" class="channel-chips" aria-label="目标渠道">
          <span v-for="label in channelLabels" :key="label" class="channel-chip">{{ label }}</span>
        </div>
        <dl class="meta-list">
          <div class="meta-row">
            <dt>创建时间</dt>
            <dd>{{ createdText }}</dd>
          </div>
          <div class="meta-row">
            <dt>额度消耗</dt>
            <dd>{{ project.quotaCost ?? 0 }} 点</dd>
          </div>
          <div class="meta-row">
            <dt>版本文案</dt>
            <dd>{{ project.results?.length ?? 0 }} 个</dd>
          </div>
        </dl>
      </section>

      <section class="page-panel detail-section">
        <h2>素材（{{ project.assets?.length ?? 0 }} 张）</h2>
        <ul v-if="project.assets && project.assets.length > 0" class="asset-list">
          <li v-for="item in draftAssets" :key="item.id" class="asset-item">
            <span class="asset-thumb" aria-hidden="true">
              <img v-if="item.url" :src="item.url" :alt="item.name" loading="lazy" />
              <el-icon v-else :size="18"><Picture /></el-icon>
            </span>
            <span class="asset-name">{{ item.name }}</span>
          </li>
        </ul>
        <p v-else class="muted">该创作未关联素材</p>
      </section>

      <section class="page-panel detail-section">
        <h2>提示词</h2>
        <p class="prompt-text">{{ project.prompt }}</p>
      </section>

      <section class="detail-section">
        <h2 class="results-title">各渠道版本文案</h2>
        <p v-if="!project.results || project.results.length === 0" class="muted">该创作暂无版本文案</p>
        <div v-else class="result-list">
          <ProjectResultCard v-for="result in project.results" :key="result.channelId" :result="result" />
        </div>
      </section>

      <div class="action-bar">
        <el-button type="primary" size="large" :icon="EditPen" class="action-primary" @click="continueCreation">
          继续创作
        </el-button>
        <el-button type="danger" plain size="large" :icon="Delete" class="action-secondary" @click="removeProject">
          删除
        </el-button>
      </div>
      <p class="action-tip">继续创作会载入渠道、素材与提示词；再次生成会重新扣减相应额度。</p>
    </template>
  </div>
</template>

<style scoped>
.project-detail-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 4px;
  min-height: 44px;
  padding: 0 6px;
  border: 0;
  background: transparent;
  color: var(--color-muted);
  font-size: 14px;
  cursor: pointer;
}

.detail-head {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.head-row h1 {
  margin: 0;
  min-width: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.channel-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.channel-chip {
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
}

.meta-list {
  margin: 0;
}

.meta-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-height: 26px;
}

.meta-row dt {
  flex-shrink: 0;
  color: var(--color-muted);
  font-size: 13px;
}

.meta-row dd {
  margin: 0;
  min-width: 0;
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.detail-section h2 {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}

.results-title {
  margin: 4px 0 10px;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
}

.asset-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.asset-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
}

.asset-thumb {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  overflow: hidden;
  border-radius: 8px;
  background: var(--color-surface-soft);
  color: var(--color-muted);
}

.asset-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-name {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  user-select: text;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.action-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.action-bar .el-button {
  width: 100%;
  margin-left: 0;
}

.action-tip {
  margin: -2px 4px 0;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.6;
}
</style>
