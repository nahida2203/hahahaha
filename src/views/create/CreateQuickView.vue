<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, Check, Picture } from '@element-plus/icons-vue'
import CreationFlowHeader from '../../components/creation/CreationFlowHeader.vue'
import { getScenariosSync, getScenarioSync } from '../../api/scenarios'
import { getOutputTypesSync } from '../../api/outputTypes'
import { useCreationStore } from '../../stores/creation'

const router = useRouter()
const route = useRoute()
const creation = useCreationStore()
const selectedScenarioId = computed({ get: () => creation.scenarioId, set: (value) => creation.setScenario(value) })
const selectedScenario = computed(() => getScenarioSync(selectedScenarioId.value))

onMounted(() => {
  creation.setMode('quick')
  const queryScenario = typeof route.query.scenario === 'string' ? getScenarioSync(route.query.scenario) : undefined
  if (queryScenario) {
    creation.setScenario(queryScenario.id)
  }
  if (!selectedScenarioId.value) creation.setScenario(getScenariosSync()[0]?.id)
})

function chooseScenario(id: string): void {
  const scenario = getScenarioSync(id)
  if (!scenario) return
  creation.setMode('quick')
  creation.setScenario(id)
  creation.setChannels(scenario.channels)
  creation.setOutputTypes(scenario.outputTypes)
  creation.setPrompt(scenario.promptTemplate)
  creation.setMissingFields([])
  creation.setConfirmation(false)
}

function next(): void {
  if (!selectedScenario.value) return
  chooseScenario(selectedScenario.value.id)
  router.push({ name: 'create-confirm' })
}

function exitCreation(): void {
  creation.reset()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="creation-flow-page">
    <CreationFlowHeader title="一键创作" :step="1" :total="2" @exit="exitCreation" />
    <main class="creation-flow-content quick-content">
      <div class="flow-heading"><h1 class="creation-flow-title">先选一个创作场景</h1><p class="creation-flow-subtitle">场景会自动匹配渠道和内容产物，之后仍可调整。</p></div>
      <div class="scenario-list">
        <button v-for="item in getScenariosSync()" :key="item.id" type="button" class="scenario-card" :class="{ 'is-selected': selectedScenarioId === item.id }" @click="chooseScenario(item.id)">
          <span class="scenario-mark" :style="{ background: item.color }"></span>
          <span class="scenario-copy"><small>{{ item.eyebrow }}</small><strong>{{ item.title }}</strong><span>{{ item.description }}</span></span>
          <el-icon v-if="selectedScenarioId === item.id" class="scenario-check" :size="18"><Check /></el-icon>
        </button>
      </div>
      <section v-if="selectedScenario" class="auto-summary">
        <div class="summary-head"><strong>平台会为你准备</strong><span>可在下一步调整</span></div>
        <div class="summary-row"><span>发布渠道</span><div class="chips"><span v-for="id in selectedScenario.channels" :key="id" class="chip">{{ id === 'douyin' ? '抖音' : id === 'shipinhao' ? '视频号' : '朋友圈' }}</span></div></div>
        <div class="summary-row"><span>内容产物</span><div class="chips"><span v-for="id in selectedScenario.outputTypes" :key="id" class="chip">{{ getOutputTypesSync().find((item) => item.id === id)?.label }}</span></div></div>
        <p class="asset-hint"><el-icon :size="15"><Picture /></el-icon>{{ selectedScenario.assetHint }}</p>
      </section>
    </main>
    <footer class="creation-flow-footer"><el-button type="primary" size="large" class="creation-primary" :disabled="!selectedScenario" @click="next">下一步 · 确认生成 <el-icon><ArrowRight /></el-icon></el-button></footer>
  </div>
</template>

<style scoped>
.quick-content { padding-top: 20px; }
.scenario-list { display: flex; flex-direction: column; gap: 9px; margin-top: 18px; }
.scenario-card { position: relative; display: grid; grid-template-columns: 10px minmax(0, 1fr) 22px; gap: 12px; align-items: start; min-height: 84px; padding: 14px 12px; border: 1px solid var(--color-border); border-radius: 12px; background: var(--color-surface); color: var(--color-ink); text-align: left; cursor: pointer; }
.scenario-card.is-selected { border-color: var(--color-brand); background: var(--color-brand-soft); }
.scenario-mark { width: 10px; height: 52px; border-radius: 6px; }
.scenario-copy { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.scenario-copy small { color: var(--color-muted); font-size: 11px; }
.scenario-copy strong { font-size: 15px; line-height: 1.4; }
.scenario-copy span { color: var(--color-muted); font-size: 12px; line-height: 1.5; }
.scenario-check { margin-top: 2px; color: var(--color-brand); }
.auto-summary { margin-top: 18px; padding: 14px; border-radius: 12px; background: var(--color-surface-soft); }
.summary-head, .summary-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.summary-head strong { font-size: 13px; }.summary-head span { color: var(--color-muted); font-size: 11px; }
.summary-row { margin-top: 12px; }.summary-row > span { flex-shrink: 0; width: 58px; color: var(--color-muted); font-size: 12px; }
.chips { display: flex; flex: 1; flex-wrap: wrap; gap: 6px; }.chip { padding: 4px 8px; border-radius: 6px; background: var(--color-surface); color: var(--color-ink-secondary); font-size: 12px; }
.asset-hint { display: flex; align-items: flex-start; gap: 5px; margin: 13px 0 0; color: var(--color-muted); font-size: 12px; line-height: 1.5; }
</style>
