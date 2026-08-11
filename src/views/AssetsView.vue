<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Camera, Delete, FolderOpened, Picture, Plus } from '@element-plus/icons-vue'
import type { Asset, AssetSource } from '../api/types'
import { getSampleAssetsSync } from '../api/assets'
import { getSettingsSync } from '../utils/configLoader'
import { readAssetsFromStorage, writeAssetsToStorage } from '../utils/assetStorage'
import { formatBytes } from '../utils/format'
import { genId } from '../utils/id'
import { isImageFile, readImageFileAsDataURL } from '../utils/image'

type AssetFilter = 'all' | 'image'

const assets = ref<Asset[]>(readAssetsFromStorage())
const filter = ref<AssetFilter>('all')

const filteredAssets = computed(() => {
  if (filter.value === 'image') return assets.value
  return assets.value
})

const usedBytes = computed(() => assets.value.reduce((sum, item) => sum + item.size, 0))
const storageSettings = getSettingsSync().storage
const remainingBytes = computed(() => Math.max(0, storageSettings.total_bytes - usedBytes.value))
const usedPercent = computed(() => {
  if (storageSettings.total_bytes <= 0) return 0
  return Math.min(100, Math.round((usedBytes.value / storageSettings.total_bytes) * 100))
})

/* ---------- 预览 ---------- */
const previewVisible = ref(false)
const previewUrl = ref('')
function openPreview(url: string | undefined): void {
  if (!url) return
  previewUrl.value = url
  previewVisible.value = true
}

/* ---------- 存储与写入 ---------- */
function persistAssets(list: Asset[]): void {
  assets.value = list
  writeAssetsToStorage(list)
}

/** 上传前检查剩余空间，不足则拦截 */
function checkStorage(addBytes: number): boolean {
  if (addBytes <= remainingBytes.value) return true
  ElMessageBox.alert(
    `剩余存储空间 ${formatBytes(remainingBytes.value)}，本次需要约 ${formatBytes(addBytes)}。请先删除部分素材或改用体积更小的图片。`,
    '存储空间不足',
    { confirmButtonText: '知道了', type: 'warning' },
  ).catch(() => undefined)
  return false
}

/* ---------- 上传：示例图 ---------- */
const sampleDialogVisible = ref(false)
const sampleSelection = ref<string[]>([])
function openSampleDialog(): void {
  sampleSelection.value = []
  sampleDialogVisible.value = true
}
function confirmSampleUpload(): void {
  const picked = getSampleAssetsSync().filter((item) => sampleSelection.value.includes(item.id))
  const addBytes = picked.length * storageSettings.sample_asset_size_bytes
  if (picked.length === 0) {
    ElMessage.warning('请先选择素材')
    return
  }
  if (!checkStorage(addBytes)) return
  const added: Asset[] = picked.map((item) => ({
    ...item,
    id: genId('asset'),
    createdAt: new Date().toISOString(),
  }))
  persistAssets([...added, ...assets.value])
  sampleDialogVisible.value = false
  ElMessage.success(`已上传 ${added.length} 张素材，占用 ${formatBytes(addBytes)}`)
}

/* ---------- 上传：相册 / 拍照 ---------- */
const albumInputKey = ref(0)
const cameraInputKey = ref(0)
async function handleFiles(event: Event, source: 'album' | 'camera'): Promise<void> {
  const input = event.target as HTMLInputElement
  // 注意：input.files 是活集合，清空 input.value 会使已获取引用同时变空，必须先拷贝为数组
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (files.length === 0) return

  const added: Asset[] = []
  for (const file of files) {
    if (!isImageFile(file)) {
      ElMessage.warning(`「${file.name}」不是图片，已跳过`)
      continue
    }
    if (!checkStorage(file.size)) {
      ElMessage.warning(`「${file.name}」未上传：存储空间不足`)
      break
    }
    try {
      const url = await readImageFileAsDataURL(file)
      added.push({
        id: genId('asset'),
        name: file.name.replace(/\.[^.]+$/, '') || (source === 'camera' ? '拍摄照片' : '相册图片'),
        size: file.size,
        type: 'image',
        url,
        source: source as AssetSource,
        createdAt: new Date().toISOString(),
      })
    } catch {
      ElMessage.error(`读取「${file.name}」失败，请重试`)
    }
  }
  if (added.length > 0) {
    persistAssets([...added, ...assets.value])
    ElMessage.success(`已上传 ${added.length} 张图片`)
  }
  albumInputKey.value += 1
  cameraInputKey.value += 1
}

