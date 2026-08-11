<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ArrowRight, ChatDotRound, Pear, Picture, Search, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getSampleAssetsSync } from '../api/assets'
import { getRecommendedTemplates } from '../api/templates'
import type { MvpTemplate } from '../api/types'
import { useSessionStore } from '../stores/session'
import DefaultAvatar from '../components/DefaultAvatar.vue'

const router = useRouter()
const { user } = storeToRefs(useSessionStore())
const recommendedTemplates = ref<MvpTemplate[]>([])
const bannerIndex = ref(0)
const selectedDiscover = ref('每月优品')
const discoverTabs = ['每月优品', '产地故事', '产品海报', '短视频', '节日营销', '品牌推广']
let bannerTimer: number | undefined

const bannerItems = [
  { eyebrow: '福农 AI 创', title: '把农产品故事，变成可发布的内容', sub: '对话、图片、视频，一站式完成助农传播', image: getSampleAssetsSync()[3]?.url },
  { eyebrow: '产地内容灵感', title: '从一张实拍图开始', sub: '让真实产地成为最有说服力的传播素材', image: getSampleAssetsSync()[0]?.url },
  { eyebrow: '县域品牌专场', title: '统一品牌表达，快速响应节点', sub: '适合政府单位、品牌团队和融媒体运营', image: getSampleAssetsSync()[1]?.url },
]

const currentBanner = computed(() => bannerItems[bannerIndex.value] ?? bannerItems[0])
const hotCards = computed(() => {
  const fallback = [
    { id: 'hot-tea', title: '茶园采摘现场', scene: '产地故事', coverUrl: getSampleAssetsSync()[3]?.url ?? '', coverAlt: '茶园晨光' },
    { id: 'hot-cup', title: '一杯春茶的镜头', scene: '产品细节', coverUrl: getSampleAssetsSync()[1]?.url ?? '', coverAlt: '茶汤茶杯' },
    { id: 'hot-glass', title: '清爽冷泡茶', scene: '产品展示', coverUrl: getSampleAssetsSync()[2]?.url ?? '', coverAlt: '冷泡茶饮' },
  ]
  return recommendedTemplates.value.length > 0
    ? recommendedTemplates.value.slice(0, 6).map((item) => ({ id: item.id, title: item.title, scene: item.scene, coverUrl: item.coverUrl, coverAlt: item.coverAlt }))
    : fallback
})
const feedCards = computed(() => [
  ...hotCards.value.slice(0, 4).map((item, index) => ({ ...item, ratio: index % 2 === 0 ? 'tall' : 'wide' })),
  { id: 'feed-origin', title: '镜头里的真实产地', scene: '短片', coverUrl: getSampleAssetsSync()[0]?.url ?? '', coverAlt: '茶园绿植', ratio: 'tall' },
  { id: 'feed-quality', title: '品质卖点一页说清', scene: '4K', coverUrl: getSampleAssetsSync()[2]?.url ?? '', coverAlt: '冷泡茶饮', ratio: 'wide' },
])

function nextBanner(): void {
  bannerIndex.value = (bannerIndex.value + 1) % bannerItems.length
}

function selectBanner(index: number): void {
  bannerIndex.value = index
}

function goTo(name: 'create-chat' | 'create-image' | 'create-video'): void {
  router.push({ name })
}

function openSearch(): void {
  ElMessage.info('搜索入口将在后续版本开放')
}

function openHotPlay(item: { id: string }): void {
  router.push({ name: 'create-image', query: { template: item.id } })
}

onMounted(async () => {
  bannerTimer = window.setInterval(() => {
    nextBanner()
  }, 5200)
  try {
    recommendedTemplates.value = await getRecommendedTemplates(6)
  } catch {
    recommendedTemplates.value = []
  }
})

onBeforeUnmount(() => {
  if (bannerTimer !== undefined) window.clearInterval(bannerTimer)
})
</script>

