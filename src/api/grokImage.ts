import { createGrokClient, toGrokApiError, GrokApiError } from './grokClient'
import { getModelConfigSync, loadAppConfig } from '../utils/configLoader'

/** 图像生成请求参数 */
export interface GrokImageOptions {
  prompt: string
  /** 生成张数（1-10） */
  n?: number
  /** 画布比例（如 1:1 / 3:4 / 16:9） */
  size?: string
  /** 响应格式：url 或 base64 */
  responseFormat?: 'url' | 'b64_json'
}

/** 单张生成结果 */
export interface GrokImageResult {
  url: string | null
  b64Json: string | null
  revisedPrompt: string | null
}

/**
 * 调用 grok-imagine-image 生成图像。
 * 失败时重试耗尽后抛出 GrokApiError（由上层决定是否降级本地模拟）。
 */
export async function generateGrokImage(options: GrokImageOptions): Promise<GrokImageResult[]> {
  const config = getModelConfigSync('grok_image')
  if (!config) {
    // 配置尚未加载：显式触发一次加载后重读
    await loadAppConfig()
    const retry = getModelConfigSync('grok_image')
    if (!retry) throw new GrokApiError('图像模型配置缺失，请检查 config.yaml')
    return generateGrokImage(options)
  }

  const client = createGrokClient(config)
  try {
    const response = await client.post('', {
      model: config.model,
      prompt: options.prompt,
      n: options.n ?? 1,
      size: options.size ?? '1:1',
      response_format: options.responseFormat ?? 'url',
    })

    const data = response.data?.data
    if (!Array.isArray(data)) {
      throw new GrokApiError('图像模型响应格式异常：缺少 data 数组')
    }

    return data.map((item: { url?: string; b64_json?: string; revised_prompt?: string }) => ({
      url: typeof item.url === 'string' ? item.url : null,
      b64Json: typeof item.b64_json === 'string' ? item.b64_json : null,
      revisedPrompt: typeof item.revised_prompt === 'string' ? item.revised_prompt : null,
    }))
  } catch (error) {
    throw toGrokApiError(error)
  }
}
