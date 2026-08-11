<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Camera, Delete, FolderOpened, Picture, Plus } from '@element-plus/icons-vue'
import CreationFlowHeader from '../../components/creation/CreationFlowHeader.vue'
import type { AssetSource, CreationAssetSelection } from '../../api/types'
import { getSampleAssetsSync } from '../../api/assets'
import { getAllChannelsSync } from '../../api/channels'
import { getScenarioSync } from '../../api/scenarios'
import { useCreationStore } from '../../stores/creation'
import { genId } from '../../utils/id'
import { isImageFile, readImageFileAsDataURL } from '../../utils/image'

const router = useRouter()
const creation = useCreationStore()

const sellingPoints = ref(creation.sellingPoints)
const activeScenario = computed(() => getScenarioSync(creation.scenarioId))
const assetRequired = computed(() => activeScenario.value?.assetPolicy === 'required')

/** 已选渠道摘要 */
const channelSummary = computed(() =>
  creation.channels.map((id) => getAllChannelsSync().find((item) => item.id === id)?.name ?? id).join('、'),
)

/* ---------- 预览 ---------- */
const previewVisible = ref(false)
const previewUrl = ref('')
function openPreview(url: string | undefined): void {
  if (!url) return
  previewUrl.value = url
  previewVisible.value = true
}

/* ---------- 示例图选择 ---------- */
const sampleDialogVisible = ref(false)
const sampleSelection = ref<string[]>([])
function openSampleDialog(): void {
  sampleSelection.value = creation.assets.filter((item) => item.source === 'sample').map((item) => item.id)
  sampleDialogVisible.value = true
}
function confirmSampleSelection(): void {
  const picked = getSampleAssetsSync().filter((item) => sampleSelection.value.includes(item.id)).map(
    (item): CreationAssetSelection => ({ id: item.id, name: item.name, size: item.size, url: item.url, source: item.source }),
  )
  if (picked.length > 0) creation.addAssets(picked)
  sampleDialogVisible.value = false
  ElMessage.success(`已添加 ${picked.length} 张素材`)
}

/* ---------- 相册 / 拍照 ---------- */
const albumInputKey = ref(0)
const cameraInputKey = ref(0)
async function handleFiles(event: Event, source: AssetSource): Promise<void> {
  const input = event.target as HTMLInputElement
  // 注意：input.files 是活集合，清空 input.value 会使已获取引用同时变空，必须先拷贝为数组
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (files.length === 0) return
  const picked: CreationAssetSelection[] = []
  for (const file of files) {
    if (!isImageFile(file)) {
      ElMessage.warning(`「${file.name}」不是图片，已跳过`)
      continue
    }
    try {
      const url = await readImageFileAsDataURL(file)
      picked.push({
        id: genId('asset'),
        name: file.name.replace(/\.[^.]+$/, '') || (source === 'camera' ? '拍摄照片' : '相册图片'),
        size: file.size,
        url,
        source,
      })
    } catch {
      ElMessage.error(`读取「${file.name}」失败，请重试`)
    }
  }
  if (picked.length > 0) {
    creation.addAssets(picked)
    ElMessage.success(`已添加 ${picked.length} 张图片`)
  }
  albumInputKey.value += 1
  cameraInputKey.value += 1
}

/* ---------- 下一步 ---------- */
function goNext(): void {
  creation.setSellingPoints(sellingPoints.value.trim())
  if (assetRequired.value && creation.assets.length === 0) {
    ElMessage.warning('请至少选择 1 张图片素材')
    return
  }
  router.push({ name: 'create-prompt' })
}

function goBack(): void {
  router.push({ name: 'create-channel' })
}

function exitCreation(): void {
  creation.reset()
  router.push({ name: 'home' })
}

function toggleSelection(list: string[], id: string): void {
  const index = list.indexOf(id)
  if (index >= 0) list.splice(index, 1)
  else list.push(id)
}

function onTextareaFocus(event: FocusEvent): void {
  // 键盘弹出时滚动到输入框，避免被遮挡
  window.setTimeout(() => (event.target as HTMLElement).scrollIntoView({ block: 'center' }), 250)
}
</script>

