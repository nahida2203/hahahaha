<script setup lang="ts">
import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Close } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    title: string
    step: number
    total?: number
    completed?: boolean
  }>(),
  {
    total: 3,
    completed: false,
  },
)

const emit = defineEmits<{
  (event: 'exit'): void
}>()

const progress = computed(() => (props.completed ? 100 : Math.min(100, (props.step / props.total) * 100)))
const statusLabel = computed(() => (props.completed ? '已完成' : `${props.step} / ${props.total}`))

async function confirmExit(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      '当前未保存的渠道、素材、提示词和生成结果将被清空；已保存到“我的创作”的记录不受影响。',
      '退出创作？',
      {
        confirmButtonText: '退出并清空',
        cancelButtonText: '继续创作',
        distinguishCancelAndClose: true,
        type: 'warning',
      },
    )
  } catch {
    return
  }
  emit('exit')
}
</script>

<template>
  <header class="creation-header">
    <div class="creation-header-row">
      <button type="button" class="creation-exit" aria-label="退出创作" @click="confirmExit">
        <el-icon :size="18" aria-hidden="true"><Close /></el-icon>
        <span>退出</span>
      </button>
      <strong>{{ title }}</strong>
      <span>{{ statusLabel }}</span>
    </div>
    <div
      class="creation-progress"
      role="progressbar"
      :aria-label="completed ? '创作信息已完成' : `创作步骤：第 ${step} 步，共 ${total} 步`"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(progress)"
    >
      <span :style="{ width: `${progress}%` }"></span>
    </div>
  </header>
</template>

<style scoped>
.creation-header {
  position: sticky;
  top: 0;
  z-index: 50;
  padding-top: env(safe-area-inset-top);
  background: var(--color-surface);
}

.creation-header-row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) 52px;
  align-items: center;
  min-height: 54px;
  padding: 0 10px;
}

.creation-header-row strong {
  overflow: hidden;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.creation-header-row > span {
  color: var(--color-muted);
  font-size: 12px;
  text-align: right;
}

.creation-exit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 62px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface-soft);
  color: var(--color-ink-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color var(--motion-fast) ease,
    background-color var(--motion-fast) ease,
    color var(--motion-fast) ease,
    transform var(--motion-fast) ease;
}

.creation-exit .el-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 21px;
  height: 21px;
  border-radius: 7px;
  background: var(--color-surface);
  color: var(--color-brand-ink);
}

.creation-exit:hover {
  border-color: var(--color-brand);
  background: var(--color-brand-soft);
  color: var(--color-brand-ink);
}

.creation-exit:focus-visible {
  outline: 3px solid var(--color-brand-soft);
  outline-offset: 2px;
}

.creation-exit:active {
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .creation-exit {
    transition: none;
  }
}

.creation-progress {
  height: 4px;
  overflow: hidden;
  background: var(--color-surface-soft);
}

.creation-progress span {
  display: block;
  height: 100%;
  background: var(--color-brand);
  transition: width var(--motion-fast) ease;
}

@media (prefers-reduced-motion: reduce) {
  .creation-progress span {
    transition: none;
  }
}
</style>
