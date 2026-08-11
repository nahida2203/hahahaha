import axios from 'axios'
import { load as parseYaml } from 'js-yaml'
import { decryptAES256 } from './crypto'
import {
  MEDIA_QUOTA_COST_IMAGE,
  MEDIA_QUOTA_COST_VIDEO,
  QUOTA_COST_PER_VERSION,
  QUOTA_INITIAL_BALANCE,
  SAMPLE_ASSET_SIZE_BYTES,
  STORAGE_TOTAL_BYTES,
} from '../api/types'

/** 业务运行参数（来自 config.yaml settings 段） */
export interface AppSettings {
  quota: {
    initial_balance: number
    cost_per_version: number
    media_cost_image: number
    media_cost_video: number
  }
  storage: {
    total_bytes: number
    sample_asset_size_bytes: number
  }
}

/** 兜底默认值：仅当 config.yaml 缺省时才使用（正常以动态数据源为准） */
export const DEFAULT_SETTINGS: AppSettings = {
  quota: {
    initial_balance: QUOTA_INITIAL_BALANCE,
    cost_per_version: QUOTA_COST_PER_VERSION,
    media_cost_image: MEDIA_QUOTA_COST_IMAGE,
    media_cost_video: MEDIA_QUOTA_COST_VIDEO,
  },
  storage: {
    total_bytes: STORAGE_TOTAL_BYTES,
    sample_asset_size_bytes: SAMPLE_ASSET_SIZE_BYTES,
  },
}

/** 单个 AI 模型配置（来自 config.yaml，敏感字段解密后仅驻留内存） */
export interface AIModelConfig {
  endpoint: string
  /** 视频任务轮询地址（{id} 为占位符） */
  poll_endpoint?: string
  model: string
  api_key_encrypted: string
  /** 解密后的 API Key（不落盘、不打印） */
  api_key?: string
  /** 请求超时（毫秒） */
  timeout_ms?: number
  /** 最大重试次数 */
  max_retries?: number
  /** 首次重试延迟（毫秒） */
  retry_delay_ms?: number
  /** 轮询间隔（毫秒，视频任务使用） */
  poll_interval_ms?: number
  /** 单任务最长等待（毫秒，视频任务使用） */
  poll_timeout_ms?: number
  /** 是否启用真实模型调用 */
  enabled?: boolean
  /** 失败后是否降级本地模拟 */
  fallback_to_local?: boolean
}

export interface AppConfig {
  settings?: AppSettings
  ai_models: {
    grok_image: AIModelConfig
    grok_video: AIModelConfig
  }
}

let appConfig: AppConfig | null = null
let loadingPromise: Promise<AppConfig> | null = null

/** 同步读取已加载的配置（未就绪返回 null） */
export function getAppConfigSync(): AppConfig | null {
  return appConfig
}

/**
 * 动态加载配置（config.yaml），并在内存中解密全部敏感字段。
 * 使用模块级缓存 + 并发去重，保证多调用方共享同一份配置。
 */
export async function loadAppConfig(): Promise<AppConfig> {
  if (appConfig) return appConfig
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    try {
      const response = await axios.get(`${import.meta.env.BASE_URL}config.yaml`, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      const parsed = parseYaml(response.data) as AppConfig

      // 内存态解密：API Key 只出现在运行时内存中
      if (parsed.ai_models?.grok_image?.api_key_encrypted) {
        parsed.ai_models.grok_image.api_key = decryptAES256(parsed.ai_models.grok_image.api_key_encrypted)
      }
      if (parsed.ai_models?.grok_video?.api_key_encrypted) {
        parsed.ai_models.grok_video.api_key = decryptAES256(parsed.ai_models.grok_video.api_key_encrypted)
      }

      appConfig = parsed
      return appConfig
    } catch (error) {
      console.error('Failed to load application configuration:', error)
      throw new Error('系统配置加载失败，请检查 config.yaml')
    } finally {
      loadingPromise = null
    }
  })()

  return loadingPromise
}

/** 按模型 key 读取配置（未就绪返回 null） */
export function getModelConfigSync(kind: 'grok_image' | 'grok_video'): AIModelConfig | null {
  return appConfig?.ai_models?.[kind] ?? null
}

/** 读取业务运行参数（未就绪时返回兜底默认值） */
export function getSettingsSync(): AppSettings {
  return appConfig?.settings ?? DEFAULT_SETTINGS
}
