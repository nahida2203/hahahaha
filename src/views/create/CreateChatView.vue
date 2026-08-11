<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, ChatDotRound, Delete, MagicStick, RefreshRight } from '@element-plus/icons-vue'
import { useCreationStore } from '../../stores/creation'
import { useQuotaStore } from '../../stores/quota'
import { getScenarioSync } from '../../api/scenarios'

const router = useRouter()
const creation = useCreationStore()
const quota = useQuotaStore()
const input = ref('')
const submitted = ref(false)

const recognized = computed(() => ({
  product: input.value.includes('茶') ? '春茶' : '助农产品',
  channel: input.value.includes('朋友圈') ? '朋友圈' : input.value.includes('口播') ? '抖音 + 视频号' : '抖音 + 朋友圈',
  output: input.value.includes('口播') ? '口播稿' : '社媒文案',
}))
const suggestions = [
  '帮我写一条春茶上市的朋友圈文案',
  '做一条农产品口播稿，突出产地直发',
  '写一组适合抖音发布的产品种草文案',
]

function submit(): void {
  if (!input.value.trim()) return
  submitted.value = true
  creation.setMode('chat')
  creation.setScenario(input.value.includes('口播') ? 'short-video' : input.value.includes('朋友圈') ? 'moments' : 'tea-launch')
  creation.setPrompt('根据用户需求生成内容：' + input.value.trim())
  creation.setMissingFields([])
}

function continueToConfirm(): void {
  const scenario = getScenarioSync(creation.scenarioId)
  if (scenario) {
    creation.setChannels(scenario.channels)
    creation.setOutputTypes(scenario.outputTypes)
  }
  router.push({ name: 'create-confirm' })
}

function applySuggestion(value: string): void {
  input.value = value
  submitted.value = false
}

function clearInput(): void {
  input.value = ''
  submitted.value = false
}

