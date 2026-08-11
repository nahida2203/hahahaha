import axios, { AxiosError, type AxiosInstance } from 'axios'
import axiosRetry from 'axios-retry'
import type { AIModelConfig } from '../utils/configLoader'

/** Grok API 调用异常：携带状态码与可重试标记，供 UI 层区分处理 */
export class GrokApiError extends Error {
  readonly status?: number
  readonly retryable: boolean

  constructor(message: string, options: { status?: number; retryable?: boolean; cause?: unknown } = {}) {
    super(message)
    this.name = 'GrokApiError'
    this.status = options.status
    this.retryable = options.retryable ?? false
    this.cause = options.cause
  }
}

/** 429 / 5xx 视为可重试的服务端错误 */
function isRetryableStatus(status?: number): boolean {
  return status === 429 || (status !== undefined && status >= 500 && status < 600)
}

/** 从 Axios 错误中提取可读信息 */
export function toGrokApiError(error: unknown): GrokApiError {
  if (error instanceof GrokApiError) return error
  if (error instanceof AxiosError) {
    const status = error.response?.status
    const detail = error.response?.data
    const rawMessage =
      (typeof detail === 'object' && detail !== null && 'error' in detail
        ? (detail as { error?: { message?: string } }).error?.message
        : undefined) ??
      error.message
    return new GrokApiError(rawMessage, { status, retryable: isRetryableStatus(status), cause: error })
  }
  return new GrokApiError(error instanceof Error ? error.message : '未知网络错误', { cause: error })
}

/**
 * 创建带重试策略的 Grok HTTP 客户端。
 * 重试条件：网络错误 / 429 / 5xx，使用指数退避（retryDelay * 2^n）并加入随机抖动，
 * 降低并发打爆上游的概率，保障 99.9%+ 稳定性目标。
 */
export function createGrokClient(config: AIModelConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.endpoint,
    timeout: config.timeout_ms ?? 120000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.api_key}`,
    },
  })

  const maxRetries = config.max_retries ?? 3
  const retryDelay = config.retry_delay_ms ?? 500

  axiosRetry(client, {
    retries: maxRetries,
    retryDelay: (retryCount) => retryDelay * 2 ** (retryCount - 1) + Math.random() * 200,
    retryCondition: (error) =>
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      isRetryableStatus(error.response?.status),
    shouldResetTimeout: true,
  })

  return client
}
