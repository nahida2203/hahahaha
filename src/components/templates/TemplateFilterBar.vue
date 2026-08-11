<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Check, Close, Search } from '@element-plus/icons-vue'
import type { MvpChannelOption, MvpTemplate } from '../../api/types'

const props = defineProps<{
  scenes: string[]
  styles: string[]
  channels: MvpChannelOption[]
  templates: MvpTemplate[]
  scene: string
  style: string
  channel: string
  resultCount: number
}>()

const emit = defineEmits<{
  (e: 'update:scene', value: string): void
  (e: 'update:style', value: string): void
  (e: 'update:channel', value: string): void
}>()

const drawerVisible = ref(false)
const draftScene = ref('')
const draftStyle = ref('')
const draftChannel = ref('')

const activeCount = computed(() => [props.scene, props.style, props.channel].filter(Boolean).length)
const draftHasFilter = computed(() => Boolean(draftScene.value || draftStyle.value || draftChannel.value))
const channelLabel = computed(
  () => props.channels.find((item) => item.id === props.channel)?.label ?? props.channel,
)
const filterSummary = computed(() => {
  const labels = [props.scene, props.style, channelLabel.value].filter(Boolean)
  return labels.length > 0 ? labels.join(' · ') : '全部模板'
})
const draftResultCount = computed(() =>
  props.templates.filter((template) => {
    if (draftScene.value && template.scene !== draftScene.value) return false
    if (draftStyle.value && template.style !== draftStyle.value) return false
    if (
      draftChannel.value &&
      !template.channelIds.includes(draftChannel.value as MvpTemplate['channelIds'][number])
    ) {
      return false
    }
    return true
  }).length,
)

function openFilters(): void {
  draftScene.value = props.scene
  draftStyle.value = props.style
  draftChannel.value = props.channel
  drawerVisible.value = true
}

function resetDraft(): void {
  draftScene.value = ''
  draftStyle.value = ''
  draftChannel.value = ''
}

function applyFilters(): void {
  emit('update:scene', draftScene.value)
  emit('update:style', draftStyle.value)
  emit('update:channel', draftChannel.value)
  drawerVisible.value = false
}
</script>

<template>
  <div class="filter-shell">
    <button
      type="button"
      class="filter-trigger"
      :aria-label="`筛选模板，当前条件：${filterSummary}，共 ${resultCount} 个结果`"
      @click="openFilters"
    >
      <span class="filter-icon" aria-hidden="true">
        <el-icon :size="18"><Search /></el-icon>
      </span>
      <span class="filter-copy">
        <span class="filter-summary">{{ filterSummary }}</span>
        <span class="filter-meta">共 {{ resultCount }} 个模板</span>
      </span>
      <span v-if="activeCount > 0" class="active-count" aria-hidden="true">{{ activeCount }}</span>
      <el-icon class="filter-arrow" :size="16" aria-hidden="true"><ArrowRight /></el-icon>
    </button>

    <el-drawer
      v-model="drawerVisible"
      direction="btt"
      size="min(82dvh, 620px)"
      :with-header="false"
      append-to-body
      destroy-on-close
      class="template-filter-drawer"
    >
      <div class="drawer-content">
        <header class="drawer-header">
          <div>
            <h2>筛选模板</h2>
            <p>组合条件快速找到合适的创作模板</p>
          </div>
          <button type="button" class="close-button" aria-label="关闭筛选" @click="drawerVisible = false">
            <el-icon :size="20" aria-hidden="true"><Close /></el-icon>
          </button>
        </header>

        <div class="drawer-scroll">
          <section class="filter-group" aria-labelledby="filter-scene-label">
            <h3 id="filter-scene-label">使用场景</h3>
            <div class="option-list" role="group" aria-labelledby="filter-scene-label">
              <button
                type="button"
                class="option-chip"
                :class="{ 'is-active': draftScene === '' }"
                :aria-pressed="draftScene === ''"
                @click="draftScene = ''"
              >
                <el-icon v-if="draftScene === ''" :size="14" aria-hidden="true"><Check /></el-icon>
                <span>全部</span>
              </button>
              <button
                v-for="item in scenes"
                :key="item"
                type="button"
                class="option-chip"
                :class="{ 'is-active': draftScene === item }"
                :aria-pressed="draftScene === item"
                @click="draftScene = item"
              >
                <el-icon v-if="draftScene === item" :size="14" aria-hidden="true"><Check /></el-icon>
                <span>{{ item }}</span>
              </button>
            </div>
          </section>

          <section class="filter-group" aria-labelledby="filter-style-label">
            <h3 id="filter-style-label">内容风格</h3>
            <div class="option-list" role="group" aria-labelledby="filter-style-label">
              <button
                type="button"
                class="option-chip"
                :class="{ 'is-active': draftStyle === '' }"
                :aria-pressed="draftStyle === ''"
                @click="draftStyle = ''"
              >
                <el-icon v-if="draftStyle === ''" :size="14" aria-hidden="true"><Check /></el-icon>
                <span>全部</span>
              </button>
              <button
                v-for="item in styles"
                :key="item"
                type="button"
                class="option-chip"
                :class="{ 'is-active': draftStyle === item }"
                :aria-pressed="draftStyle === item"
                @click="draftStyle = item"
              >
                <el-icon v-if="draftStyle === item" :size="14" aria-hidden="true"><Check /></el-icon>
                <span>{{ item }}</span>
              </button>
            </div>
          </section>

          <section class="filter-group" aria-labelledby="filter-channel-label">
            <h3 id="filter-channel-label">目标渠道</h3>
            <div class="option-list" role="group" aria-labelledby="filter-channel-label">
              <button
                type="button"
                class="option-chip"
                :class="{ 'is-active': draftChannel === '' }"
                :aria-pressed="draftChannel === ''"
                @click="draftChannel = ''"
              >
                <el-icon v-if="draftChannel === ''" :size="14" aria-hidden="true"><Check /></el-icon>
                <span>全部</span>
              </button>
              <button
                v-for="item in channels"
                :key="item.id"
                type="button"
                class="option-chip"
                :class="{ 'is-active': draftChannel === item.id }"
                :aria-pressed="draftChannel === item.id"
                @click="draftChannel = item.id"
              >
                <el-icon v-if="draftChannel === item.id" :size="14" aria-hidden="true"><Check /></el-icon>
                <span>{{ item.label }}</span>
              </button>
            </div>
          </section>
        </div>

        <footer class="drawer-footer">
          <button type="button" class="reset-button" :disabled="!draftHasFilter" @click="resetDraft">重置</button>
          <el-button type="primary" size="large" class="apply-button" @click="applyFilters">
            查看 {{ draftResultCount }} 个模板
          </el-button>
        </footer>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.filter-shell {
  width: 100%;
}

