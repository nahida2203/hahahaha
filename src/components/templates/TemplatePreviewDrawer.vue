<script setup lang="ts">
import { computed } from 'vue'
import { formatChannels } from '../../api/channels'
import type { MvpTemplate } from '../../api/types'

const props = defineProps<{
  modelValue: boolean
  template: MvpTemplate | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'use', template: MvpTemplate): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const channelText = computed(() => (props.template ? formatChannels(props.template.channelIds) : ''))
</script>

<template>
  <el-drawer
    v-model="visible"
    direction="btt"
    size="82%"
    :with-header="false"
    destroy-on-close
    class="template-drawer"
  >
    <div v-if="template" class="preview">
      <div class="cover">
        <img :src="template.coverUrl" :alt="template.coverAlt" />
        <span class="scene-tag">{{ template.scene }}</span>
      </div>

      <div class="preview-head">
        <h2 class="title">{{ template.title }}</h2>
        <span class="style-chip">{{ template.style }}</span>
      </div>

      <p class="description">{{ template.description }}</p>

      <section class="block" aria-label="提示词示例">
        <h3 class="block-title">提示词示例</h3>
        <p class="prompt">{{ template.promptExample }}</p>
      </section>

      <section class="block" aria-label="适用渠道">
        <h3 class="block-title">适用渠道</h3>
        <p class="channels">{{ channelText }}</p>
      </section>

      <div class="footer">
        <el-button type="primary" size="large" class="use-btn" @click="emit('use', template)">
          使用此模板
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.preview {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  border-radius: 14px;
  background: var(--color-surface-soft);
}

.cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scene-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(21, 23, 34, 0.62);
  color: #fff;
  font-size: 12px;
  line-height: 1.5;
}

.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
}

.style-chip {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 8px;
  background: var(--color-brand-soft);
  color: var(--color-brand-ink);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
  white-space: nowrap;
}

.description {
  margin: 0;
  color: var(--color-ink-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.block {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--color-surface-soft);
}

.block-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-muted);
}

.prompt {
  margin: 0;
  color: var(--color-ink);
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.channels {
  margin: 0;
  color: var(--color-ink-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.footer {
  position: sticky;
  bottom: 0;
  margin: 2px -16px -16px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.use-btn {
  width: 100%;
}

</style>

<style>
.template-drawer .el-drawer__body {
  padding: 16px;
}
</style>
