<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, ChatDotRound, MagicStick, VideoCameraFilled, VideoPlay } from '@element-plus/icons-vue'
import CreationFlowHeader from '../../components/creation/CreationFlowHeader.vue'
import type { ChannelId } from '../../api/types'
import { isChannelId } from '../../api/types'
import { getAllChannelsSync } from '../../api/channels'
import { getAppDataSync } from '../../utils/appDataLoader'
import { useCreationStore } from '../../stores/creation'

const route = useRoute()
const router = useRouter()
const creation = useCreationStore()

const ICON_MAP: Record<string, unknown> = {
  VideoPlay,
  VideoCameraFilled,
  ChatDotRound,
}

const selected = ref<ChannelId[]>([])
const templateTitle = ref<string | undefined>(undefined)
const templateId = typeof route.query.template === 'string' ? route.query.template : undefined
const templateQuery = ref(templateId)
const ready = ref(false)
const selectedChannels = computed(() => getAllChannelsSync().filter((channel) => selected.value.includes(channel.id)))

onMounted(async () => {
  // P1 “使用此模板”会带 query.template 与 query.channels（逗号分隔渠道 id）
  const queryChannels = String(route.query.channels ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is ChannelId => isChannelId(item))
  selected.value = [...new Set(queryChannels)]

  if (templateId) {
    // 从动态加载的应用数据源中查找模板标题与提示词示例
    try {
      const found = getAppDataSync()?.templates.find((item) => item.id === templateId)
      if (found) {
        templateTitle.value = found.title
        creation.setTemplate(templateId, found.title, found.promptExample)
      }
    } catch {
      // 数据源未就绪：保持模板 id 兜底
    }
    creation.setTemplate(templateId, templateTitle.value || templateId)
  }

  // 返回/刷新场景：沿用已有草稿
  if (selected.value.length === 0 && creation.channels.length > 0) {
    selected.value = [...creation.channels]
  }
  ready.value = true
})

function toggle(id: ChannelId): void {
  const index = selected.value.indexOf(id)
  if (index >= 0) {
    selected.value.splice(index, 1)
  } else {
    selected.value.push(id)
  }
}

function goNext(): void {
  if (selected.value.length === 0) {
    ElMessage.warning('请至少选择 1 个渠道')
    return
  }
  creation.setChannels([...selected.value])
  router.push({ name: 'create-assets' })
}

function exitCreation(): void {
  creation.reset()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="creation-flow-page">
    <CreationFlowHeader title="开始创作" :step="1" @exit="exitCreation" />

    <main class="creation-flow-content">
      <div class="flow-heading">
        <h1 class="creation-flow-title">选择发布渠道</h1>
        <p class="creation-flow-subtitle">可多选，将分别生成适配各渠道的内容。</p>
      </div>

      <div class="channel-grid" aria-label="目标渠道">
        <button
          v-for="channel in getAllChannelsSync()"
          :key="channel.id"
          class="channel-tile"
          :class="{ 'is-selected': selected.includes(channel.id) }"
          type="button"
          :aria-pressed="selected.includes(channel.id)"
          @click="toggle(channel.id)"
        >
          <span class="channel-icon" aria-hidden="true">
            <el-icon :size="22"><component :is="ICON_MAP[channel.icon]" /></el-icon>
          </span>
          <span class="channel-name">{{ channel.name }}</span>
          <el-icon v-if="selected.includes(channel.id)" class="channel-check" :size="16" aria-hidden="true"><Check /></el-icon>
        </button>
      </div>

      <section v-if="selectedChannels.length > 0" class="channel-guidance" aria-label="已选渠道内容建议">
        <div class="guidance-head">
          <el-icon :size="18" aria-hidden="true"><MagicStick /></el-icon>
          <strong>内容建议</strong>
        </div>
        <div v-for="channel in selectedChannels" :key="channel.id" class="guidance-row">
          <span>{{ channel.name }}</span>
          <p>{{ channel.copyStyle }}</p>
        </div>
      </section>

      <div v-if="templateQuery" class="template-tip">
        <span>已使用模板</span>
        <strong>{{ templateTitle ?? templateId }}</strong>
      </div>
    </main>

    <footer class="creation-flow-footer">
      <el-button
        type="primary"
        size="large"
        class="creation-primary"
        :disabled="!ready || selected.length === 0"
        @click="goNext"
      >
        下一步 · 添加素材
      </el-button>
    </footer>
  </div>
</template>

<style scoped>
.flow-heading {
  padding: 2px 2px 0;
}

.channel-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 20px;
}

.channel-tile {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 96px;
  padding: 12px 6px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  border: 1.5px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-ink);
  cursor: pointer;
}

.channel-tile.is-selected {
  border-color: var(--color-brand);
  background: var(--color-brand-soft);
  color: var(--color-brand-ink);
}

.channel-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-surface-soft);
  color: var(--color-brand);
}

.channel-tile.is-selected .channel-icon {
  background: var(--color-surface);
  color: var(--color-brand-ink);
}

.channel-name {
  font-size: 14px;
  font-weight: 700;
}

.channel-check {
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--color-brand);
}

.channel-guidance {
  margin-top: 18px;
  padding: 14px 2px;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.guidance-head {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--color-brand-ink);
}

.guidance-head strong {
  font-size: 14px;
}

.guidance-row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 8px;
  margin-top: 10px;
}

.guidance-row span {
  font-size: 13px;
  font-weight: 700;
}

.guidance-row p {
  margin: 0;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.6;
}

.template-tip {
  display: flex;
  min-height: 48px;
  margin-top: 8px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-primary);
  font-size: 13px;
}

.template-tip span {
  color: var(--color-muted);
}

.template-tip strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
