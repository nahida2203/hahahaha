import type { Channel } from '../api/types'

export interface GeneratePromptInput {
  channels: Channel[]
  assetNames: string[]
  sellingPoints: string
  templateTitle?: string
  /** 模板自带的提示词示例（P1 模板字段），生成时作为参考句式 */
  promptExample?: string
}

/**
 * 模拟提示词生成器（演示生成）：
 * 按 渠道 + 素材名称 + 卖点 + 模板标题 拼接预置句式。
 */
export function generatePrompt(input: GeneratePromptInput): string {
  const { channels, assetNames, sellingPoints, templateTitle, promptExample } = input
  const lines: string[] = []

  lines.push('请为以下助农营销内容创作文案：')
  lines.push('')

  lines.push(`【目标渠道】${channels.map((c) => `${c.name}（${c.copyStyle}）`).join('；')}`)
  if (assetNames.length > 0) {
    lines.push(`【可用素材】${assetNames.join('、')}（围绕素材中的产品与场景展开）`)
  }
  if (sellingPoints.trim()) {
    lines.push(`【核心卖点】${sellingPoints.trim()}`)
  }
  if (templateTitle) {
    lines.push(`【参考模板】《${templateTitle}》的叙事框架与风格`)
  }
  if (promptExample && promptExample.trim()) {
    lines.push(`【参考提示词示例】${promptExample.trim()}`)
  }

  lines.push('')
  lines.push('【文案要求】')
  lines.push('- 结合农产品的真实产地与助农属性，语气真诚、有画面感')
  lines.push('- 每条文案按对应渠道单独成版，适配该渠道的传播习惯')
  lines.push('- 突出卖点与行动号召，不夸大功效，不虚构产地信息')
  lines.push('- 中文输出，300 字以内')

  return lines.join('\n')
}