<template>
  <div class="immersive-home">
    <header class="immersive-header">
      <div class="brand-lockup" aria-label="福农AI创">
        <span class="brand-mark" aria-hidden="true"><el-icon :size="19"><Pear /></el-icon></span>
        <strong>福农AI创</strong>
      </div>
      <div class="header-actions">
        <button class="round-action" type="button" aria-label="搜索" @click="openSearch"><el-icon :size="22"><Search /></el-icon></button>
        <button class="account-avatar" type="button" aria-label="打开我的账号" @click="router.push({ name: 'account' })"><DefaultAvatar /></button>
      </div>
    </header>

    <main class="immersive-content">
      <section class="hero-banner" aria-label="首页 Banner">
        <button class="hero-banner-button" type="button" :aria-label="currentBanner.title" @click="nextBanner">
          <img v-if="currentBanner.image" :src="currentBanner.image" alt="" class="hero-image" />
          <span class="hero-scrim" aria-hidden="true"></span>
          <span class="hero-copy">
            <span class="hero-eyebrow">{{ currentBanner.eyebrow }}</span>
            <strong>{{ currentBanner.title }}</strong>
            <small>{{ currentBanner.sub }}</small>
          </span>
        </button>
        <div class="hero-dots" aria-label="切换 Banner">
          <button v-for="(_, index) in bannerItems" :key="index" type="button" :class="{ active: index === bannerIndex }" :aria-label="'第 ' + (index + 1) + ' 个 Banner'" @click="selectBanner(index)"></button>
        </div>
      </section>

      <section class="creation-section" aria-labelledby="creation-title">
        <div class="creation-grid">
          <button class="creation-tile tile-chat" type="button" @click="goTo('create-chat')">
            <span class="tile-icon"><el-icon :size="29"><ChatDotRound /></el-icon></span>
            <strong>对话创作</strong>
          </button>
          <button class="creation-tile tile-image" type="button" @click="goTo('create-image')">
            <span class="tile-icon"><el-icon :size="29"><Picture /></el-icon></span>
            <strong>图片生成</strong>
          </button>
          <button class="creation-tile tile-video" type="button" @click="goTo('create-video')">
            <span class="tile-icon"><el-icon :size="29"><VideoPlay /></el-icon></span>
            <strong>视频生成</strong>
          </button>
        </div>
        <h1 id="creation-title" class="visually-hidden">开始创作</h1>
        <div class="creation-dots" aria-hidden="true"><i class="active"></i><i></i></div>
      </section>

      <section class="hot-section" aria-labelledby="template-title">
        <div class="section-heading">
          <div><h2 id="template-title">模板推荐</h2></div>
          <button class="heading-more text-more" type="button" @click="router.push({ name: 'templates' })">更多 <el-icon :size="16"><ArrowRight /></el-icon></button>
        </div>
        <div class="hot-scroll">
          <button v-for="item in hotCards" :key="item.id" class="hot-card" type="button" @click="openHotPlay(item)">
            <img :src="item.coverUrl" :alt="item.coverAlt" loading="lazy" />
            <span class="hot-overlay"></span>
            <span class="hot-name">{{ item.title }}</span>
            <span class="hot-tag">{{ item.scene }}</span>
          </button>
        </div>
      </section>

      <section class="discover-section" aria-labelledby="monthly-title">
        <div class="discover-tabs" role="tablist" aria-label="内容筛选">
          <button v-for="tab in discoverTabs" :key="tab" type="button" role="tab" :aria-selected="selectedDiscover === tab" :class="{ active: selectedDiscover === tab }" @click="selectedDiscover = tab">{{ tab }}</button>
        </div>
        <h2 id="monthly-title" class="visually-hidden">每月优品</h2>
        <div class="feed-grid">
          <button v-for="item in feedCards" :key="item.id" type="button" class="feed-card" :class="'feed-' + item.ratio" @click="openHotPlay(item)">
            <img :src="item.coverUrl" :alt="item.coverAlt" loading="lazy" />
            <span class="feed-play"><el-icon :size="15"><VideoPlay /></el-icon></span>
            <span class="feed-caption">{{ item.title }}</span>
          </button>
        </div>
      </section>
    </main>

  </div>
