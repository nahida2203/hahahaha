import axios from 'axios'
import { createGrokClient, toGrokApiError, GrokApiError } from './grokClient'
import { getModelConfigSync, loadAppConfig } from '../utils/configLoader'

/** 视频生成请求参数 */
export interface GrokVideoOptions {
  prompt: string
  /** 视频时长（秒，1-15） */
  duration?: number
  /** 分辨率（如 480p / 720p / 1080p） */
  resolution?: string
  /** 长宽比（如 9:16 / 16:9 / 1:1） */
  aspectRatio?: string
  /** 参考图 URL（图生视频时传入） */
  imageUrl?: string | null
}

/** 视频任务状态 */
export type GrokVideoStatus = 'pending' | 'processing' | 'done' | 'failed'

/** 视频生成结果 */
export interface GrokVideoResult {
  requestId: string
  status: GrokVideoStatus
  /** 生成完成后的视频地址 */
  videoUrl: string | null
  /** 失败原因 */
  error?: string | null
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * 调用 grok-imagine-video 生成视频。
 * 接口为异步任务：提交后返回 request_id，随后按 poll_interval_ms 轮询
 * GET /v1/videos/{request_id} 直到 done / failed / 超时。
 */
export async function generateGrokVideo(
  options: GrokVideoOptions,
  onProgress?: (status: GrokVideoStatus, requestId: string) => void,
): Promise<GrokVideoResult> {
  const config = getModelConfigSync('grok_video')
  if (!config) {
    await loadAppConfig()
    const retry = getModelConfigSync('grok_video')
    if (!retry) throw new GrokApiError('视频模型配置缺失，请检查 config.yaml')
    return generateGrokVideo(options, onProgress)
  }

  const client = createGrokClient(config)

  let requestId: string
  try {
    // 1. 提交生成任务
    const response = await client.post('', {
      model: config.model,
      prompt: options.prompt,
      duration: options.duration ?? 5,
      resolution: options.resolution ?? '480p',
      aspect_ratio: options.aspectRatio ?? '9:16',
      // 图生视频参考图：type 必须为 'image'，否则模型报 "video reference must have type image"
      ...(options.imageUrl ? { image: { url: options.imageUrl, type: 'image' } } : {}),
    })
    requestId = response.data?.request_id
    if (!requestId) {
      throw new GrokApiError('视频模型响应缺少 request_id')
    }
  } catch (error) {
    throw toGrokApiError(error)
  }

  onProgress?.('processing', requestId)

  // 2. 轮询任务状态（poll_endpoint 缺省时按提交端点推导：.../videos/generations -> .../videos/{id}）
  const defaultPollUrl = config.endpoint.replace(/\/generations$/, '/{id}')
  const pollUrl = (config.poll_endpoint ?? defaultPollUrl).replace('{id}', encodeURIComponent(requestId))
  const pollInterval = config.poll_interval_ms ?? 3000
  const pollTimeout = config.poll_timeout_ms ?? 600000
  const deadline = Date.now() + pollTimeout

  while (Date.now() < deadline) {
    await sleep(pollInterval)
    let statusData: { status?: string; video_url?: string; url?: string; error?: string | null }
    try {
      const pollResponse = await axios.get(pollUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.api_key}`,
        },
        timeout: config.timeout_ms ?? 120000,
      })
      statusData = pollResponse.data ?? {}
    } catch (error) {
      // 轮询瞬时失败（网络抖动）：重试下一轮，不中断整体任务
      console.warn('Grok video poll failed, retrying:', error)
      continue
    }

    const status = statusData.status
    if (status === 'done') {
      const videoUrl = statusData.video_url ?? statusData.url ?? null
      if (!videoUrl) {
        throw new GrokApiError('视频任务完成但响应缺少视频地址')
      }
      onProgress?.('done', requestId)
      return { requestId, status: 'done', videoUrl, error: null }
    }
    if (status === 'failed') {
      throw new GrokApiError(statusData.error ?? '视频生成任务失败')
    }
    if (status !== 'processing' && status !== 'pending' && status !== 'queued') {
      throw new GrokApiError(`视频任务返回未知状态：${status ?? 'unknown'}`)
    }
  }

  throw new GrokApiError('视频生成超时，请稍后重试')
}
