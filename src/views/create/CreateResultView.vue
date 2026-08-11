<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, CircleCloseFilled, CopyDocument, VideoPlay } from '@element-plus/icons-vue'
import CreationFlowHeader from '../../components/creation/CreationFlowHeader.vue'
import type { GeneratedResult } from '../../api/types'
import { getChannelSync } from '../../api/channels'
import { getSettingsSync } from '../../utils/configLoader'
import { useCreationStore } from '../../stores/creation'
import { useProjectsStore } from '../../stores/projects'
import { useQuotaStore } from '../../stores/quota'
import { generateContent } from '../../utils/contentGenerator'
import { randomInt } from '../../utils/format'
import { formatDateTime, nowIso } from '../../utils/id'

const router = useRouter()
const creation = useCreationStore()
const projects = useProjectsStore()
const quota = useQuotaStore()

type GenerateStatus = 'idle' | 'generating' | 'success' | 'error'

const status = ref<GenerateStatus>('idle')
const progress = ref(0)
const errorMessage = ref('')
const warnings = ref<string[]>([])
const results = ref<GeneratedResult[]>([])
const saved = ref(false)

let progressTimer: number | undefined
let generationToken = 0

const channels = computed(() =>
  creation.channels
    .map((id) => getChannelSync(id))
    .filter((item): item is NonNullable<typeof item> => item !== null),
)
const settings = getSettingsSync()
const cost = computed(() => {
  if (creation.outputTypes.includes('storyboard')) return settings.quota.media_cost_video
  if (creation.outputTypes.includes('poster')) return settings.quota.media_cost_image
  return settings.quota.cost_per_version * creation.channels.length
})
/** 生成类型：图片流程（poster）走 grok-imagine-image，视频流程（storyboard）走 grok-imagine-video */
const mediaType = computed<'copy' | 'image' | 'video'>(() => {
  if (creation.outputTypes.includes('storyboard')) return 'video'
  if (creation.outputTypes.includes('poster')) return 'image'
  return 'copy'
})
const hasDraft = computed(() => creation.channels.length > 0 && creation.prompt.trim().length > 0)
const currentTitle = computed(() => {
  const base =
    creation.templateTitle && creation.templateTitle !== creation.templateId ? creation.templateTitle : '助农内容创作'
  return `${base} ${formatDateTime(nowIso())}`
})

onBeforeUnmount(() => {
  if (progressTimer !== undefined) window.clearInterval(progressTimer)
})

function askResetQuota(): void {
  ElMessageBox.alert(
    `本次生成需 ${cost.value} 点，当前余额仅 ${quota.balance} 点。请联系平台管理员补充额度后再试。`,
    '额度不足',
    { confirmButtonText: '知道了', type: 'warning' },
  ).catch(() => undefined)
}

async function runGenerate(): Promise<void> {
  if (status.value === 'generating') return
  if (!hasDraft.value) {
    ElMessage.warning('创作信息不完整，请重新开始创作')
    router.push({ name: 'create-channel' })
    return
  }
  // 额度不足在生成前拦截
  if (!quota.canAfford(cost.value)) {
    askResetQuota()
    return
  }

  status.value = 'generating'
  progress.value = 0
  saved.value = false
  warnings.value = []
  const token = ++generationToken
  const duration = randomInt(1500, 3000)

  await new Promise<void>((resolve) => {
    const start = Date.now()
    progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - start
      progress.value = Math.min(95, Math.round((elapsed / duration) * 100))
      if (elapsed >= duration) {
        if (progressTimer !== undefined) window.clearInterval(progressTimer)
        progress.value = 100
        resolve()
      }
    }, 100)
  })
  if (token !== generationToken) return

  try {
    const output = await generateContent({
      channels: channels.value,
      assets: creation.assets,
      prompt: creation.prompt,
      sellingPoints: creation.sellingPoints,
      mediaType: mediaType.value,
    })
    // 生成成功才扣减额度
    const spendResult = quota.spend(cost.value, currentTitle.value)
    if (!spendResult.ok) {
      status.value = 'error'
      errorMessage.value = spendResult.message ?? '额度扣减失败'
      return
    }
    results.value = output.results
    warnings.value = output.warnings ?? []
    if (warnings.value.length > 0) {
      ElMessage.warning(warnings.value[0])
    }
    status.value = 'success'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : '生成失败，请重试'
  }
}

/** 重新生成：再次走完整生成流程并再次扣减额度 */
async function copyText(text: string): Promise<void> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text)
      ElMessage.success('文案已复制')
      return
    }
    throw new Error('clipboard unavailable')
  } catch {
    // 降级：临时 textarea + execCommand
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (copied) {
        ElMessage.success('文案已复制')
        return
      }
    } catch {
      // 忽略降级失败
    }
    ElMessage.warning('复制失败，请长按文案手动复制')
  }
}

function saveToProjects(): void {
  projects.saveProject({
    title: currentTitle.value,
    channels: [...creation.channels],
    coverUrl: creation.assets[0]?.url ?? results.value[0]?.posterUrl ?? null,
    prompt: creation.prompt,
    assets: creation.assets.map((item) => ({ id: item.id, name: item.name, url: item.url, source: item.source })),
    results: results.value.map((item) => ({ ...item })),
    quotaCost: cost.value,
    templateId: creation.templateId,
  })
  saved.value = true
  ElMessage.success('已保存到我的创作')
}

function startOver(): void {
  creation.reset()
  router.push({ name: 'create-home' })
}

function createAgain(): void {
  creation.setConfirmation(false)
  router.push({ name: creation.mode === 'chat' ? 'create-chat' : 'create-quick' })
}

