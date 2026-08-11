<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ChatDotRound, Delete, HotWater, MagicStick, Picture, RefreshRight, VideoCameraFilled, VideoPlay } from '@element-plus/icons-vue'
import type { Asset, ChannelId } from '../../api/types'
import { getSettingsSync } from '../../utils/configLoader'
import { getSampleAssetsSync } from '../../api/assets'
import { getAllChannelsSync } from '../../api/channels'
import { useCreationStore } from '../../stores/creation'
import { useQuotaStore } from '../../stores/quota'
import { genId } from '../../utils/id'
import { isImageFile, readImageFileAsDataURL } from '../../utils/image'

const props = defineProps<{ mediaType: 'image' | 'video' }>()
const router = useRouter()
const creation = useCreationStore()
const quota = useQuotaStore()

const prompt = ref('')
const selectedAsset = ref<Asset | undefined>(getSampleAssetsSync()[1])
const uploadedAsset = ref<Asset | undefined>()
const selectedRatio = ref('3:4')
const imageCount = ref(2)
const selectedChannels = ref<ChannelId[]>(['douyin'])
const uploadInput = ref<HTMLInputElement | null>(null)
const isImage = computed(() => props.mediaType === 'image')
const title = computed(() => (isImage.value ? '图片生成' : '视频生成'))
const promptHint = computed(() => (isImage.value ? '请根据图片内容描述想要生成的画面和风格' : '请根据图片内容描述想要生成的画面和动作'))
const imageRatios = ['1:1', '9:16', '16:9', '4:3', '3:2', '2:3', '3:4', '21:9']
const videoRatios = ['9:16', '16:9', '1:1']
const ratios = computed(() => isImage.value ? imageRatios : videoRatios)
const sliderStyle = computed(() => {
  const percent = ((imageCount.value - 1) / 8) * 100
  return { background: `linear-gradient(to right, #78ff4b 0%, #78ff4b ${percent}%, #4d515a ${percent}%, #4d515a 100%)` }
})
const recommendedPrompts = computed(() => isImage.value ? ['春茶上新产品海报', '清晨茶园航拍', '福建茶叶礼盒'] : ['瀑布水流慢镜头', '古风男子回眸', '产品展示运镜'])
const exampleAssets = computed(() => isImage.value ? getSampleAssetsSync() : [getSampleAssetsSync()[0], getSampleAssetsSync()[2], getSampleAssetsSync()[3], getSampleAssetsSync()[1]])
const settings = getSettingsSync()
const cost = computed(() => (isImage.value ? settings.quota.media_cost_image : settings.quota.media_cost_video))
const promptCount = computed(() => prompt.value.length)

onMounted(() => {
  creation.setMode('custom')
  selectedChannels.value = isImage.value ? ['pengyouquan'] : ['douyin']
  creation.setChannels(selectedChannels.value)
  creation.setOutputTypes(isImage.value ? ['poster'] : ['voiceover', 'storyboard'])
  selectedRatio.value = isImage.value ? '3:4' : '9:16'
  creation.setAspectRatio(selectedRatio.value)
  imageCount.value = creation.imageCount
})

function exitCreation(): void {
  creation.reset()
  router.push({ name: 'home' })
}

function selectExample(asset: Asset): void {
  selectedAsset.value = asset
  const examples = isImage.value
    ? ['春茶新品上市海报，清新自然的茶园背景，突出产地直发和当季新茶', '清晨茶园的柔和阳光，薄雾与茶树层次分明，真实自然的摄影风格', '福建茶叶礼盒产品图，简洁高级的陈列方式，突出包装细节']
    : ['瀑布水流慢镜头，镜头由远及近，水雾在阳光下闪烁，电影感画面', '古风男子在山林中缓慢回眸，衣袂随风，镜头平稳推进', '农产品产品展示运镜，环绕拍摄包装细节，节奏明快，适合短视频']
  const index = exampleAssets.value.findIndex((item) => item.id === asset.id)
  prompt.value = examples[index % examples.length] ?? ''
}

function applyPrompt(value: string): void {
  prompt.value = value
}

function selectChannel(id: ChannelId): void {
  selectedChannels.value = [id]
}

function openUpload(): void {
  uploadInput.value?.click()
}

