import axios from 'axios'
import { load as parseYaml } from 'js-yaml'
import type { Asset, Channel, MvpTemplate, Project } from '../api/types'
import type { DemoAccount } from '../api/accounts'
import type { CreationScenario } from '../api/scenarios'
import type { OutputTypeOption } from '../api/outputTypes'

/** 应用数据契约：从外部 YAML 真实数据源动态加载 */
export interface AppData {
  channels: Channel[]
  template_scenes: string[]
  template_styles: string[]
  templates: MvpTemplate[]
  assets: Asset[]
  demo_projects: Project[]
  demo_accounts: DemoAccount[]
  creation_scenarios: CreationScenario[]
  output_types: OutputTypeOption[]
}

let appData: AppData | null = null
let loadingPromise: Promise<AppData> | null = null

/**
 * 相对路径资源统一补全部署前缀（import.meta.env.BASE_URL）。
 * 应用以 base（如 /funong-ai-create/）部署时，裸路径 /photos/*.webp 会 404，
 * 需在数据加载层一次性规范化，避免各处渲染与参考图转换重复处理。
 * data:/http(s):/blob: 等绝对地址原样返回。
 */
function resolveAssetUrl(url: string | undefined | null): string | undefined | null {
  if (!url) return url
  if (/^(data:|https?:|blob:)/i.test(url)) return url
  const base = import.meta.env.BASE_URL ?? '/'
  if (base && url.startsWith(base)) return url
  return `${base}${url.replace(/^\//, '')}`
}

/** 同步读取已加载的数据（未就绪返回 null） */
export function getAppDataSync(): AppData | null {
  return appData
}

/**
 * 动态加载应用数据（data/appData.yaml）。
 * 使用模块级缓存 + 并发去重，保证多调用方共享同一份数据。
 */
export async function loadAppData(): Promise<AppData> {
  if (appData) return appData
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    try {
      const response = await axios.get(`${import.meta.env.BASE_URL}data/appData.yaml`, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      appData = parseYaml(response.data) as AppData
      // 相对路径资源补全部署前缀（base），防止资源 404
      if (Array.isArray(appData.assets)) {
        appData.assets.forEach((asset) => {
          const resolved = resolveAssetUrl(asset.url)
          if (resolved != null) asset.url = resolved
        })
      }
      if (Array.isArray(appData.templates)) {
        appData.templates.forEach((template) => {
          const resolved = resolveAssetUrl(template.coverUrl)
          if (resolved) template.coverUrl = resolved
        })
      }
      if (Array.isArray(appData.demo_projects)) {
        appData.demo_projects.forEach((project) => {
          const resolved = resolveAssetUrl(project.coverUrl)
          if (resolved != null) project.coverUrl = resolved
        })
      }
      return appData
    } catch (error) {
      console.error('Failed to load app data:', error)
      throw new Error('应用数据加载失败')
    } finally {
      loadingPromise = null
    }
  })()

  return loadingPromise
}