function exitCreation(): void {
  creation.reset()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="creation-flow-page">
    <CreationFlowHeader title="创作结果" :step="3" completed @exit="exitCreation" />

    <main class="creation-flow-content result-flow-content">

    <!-- 草稿不完整 -->
    <section v-if="!hasDraft" class="page-panel">
      <div class="state-panel">
        <el-icon class="error-icon" aria-hidden="true"><VideoPlay /></el-icon>
        <p>创作信息不完整，需要先选择渠道并填写生成指令</p>
        <el-button type="primary" @click="router.push({ name: 'create-home' })">重新开始创作</el-button>
      </div>
    </section>

    <!-- 未生成 -->
    <section v-else-if="status === 'idle'" class="page-panel">
      <h1>开始生成</h1>
      <p class="muted">将按 {{ creation.channels.length }} 个渠道生成适配内容</p>

      <div class="cost-box">
        <div class="cost-row"><span>目标渠道</span><span>{{ creation.channels.length }} 个</span></div>
        <div class="cost-row"><span>预计消耗额度</span><span class="cost-value">{{ cost }} 点</span></div>
        <div class="cost-row"><span>当前余额</span><span :class="{ 'cost-low': quota.balance < cost }">{{ quota.balance }} 点</span></div>
      </div>

      <el-button type="primary" size="large" class="generate-btn" @click="runGenerate">开始生成</el-button>
      <button class="link-btn" type="button" @click="startOver">放弃本次创作，重新选择渠道</button>
    </section>

    <!-- 生成中 -->
    <section v-else-if="status === 'generating'" class="page-panel generating-panel" role="status" aria-live="polite">
      <el-progress type="circle" :percentage="progress" :width="120" :stroke-width="8" />
      <p class="generating-text">正在为 {{ creation.channels.length }} 个渠道生成内容…</p>
      <p class="muted generating-sub">预计 {{ creation.channels.length }} 个版本将消耗 {{ cost }} 点额度</p>
    </section>

    <!-- 失败 -->
    <section v-else-if="status === 'error'" class="page-panel" role="alert">
      <div class="state-panel">
        <el-icon class="error-icon" aria-hidden="true"><CircleCloseFilled /></el-icon>
        <p>{{ errorMessage }}</p>
        <p class="muted">本次未消耗额度，可直接重试</p>
        <el-button type="primary" @click="runGenerate">再次生成</el-button>
      </div>
    </section>

    <!-- 成功 -->
    <section v-else class="page-panel">
      <div class="success-head"><h1>生成完成</h1></div>
      <p class="muted">本次消耗 {{ cost }} 点额度，剩余 {{ quota.balance }} 点</p>

      <div v-if="warnings.length > 0" class="warning-box" role="alert">
        <p v-for="(item, index) in warnings" :key="index">{{ item }}</p>
      </div>

      <div class="result-list">
        <div v-for="result in results" :key="result.channelId" class="result-card">
          <div class="result-head">
            <span class="result-channel">{{ getChannelSync(result.channelId)?.name ?? result.channelId }}</span>
            <el-button size="small" :icon="CopyDocument" @click="copyText(result.text)">复制文案</el-button>
          </div>
          <p class="result-text">{{ result.text }}</p>
          <div v-if="result.videoUrl" class="poster-box">
            <video :src="result.videoUrl" controls playsinline class="result-video"></video>
            <span class="poster-tag">AI 视频</span>
          </div>
          <div v-else class="poster-box">
            <img v-if="result.posterUrl" :src="result.posterUrl" :alt="`${getChannelSync(result.channelId)?.name ?? ''}生成海报`" />
            <span class="poster-tag">{{ result.source === 'grok' ? 'AI 海报' : '示例图' }}</span>
          </div>
        </div>
      </div>

      <div class="success-actions">
        <el-button type="primary" size="large" :icon="saved ? Check : undefined" :disabled="saved" @click="saveToProjects">
          {{ saved ? '已保存到我的创作' : '保存到我的创作' }}
        </el-button>
      </div>
      <button class="link-btn" type="button" @click="createAgain">再次创作</button>
    </section>
    </main>
  </div>
</template>

<style scoped>
.result-flow-content {
  padding-top: 16px;
}

.cost-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 14px 0 18px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--color-surface-soft);
  font-size: 14px;
}

.cost-row {
  display: flex;
  justify-content: space-between;
  color: var(--color-muted);
}

.cost-row > span:last-child {
  color: var(--color-ink);
  font-weight: 600;
}

.cost-low {
  color: var(--color-danger) !important;
}

.generate-btn {
  width: 100%;
  margin-bottom: 6px;
}

.link-btn {
  display: block;
  width: 100%;
  min-height: 44px;
  margin: 4px auto 0;
  border: 0;
  background: transparent;
  color: var(--color-muted);
  font-size: 13px;
  cursor: pointer;
}

.generating-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 36px 16px;
  text-align: center;
}

.generating-text {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.generating-sub {
  margin: 0;
  font-size: 12px;
}

.success-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.success-head h1 {
  margin: 0;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 14px;
}

.result-card {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.result-channel {
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
}

.result-text {
  margin: 10px 0;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  user-select: text;
}

.warning-box {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid var(--color-warning, #e6a23c);
  border-radius: 10px;
  background: rgba(230, 162, 60, 0.08);
  color: var(--color-warning, #b88230);
  font-size: 12px;
  line-height: 1.7;
}

.warning-box p {
  margin: 0;
}

.result-video {
  display: block;
  width: 100%;
  aspect-ratio: 9 / 16;
  max-height: 420px;
  background: #000;
}

.poster-box {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  background: var(--color-surface-soft);
}

.poster-box img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.poster-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(21, 23, 34, 0.62);
  color: #fff;
  font-size: 11px;
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
}

.success-actions .el-button {
  width: 100%;
  margin-left: 0;
}
</style>
