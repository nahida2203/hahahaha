import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockChannel = (id: 'douyin' | 'shipinhao' | 'pengyouquan') => ({
  id,
  name: id,
  icon: 'VideoPlay',
  description: '',
  copyStyle: '',
})

const mockAssetSelection = (name: string) => ({ id: 'a1', name, size: 1, source: 'sample' as const })

// 默认：模型未启用（本地生成路径），避免真实网络请求
let imageEnabled = false
let videoEnabled = false
let imageFails = false
let videoFails = false
let imageReturnsB64 = false
/** 视频模型抛出指定错误（模拟中转站权限拦截等） */
let videoError: string | null = null

vi.mock('./configLoader', () => ({
  getModelConfigSync: vi.fn((kind: 'grok_image' | 'grok_video') => {
    if (kind === 'grok_image') {
      return imageEnabled
        ? { endpoint: 'e', model: 'grok-imagine-image', api_key: 'k', enabled: true, fallback_to_local: true }
        : { endpoint: 'e', model: 'grok-imagine-image', api_key: 'k', enabled: false, fallback_to_local: true }
    }
    return videoEnabled
      ? { endpoint: 'e', model: 'grok-imagine-video', api_key: 'k', enabled: true, fallback_to_local: true }
      : { endpoint: 'e', model: 'grok-imagine-video', api_key: 'k', enabled: false, fallback_to_local: true }
  }),
  loadAppConfig: vi.fn(),
  getAppConfigSync: vi.fn(),
}))

vi.mock('../api/grokImage', () => ({
  generateGrokImage: vi.fn(async () => {
    if (imageFails) throw new Error('image service down')
    return imageReturnsB64
      ? [{ url: null, b64Json: 'QUJDRA==', revisedPrompt: null }]
      : [{ url: 'https://cdn.x.ai/img/grok.png', b64Json: null, revisedPrompt: null }]
  }),
}))

vi.mock('../api/grokVideo', () => ({
  generateGrokVideo: vi.fn(async () => {
    if (videoError) throw new Error(videoError)
    if (videoFails) throw new Error('video service down')
    return { requestId: 'r1', status: 'done', videoUrl: 'https://cdn.x.ai/vid/grok.mp4', error: null }
  }),
}))

vi.mock('../api/assets', () => ({
  getSampleAssetsSync: () => [
    { id: 'sample-green-plant', name: '茶园绿植', size: 1, type: 'image', url: '/photos/green-plant.webp', source: 'sample', createdAt: '' },
  ],
}))

