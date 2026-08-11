import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GrokApiError } from './grokClient'

const mockConfig = {
  endpoint: 'https://api.x.ai/v1/images/generations',
  model: 'grok-imagine-image',
  api_key: 'xai-test-key',
  api_key_encrypted: 'enc',
  timeout_ms: 1000,
  max_retries: 3,
  retry_delay_ms: 100,
  enabled: true,
  fallback_to_local: true,
}

vi.mock('../utils/configLoader', () => ({
  getModelConfigSync: vi.fn(() => mockConfig),
  loadAppConfig: vi.fn(),
  getAppConfigSync: vi.fn(),
}))

// axios-retry 需要 interceptors 与 defaults，因此提供一个最小可用实例
const { clientPost, mockCreate } = vi.hoisted(() => ({
  clientPost: vi.fn(),
  mockCreate: vi.fn(),
}))

vi.mock('axios', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('axios')
  return {
    ...actual,
    default: {
      ...actual.default,
      create: mockCreate,
    },
  }
})

function makeFakeClient() {
  return {
    defaults: { timeout: 1000 },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    post: clientPost,
  }
}

describe('grokImage 图像生成', () => {
  beforeEach(() => {
    clientPost.mockReset()
    mockCreate.mockImplementation(() => makeFakeClient())
  })

  it('成功：解析 url 与 b64_json 字段', async () => {
    clientPost.mockResolvedValue({
      data: {
        data: [
          { url: 'https://cdn.x.ai/img/1.png', revised_prompt: 'revised' },
          { b64_json: 'base64data' },
        ],
      },
    })

    const { generateGrokImage } = await import('./grokImage')
    const results = await generateGrokImage({ prompt: '一杯福鼎白茶' })

    expect(results).toHaveLength(2)
    expect(results[0].url).toBe('https://cdn.x.ai/img/1.png')
    expect(results[0].revisedPrompt).toBe('revised')
    expect(results[1].b64Json).toBe('base64data')
    // 请求体包含模型名与提示词
    const requestBody = clientPost.mock.calls[0][1]
    expect(requestBody.model).toBe('grok-imagine-image')
    expect(requestBody.prompt).toBe('一杯福鼎白茶')
  })

  it('失败：响应缺少 data 数组时抛出 GrokApiError', async () => {
    clientPost.mockResolvedValue({ data: {} })

    const { generateGrokImage } = await import('./grokImage')
    await expect(generateGrokImage({ prompt: 'x' })).rejects.toBeInstanceOf(GrokApiError)
  })

  it('失败：401 认证错误向上抛出并携带状态码', async () => {
    const { AxiosError } = await import('axios')
    clientPost.mockRejectedValue(
      new AxiosError('401', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 401,
        data: { error: { message: 'Invalid API key' } },
      } as never),
    )

    const { generateGrokImage } = await import('./grokImage')
    const error = await generateGrokImage({ prompt: 'x' }).catch((e) => e)
    expect(error).toBeInstanceOf(GrokApiError)
    expect(error.status).toBe(401)
    expect(error.retryable).toBe(false)
  })

  it('失败：配置缺失时抛出可读错误', async () => {
    const configLoader = await import('../utils/configLoader')
    vi.mocked(configLoader.getModelConfigSync).mockReturnValueOnce(null as never)
    vi.mocked(configLoader.loadAppConfig).mockRejectedValue(new Error('boom'))

    const { generateGrokImage } = await import('./grokImage')
    await expect(generateGrokImage({ prompt: 'x' })).rejects.toThrow('boom')
  })
})
