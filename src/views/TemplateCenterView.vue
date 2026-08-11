<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import LoadingState from '../components/states/LoadingState.vue'
import EmptyState from '../components/states/EmptyState.vue'
import ErrorState from '../components/states/ErrorState.vue'
import TemplateCard from '../components/templates/TemplateCard.vue'
import TemplateFilterBar from '../components/templates/TemplateFilterBar.vue'
import TemplatePreviewDrawer from '../components/templates/TemplatePreviewDrawer.vue'
import { getTemplateCatalog, type TemplateCatalog } from '../api/templates'
import type { MvpTemplate } from '../api/types'

const router = useRouter()

const catalog = ref<TemplateCatalog | null>(null)
const loading = ref(true)
const loadError = ref(false)

const sceneFilter = ref('')
const styleFilter = ref('')
const channelFilter = ref('')
const activeCategory = ref('推荐')
const categoryTabs = ['推荐', '产品种草', '产地故事', '品牌内容', '节日营销']

const selectedTemplate = ref<MvpTemplate | null>(null)
const previewVisible = ref(false)

const filteredTemplates = computed(() => {
  const templates = catalog.value?.templates ?? []
  return templates.filter((template) => {
    if (activeCategory.value === '产品种草' && template.scene !== '新品上市') return false
    if (activeCategory.value === '产地故事' && template.scene !== '产地故事') return false
    if (activeCategory.value === '品牌内容' && template.scene !== '品牌故事') return false
    if (activeCategory.value === '节日营销' && template.scene !== '节日营销') return false
    if (sceneFilter.value && template.scene !== sceneFilter.value) return false
    if (styleFilter.value && template.style !== styleFilter.value) return false
    if (channelFilter.value && !template.channelIds.includes(channelFilter.value as MvpTemplate['channelIds'][number])) {
      return false
    }
    return true
  })
})

const templateColumns = computed(() => ({
  left: filteredTemplates.value.filter((_, index) => index % 2 === 0),
  right: filteredTemplates.value.filter((_, index) => index % 2 === 1),
}))

function clearFilters() {
  sceneFilter.value = ''
  styleFilter.value = ''
  channelFilter.value = ''
}

function openPreview(template: MvpTemplate) {
  selectedTemplate.value = template
  previewVisible.value = true
}

async function loadCatalog() {
  loading.value = true
  loadError.value = false
  try {
    catalog.value = await getTemplateCatalog()
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

function useTemplate(template: MvpTemplate) {
  previewVisible.value = false
  selectedTemplate.value = null
  ElMessage.success(`已选择模板：${template.title}`)
  router.push({
    name: 'create-quick',
    query: { template: template.id, channels: template.channelIds.join(',') },
  })
}

onMounted(() => {
  void loadCatalog()
})
</script>

<template>
  <div class="template-center immersive-template">
    <h1 class="visually-hidden">模板库</h1>

    <LoadingState v-if="loading" text="正在加载模板…" />
    <ErrorState v-else-if="loadError" message="模板加载失败，请稍后重试" @retry="loadCatalog" />

    <template v-else>
      <section class="content-toolbar" aria-label="模板分类与筛选">
        <div class="category-tabs" role="tablist" aria-label="模板分类">
          <button
            v-for="tab in categoryTabs"
            :key="tab"
            type="button"
            role="tab"
            :aria-selected="activeCategory === tab"
            :class="{ active: activeCategory === tab }"
            @click="activeCategory = tab"
          >{{ tab }}</button>
        </div>
        <TemplateFilterBar
          v-if="catalog"
          :scenes="catalog.scenes"
          :styles="catalog.styles"
          :channels="catalog.channels"
          :templates="catalog.templates"
          :scene="sceneFilter"
          :style="styleFilter"
          :channel="channelFilter"
          :result-count="filteredTemplates.length"
          @update:scene="sceneFilter = $event"
          @update:style="styleFilter = $event"
          @update:channel="channelFilter = $event"
        />
      </section>

      <EmptyState
        v-if="filteredTemplates.length === 0"
        description="没有符合条件的模板，换个筛选条件试试"
      >
        <template #action>
          <el-button type="primary" plain @click="clearFilters">清除筛选</el-button>
        </template>
      </EmptyState>

      <div v-else class="template-grid">
        <div class="template-column">
          <TemplateCard
            v-for="(template, index) in templateColumns.left"
            :key="template.id"
            :template="template"
            :index="index * 2"
            @preview="openPreview"
          />
        </div>
        <div class="template-column">
          <TemplateCard
            v-for="(template, index) in templateColumns.right"
            :key="template.id"
            :template="template"
            :index="index * 2 + 1"
            @preview="openPreview"
          />
        </div>
      </div>
    </template>

    <TemplatePreviewDrawer
      v-model="previewVisible"
      :template="selectedTemplate"
      @use="useTemplate"
    />

  </div>
</template>

<style scoped>
.template-center {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.immersive-template {
  min-height: 100dvh;
  padding: calc(6px + env(safe-area-inset-top)) 12px calc(108px + env(safe-area-inset-bottom));
  overflow: hidden;
  background: #090b0c;
  color: #f7faf7;
}

.content-toolbar { display: flex; align-items: center; gap: 8px; margin: 0 -12px; padding: 0 12px 9px; border-bottom: 1px solid rgba(255,255,255,.08); background: transparent; }
.category-tabs { display: flex; min-width: 0; flex: 1; gap: 24px; overflow-x: auto; scrollbar-width: none; }
.category-tabs::-webkit-scrollbar { display: none; }
.category-tabs button { position: relative; flex: 0 0 auto; min-height: 42px; padding: 0; border: 0; background: transparent; color: #6f7b74; font-size: 15px; font-weight: 600; letter-spacing: 0; cursor: pointer; }
.category-tabs button.active { color: #f5f7f2; }
.category-tabs button.active::after { position: absolute; right: 6px; bottom: 0; left: 6px; height: 3px; border-radius: 3px; background: #dce8de; content: ''; }
.content-toolbar :deep(.filter-shell) { flex: 0 0 auto; width: 42px; }
.content-toolbar :deep(.filter-trigger) { width: 42px; min-height: 42px; justify-content: center; padding: 0; border: 1px solid rgba(255,255,255,.16); border-radius: 50%; background: rgba(255,255,255,.07); box-shadow: 0 6px 18px rgba(0,0,0,.22); }
.content-toolbar :deep(.filter-copy), .content-toolbar :deep(.active-count), .content-toolbar :deep(.filter-arrow) { display: none; }
.content-toolbar :deep(.filter-icon) { width: auto; height: auto; background: transparent; color: #edf5ef; }

.page-head {
  padding: 4px 2px 0;
}

.page-head h1 {
  margin: 0 0 6px;
  font-size: 20px;
  line-height: 1.4;
}

.page-sub {
  margin: 0;
  color: #858a91;
  font-size: 13px;
  line-height: 1.7;
}

.template-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 10px; align-items: start; }
.template-column { display: flex; min-width: 0; flex-direction: column; gap: 12px; }
.template-grid :deep(.template-card) { margin: 0; }

.immersive-template :deep(.template-card) { border: 0; background: transparent; color: #f7faf7; }

@media (min-width: 680px) {
  .immersive-template { padding-right: 24px; padding-left: 24px; }
}
</style>