<template>
  <div class="creation-flow-page">
    <CreationFlowHeader title="添加素材" :step="2" @exit="exitCreation" />

    <main class="creation-flow-content asset-content">
      <div class="asset-heading">
        <div>
          <h1 class="creation-flow-title">创作素材</h1>
          <p class="creation-flow-subtitle">
            {{ creation.assets.length > 0 ? `已选择 ${creation.assets.length} 张图片` : '至少添加 1 张产品或产地图片。' }}
          </p>
        </div>
        <button class="channel-summary" type="button" @click="goBack">{{ channelSummary }} · 修改</button>
      </div>

      <div v-if="creation.assets.length > 0" class="asset-grid">
        <div v-for="asset in creation.assets" :key="asset.id" class="asset-cell">
          <button class="asset-thumb" type="button" :aria-label="`预览 ${asset.name}`" @click="openPreview(asset.url)">
            <img v-if="asset.url" :src="asset.url" :alt="asset.name" />
            <span v-else class="thumb-fallback">{{ asset.name.slice(0, 1) }}</span>
            <span class="source-tag">{{ asset.source === 'sample' ? '示例' : asset.source === 'camera' ? '拍照' : '相册' }}</span>
          </button>
          <div class="asset-meta">
            <span class="asset-name" :title="asset.name">{{ asset.name }}</span>
            <button class="remove-btn" type="button" :aria-label="`删除 ${asset.name}`" @click="creation.removeAsset(asset.id)">
              <el-icon :size="16"><Delete /></el-icon>
            </button>
          </div>
        </div>
        <button class="asset-add" type="button" @click="openSampleDialog">
          <el-icon :size="22" aria-hidden="true"><Plus /></el-icon>
          <span>继续添加</span>
        </button>
      </div>
      <div v-else class="asset-empty">
        <el-icon :size="34" aria-hidden="true"><Picture /></el-icon>
        <p>还没有素材，选择一种方式添加</p>
      </div>

      <div class="section-title"><span>从哪里添加</span></div>
      <div class="source-actions">
        <button class="source-btn" type="button" @click="openSampleDialog">
          <el-icon :size="22" aria-hidden="true"><Picture /></el-icon>
          <span>示例素材</span>
        </button>
        <label class="source-btn">
          <el-icon :size="22" aria-hidden="true"><FolderOpened /></el-icon>
          <span>相册</span>
          <input
            :key="`album-${albumInputKey}`"
            class="file-input"
            type="file"
            accept="image/*"
            multiple
            @change="handleFiles($event, 'album')"
          />
        </label>
        <label class="source-btn">
          <el-icon :size="22" aria-hidden="true"><Camera /></el-icon>
          <span>拍照</span>
          <input
            :key="`camera-${cameraInputKey}`"
            class="file-input"
            type="file"
            accept="image/*"
            capture="environment"
            @change="handleFiles($event, 'camera')"
          />
        </label>
      </div>

      <div class="section-title selling-title"><span>补充卖点</span><small>选填</small></div>
      <el-input
        v-model="sellingPoints"
        type="textarea"
        :rows="3"
        maxlength="200"
        show-word-limit
        resize="none"
        placeholder="如：高山茶园、鲜爽回甘、产地直发，可写多个卖点，用逗号分隔"
        @focus="onTextareaFocus"
      />
    </main>

    <footer class="creation-flow-footer">
      <el-button size="large" class="creation-secondary" @click="goBack">上一步</el-button>
      <el-button type="primary" size="large" class="creation-primary" @click="goNext">
        下一步 · 写提示词
      </el-button>
    </footer>

    <!-- 示例素材弹窗 -->
    <el-dialog v-model="sampleDialogVisible" title="选择示例素材" width="90%" append-to-body class="picker-dialog">
      <p class="muted dialog-tip">可多选，选中后点“确定”加入创作</p>
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
        <el-button type="primary" @click="confirmSampleSelection">确定（已选 {{ sampleSelection.length }}）</el-button>
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
.asset-content {
  padding-top: 16px;
}

.asset-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.channel-summary {
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font-size: 12px;
  text-align: right;
  cursor: pointer;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 20px 0 10px;
  font-size: 14px;
  font-weight: 700;
}

.section-title small {
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 400;
}

.asset-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-height: 132px;
  margin-top: 16px;
  padding: 22px 0;
  border-radius: 12px;
  background: var(--color-surface-soft);
  color: var(--color-muted);
  text-align: center;
}

.asset-empty p {
  margin: 0;
  font-size: 13px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.asset-cell {
  min-width: 0;
}

.asset-thumb {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-soft);
  cursor: zoom-in;
}

.asset-add {
  display: flex;
  min-width: 0;
  aspect-ratio: 1;
  padding: 8px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  border: 1px dashed var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-muted);
  font-size: 12px;
  cursor: pointer;
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

.asset-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-btn {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-danger);
  cursor: pointer;
}

.source-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.source-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 68px;
  padding: 8px 4px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-ink-secondary);
  font-size: 12px;
  cursor: pointer;
}

.source-btn:active {
  background: var(--color-surface-soft);
}

.file-input {
  display: none;
}

.selling-title {
  margin-top: 22px;
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
