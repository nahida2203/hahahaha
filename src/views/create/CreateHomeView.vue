<script setup lang="ts">
import { ArrowRight, ChatDotRound, Picture, VideoPlay } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import CreationFlowHeader from '../../components/creation/CreationFlowHeader.vue'

const router = useRouter()
function exitCreation(): void { router.push({ name: 'home' }) }
</script>

<template>
  <div class="creation-flow-page create-home-page">
    <CreationFlowHeader title="开始创作" :step="1" :total="1" completed @exit="exitCreation" />
    <main class="creation-flow-content create-home-content">
      <div class="create-home-intro"><span class="eyebrow">福农 AI 创作</span><h1>选择你想做的内容</h1><p>从一句需求、一张图片或一段视频开始。</p></div>
      <div class="mode-grid">
        <button class="mode-card mode-chat" type="button" @click="router.push({ name: 'create-chat' })"><span class="mode-icon"><el-icon :size="28"><ChatDotRound /></el-icon></span><span class="mode-copy"><strong>对话创作</strong><small>说说你的推广需求，自动整理渠道和内容</small></span><el-icon class="mode-arrow"><ArrowRight /></el-icon></button>
        <button class="mode-card mode-image" type="button" @click="router.push({ name: 'create-image' })"><span class="mode-icon"><el-icon :size="28"><Picture /></el-icon></span><span class="mode-copy"><strong>图片生成</strong><small>生成海报、商品图和九宫格</small></span><el-icon class="mode-arrow"><ArrowRight /></el-icon></button>
        <button class="mode-card mode-video" type="button" @click="router.push({ name: 'create-video' })"><span class="mode-icon"><el-icon :size="28"><VideoPlay /></el-icon></span><span class="mode-copy"><strong>视频生成</strong><small>生成口播稿、分镜和短视频方案</small></span><el-icon class="mode-arrow"><ArrowRight /></el-icon></button>
      </div>
      <p class="create-note">后续可在确认页调整渠道、素材和产物。</p>
    </main>
  </div>
</template>

<style scoped>
.create-home-page { background: #090b0c; color: #f7faf7; }.create-home-page :deep(.creation-header) { background: #090b0c; color: #fff; }.create-home-page :deep(.creation-header-row > span) { color: #87918b; }.create-home-page :deep(.creation-progress) { background: #1b2420; }.create-home-page :deep(.creation-progress span) { background: #d9eee0; }.create-home-content { display: flex; flex-direction: column; gap: 18px; padding: 30px 16px calc(30px + env(safe-area-inset-bottom)); }.create-home-intro { padding: 4px 2px 8px; }.eyebrow { color: #a9cdb5; font-size: 12px; font-weight: 700; letter-spacing: .08em; }.create-home-intro h1 { margin: 11px 0 7px; font-size: 27px; line-height: 1.28; }.create-home-intro p { margin: 0; color: #909a94; font-size: 13px; line-height: 1.65; }.mode-grid { display: flex; flex-direction: column; gap: 10px; }.mode-card { position: relative; display: grid; grid-template-columns: 54px minmax(0,1fr) 24px; gap: 13px; align-items: center; min-height: 103px; padding: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,.1); border-radius: 18px; background: #141b18; color: #f6faf7; text-align: left; cursor: pointer; }.mode-card::before { position: absolute; inset: 0; content: ''; pointer-events: none; background: radial-gradient(circle at 90% 0%, rgba(157,220,176,.18), transparent 34%); }.mode-image::before { background: radial-gradient(circle at 90% 0%, rgba(160,201,236,.2), transparent 34%); }.mode-video::before { background: radial-gradient(circle at 90% 0%, rgba(238,190,112,.2), transparent 34%); }.mode-icon { position: relative; display: flex; align-items: center; justify-content: center; width: 54px; height: 54px; border: 1px solid rgba(255,255,255,.16); border-radius: 16px; background: rgba(255,255,255,.08); color: #d9f0df; }.mode-image .mode-icon { color: #d4eaff; }.mode-video .mode-icon { color: #f2dbb2; }.mode-copy { position: relative; display: flex; min-width: 0; flex-direction: column; gap: 5px; }.mode-copy strong { font-size: 17px; }.mode-copy small { color: #8f9b94; font-size: 12px; line-height: 1.45; }.mode-arrow { position: relative; color: #829088; }.create-note { margin: 2px 0 0; color: #69736d; font-size: 12px; line-height: 1.6; }
</style>
