import type { Channel, CreationAssetSelection, GeneratedResult } from '../api/types'
import { generateGrokImage } from '../api/grokImage'
import { generateGrokVideo } from '../api/grokVideo'
import { GrokApiError } from '../api/grokClient'
import { getModelConfigSync } from './configLoader'
import { getSampleAssetsSync } from '../api/assets'
import { randomInt } from './format'

export interface GenerateContentInput {
  channels: Channel[]
  assets: CreationAssetSelection[]
  prompt: string
  /** 文字卖点（短语，可为空） */
  sellingPoints?: string
  /** 生成类型：copy=文案 / image=图片 / video=视频 */
  mediaType?: 'copy' | 'image' | 'video'
}

export interface GenerateContentOutput {
  results: GeneratedResult[]
  /** 降级/异常提示（非致命，前端以提示条展示） */
  warnings?: string[]
}

/** 渠道文案句式库（演示数据，按渠道风格预置若干组，生成时随机组合；{asset}/{points} 为占位符） */
const COPY_LIBRARY: Record<Channel['id'], string[]> = {
  douyin: [
    '你喝过会“回甘”的茶吗？{asset}，一口鲜爽，满口花香！{points}。＃助农好物 ＃产地直发',
    '今天带你看看真正的{asset}！{points}，产地直发、价格实在，评论区告诉我你心动了吗？＃助农 ＃好物推荐',
    '别划走！{asset}来了，{points}。这一口，只有产地才有的味道！＃乡村美食 ＃助农',
  ],
  shipinhao: [
    '这片{asset}的主人，守了三十年。{points}，他想让更多人尝尝家乡的味道。点个赞，为农人加油！',
    '今天分享一个真实的故事：{asset}，从采摘到发货，每一步都用心。{points}，喜欢的家人点个赞、转发给朋友～',
    '慢一点，去感受{asset}的味道。{points}，这是大山送给我们的礼物，愿这份真诚被更多人看见。',
  ],
  pengyouquan: [
    '今天开箱的{asset}，实物比照片还惊喜。{points}，自己试过才敢推荐，想尝鲜的朋友私信我～',
    '周末去了产地，亲眼看了{asset}的生长环境。{points}，干净、实在、好吃，家里人都说好。需要的朋友滴滴我。',
    '{asset}上新啦！{points}，数量不多、卖完等明年。附近的朋友还可以自提，先到先得～',
  ],
}

function pick<T>(list: T[]): T {
  return list[randomInt(0, list.length - 1)]
}

/**
 * 将模型底层错误翻译为对用户可读的中文提示。
 * 中转站按 API Key 分组授权，未开通时返回 "Video generation is not enabled for this group"。
 */
function translateModelError(kind: '图像' | '视频', message: string): string {
  if (/not enabled for this group/i.test(message)) {
    return `${kind}模型：中转站账号未开通${kind}生成权限，请联系平台管理员开通后再试（${message}）`
  }
  return message
}

/**
 * 参考图规范化：远端模型无法访问本机地址（相对路径 / localhost），
 * 需转换为 data URI 后随请求提交；已是 data:/http(s) 地址则原样返回。
 * 非 2xx 响应或非图片 MIME（如 404 错误页）视为加载失败，返回 null 放弃参考图。
 */
async function toDataUriReference(url: string | null | undefined): Promise<string | null | undefined> {
  if (!url) return url
  if (/^(data:|https?:\/\/)/i.test(url)) return url
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    if (blob.type && !blob.type.startsWith('image/')) return null
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('参考图读取失败'))
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.readAsDataURL(blob)
    })
  } catch {
    // 转换失败时放弃参考图，降级为文本生视频
    return null
  }
}

function buildCopy(channel: Channel, assetName: string, sellingPoints: string): string {
  const skeleton = pick(COPY_LIBRARY[channel.id])
  return skeleton
    .replaceAll('{asset}', assetName)
    .replaceAll('{points}', sellingPoints.trim() || '口感与品质俱佳')
}

/**
 * 通过 grok-imagine-image 生成海报图。
 * - 模型未启用：直接返回 null（走本地示例图）。
 * - 请求 b64_json：中转站返回的 S3 地址无 CORS 头，跨域加载会被浏览器 ORB 拦截，
 *   故优先使用 base64 data URI（同源渲染，杜绝 ERR_BLOCKED_BY_ORB）；仅当未返回 b64 时退回 url。
 * - 调用成功：返回图片地址（data URI 或 url）。
 * - 调用失败且允许降级：记录告警并返回 null；否则向上抛出 GrokApiError。
 */
