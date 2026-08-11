import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ChannelId, CreationAssetSelection } from '../api/types'
import { getAllChannelsSync } from '../api/channels'
import { generatePrompt } from '../utils/promptGenerator'

export type CreationMode = 'quick' | 'chat' | 'custom'
export type OutputType = 'copy' | 'article' | 'voiceover' | 'poster' | 'grid' | 'storyboard'

export interface CreationConfig {
  mode: CreationMode
  scenarioId?: string
  outputTypes: OutputType[]
  confirmed: boolean
  missingFields: string[]
}

/** 创作流程草稿状态（内存态，跨四步路由共享；刷新后回到第 1 步） */
export const useCreationStore = defineStore('creation', () => {
  /** 已选渠道 id */
  const channels = ref<ChannelId[]>([])
  /** 已选素材（示例素材或本次临时上传） */
  const assets = ref<CreationAssetSelection[]>([])
  /** 文字卖点（非必填） */
  const sellingPoints = ref('')
  /** 提示词（AI 生成或手动输入） */
  const prompt = ref('')
  /** 图片生成数量（图片生成页使用，默认 2 张） */
  const imageCount = ref(2)
  /** 图片或视频画布比例（媒体生成页使用） */
  const aspectRatio = ref('3:4')
  /** 来源模板 id（P1 “使用此模板”的 query.template） */
  const templateId = ref<string | undefined>(undefined)
  /** 来源模板标题（用于展示与创作标题） */
  const templateTitle = ref<string | undefined>(undefined)
  /** 来源模板的提示词示例（P1 模板字段，AI 生成提示词时参考） */
  const templatePromptExample = ref<string | undefined>(undefined)
  const mode = ref<CreationMode>('quick')
  const scenarioId = ref<string | undefined>(undefined)
  const outputTypes = ref<OutputType[]>(['copy'])
  const confirmed = ref(false)
  const missingFields = ref<string[]>([])

  function setChannels(ids: ChannelId[]): void {
    channels.value = ids
  }

  function setAssets(list: CreationAssetSelection[]): void {
    assets.value = list
  }

  /** 追加素材（按 id 去重） */
  function addAssets(list: CreationAssetSelection[]): void {
    const existing = new Set(assets.value.map((item) => item.id))
    assets.value = [...assets.value, ...list.filter((item) => !existing.has(item.id))]
  }

  function removeAsset(id: string): void {
    assets.value = assets.value.filter((item) => item.id !== id)
  }

  function setSellingPoints(text: string): void {
    sellingPoints.value = text
  }

  function setPrompt(text: string): void {
    prompt.value = text
  }

  function setImageCount(value: number): void {
    imageCount.value = Math.min(9, Math.max(1, Math.round(value)))
  }

  function setAspectRatio(value: string): void {
    aspectRatio.value = value
  }

  function setMode(value: CreationMode): void {
    mode.value = value
  }

  function setScenario(value: string | undefined): void {
    scenarioId.value = value
  }

  function setOutputTypes(values: OutputType[]): void {
    outputTypes.value = [...new Set(values)]
  }

  function setConfirmation(value: boolean): void {
    confirmed.value = value
  }

  function setMissingFields(values: string[]): void {
    missingFields.value = values
  }

  /** AI 生成提示词（模拟拼接，组件内负责延迟与 loading） */
  function aiGeneratePrompt(): string {
    const text = generatePrompt({
      channels: getAllChannelsSync().filter((item) => channels.value.includes(item.id)),
      assetNames: assets.value.map((item) => item.name),
      sellingPoints: sellingPoints.value,
      templateTitle: templateTitle.value,
      promptExample: templatePromptExample.value,
    })
    prompt.value = text
    return text
  }

  /** 记录来源模板（query.template） */
  function setTemplate(templateIdValue: string | undefined, templateTitleValue?: string, promptExampleValue?: string): void {
    templateId.value = templateIdValue
    templateTitle.value = templateTitleValue
    templatePromptExample.value = promptExampleValue
  }

  /** 清空草稿（保存完成或主动放弃时） */
  function reset(): void {
    channels.value = []
    assets.value = []
    sellingPoints.value = ''
    prompt.value = ''
    imageCount.value = 2
    aspectRatio.value = '3:4'
    templateId.value = undefined
    templateTitle.value = undefined
    templatePromptExample.value = undefined
    mode.value = 'quick'
    scenarioId.value = undefined
    outputTypes.value = ['copy']
    confirmed.value = false
    missingFields.value = []
  }

  return {
    channels,
    assets,
    sellingPoints,
    prompt,
    imageCount,
    aspectRatio,
    templateId,
    templateTitle,
    templatePromptExample,
    mode,
    scenarioId,
    outputTypes,
    confirmed,
    missingFields,
    setChannels,
    setAssets,
    addAssets,
    removeAsset,
    setSellingPoints,
    setPrompt,
    setImageCount,
    setAspectRatio,
    setMode,
    setScenario,
    setOutputTypes,
    setConfirmation,
    setMissingFields,
    aiGeneratePrompt,
    setTemplate,
    reset,
  }
})