/* ---------- 删除 ---------- */
function toggleSelection(list: string[], id: string): void {
  const index = list.indexOf(id)
  if (index >= 0) list.splice(index, 1)
  else list.push(id)
}

async function removeAsset(asset: Asset): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `删除「${asset.name}」后将释放 ${formatBytes(asset.size)} 存储空间，且不可恢复。确定删除吗？`,
      '删除素材',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  persistAssets(assets.value.filter((item) => item.id !== asset.id))
  ElMessage.success('已删除素材，存储空间已释放')
}
</script>

<template>
  <div class="assets-page">
    <!-- 存储空间 -->
    <section class="page-panel storage-panel">
      <div class="storage-head">
        <h1>素材库</h1>
        <span class="storage-label">
          已用 <strong>{{ formatBytes(usedBytes) }}</strong> / {{ formatBytes(storageSettings.total_bytes) }}
        </span>
      </div>
      <el-progress :percentage="usedPercent" :stroke-width="10" :show-text="false" color="var(--color-brand)" />
      <p class="muted storage-note">
        图库素材按 {{ formatBytes(storageSettings.sample_asset_size_bytes) }}/张计入；相册/拍照按文件大小计入
      </p>
    </section>

    <!-- 上传入口 -->
    <section class="upload-bar">
      <button class="upload-btn upload-primary" type="button" @click="openSampleDialog">
        <el-icon :size="18" aria-hidden="true"><Picture /></el-icon><span>素材图库</span>
      </button>
      <label class="upload-btn" role="button" tabindex="0" @keydown.enter.prevent="() => undefined">
        <el-icon :size="18" aria-hidden="true"><FolderOpened /></el-icon><span>相册</span>
        <input
          :key="`album-${albumInputKey}`"
          class="file-input"
          type="file"
          accept="image/*"
          multiple
          @change="handleFiles($event, 'album')"
        />
      </label>
      <label class="upload-btn" role="button" tabindex="0" @keydown.enter.prevent="() => undefined">
        <el-icon :size="18" aria-hidden="true"><Camera /></el-icon><span>拍照</span>
        <input
          :key="`camera-${cameraInputKey}`"
          class="file-input"
          type="file"
          accept="image/*"
          capture="environment"
          @change="handleFiles($event, 'camera')"
        />
      </label>
    </section>

    <!-- 筛选 -->
    <section class="filter-bar">
      <el-radio-group v-model="filter" size="large">
        <el-radio-button value="all">全部（{{ assets.length }}）</el-radio-button>
        <el-radio-button value="image">图片（{{ assets.length }}）</el-radio-button>
      </el-radio-group>
    </section>

    <!-- 列表 -->
    <section v-if="filteredAssets.length > 0" class="asset-grid" aria-label="素材列表">
      <div v-for="asset in filteredAssets" :key="asset.id" class="asset-cell">
        <button class="asset-thumb" type="button" :aria-label="`预览 ${asset.name}`" @click="openPreview(asset.url)">
          <img v-if="asset.url" :src="asset.url" :alt="asset.name" />
          <span v-else class="thumb-fallback">{{ asset.name.slice(0, 1) }}</span>
          <span class="source-tag">{{ asset.source === 'sample' ? '图库' : asset.source === 'camera' ? '拍照' : '相册' }}</span>
        </button>
        <div class="asset-meta">
          <div class="asset-info">
            <span class="asset-name" :title="asset.name">{{ asset.name }}</span>
            <span class="asset-size">{{ formatBytes(asset.size) }}</span>
          </div>
          <button class="delete-btn" type="button" :aria-label="`删除 ${asset.name}`" @click="removeAsset(asset)">
            <el-icon :size="16"><Delete /></el-icon>
          </button>
        </div>
      </div>
    </section>

    <!-- 空状态 -->
    <section v-else class="page-panel">
      <div class="state-panel">
        <el-icon :size="40" aria-hidden="true"><Picture /></el-icon>
        <p>素材库还是空的，上传第一张素材开始吧</p>
        <el-button type="primary" :icon="Plus" @click="openSampleDialog">从素材图库添加</el-button>
      </div>
    </section>

    <!-- 素材图库选择弹窗 -->
    <el-dialog v-model="sampleDialogVisible" title="添加素材" width="90%" append-to-body class="picker-dialog">
      <p class="muted dialog-tip">
        可多选；每张素材占用 {{ formatBytes(storageSettings.sample_asset_size_bytes) }} 存储空间
      </p>
      <div class="picker-grid">
        <button
          v-for="asset in getSampleAssetsSync()"
          :key="asset.id"
          class="picker-cell"
          :class="{ 'is-selected': sampleSelection.includes(asset.id) }"
          type="button"
          :aria-pressed="sampleSelection.includes(asset.id)"
          @click="toggleSelection(sampleSelection, asset.id)"
        >
          <img :src="asset.url" :alt="asset.name" />
          <span class="picker-name">{{ asset.name }}</span>
        </button>
      </div>
      <template #footer>
        <el-button @click="sampleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSampleUpload">
          上传（已选 {{ sampleSelection.length }}）
        </el-button>
      </template>
    </el-dialog>

    <!-- 大图预览 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="[previewUrl]"
      :initial-index="0"
      @close="previewVisible = false"
    />
  </div>
