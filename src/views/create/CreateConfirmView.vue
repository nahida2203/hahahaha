<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Check, EditPen, Picture, VideoPlay } from '@element-plus/icons-vue'
import CreationFlowHeader from '../../components/creation/CreationFlowHeader.vue'
import { getScenarioSync } from '../../api/scenarios'
import { getOutputTypesSync } from '../../api/outputTypes'
import { getSampleAssetsSync } from '../../api/assets'
import type { OutputType } from '../../stores/creation'
import { useCreationStore } from '../../stores/creation'

const router = useRouter()
const creation = useCreationStore()
const showOutputPicker = ref(false)
const selectedScenario = computed(() => getScenarioSync(creation.scenarioId))
const assetRequired = computed(() => selectedScenario.value?.assetPolicy === 'required')
const assetMessage = computed(() => selectedScenario.value?.assetHint ?? '可添加产品图，让结果更贴近实际')
const selectedOutputLabels = computed(() => creation.outputTypes.map((id) => getOutputTypesSync().find((item) => item.id === id)?.label ?? id))
const isMediaCreation = computed(() => creation.mode === 'custom' && (creation.outputTypes.includes('poster') || creation.outputTypes.includes('storyboard')))
const mediaRatioLabel = computed(() => creation.outputTypes.includes('poster') ? '图片比例' : '视频比例')
const canGenerate = computed(() => creation.channels.length > 0 && creation.prompt.trim().length > 0 && (!assetRequired.value || creation.assets.length > 0))

function toggleOutput(id: OutputType): void {
  const next = creation.outputTypes.includes(id) ? creation.outputTypes.filter((item) => item !== id) : [...creation.outputTypes, id]
  if (next.length > 0) creation.setOutputTypes(next)
}

function addSample(): void {
  const sample = getSampleAssetsSync()[0]
  if (sample) creation.addAssets([{ id: sample.id, name: sample.name, size: sample.size, url: sample.url, source: sample.source }])
}

function generate(): void {
  if (!canGenerate.value) return
  creation.setConfirmation(true)
  router.push({ name: 'create-result' })
}

function exitCreation(): void {
  creation.reset()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="creation-flow-page">
    <CreationFlowHeader title="确认生成" :step="2" :total="2" @exit="exitCreation" />
    <main class="creation-flow-content confirm-content">
      <div class="flow-heading"><h1 class="creation-flow-title">确认这次创作</h1><p class="creation-flow-subtitle">平台已按场景准备好内容，你可以在生成前最后调整。</p></div>
      <section class="confirm-section">
        <div class="section-head"><span><el-icon><VideoPlay /></el-icon>发布渠道</span><button type="button" @click="router.push({ name: 'create-channel' })"><el-icon :size="14"><EditPen /></el-icon>调整</button></div>
        <div class="chips"><span v-for="id in creation.channels" :key="id" class="chip">{{ id === 'douyin' ? '抖音' : id === 'shipinhao' ? '视频号' : '朋友圈' }}</span></div>
      </section>
      <section class="confirm-section">
        <div class="section-head"><span><el-icon><Check /></el-icon>内容产物</span><button type="button" @click="showOutputPicker = !showOutputPicker"><el-icon :size="14"><EditPen /></el-icon>调整</button></div>
        <div class="chips"><span v-for="label in selectedOutputLabels" :key="label" class="chip chip-green">{{ label }}</span></div>
        <div v-if="showOutputPicker" class="output-picker"><button v-for="item in getOutputTypesSync()" :key="item.id" type="button" :class="{ 'is-selected': creation.outputTypes.includes(item.id) }" @click="toggleOutput(item.id)"><span>{{ item.label }}</span><small>{{ item.description }}</small><el-icon v-if="creation.outputTypes.includes(item.id)"><Check /></el-icon></button></div>
      </section>
      <section v-if="isMediaCreation" class="confirm-section">
        <div class="section-head"><span><el-icon><Picture /></el-icon>生成设置</span></div>
        <div class="settings-grid"><div><span>{{ mediaRatioLabel }}</span><strong>{{ creation.aspectRatio }}</strong></div><div v-if="creation.outputTypes.includes('poster')"><span>生成数量</span><strong>{{ creation.imageCount }} 张</strong></div></div>
      </section>
      <section class="confirm-section">
        <div class="section-head"><span><el-icon><Picture /></el-icon>参考素材</span><span class="optional">{{ assetRequired ? '必须' : '可选' }}</span></div>
        <div v-if="creation.assets.length" class="asset-preview"><img v-if="creation.assets[0]?.url" :src="creation.assets[0].url" alt="已选素材" /><span>{{ creation.assets.length }} 张素材已准备</span></div>
        <button v-else type="button" class="asset-empty" @click="addSample"><el-icon :size="20"><Picture /></el-icon><span>{{ assetMessage }}</span><small>点击添加示例图</small></button>
      </section>
      <section class="prompt-preview"><div class="section-head"><span><el-icon><EditPen /></el-icon>生成指令</span><button type="button" @click="router.push({ name: 'create-prompt' })">编辑</button></div><p>{{ creation.prompt }}</p></section>
    </main>
    <footer class="creation-flow-footer"><el-button size="large" class="creation-secondary" @click="router.push({ name: 'create-quick' })"><el-icon><ArrowLeft /></el-icon>上一步</el-button><el-button type="primary" size="large" class="creation-primary" :disabled="!canGenerate" @click="generate">开始生成 <el-icon><ArrowRight /></el-icon></el-button></footer>
  </div>
</template>

<style scoped>
.confirm-content { padding-top: 20px; }
.confirm-section, .prompt-preview { margin-top: 16px; padding-bottom: 15px; border-bottom: 1px solid var(--color-border); }
.section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.section-head > span:first-child { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; }
.section-head button { display: inline-flex; align-items: center; gap: 3px; min-height: 36px; padding: 0 4px; border: 0; background: transparent; color: var(--color-primary); font-size: 12px; cursor: pointer; }
.optional { color: var(--color-muted); font-size: 11px; font-weight: 400; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.chip { padding: 5px 9px; border-radius: 7px; background: var(--color-primary-soft); color: var(--color-primary); font-size: 12px; }
.chip-green { background: var(--color-brand-soft); color: var(--color-brand-ink); }
.settings-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
.settings-grid > div { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface-soft); color: var(--color-muted); font-size: 12px; }
.settings-grid strong { color: var(--color-ink); font-size: 14px; }
.output-picker { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.output-picker button { display: grid; grid-template-columns: minmax(0, 1fr) 22px; gap: 3px 8px; padding: 9px 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface); text-align: left; }
.output-picker button.is-selected { border-color: var(--color-brand); background: var(--color-brand-soft); }
.output-picker span { font-size: 13px; }
.output-picker small { color: var(--color-muted); font-size: 11px; }
.output-picker .el-icon { grid-column: 2; grid-row: 1 / span 2; align-self: center; color: var(--color-brand); }
.asset-preview { display: flex; align-items: center; gap: 10px; margin-top: 10px; color: var(--color-ink-secondary); font-size: 12px; }
.asset-preview img { width: 58px; height: 58px; border-radius: 8px; object-fit: cover; }
.asset-empty { display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 10px; padding: 12px; border: 1px dashed var(--color-border); border-radius: 9px; background: var(--color-surface-soft); color: var(--color-muted); text-align: left; }
.asset-empty small { margin-left: auto; color: var(--color-primary); font-size: 11px; }
.prompt-preview p { margin: 10px 0 0; color: var(--color-ink-secondary); font-size: 13px; line-height: 1.7; white-space: pre-wrap; }
</style>
