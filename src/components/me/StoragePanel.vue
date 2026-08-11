<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Picture } from '@element-plus/icons-vue'
import { getSettingsSync } from '../../utils/configLoader'
import { readAssetsFromStorage } from '../../utils/assetStorage'
import { formatBytes } from '../../utils/format'

const router = useRouter()
const assets = ref(readAssetsFromStorage())
const storageSettings = getSettingsSync().storage

const usedBytes = computed(() => assets.value.reduce((sum, item) => sum + item.size, 0))
const usedPercent = computed(() => {
  if (storageSettings.total_bytes <= 0) return 0
  return Math.min(100, Math.round((usedBytes.value / storageSettings.total_bytes) * 100))
})
</script>

<template>
  <section class="page-panel storage-panel" aria-label="存储空间">
    <div class="panel-head">
      <h2>存储空间</h2>
      <button class="panel-link" type="button" @click="router.push({ name: 'assets' })">
        素材库<el-icon :size="14" aria-hidden="true"><ArrowRight /></el-icon>
      </button>
    </div>

    <div class="storage-meta">
      <span class="storage-used">已用 <strong>{{ formatBytes(usedBytes) }}</strong> / {{ formatBytes(storageSettings.total_bytes) }}</span>
      <span class="storage-count">共 {{ assets.length }} 张素材</span>
    </div>
    <el-progress
      :percentage="usedPercent"
      :stroke-width="10"
      :show-text="false"
      color="var(--color-brand)"
      aria-label="存储使用进度"
    />
    <p class="muted storage-note">
      图库素材按 {{ formatBytes(storageSettings.sample_asset_size_bytes) }}/张计入，相册/拍照按文件大小计入
    </p>

    <button class="storage-btn" type="button" @click="router.push({ name: 'assets' })">
      <el-icon :size="16" aria-hidden="true"><Picture /></el-icon>
      <span>前往素材库（{{ assets.length }} 张）</span>
    </button>
  </section>
</template>

<style scoped>
.storage-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-height: 44px;
  margin: -10px -6px 0 0;
  padding: 0 6px;
  border: 0;
  background: transparent;
  color: var(--color-brand-ink);
  font-size: 13px;
  cursor: pointer;
}

.storage-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.storage-used {
  min-width: 0;
  overflow: hidden;
  color: var(--color-ink-secondary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.storage-used strong {
  color: var(--color-ink);
}

.storage-count {
  flex: 0 0 auto;
  color: var(--color-muted);
  font-size: 12px;
}

.storage-note {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
}

.storage-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  margin-top: 2px;
  border: 1px solid var(--color-brand);
  border-radius: 10px;
  background: var(--color-brand-soft);
  color: var(--color-brand-ink);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
