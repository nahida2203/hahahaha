import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { encryptAES256 } from './crypto'

// 仅替换 axios.get，保留其余真实实现（如 AxiosError）
vi.mock('axios', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('axios')
  return {
    ...actual,
    default: { ...actual.default, get: vi.fn() },
  }
})

const mockedAxiosGet = vi.mocked(axios.get)

const CONFIG_YAML = (encrypted: string) => `
ai_models:
  grok_image:
    endpoint: "https://api.x.ai/v1/images/generations"
    model: "grok-imagine-image"
    api_key_encrypted: "${encrypted}"
    enabled: true
    fallback_to_local: true
  grok_video:
    endpoint: "https://api.x.ai/v1/videos/generations"
    poll_endpoint: "https://api.x.ai/v1/videos/{id}"
    model: "grok-imagine-video"
    api_key_encrypted: "${encrypted}"
    enabled: true
    fallback_to_local: true
`

describe('configLoader 动态配置加载', () => {
  beforeEach(() => {
    vi.resetModules()
    mockedAxiosGet.mockReset()
  })

  it('从 config.yaml 加载配置并解密 API Key', async () => {
    const plainKey = 'xai-real-api-key-xyz-777'
    const encrypted = encryptAES256(plainKey)
    mockedAxiosGet.mockResolvedValue({ data: CONFIG_YAML(encrypted) })

    const { loadAppConfig } = await import('./configLoader')
    const config = await loadAppConfig()

    expect(config.ai_models.grok_image.model).toBe('grok-imagine-image')
    expect(config.ai_models.grok_image.api_key).toBe(plainKey)
    expect(config.ai_models.grok_video.model).toBe('grok-imagine-video')
    expect(config.ai_models.grok_video.api_key).toBe(plainKey)
    // 原始密文字段仍保留、未丢失
    expect(config.ai_models.grok_image.api_key_encrypted).toBe(encrypted)
  })

  it('配置加载失败时抛出可读错误', async () => {
    mockedAxiosGet.mockRejectedValue(new Error('network down'))

    const { loadAppConfig } = await import('./configLoader')
    await expect(loadAppConfig()).rejects.toThrow('系统配置加载失败')
  })

  it('同一份配置并发加载只请求一次数据源', async () => {
    const encrypted = encryptAES256('xai-key-for-dedupe')
    mockedAxiosGet.mockResolvedValue({ data: CONFIG_YAML(encrypted) })

    const { loadAppConfig } = await import('./configLoader')
    const [a, b] = await Promise.all([loadAppConfig(), loadAppConfig()])
    expect(a).toBe(b)
    expect(mockedAxiosGet).toHaveBeenCalledTimes(1)
  })
})