async function handleUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!isImageFile(file)) {
    ElMessage.warning('请上传 JPG、PNG 或 WEBP 图片')
    return
  }
  try {
    const url = await readImageFileAsDataURL(file)
    selectedAsset.value = {
      id: genId('asset'),
      name: file.name.replace(/\.[^.]+$/, '') || '上传图片',
      size: file.size,
      type: 'image',
      url,
      source: 'album',
      createdAt: new Date().toISOString(),
    }
    uploadedAsset.value = selectedAsset.value
    ElMessage.success('图片已添加')
  } catch {
    ElMessage.error('图片读取失败，请重试')
  }
}

function removeSelectedAsset(): void {
  uploadedAsset.value = undefined
  selectedAsset.value = undefined
}

function continueCreation(): void {
  creation.setMode('custom')
  creation.setChannels(isImage.value ? ['pengyouquan'] : selectedChannels.value)
  creation.setOutputTypes(isImage.value ? ['poster'] : ['voiceover', 'storyboard'])
  creation.setPrompt(prompt.value.trim() || (isImage.value ? '生成一张春茶上市产品海报' : '生成一条春茶上市短视频方案'))
  creation.setAspectRatio(selectedRatio.value)
  creation.setSellingPoints('画面比例：' + selectedRatio.value + (isImage.value ? '；生成数量：' + imageCount.value + '张' : ''))
  if (isImage.value) creation.setImageCount(imageCount.value)
  creation.setAssets([])
  const referenceAsset = uploadedAsset.value ?? selectedAsset.value
  if (referenceAsset) {
    creation.addAssets([{ id: referenceAsset.id, name: referenceAsset.name, size: referenceAsset.size, url: referenceAsset.url, source: referenceAsset.source }])
  }
  router.push({ name: 'create-confirm' })
}
</script>

<template>
  <div class="media-page">
    <header class="media-header">
      <button class="back-button" type="button" aria-label="返回" @click="exitCreation"><el-icon :size="28"><ArrowLeft /></el-icon></button>
      <h1>{{ title }}</h1>
      <div class="quota-indicator"><span class="quota-orb"><el-icon :size="13"><MagicStick /></el-icon></span><strong>{{ quota.balance }}</strong></div>
    </header>

    <main class="media-content">
      <section class="case-section" aria-labelledby="case-title">
        <div class="section-title-row"><h2 id="case-title"><el-icon class="fire-mark" :size="25"><HotWater /></el-icon>热门案例</h2><p>点击下方素材，查看创意描述示例</p></div>
        <div class="case-scroller">
          <button v-for="asset in exampleAssets" :key="asset.id" class="case-card" type="button" :class="{ selected: selectedAsset?.id === asset.id }" @click="selectExample(asset)">
            <img :src="asset.url" :alt="asset.name" />
            <span v-if="!isImage" class="case-play"><el-icon :size="22"><VideoPlay /></el-icon></span>
            <span class="case-shade"></span>
          </button>
        </div>
      </section>

      <section class="prompt-section" aria-labelledby="prompt-title">
        <div class="section-title-row"><h2 id="prompt-title"><el-icon :size="25"><MagicStick /></el-icon>AI创意描述</h2><p>{{ promptHint }}</p></div>
        <div class="prompt-box">
          <textarea v-model="prompt" placeholder="输入你想要的内容" maxlength="500" aria-label="创意描述" />
          <div class="prompt-tools"><button class="ai-write-button" type="button" @click="applyPrompt(recommendedPrompts[0] || '')"><el-icon :size="20"><MagicStick /></el-icon><strong>没有文案？ AI帮你写</strong></button><button class="upload-button" type="button" aria-label="上传参考图片" @click="openUpload"><el-icon :size="18"><Picture /></el-icon><span>上传图片</span></button><button v-if="prompt" class="clear-button" type="button" aria-label="清空描述" @click="prompt = ''"><el-icon :size="18"><Delete /></el-icon></button><span class="prompt-count">{{ promptCount }} / 500</span></div>
        </div>
        <input ref="uploadInput" class="visually-hidden-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" @change="handleUpload" />
        <div v-if="uploadedAsset" class="upload-preview"><img :src="uploadedAsset.url" :alt="uploadedAsset.name" /><span>{{ uploadedAsset.name }}</span><button type="button" aria-label="移除上传图片" @click="removeSelectedAsset"><el-icon :size="15"><Delete /></el-icon></button></div>
        <div class="recommend-row"><div class="recommend-list"><button v-for="item in recommendedPrompts" :key="item" type="button" @click="applyPrompt(item)">{{ item }}</button></div><button class="refresh-button" type="button" aria-label="换一批推荐" @click="applyPrompt(recommendedPrompts[1] || '')"><el-icon :size="23"><RefreshRight /></el-icon></button></div>
      </section>

      <section class="channel-section" aria-labelledby="channel-title">
        <div class="section-title-row"><h2 id="channel-title">发布渠道</h2><p>选择生成内容要适配的平台</p></div>
        <div class="channel-grid" role="radiogroup" aria-label="发布渠道">
          <button v-for="channel in getAllChannelsSync()" :key="channel.id" type="button" role="radio" class="channel-card" :class="{ selected: selectedChannels.includes(channel.id) }" :aria-checked="selectedChannels.includes(channel.id)" @click="selectChannel(channel.id)">
            <span class="channel-icon"><el-icon :size="19"><VideoPlay v-if="channel.id === 'douyin'" /><VideoCameraFilled v-else-if="channel.id === 'shipinhao'" /><ChatDotRound v-else /></el-icon></span><span>{{ channel.name }}</span><span class="channel-check">{{ selectedChannels.includes(channel.id) ? '✓' : '' }}</span>
          </button>
        </div>
      </section>

      <section class="ratio-section" aria-labelledby="ratio-title">
        <div class="section-title-row"><h2 id="ratio-title">{{ isImage ? '图片比例' : '长宽比' }}</h2><p>{{ isImage ? '选择适合内容的画布比例' : '选择适当的纵横比' }}</p></div>
        <div class="ratio-grid" :class="{ 'image-ratio-grid': isImage }">
          <button v-for="ratio in ratios" :key="ratio" type="button" class="ratio-card" :class="{ selected: selectedRatio === ratio }" :aria-pressed="selectedRatio === ratio" @click="selectedRatio = ratio"><span class="ratio-shape" :class="'ratio-' + ratio.replace(':', '-')"></span><strong>{{ ratio }}</strong></button>
        </div>
        <div v-if="isImage" class="count-control">
          <div class="count-label"><strong>生成数量：</strong><output>{{ imageCount }} 张</output></div>
          <div class="count-slider-row"><span aria-hidden="true">1</span><input v-model.number="imageCount" :style="sliderStyle" type="range" min="1" max="9" step="1" aria-label="生成数量" /><span aria-hidden="true">9</span></div>
        </div>
      </section>
    </main>

    <footer class="media-footer"><button class="make-button" type="button" @click="continueCreation"><span>立即制作</span><span class="make-cost"><el-icon :size="16"><MagicStick /></el-icon>{{ cost }}</span></button></footer>
  </div>