function exitCreation(): void {
  creation.reset()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="chat-page">
    <header class="chat-header">
      <button class="back-button" type="button" aria-label="返回" @click="exitCreation"><el-icon :size="28"><ArrowLeft /></el-icon></button>
      <h1>对话创作</h1>
      <div class="quota-indicator"><span class="quota-orb"><el-icon :size="13"><MagicStick /></el-icon></span><strong>{{ quota.balance }}</strong></div>
    </header>

    <main class="chat-content">
      <section class="chat-hero">
        <span class="ai-mark"><el-icon :size="25"><MagicStick /></el-icon></span>
        <div><h2>说说你想做什么</h2><p>用一句话告诉我你的产品、渠道和内容目标</p></div>
      </section>

      <div class="assistant-bubble"><span class="bubble-icon"><el-icon :size="17"><ChatDotRound /></el-icon></span><span>我会帮你识别产品、渠道和内容类型，只在缺资料时追问。</span></div>

      <section class="prompt-section" aria-labelledby="chat-prompt-title">
        <div class="section-title-row"><h2 id="chat-prompt-title"><el-icon :size="24"><MagicStick /></el-icon>AI创意描述</h2><p>描述你的推广需求，越具体越容易生成</p></div>
        <div class="prompt-box" :class="{ 'is-submitted': submitted }">
          <textarea v-model="input" maxlength="500" placeholder="输入你想要的内容" aria-label="推广需求" @keydown.ctrl.enter="submit" />
          <div class="prompt-tools"><button class="ai-write-button" type="button" @click="applySuggestion(suggestions[0])"><el-icon :size="20"><MagicStick /></el-icon><strong>没有想法？AI帮你写</strong></button><button v-if="input" class="clear-button" type="button" aria-label="清空需求" @click="clearInput"><el-icon :size="18"><Delete /></el-icon></button><span class="prompt-count">{{ input.length }} / 500</span></div>
        </div>
      </section>

      <section v-if="!submitted" class="suggestion-section" aria-label="推荐需求">
        <div class="section-title-row"><h2>推荐需求</h2><p>点击后可继续修改</p></div>
        <div class="suggestion-row"><button v-for="item in suggestions" :key="item" type="button" @click="applySuggestion(item)">{{ item }}</button><button class="refresh-button" type="button" aria-label="换一批推荐" @click="applySuggestion(suggestions[1])"><el-icon :size="22"><RefreshRight /></el-icon></button></div>
      </section>

      <section v-else class="recognition-panel" aria-label="识别结果">
        <div class="recognition-head"><span class="recognition-icon"><el-icon :size="18"><ChatDotRound /></el-icon></span><div><strong>我先这样理解</strong><small>确认后还可以继续调整</small></div></div>
        <div class="recognition-grid"><div><span>推广对象</span><strong>{{ recognized.product }}</strong></div><div><span>发布渠道</span><strong>{{ recognized.channel }}</strong></div><div><span>内容产物</span><strong>{{ recognized.output }}</strong></div></div>
      </section>
    </main>

    <footer class="chat-footer"><button class="make-button" type="button" :disabled="!input.trim()" @click="submitted ? continueToConfirm() : submit()"><span>{{ submitted ? '继续确认' : '识别需求' }}</span><el-icon class="make-arrow" :size="22"><ArrowRight /></el-icon></button><p>不会直接开始生成，你可以在确认页继续调整</p></footer>
  </div>
</template>

<style scoped>
.chat-page { min-height: 100dvh; padding: 0 20px calc(140px + env(safe-area-inset-bottom)); overflow-x: hidden; background: #050505; color: #f7f7f7; }
.chat-header { display: grid; grid-template-columns: 44px minmax(0, 1fr) 62px; align-items: center; min-height: 75px; padding-top: env(safe-area-inset-top); }
.chat-header h1 { margin: 0; overflow: hidden; font-size: 22px; font-weight: 750; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.back-button { display: inline-flex; align-items: center; justify-content: flex-start; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: #f4f4f4; cursor: pointer; }
.quota-indicator { display: flex; align-items: center; justify-content: flex-end; gap: 4px; color: #f4f4f4; font-size: 16px; }
.quota-orb { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border: 1px solid rgba(213,194,255,.72); border-radius: 50%; background: linear-gradient(145deg, #8e61ee, #5046c7); color: #fff; }
.chat-content { max-width: 720px; margin: 0 auto; }
.chat-hero { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
.ai-mark { display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; border-radius: 16px; background: linear-gradient(145deg, #7957ee, #4433a4); color: #fff; box-shadow: 0 8px 22px rgba(99,72,225,.24); }
.chat-hero h2 { margin: 0; font-size: 22px; line-height: 1.3; }
.chat-hero p { margin: 5px 0 0; color: #858585; font-size: 13px; line-height: 1.45; }
.assistant-bubble { display: flex; align-items: flex-start; gap: 8px; margin-top: 20px; padding: 13px 14px; border: 1px solid rgba(255,255,255,.08); border-radius: 14px; background: #171717; color: #a3a3a3; font-size: 13px; line-height: 1.55; }
.bubble-icon { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; width: 25px; height: 25px; border-radius: 8px; background: rgba(142,97,238,.2); color: #c8baff; }
.prompt-section { margin-top: 23px; }
.section-title-row h2 { display: flex; align-items: center; gap: 7px; margin: 0; color: #f7f7f7; font-size: 20px; font-weight: 750; line-height: 1.3; }
.section-title-row h2 .el-icon { color: #fff; }
.section-title-row p { margin: 5px 0 0; color: #858585; font-size: 13px; line-height: 1.45; }
.prompt-box { position: relative; min-height: 246px; margin-top: 10px; overflow: hidden; border-radius: 17px; background: #242424; }
.prompt-box:focus-within { box-shadow: 0 0 0 1px rgba(126,94,255,.75); }
.prompt-box.is-submitted { box-shadow: 0 0 0 1px rgba(138,88,245,.45); }
.prompt-box textarea { display: block; width: 100%; min-height: 246px; padding: 20px 18px 62px; resize: none; border: 0; outline: 0; background: transparent; color: #f5f5f5; font: inherit; font-size: 16px; line-height: 1.65; }
.prompt-box textarea::placeholder { color: #656565; }
.prompt-tools { position: absolute; right: 15px; bottom: 12px; left: 15px; display: flex; align-items: center; gap: 9px; }
.ai-write-button { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0; border: 0; background: transparent; color: #fff; font-size: 14px; cursor: pointer; }
.ai-write-button .el-icon { color: #fff; filter: drop-shadow(4px 2px 0 #8f68fb); }
.ai-write-button strong { background: linear-gradient(90deg, #fff 0%, #fff 31%, #c28bff 100%); background-clip: text; color: transparent; }
.clear-button { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; margin-left: auto; padding: 0; border: 0; background: transparent; color: #6d6d6d; cursor: pointer; }
.prompt-count { color: #777; font-size: 13px; white-space: nowrap; }
.suggestion-section { margin-top: 17px; }
.suggestion-row { display: flex; align-items: center; gap: 10px; margin-top: 8px; overflow: hidden; }
.suggestion-row button { flex: 0 0 auto; max-width: 190px; min-height: 40px; padding: 0; overflow: hidden; border: 0; background: transparent; color: #858585; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.suggestion-row button:hover { color: #c7baff; }
.refresh-button { display: inline-flex !important; align-items: center; justify-content: center; width: 40px; min-height: 40px !important; margin-left: auto; color: #868686 !important; }
.recognition-panel { margin-top: 18px; padding: 16px; border: 1px solid rgba(150,115,255,.52); border-radius: 16px; background: linear-gradient(145deg, rgba(75,56,148,.28), rgba(31,25,58,.44)); }
.recognition-head { display: flex; align-items: center; gap: 9px; }
.recognition-icon { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 10px; background: rgba(151,120,255,.23); color: #d0c6ff; }
.recognition-head div { display: flex; flex-direction: column; gap: 2px; }
.recognition-head strong { color: #f4f1ff; font-size: 14px; }
.recognition-head small { color: #a49bbf; font-size: 11px; }
.recognition-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 15px; }
.recognition-grid div { min-width: 0; padding: 10px 9px; border-radius: 10px; background: rgba(0,0,0,.23); }
.recognition-grid span { display: block; margin-bottom: 5px; color: #9b94ae; font-size: 11px; }
.recognition-grid strong { display: block; overflow-wrap: anywhere; color: #f4f2fb; font-size: 13px; font-weight: 650; }
.chat-footer { position: fixed; right: 0; bottom: 0; left: 0; z-index: 20; padding: 17px 20px calc(19px + env(safe-area-inset-bottom)); background: linear-gradient(180deg, rgba(5,5,5,0), #050505 24%); text-align: center; }
.make-button { display: flex; align-items: center; justify-content: center; gap: 20px; width: min(100%, 680px); min-height: 70px; margin: 0 auto; border: 0; border-radius: 40px; background: linear-gradient(100deg, #6554f1 0%, #8c43f4 100%); color: #fff; font-size: 22px; font-weight: 750; box-shadow: 0 9px 27px rgba(121,74,247,.26); cursor: pointer; }
.make-button:disabled { background: #302d38; color: #716d79; box-shadow: none; cursor: not-allowed; }
.make-button:not(:disabled):active { transform: scale(.985); }
.make-arrow { font-size: 25px; font-weight: 400; line-height: 1; }
.chat-footer p { margin: 9px 0 0; color: #5a5a5a; font-size: 12px; }
@media (min-width: 680px) { .chat-page { padding-right: 28px; padding-left: 28px; } .chat-header { max-width: 720px; margin: 0 auto; } }
@media (max-width: 420px) { .recognition-grid { gap: 6px; } .recognition-grid div { padding: 9px 7px; } .recognition-grid strong { font-size: 12px; } }
@media (max-width: 360px) { .chat-page { padding-right: 16px; padding-left: 16px; } .make-button { font-size: 20px; } .suggestion-row { gap: 8px; } .suggestion-row button { max-width: 145px; font-size: 12px; } }
@media (prefers-reduced-motion: reduce) { .make-button { transition: none; } }
</style>