async function generatePoster(prompt: string, warnings: string[]): Promise<string | null> {
  const config = getModelConfigSync('grok_image')
  if (!config?.enabled) return null
  try {
    const images = await generateGrokImage({ prompt, n: 1, size: '3:4', responseFormat: 'b64_json' })
    const image = images[0]
    // 优先 base64 data URI（grok 返回 JPEG）
    const posterUrl = image?.b64Json
      ? `data:image/jpeg;base64,${image.b64Json}`
      : image?.url ?? null
    if (!posterUrl) {
      throw new GrokApiError('图像模型返回为空')
    }
    return posterUrl
  } catch (error) {
    // 透出真实错误信息（GrokApiError 含接口错误详情），并翻译已知的权限类错误
    const rawMessage = error instanceof Error ? error.message : '图像生成服务异常'
    const message = translateModelError('图像', rawMessage)
    if (config.fallback_to_local) {
      warnings.push(`图像模型调用失败，已降级为示例图（${message}）`)
      return null
    }
    throw error
  }
}

/**
 * 通过 grok-imagine-video 生成视频。
 * 失败降级策略与图像一致；降级时返回 null。
 */
async function generateVideo(prompt: string, referenceUrl: string | null | undefined, warnings: string[]): Promise<string | null> {
  const config = getModelConfigSync('grok_video')
  if (!config?.enabled) return null
  try {
    // 本地素材需先转为 data URI 供远端模型读取
    const normalizedRef = await toDataUriReference(referenceUrl)
    const result = await generateGrokVideo(
      { prompt, duration: 5, aspectRatio: '9:16', imageUrl: normalizedRef },
      (status) => console.info(`[grok-video] task status -> ${status}`),
    )
    return result.videoUrl
  } catch (error) {
    // 透出真实错误信息（GrokApiError 含接口错误详情），并翻译已知的权限类错误
    const rawMessage = error instanceof Error ? error.message : '视频生成服务异常'
    const message = translateModelError('视频', rawMessage)
    if (config.fallback_to_local) {
      warnings.push(`视频模型调用失败，已降级为本地占位（${message}）`)
      return null
    }
    throw error
  }
}

/**
 * 内容生成入口：文案本地生成；海报/视频调用 Grok Imagine 模型（带重试与降级）。
 * 失败且不允许降级时抛出 GrokApiError，由调用方进入错误态并引导重试。
 */
export async function generateContent(input: GenerateContentInput): Promise<GenerateContentOutput> {
  const { channels, assets, prompt, sellingPoints = '', mediaType = 'copy' } = input

  if (!prompt.trim()) {
    throw new Error('提示词为空，无法生成')
  }

  const warnings: string[] = []
  const assetName = assets[0]?.name ?? '助农产品'
  const referenceUrl = assets[0]?.url ?? null

  // ---- 文案：按渠道从预置文案库生成变体 ----
  const results: GeneratedResult[] = channels.map((channel) => ({
    channelId: channel.id,
    text: buildCopy(channel, assetName, sellingPoints),
    posterUrl: null,
  }))

  // ---- 海报（图片生成流程）----
  if (mediaType === 'image') {
    const posterUrl = await generatePoster(prompt, warnings)
    results.forEach((result) => {
      result.posterUrl = posterUrl ?? pick(getSampleAssetsSync()).url ?? null
      result.source = posterUrl ? 'grok' : 'local'
    })
    return { results, warnings }
  }

  // ---- 视频生成流程：为每个渠道生成视频结果 ----
  if (mediaType === 'video') {
    const videoUrl = await generateVideo(prompt, referenceUrl, warnings)
    results.forEach((result) => {
      result.videoUrl = videoUrl
      result.source = videoUrl ? 'grok' : 'local'
    })
    return { results, warnings }
  }

  // ---- 纯文案流程：海报保留本地示例图（兼容原有演示行为）----
  results.forEach((result) => {
    result.posterUrl = pick(getSampleAssetsSync()).url ?? null
    result.source = 'local'
  })

  return { results, warnings }
}