.filter-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 56px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
}

.filter-trigger:active {
  background: var(--color-surface-soft);
}

.filter-icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.filter-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.filter-summary {
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-meta {
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.4;
}

.active-count {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--color-brand);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.filter-arrow {
  flex: 0 0 auto;
  color: var(--color-muted);
}

.drawer-content {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--color-border);
}

.drawer-header h2 {
  margin: 0 0 3px;
  font-size: 18px;
  line-height: 1.4;
}

.drawer-header p {
  margin: 0;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.5;
}

.close-button {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin: -8px -8px 0 0;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
}

.close-button:active {
  background: var(--color-surface-soft);
}

.drawer-scroll {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 2px 16px 18px;
  overscroll-behavior: contain;
}

.filter-group {
  padding-top: 16px;
}

.filter-group + .filter-group {
  margin-top: 16px;
  border-top: 1px solid var(--color-border);
}

.filter-group h3 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
}

.option-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-ink-secondary);
  font-size: 13px;
  cursor: pointer;
  touch-action: manipulation;
}

.option-chip.is-active {
  border-color: var(--color-brand);
  background: var(--color-brand-soft);
  color: var(--color-brand-ink);
  font-weight: 600;
}

.drawer-footer {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: 10px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.reset-button {
  min-height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-ink-secondary);
  font-size: 14px;
  cursor: pointer;
}

.reset-button:disabled {
  color: var(--color-muted);
  cursor: not-allowed;
  opacity: 0.5;
}

.apply-button {
  width: 100%;
  min-height: 44px;
  margin: 0;
}
</style>

<style>
.template-filter-drawer {
  overflow: hidden;
  border-radius: 16px 16px 0 0;
  background: #121715;
  color: #f3f7f3;
}

.template-filter-drawer .el-drawer__body {
  padding: 0;
  overflow: hidden;
  background: #121715;
}

.template-filter-drawer .drawer-header,
.template-filter-drawer .drawer-footer,
.template-filter-drawer .option-chip,
.template-filter-drawer .reset-button {
  border-color: rgba(255,255,255,.1);
  background: #121715;
  color: #d7e1da;
}

.template-filter-drawer .drawer-header p {
  color: #8b9990;
}

.template-filter-drawer .option-chip.is-active {
  border-color: rgba(185,223,197,.6);
  background: rgba(185,223,197,.12);
  color: #d8f0dd;
}

.template-filter-drawer .apply-button {
  border-color: #d8f0dd;
  background: #d8f0dd;
  color: #162019;
}
</style>
