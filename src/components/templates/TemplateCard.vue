<script setup lang="ts">
import { computed } from 'vue'
import { ChatDotRound, CollectionTag, MoreFilled, Star } from '@element-plus/icons-vue'
import { formatChannels } from '../../api/channels'
import type { MvpTemplate } from '../../api/types'

const props = defineProps<{ template: MvpTemplate; index?: number }>()
const emit = defineEmits<{ (e: 'preview', template: MvpTemplate): void }>()

const channelText = computed(() => formatChannels(props.template.channelIds))
const authorName = computed(() => props.template.style === '大气正式' ? '福农品牌研究所' : props.template.style === '年轻潮流' ? '县域内容实验室' : '产地灵感站')
const engagement = computed(() => String([128, 86, 443, 67, 231, 92][(props.index ?? 0) % 6]))
const isVideo = computed(() => props.template.channelIds.includes('douyin') || props.template.channelIds.includes('shipinhao'))
const actionLabel = '做同款'
</script>

<template>
  <button
    type="button"
    class="template-card"
    :class="`card-${(index ?? 0) % 4}`"
    :aria-label="`查看模板：${template.title}`"
    @click="emit('preview', template)"
  >
    <span class="cover">
      <img :src="template.coverUrl" :alt="template.coverAlt" loading="lazy" />
      <span class="cover-topline">
        <span class="scene-tag">{{ template.scene }}</span>
        <span v-if="isVideo" class="media-mark" aria-label="视频模板"><el-icon :size="13"><ChatDotRound /></el-icon></span>
      </span>
      <span class="cover-bottomline"><span class="cover-action">{{ actionLabel }}</span></span>
    </span>
    <span class="body">
      <span class="title">{{ template.title }}</span>
      <span class="author-row">
        <span class="author-avatar" aria-hidden="true">{{ authorName.slice(0, 1) }}</span>
        <span class="author-name">{{ authorName }}</span>
        <span class="card-more" aria-hidden="true"><el-icon :size="15"><MoreFilled /></el-icon></span>
      </span>
      <span class="meta">
        <span class="style-chip"><el-icon :size="11"><CollectionTag /></el-icon>{{ template.style }}</span>
        <span class="channels">{{ channelText }}</span>
        <span class="engagement" aria-label="使用次数"><el-icon :size="12" aria-hidden="true"><Star /></el-icon>{{ engagement }}</span>
      </span>
    </span>
  </button>
</template>

<style scoped>
.template-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 44px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #f7faf7;
  text-align: left;
  cursor: pointer;
}

.template-card:active {
  transform: scale(0.985);
}

.cover {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1.18;
  border-radius: 12px;
  overflow: hidden;
  background: #1a201d;
}

.cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scene-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  max-width: calc(100% - 16px);
  padding: 3px 8px;
  overflow: hidden;
  border-radius: 6px;
  background: rgba(21, 23, 34, 0.68);
  color: #fff;
  font-size: 11px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-1 .cover { aspect-ratio: 1 / 1; }
.card-2 .cover { aspect-ratio: 1 / 1.3; }
.card-3 .cover { aspect-ratio: 1 / .9; }
.cover-topline, .cover-bottomline { position: absolute; right: 8px; left: 8px; display: flex; align-items: center; justify-content: space-between; }
.cover-topline { top: 8px; }
.cover-topline .scene-tag { position: static; }
.media-mark { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,.52); color: #fff; }
.cover-bottomline { bottom: 9px; justify-content: flex-end; }
.cover-action { min-height: 34px; padding: 0 13px; border-radius: 18px; background: rgba(255,255,255,.72); color: #22262b; font-size: 12px; font-weight: 700; line-height: 34px; backdrop-filter: blur(8px); }

.body {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 8px 2px 14px;
}

.title {
  display: -webkit-box;
  overflow: hidden;
  color: #f4f7f3;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.author-row { display: flex; align-items: center; gap: 6px; min-width: 0; color: #9ba69f; font-size: 11px; }
.author-avatar { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; flex: 0 0 auto; border-radius: 50%; background: #294b3a; color: #d6efdc; font-size: 10px; font-weight: 700; }
.author-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-more { display: inline-flex; align-items: center; justify-content: center; margin-left: auto; color: #69766f; }

.meta {
  display: flex;
  align-items: center;
  gap: 5px;
  min-height: 20px;
}

.style-chip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 5px;
  background: rgba(255,255,255,.09);
  color: #b8c4bc;
  font-size: 11px;
  line-height: 1.6;
  white-space: nowrap;
}

.channels {
  min-width: 0;
  overflow: hidden;
  color: #819087;
  font-size: 11px;
  line-height: 1.6;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.engagement { display: inline-flex; align-items: center; gap: 3px; margin-left: auto; color: #a4b0a8; font-size: 11px; white-space: nowrap; }

@media (min-width: 680px) {
  .template-card { break-inside: avoid; }
}
</style>
