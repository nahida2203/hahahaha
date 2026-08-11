<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { EditPen, MagicStick, Picture, Refresh, VideoPlay } from '@element-plus/icons-vue'
import CreationFlowHeader from '../../components/creation/CreationFlowHeader.vue'
import { getAllChannelsSync } from '../../api/channels'
import { useCreationStore } from '../../stores/creation'
import { randomInt, sleep } from '../../utils/format'

const router = useRouter()
const creation = useCreationStore()

const generating = ref(false)
const promptMode = ref<'ai' | 'manual'>('ai')

const channelSummary = computed(() =>
  creation.channels.map((id) => getAllChannelsSync().find((item) => item.id === id)?.name ?? id).join('、'),
)
const hasPrompt = computed(() => creation.prompt.trim().length > 0)

async function aiGenerate(): Promise<void> {
  if (generating.value) return
  generating.value = true
  try {
    // 模拟 AI 生成延迟 1-1.5s
    await sleep(randomInt(1000, 1500))
    creation.aiGeneratePrompt()
    ElMessage.success(hasPrompt.value ? '已重新生成提示词' : '提示词已生成')
  } finally {
    generating.value = false
  }
}

function onTextareaFocus(event: FocusEvent): void {
  window.setTimeout(() => (event.target as HTMLElement).scrollIntoView({ block: 'center' }), 250)
}

function goBack(): void {
  router.push({ name: 'create-assets' })
}

function exitCreation(): void {
  creation.reset()
  router.push({ name: 'home' })
}

function goNext(): void {
  if (!hasPrompt.value) {
    ElMessage.warning('请先输入或生成提示词')
    return
  }
  router.push({ name: 'create-result' })
}
</script>

<template>
  <div class="creation-flow-page">
    <CreationFlowHeader title="生成提示词" :step="3" @exit="exitCreation" />

    <main class="creation-flow-content prompt-content">
      <h1 class="creation-flow-title">完善生成指令</h1>
      <p class="creation-flow-subtitle">AI 可以先生成，你也可以直接手动输入。</p>

      <div class="creation-summary" aria-label="本次创作摘要">
        <span><el-icon :size="16" aria-hidden="true"><VideoPlay /></el-icon>{{ channelSummary }}</span>
        <span><el-icon :size="16" aria-hidden="true"><Picture /></el-icon>{{ creation.assets.length }} 张素材</span>
      </div>

      <div class="prompt-mode" role="group" aria-label="提示词输入方式">
        <button type="button" :class="{ 'is-active': promptMode === 'ai' }" :aria-pressed="promptMode === 'ai'" @click="promptMode = 'ai'">
          <el-icon :size="17" aria-hidden="true"><MagicStick /></el-icon>
          AI 生成
        </button>
        <button type="button" :class="{ 'is-active': promptMode === 'manual' }" :aria-pressed="promptMode === 'manual'" @click="promptMode = 'manual'">
          <el-icon :size="17" aria-hidden="true"><EditPen /></el-icon>
          手动输入
        </button>
      </div>

      <button v-if="promptMode === 'ai'" type="button" class="ai-generate" :disabled="generating" @click="aiGenerate">
        <span class="ai-icon"><el-icon :size="20" aria-hidden="true"><MagicStick /></el-icon></span>
        <span class="ai-copy">
          <strong>{{ generating ? '正在生成提示词…' : hasPrompt ? '重新生成一版' : '生成一版提示词' }}</strong>
          <small>根据渠道、素材和卖点自动整理</small>
        </span>
        <el-icon v-if="hasPrompt && !generating" :size="18" aria-hidden="true"><Refresh /></el-icon>
      </button>

      <div class="prompt-label">
        <span>提示词内容</span>
        <small v-if="promptMode === 'manual'">直接编辑后即可生成</small>
      </div>
      <el-input
        v-model="creation.prompt"
        type="textarea"
        :rows="9"
        resize="none"
        placeholder="输入希望生成的内容、重点卖点和表达要求…"
        @focus="onTextareaFocus"
      />
    </main>

    <footer class="creation-flow-footer">
      <el-button size="large" class="creation-secondary" @click="goBack">上一步</el-button>
      <el-button type="primary" size="large" class="creation-primary" :disabled="!hasPrompt" @click="goNext">
        开始生成
      </el-button>
    </footer>
  </div>
</template>

<style scoped>
.prompt-content {
  display: flex;
  flex-direction: column;
  padding-top: 16px;
}

.creation-summary {
  display: flex;
  gap: 8px;
  margin: 16px 0 14px;
  flex-wrap: wrap;
}

.creation-summary span {
  display: inline-flex;
  min-height: 36px;
  padding: 0 10px;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  background: var(--color-surface-soft);
  color: var(--color-ink-secondary);
  font-size: 12px;
}

.prompt-mode {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  background: var(--color-surface-soft);
}

.prompt-mode button {
  display: flex;
  min-height: 44px;
  padding: 0 10px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
}

.prompt-mode button.is-active {
  background: var(--color-surface);
  color: var(--color-primary);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(32, 43, 73, 0.08);
}

.ai-generate {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 24px;
  min-height: 72px;
  margin-top: 12px;
  padding: 10px 12px;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--color-primary);
  border-radius: 10px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  text-align: left;
  cursor: pointer;
}

.ai-generate:disabled {
  cursor: wait;
  opacity: 0.7;
}

.ai-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--color-surface);
}

.ai-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.ai-copy strong {
  font-size: 14px;
}

.ai-copy small {
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.4;
}

.prompt-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 18px 0 9px;
  font-size: 14px;
  font-weight: 700;
}

.prompt-label small {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 400;
}

:deep(.el-textarea__inner) {
  min-height: 220px !important;
  padding: 12px;
  line-height: 1.65;
}
</style>
