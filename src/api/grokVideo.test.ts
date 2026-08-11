import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GrokApiError } from './grokClient'

const mockConfig = {
  endpoint: 'https://api.x.ai/v1/videos/generations',
  poll_endpoint: 'https://api.x.ai/v1/videos/{id}',
  model: 'grok-imagine-video',
  api_key: 'xai-test-key',
  api_key_encrypted: 'enc',
  timeout_ms: 1000,
  max_retries: 3,
  retry_delay_ms: 100,
  poll_interval_ms: 5,
  poll_timeout_ms: 100,
  enabled: true,
  fallback_to_local: true,
}

vi.mock('../utils/configLoader', () => ({
  getModelConfigSync: vi.fn(() => mockConfig),
  loadAppConfig: vi.fn(),
  getAppConfigSync: vi.fn(),
}))

const { clientPost, axiosGet, mockCreate } = vi.hoisted(() => ({
  clientPost: vi.fn(),
  axiosGet: vi.fn(),
  mockCreate: vi.fn(),
}))

vi.mock('axios', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('axios')
  return {
    ...actual,
    default: {
      ...actual.default,
      create: mockCreate,
      get: axiosGet,
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

describe('grokVideo 视频生成（异步任务 + 轮询）', () => {
  beforeEach(() => {
    clientPost.mockReset()
    axiosGet.mockReset()
    mockCreate.mockImplementation(() => makeFakeClient())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('成功：提交任务 → 轮询 processing → done 并返回视频地址', async () => {
    clientPost.mockResolvedValue({ data: { request_id: 'req-001' } })
    axiosGet
      .mockResolvedValueOnce({ data: { status: 'processing' } })
      .mockResolvedValueOnce({ data: { status: 'done', video_url: 'https://cdn.x.ai/vid/1.mp4' } })

    const { generateGrokVideo } = await import('./grokVideo')
    const promise = generateGrokVideo({ prompt: '茶园晨光' }, vi.fn())

    // 轮询间隔使用假定时器驱动
    await vi.advanceTimersByTimeAsync(10)
    const result = await promise

    expect(result.status).toBe('done')
    expect(result.videoUrl).toBe('https://cdn.x.ai/vid/1.mp4')
    // 提交请求包含模型名与提示词
    expect(clientPost.mock.calls[0][1].model).toBe('grok-imagine-video')
    expect(clientPost.mock.calls[0][1].prompt).toBe('茶园晨光')
  })

  it('失败：任务进入 failed 状态时抛出错误', async () => {
    clientPost.mockResolvedValue({ data: { request_id: 'req-002' } })
    axiosGet.mockResolvedValueOnce({ data: { status: 'failed', error: '内容不合规' } })

    const { generateGrokVideo } = await import('./grokVideo')
    const promise = generateGrokVideo({ prompt: 'x' })
    const assertion = expect(promise).rejects.toMatchObject({ message: '内容不合规' })
    await vi.advanceTimersByTimeAsync(10)
    await assertion
  })

  it('失败：轮询超时抛出可读错误', async () => {
    clientPost.mockResolvedValue({ data: { request_id: 'req-003' } })
    axiosGet.mockResolvedValue({ data: { status: 'processing' } })

    const { generateGrokVideo } = await import('./grokVideo')
    const promise = generateGrokVideo({ prompt: 'x' })
    const assertion = expect(promise).rejects.toBeInstanceOf(GrokApiError)
    await vi.advanceTimersByTimeAsync(500)
    await assertion
  })

  it('成功：轮询中途瞬时失败会继续重试', async () => {
    clientPost.mockResolvedValue({ data: { request_id: 'req-004' } })
    axiosGet
      .mockRejectedValueOnce(new Error('network jitter'))
      .mockResolvedValueOnce({ data: { status: 'done', url: 'https://cdn.x.ai/vid/4.mp4' } })

    const { generateGrokVideo } = await import('./grokVideo')
    const promise = generateGrokVideo({ prompt: 'x' })
    await vi.advanceTimersByTimeAsync(10)

    const result = await promise
    expect(result.videoUrl).toBe('https://cdn.x.ai/vid/4.mp4')
  })

  it('失败：提交响应缺少 request_id 时抛出错误', async () => {
    clientPost.mockResolvedValue({ data: {} })

    const { generateGrokVideo } = await import('./grokVideo')
    await expect(generateGrokVideo({ prompt: 'x' })).rejects.toMatchObject({
      message: '视频模型响应缺少 request_id',
    })
  })

  it('图生视频：参考图使用 type=image 的引用结构（否则模型报 "video reference must have type image"）', async () => {
    clientPost.mockResolvedValue({ data: { request_id: 'req-005' } })
    axiosGet.mockResolvedValueOnce({ data: { status: 'done', video_url: 'https://cdn.x.ai/vid/5.mp4' } })

    const { generateGrokVideo } = await import('./grokVideo')
    const promise = generateGrokVideo({ prompt: 'x', imageUrl: 'https://cdn.x.ai/img/ref.png' })
    await vi.advanceTimersByTimeAsync(10)
    await promise

    expect(clientPost.mock.calls[0][1].image).toEqual({
      url: 'https://cdn.x.ai/img/ref.png',
      type: 'image',
    })
  })
})
