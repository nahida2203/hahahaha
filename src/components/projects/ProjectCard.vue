<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, EditPen } from '@element-plus/icons-vue'
import type { Project } from '../../api/types'
import { getChannelSync } from '../../api/channels'
import { formatDateTime } from '../../utils/id'

const props = defineProps<{ project: Project }>()
const emit = defineEmits<{ (e: 'open', id: string): void }>()

const channelLabels = computed(() =>
  props.project.channels
    .map((id) => getChannelSync(id)?.name ?? id)
    .filter((label, index, all) => all.indexOf(label) === index),
)

const timeText = computed(() => {
  const date = new Date(props.project.createdAt)
  if (Number.isNaN(date.getTime())) return props.project.createdAt
  const base = formatDateTime(props.project.createdAt)
  return date.getFullYear() === new Date().getFullYear() ? base : `${date.getFullYear()}-${base}`
})
</script>

<template>
  <button
    type="button"
    class="project-card"
    :aria-label="`查看创作：${project.title}`"
    @click="emit('open', project.id)"
  >
    <span class="thumb" aria-hidden="true">
      <img v-if="project.coverUrl" :src="project.coverUrl" :alt="project.title" loading="lazy" />
      <el-icon v-else :size="22"><EditPen /></el-icon>
    </span>
    <span class="body">
      <span class="title">{{ project.title }}</span>
      <span v-if="channelLabels.length > 0" class="chips" aria-hidden="true">
        <span v-for="label in channelLabels" :key="label" class="chip">{{ label }}</span>
      </span>
      <span class="meta">
        <span class="time">{{ timeText }}</span>
        <span class="cost">消耗 {{ project.quotaCost ?? 0 }} 点额度</span>
      </span>
    </span>
    <el-icon class="arrow" :size="16" aria-hidden="true"><ArrowRight /></el-icon>
  </button>
</template>

<style scoped>
.project-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 88px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
}

.project-card:active {
  transform: scale(0.985);
}

.thumb {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  overflow: hidden;
  border-radius: 10px;
  background: var(--color-surface-soft);
  color: var(--color-muted);
}

.thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  flex: 1;
}

.title {
  display: -webkit-box;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.chips {
  display: flex;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
}

.chip {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 11px;
  line-height: 1.6;
  white-space: nowrap;
}

.meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.5;
}

.time {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cost {
  flex-shrink: 0;
}

.arrow {
  flex-shrink: 0;
  color: var(--color-muted);
}
</style>