describe('contentGenerator 内容生成', () => {
  beforeEach(() => {
    imageEnabled = false
    videoEnabled = false
    imageFails = false
    videoFails = false
    imageReturnsB64 = false
    videoError = null
  })

  it('模型未启用：生成本地文案与示例海报', async () => {
    const { generateContent } = await import('./contentGenerator')
    const output = await generateContent({
      channels: [mockChannel('douyin')],
      assets: [mockAssetSelection('福鼎白茶')],
      prompt: '福鼎白茶新品上市',
      mediaType: 'copy',
    })
    expect(output.results).toHaveLength(1)
    expect(output.results[0].source).toBe('local')
    expect(output.results[0].text).toContain('福鼎白茶')
    expect(output.warnings ?? []).toHaveLength(0)
  })

  it('图像模型启用且成功：海报使用 AI 生成地址', async () => {
    imageEnabled = true
    const { generateContent } = await import('./contentGenerator')
    const output = await generateContent({
      channels: [mockChannel('douyin')],
      assets: [mockAssetSelection('福鼎白茶')],
      prompt: '海报：福鼎白茶',
      mediaType: 'image',
    })
    expect(output.results[0].posterUrl).toBe('https://cdn.x.ai/img/grok.png')
    expect(output.results[0].source).toBe('grok')
    expect(output.warnings ?? []).toHaveLength(0)
  })

  it('图像模型返回 b64_json：海报使用 data URI（同源渲染，规避跨域 ORB 拦截）', async () => {
    imageEnabled = true
    imageReturnsB64 = true
    const { generateContent } = await import('./contentGenerator')
    const output = await generateContent({
      channels: [mockChannel('douyin')],
      assets: [mockAssetSelection('福鼎白茶')],
      prompt: '海报：福鼎白茶',
      mediaType: 'image',
    })
    expect(output.results[0].posterUrl).toBe('data:image/jpeg;base64,QUJDRA==')
    expect(output.results[0].source).toBe('grok')
  })

  it('图像模型调用失败且允许降级：回退示例图并产生告警', async () => {
    imageEnabled = true
    imageFails = true
    const { generateContent } = await import('./contentGenerator')
    const output = await generateContent({
      channels: [mockChannel('douyin')],
      assets: [mockAssetSelection('福鼎白茶')],
      prompt: '海报：福鼎白茶',
      mediaType: 'image',
    })
    expect(output.results[0].source).toBe('local')
    expect(output.results[0].posterUrl).toBe('/photos/green-plant.webp')
    expect(output.warnings?.length).toBeGreaterThan(0)
    expect(output.warnings?.[0]).toContain('图像模型调用失败')
  })

  it('视频模型启用且成功：生成视频地址', async () => {
    videoEnabled = true
    const { generateContent } = await import('./contentGenerator')
    const output = await generateContent({
      channels: [mockChannel('douyin')],
      assets: [mockAssetSelection('福鼎白茶')],
      prompt: '短视频：茶园晨光',
      mediaType: 'video',
    })
    expect(output.results[0].videoUrl).toBe('https://cdn.x.ai/vid/grok.mp4')
    expect(output.results[0].source).toBe('grok')
  })

  it('视频生成：本地相对路径参考图转换为 data URI 后提交（远端模型无法访问本机地址）', async () => {
    videoEnabled = true
    const fetchMock = vi.fn(async () => ({
      ok: true,
      blob: async () => new Blob(['fake'], { type: 'image/webp' }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    try {
      const { generateContent } = await import('./contentGenerator')
      await generateContent({
        channels: [mockChannel('douyin')],
        assets: [{ id: 'a1', name: '茶', size: 1, source: 'sample', url: '/photos/tea-cup.webp' }],
        prompt: '短视频：茶园晨光',
        mediaType: 'video',
      })
      const { generateGrokVideo } = await import('../api/grokVideo')
      expect(generateGrokVideo).toHaveBeenCalledWith(
        expect.objectContaining({ imageUrl: expect.stringMatching(/^data:image\/webp;base64,/) }),
        expect.any(Function),
      )
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('视频生成：参考图加载失败（404/非图片）时放弃参考图，降级为文本生视频', async () => {
    videoEnabled = true
    // 模拟 base 前缀缺失导致的 404 错误页（text/plain），与线上实测场景一致
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 404,
      blob: async () => new Blob(['Not Found'], { type: 'text/plain' }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    try {
      const { generateContent } = await import('./contentGenerator')
      await generateContent({
        channels: [mockChannel('douyin')],
        assets: [{ id: 'a1', name: '茶', size: 1, source: 'sample', url: '/photos/tea-cup.webp' }],
        prompt: '短视频：茶园晨光',
        mediaType: 'video',
      })
      const { generateGrokVideo } = await import('../api/grokVideo')
      // 参考图被放弃：不携带 imageUrl，改为文本生视频
      expect(generateGrokVideo).toHaveBeenCalledWith(
        expect.objectContaining({ imageUrl: null }),
        expect.any(Function),
      )
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('视频模型被中转站权限拦截：降级并给出可读中文告警', async () => {
    videoEnabled = true
    videoError = 'Video generation is not enabled for this group'
    const { generateContent } = await import('./contentGenerator')
    const output = await generateContent({
      channels: [mockChannel('douyin')],
      assets: [mockAssetSelection('福鼎白茶')],
      prompt: '短视频：茶园晨光',
      mediaType: 'video',
    })
    expect(output.results[0].source).toBe('local')
    expect(output.results[0].videoUrl).toBeNull()
    expect(output.warnings?.[0]).toContain('未开通视频生成权限')
  })

  it('提示词为空时抛出错误', async () => {
    const { generateContent } = await import('./contentGenerator')
    await expect(
      generateContent({ channels: [mockChannel('douyin')], assets: [], prompt: '   ' }),
    ).rejects.toThrow('提示词为空')
  })
})