</template>

<style scoped>
.immersive-home { min-height: 100dvh; overflow: hidden; background: #090b0c; color: #f7faf7; }
.immersive-header { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between; min-height: 64px; padding: calc(8px + env(safe-area-inset-top)) 14px 8px; background: linear-gradient(180deg, rgba(9, 11, 12, .98), rgba(9, 11, 12, .78), transparent); }
.round-action { position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0; border: 1px solid rgba(255,255,255,.22); border-radius: 50%; background: rgba(8, 12, 11, .58); color: #fff; cursor: pointer; }
.brand-lockup { display: inline-flex; align-items: center; gap: 9px; font-size: 17px; font-weight: 700; letter-spacing: .01em; }.brand-mark { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid rgba(255,255,255,.6); border-radius: 10px; background: #168c61; color: #fff; box-shadow: 0 5px 14px rgba(22,140,97,.28); }
.header-actions { display: flex; align-items: center; gap: 6px; }.round-action { width: 44px; height: 44px; }.account-avatar { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0; border: 1px solid rgba(220,244,228,.7); border-radius: 50%; background: #ccebd9; color: #145b3e; font-size: 16px; font-weight: 750; cursor: pointer; }
.immersive-content { width: min(100%, 720px); margin: 0 auto; padding: 0 12px calc(108px + env(safe-area-inset-bottom)); }.hero-banner { position: relative; min-height: 190px; overflow: hidden; border-radius: 22px; background: #183026; box-shadow: 0 18px 42px rgba(0,0,0,.24); }.hero-banner-button { position: absolute; inset: 0; display: block; width: 100%; padding: 0; overflow: hidden; border: 0; background: transparent; color: #fff; text-align: left; cursor: pointer; }.hero-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: saturate(.78) brightness(.72); }.hero-scrim { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(10,26,19,.92) 0%, rgba(12,29,23,.64) 44%, rgba(9,11,12,.08) 100%), linear-gradient(0deg, rgba(0,0,0,.52), transparent 50%); }.hero-copy { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: center; min-height: 190px; max-width: 82%; padding: 22px 22px; }.hero-eyebrow { margin-bottom: 7px; color: #c9e8d2; font-size: 12px; font-weight: 600; }.hero-copy strong { max-width: 380px; font-size: clamp(22px, 6vw, 34px); line-height: 1.25; }.hero-copy small { margin-top: 8px; color: rgba(235,245,237,.78); font-size: 11px; line-height: 1.5; }.hero-dots { position: absolute; right: 18px; bottom: 15px; z-index: 2; display: flex; gap: 5px; align-items: center; }.hero-dots button { width: 7px; height: 7px; padding: 0; border: 0; border-radius: 7px; background: rgba(255,255,255,.42); cursor: pointer; transition: width 220ms ease, background 220ms ease; }.hero-dots button.active { width: 18px; background: #fff; }
.creation-section { margin-top: 24px; }.creation-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }.creation-tile { position: relative; display: flex; aspect-ratio: 1.2 / 1; min-height: 0; flex-direction: column; align-items: center; justify-content: space-between; gap: 8px; padding: 15px 10px 14px; overflow: hidden; border: 1px solid rgba(255,255,255,.16); border-radius: 20px; background: #2a2721; color: #faf9f5; text-align: center; cursor: pointer; isolation: isolate; box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 8px 20px rgba(0,0,0,.16); }.creation-tile::before { position: absolute; inset: 0; z-index: -1; content: ''; background: linear-gradient(135deg, rgba(255,255,255,.035) 0%, transparent 36%, rgba(0,0,0,.08) 100%), repeating-linear-gradient(135deg, rgba(255,255,255,.018) 0 1px, transparent 1px 24px); }.tile-image::before { background: linear-gradient(135deg, rgba(255,255,255,.04) 0%, transparent 38%, rgba(0,0,0,.08) 100%), repeating-linear-gradient(135deg, rgba(255,255,255,.018) 0 1px, transparent 1px 24px); }.tile-video::before { background: linear-gradient(135deg, rgba(255,255,255,.04) 0%, transparent 38%, rgba(0,0,0,.08) 0%, transparent 38%, rgba(0,0,0,.08) 100%), repeating-linear-gradient(135deg, rgba(255,255,255,.018) 0 1px, transparent 1px 24px); }.tile-icon { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; margin: 0 auto; border: 0; border-radius: 0; background: transparent; color: #fff; }.tile-icon :deep(.el-icon) { filter: drop-shadow(0 1px 1px rgba(0,0,0,.2)); }.tile-image .tile-icon, .tile-video .tile-icon { color: #fff; }.creation-tile strong { font-size: 16px; font-weight: 600; line-height: 1.2; letter-spacing: .01em; }.creation-tile:active { transform: scale(.985); }
.hot-section { margin-top: 23px; }.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 11px; }.section-heading h2 { margin: 0; font-size: 23px; line-height: 1.2; }.text-more { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; padding: 0 2px; border: 0; background: transparent; color: #a8b1ad; font-size: 13px; cursor: pointer; }.hot-scroll { display: flex; gap: 10px; overflow-x: auto; padding: 1px 1px 8px; scrollbar-width: none; scroll-snap-type: x mandatory; }.hot-scroll::-webkit-scrollbar { display: none; }.hot-card { position: relative; flex: 0 0 31.5%; aspect-ratio: .82; overflow: hidden; border: 0; border-radius: 18px; background: #1c2521; color: #fff; text-align: left; cursor: pointer; scroll-snap-align: start; }.hot-card img { width: 100%; height: 100%; object-fit: cover; }.hot-overlay { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,.84), transparent 55%); }.hot-name { position: absolute; right: 10px; bottom: 25px; left: 10px; overflow: hidden; font-size: 13px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }.hot-tag { position: absolute; bottom: 9px; left: 10px; color: #bfc9c3; font-size: 10px; }
.discover-section { margin-top: 8px; }.discover-tabs { display: flex; gap: 22px; margin: 5px -12px 14px; padding: 0 12px 3px; overflow-x: auto; scrollbar-width: none; }.discover-tabs::-webkit-scrollbar { display: none; }.discover-tabs button { flex: 0 0 auto; min-height: 43px; padding: 0; border: 0; background: transparent; color: #666e69; font-size: 16px; cursor: pointer; }.discover-tabs button.active { color: #f5f7f2; font-weight: 700; }.feed-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }.feed-card { position: relative; min-width: 0; overflow: hidden; border: 0; border-radius: 9px; background: #1a201d; color: #fff; cursor: pointer; }.feed-card img { display: block; width: 100%; height: 100%; object-fit: cover; }.feed-tall { aspect-ratio: .8; }.feed-wide { aspect-ratio: 1.02; }.feed-play { position: absolute; top: 9px; right: 9px; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: rgba(0,0,0,.48); color: #fff; }.feed-caption { position: absolute; right: 10px; bottom: 9px; left: 10px; overflow: hidden; color: #fff; font-size: 12px; font-weight: 600; text-shadow: 0 1px 4px rgba(0,0,0,.65); text-overflow: ellipsis; white-space: nowrap; }
.round-action:active, .account-avatar:active, .creation-tile:active, .hot-card:active, .feed-card:active { transform: scale(.98); }.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (min-width: 680px) { .immersive-header { padding-right: 24px; padding-left: 24px; }.immersive-content { padding-right: 24px; padding-left: 24px; }.hero-banner, .hero-copy { min-height: 240px; }.hot-card { flex-basis: 180px; } }
@media (prefers-reduced-motion: reduce) { .hero-dots button, .round-action, .account-avatar, .creation-tile, .hot-card, .feed-card, .compose-button { transition: none; transform: none; } }
</style>