</template>


<style scoped>
.storage-panel {
  padding: 16px;
}

.storage-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.storage-head h1 {
  margin: 0;
}

.storage-label {
  flex: 0 0 auto;
  color: var(--color-muted);
  font-size: 12px;
}

.storage-label strong {
  color: var(--color-ink);
}

.storage-note {
  margin: 8px 0 0;
  font-size: 12px;
}

.upload-bar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 12px 0;
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 48px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-ink-secondary);
  font-size: 13px;
  cursor: pointer;
}

.upload-primary {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
}

.file-input {
  display: none;
}

.filter-bar {
  margin-bottom: 12px;
}

.filter-bar :deep(.el-radio-group) {
  display: flex;
  width: 100%;
}

.filter-bar :deep(.el-radio-button) {
  flex: 1;
}

.filter-bar :deep(.el-radio-button__inner) {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.asset-cell {
  min-width: 0;
}

.asset-thumb {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-soft);
  cursor: zoom-in;
}

.asset-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-muted);
  font-size: 24px;
}

.source-tag {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(21, 23, 34, 0.62);
  color: #fff;
  font-size: 11px;
}

.asset-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

.asset-info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.asset-name {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-size {
  color: var(--color-muted);
  font-size: 11px;
}

.delete-btn {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-danger);
  cursor: pointer;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.picker-cell {
  min-width: 0;
  padding: 0;
  overflow: hidden;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  cursor: pointer;
}

.picker-cell img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.picker-cell.is-selected {
  border-color: var(--color-primary);
}

.picker-name {
  display: block;
  padding: 6px 8px;
  overflow: hidden;
  font-size: 12px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-cell.is-selected .picker-name {
  color: var(--color-primary);
  font-weight: 600;
}

.dialog-tip {
  margin: 0 0 10px;
  font-size: 12px;
}
</style>