</template>

<style scoped>
.media-page { min-height: 100dvh; padding: 0 20px calc(182px + env(safe-area-inset-bottom)); overflow-x: hidden; background: #050505; color: #f7f7f7; }
.media-header { display: grid; grid-template-columns: 44px minmax(0, 1fr) 62px; align-items: center; min-height: 75px; padding-top: env(safe-area-inset-top); }
.media-header h1 { margin: 0; overflow: hidden; font-size: 22px; font-weight: 750; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.back-button { display: inline-flex; align-items: center; justify-content: flex-start; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: #f4f4f4; cursor: pointer; }
.quota-indicator { display: flex; align-items: center; justify-content: flex-end; gap: 4px; color: #f4f4f4; font-size: 16px; }
.quota-orb { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border: 1px solid rgba(213,194,255,.72); border-radius: 50%; background: linear-gradient(145deg, #8e61ee, #5046c7); color: #fff; }
.media-content { max-width: 720px; margin: 0 auto; }
.case-section, .prompt-section, .ratio-section { margin-top: 12px; }
.section-title-row h2 { display: flex; align-items: center; gap: 7px; margin: 0; color: #f7f7f7; font-size: 20px; font-weight: 750; line-height: 1.3; }
.section-title-row p { margin: 5px 0 0; color: #858585; font-size: 13px; line-height: 1.45; }
.fire-mark { color: #fff; }
.case-scroller { display: grid; grid-auto-columns: 134px; grid-auto-flow: column; gap: 9px; margin-top: 15px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
.case-scroller::-webkit-scrollbar { display: none; }
.case-card { position: relative; width: 134px; height: 174px; overflow: hidden; padding: 0; border: 1px solid transparent; border-radius: 17px; background: #242424; cursor: pointer; }
.case-card.selected { border-color: #fff; box-shadow: 0 0 0 1px rgba(255,255,255,.55); }
.case-card img { display: block; width: 100%; height: 100%; object-fit: cover; }
.case-shade { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 62%, rgba(0,0,0,.18)); pointer-events: none; }
.case-play { position: absolute; top: 50%; left: 50%; display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; transform: translate(-50%, -50%); border: 1px solid rgba(255,255,255,.86); border-radius: 50%; background: rgba(0,0,0,.28); color: #fff; }
.prompt-section { margin-top: 22px; }
.prompt-section .section-title-row h2 .el-icon { color: #fff; }
.prompt-box { position: relative; min-height: 238px; margin-top: 9px; overflow: hidden; border-radius: 17px; background: #242424; }
.prompt-box:focus-within { box-shadow: 0 0 0 1px rgba(126,94,255,.75); }
.prompt-box textarea { display: block; width: 100%; min-height: 238px; padding: 20px 18px 62px; resize: none; border: 0; outline: 0; background: transparent; color: #f5f5f5; font: inherit; font-size: 16px; line-height: 1.65; }
.prompt-box textarea::placeholder { color: #656565; }
.prompt-tools { position: absolute; right: 15px; bottom: 12px; left: 15px; display: flex; align-items: center; gap: 8px; min-width: 0; }
.ai-write-button { display: inline-flex; min-width: 0; flex: 1 1 auto; align-items: center; gap: 6px; min-height: 40px; padding: 0; border: 0; background: transparent; color: #fff; font-size: 14px; cursor: pointer; }
.ai-write-button .el-icon { color: #fff; filter: drop-shadow(4px 2px 0 #8f68fb); }
.ai-write-button strong { overflow: hidden; background: linear-gradient(90deg, #fff 0%, #fff 31%, #c28bff 100%); background-clip: text; color: transparent; text-overflow: ellipsis; white-space: nowrap; }
.clear-button { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; margin-left: auto; padding: 0; border: 0; background: transparent; color: #6d6d6d; cursor: pointer; }
.prompt-count { margin-left: auto; color: #777; font-size: 13px; white-space: nowrap; }
.upload-button { display: inline-flex; align-items: center; gap: 5px; min-height: 40px; flex: 0 0 auto; padding: 0 8px; border: 1px solid rgba(255,255,255,.13); border-radius: 9px; background: rgba(255,255,255,.06); color: #c7c7c7; font-size: 12px; cursor: pointer; }
.upload-button:hover { border-color: rgba(190,163,255,.62); color: #e3d9ff; }
.visually-hidden-input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
.upload-preview { display: flex; align-items: center; gap: 8px; max-width: 100%; margin-top: 9px; padding: 6px 8px; border: 1px solid rgba(150,115,255,.35); border-radius: 10px; background: rgba(87,62,163,.18); color: #bdb4d6; font-size: 12px; }
.upload-preview img { width: 36px; height: 36px; border-radius: 7px; object-fit: cover; }
.upload-preview span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.upload-preview button { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; border: 0; background: transparent; color: #85808f; cursor: pointer; }
.recommend-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.recommend-list { display: flex; flex: 1; gap: 14px; min-width: 0; overflow: hidden; }
.recommend-list button { max-width: 120px; padding: 0; overflow: hidden; border: 0; background: transparent; color: #858585; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.refresh-button { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 40px; height: 40px; padding: 0; border: 0; background: transparent; color: #868686; cursor: pointer; }
.ratio-section { margin-top: 17px; }
.channel-section { margin-top: 22px; }
.channel-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; margin-top: 12px; }
.channel-card { display: flex; min-height: 74px; flex-direction: column; align-items: center; justify-content: center; gap: 5px; padding: 8px 5px; border: 1px solid rgba(255,255,255,.1); border-radius: 13px; background: #242424; color: #929292; font-size: 12px; cursor: pointer; }
.channel-card.selected { border-color: #f2f2f2; background: #2d2d30; color: #f8f8f8; box-shadow: 0 0 0 1px rgba(255,255,255,.18); }
.channel-icon { display: inline-flex; align-items: center; justify-content: center; width: 29px; height: 29px; border-radius: 9px; background: rgba(255,255,255,.08); color: #a7a7a7; }
.channel-card.selected .channel-icon { background: rgba(255,255,255,.12); color: #f8f8f8; }
.channel-check { min-height: 13px; color: #f2f2f2; font-size: 12px; font-weight: 700; line-height: 1; }
.ratio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 13px; }
.ratio-card { display: flex; min-height: 126px; flex-direction: column; align-items: center; justify-content: center; gap: 11px; padding: 12px 8px; border: 2px solid transparent; border-radius: 17px; background: #242424; color: #969696; cursor: pointer; }
.ratio-card.selected { border-color: #f2f2f2; color: #f8f8f8; }
.ratio-card strong { font-size: 17px; font-weight: 500; }
.ratio-shape { display: block; width: 37px; height: 54px; border: 3px solid currentColor; border-radius: 6px; }
.ratio-16-9 { width: 60px; height: 37px; }
.ratio-1-1 { width: 48px; height: 48px; }
.image-ratio-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.image-ratio-grid .ratio-card { min-height: 112px; flex-direction: row; justify-content: flex-start; gap: 14px; padding: 14px 16px; border-width: 1px; border-radius: 18px; }
.image-ratio-grid .ratio-card strong { font-size: 18px; }
.ratio-9-16 { width: 27px; height: 49px; }
.ratio-4-3 { width: 56px; height: 42px; }
.ratio-3-2 { width: 58px; height: 39px; }
.ratio-2-3 { width: 39px; height: 58px; }
.ratio-3-4 { width: 42px; height: 56px; }
.ratio-21-9 { width: 63px; height: 27px; }
.count-control { margin-top: 27px; }
.count-label { display: flex; align-items: baseline; gap: 8px; color: #f6f6f6; font-size: 18px; }
.count-label strong { font-size: 20px; }
.count-label output { color: #78ff4b; font-size: 21px; font-weight: 750; }
.count-slider-row { display: grid; grid-template-columns: 22px minmax(0, 1fr) 22px; align-items: center; gap: 10px; margin-top: 17px; color: #7b7f86; font-size: 18px; }
.count-slider-row input { width: 100%; height: 6px; margin: 0; appearance: none; border-radius: 999px; outline: none; cursor: pointer; }
.count-slider-row input::-webkit-slider-thumb { width: 28px; height: 28px; appearance: none; border: 0; border-radius: 50%; background: #78ff4b; box-shadow: 0 0 0 4px rgba(120,255,75,.1); }
.count-slider-row input::-moz-range-thumb { width: 28px; height: 28px; border: 0; border-radius: 50%; background: #78ff4b; box-shadow: 0 0 0 4px rgba(120,255,75,.1); }
.media-footer { position: fixed; right: 0; bottom: 0; left: 0; z-index: 20; padding: 17px 20px calc(19px + env(safe-area-inset-bottom)); background: linear-gradient(180deg, rgba(5,5,5,0), #050505 21%); text-align: center; }
.make-button { display: flex; align-items: center; justify-content: center; gap: 28px; width: min(100%, 680px); min-height: 73px; margin: 0 auto; border: 0; border-radius: 40px; background: linear-gradient(100deg, #6554f1 0%, #8c43f4 100%); color: #fff; font-size: 23px; font-weight: 750; box-shadow: 0 9px 27px rgba(121,74,247,.26); cursor: pointer; }
.make-button:active { transform: scale(.985); }
.make-cost { display: inline-flex; align-items: center; gap: 4px; font-size: 17px; font-weight: 600; }
.make-cost .el-icon { color: #e7dfff; }
@media (min-width: 680px) { .media-page { padding-right: 28px; padding-left: 28px; } .media-header { max-width: 720px; margin: 0 auto; } .case-card { width: 148px; height: 192px; } .case-scroller { grid-auto-columns: 148px; } }
@media (max-width: 360px) { .media-page { padding-right: 16px; padding-left: 16px; } .case-card { width: 120px; height: 156px; } .case-scroller { grid-auto-columns: 120px; } .make-button { gap: 18px; font-size: 20px; } .recommend-list { gap: 8px; } .recommend-list button { max-width: 100px; font-size: 12px; } }
@media (max-width: 560px) { .image-ratio-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .image-ratio-grid .ratio-card { min-height: 86px; gap: 10px; padding: 10px 12px; } .image-ratio-grid .ratio-card strong { font-size: 16px; } }
@media (max-width: 420px) { .ai-write-button strong { max-width: 128px; } .upload-button { width: 40px; justify-content: center; padding: 0; } .upload-button span { display: none; } }
@media (prefers-reduced-motion: reduce) { .make-button { transition: none; } }
</style>
