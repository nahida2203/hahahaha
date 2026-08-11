<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, Picture } from '@element-plus/icons-vue'
import type { GeneratedResult } from '../../api/types'
import { getChannelSync } from '../../api/channels'

const props = defineProps<{ result: GeneratedResult }>()

const channelName = computed(() => getChannelSync(props.result.channelId)?.name ?? props.result.channelId)

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
</script>

<template>
  <article class="result-card">
    <div class="result-head">
      <span class="result-channel">{{ channelName }}</span>
      <el-button :icon="CopyDocument" @click="copyText(result.text)">复制文案</el-button>
    </div>
    <p class="result-text">{{ result.text }}</p>
    <div class="poster-box">
      <img
        v-if="result.posterUrl"
        :src="result.posterUrl"
        :alt="`${channelName}生成海报`"
        loading="lazy"
      />
      <span v-else class="poster-placeholder" aria-hidden="true">
        <el-icon :size="22"><Picture /></el-icon>
        暂无生成海报
      </span>
      <span v-if="result.posterUrl" class="poster-tag">生成海报</span>
    </div>
  </article>
</template>

<style scoped>
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
  flex-shrink: 0;
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

.poster-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  aspect-ratio: 4 / 3;
  color: var(--color-muted);
  font-size: 12px;
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
</style>
