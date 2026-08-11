import { describe, it, expect } from 'vitest'
import { AxiosError } from 'axios'
import { GrokApiError, toGrokApiError } from './grokClient'

describe('grokClient 错误归一化', () => {
  it('GrokApiError 原样透传', () => {
    const original = new GrokApiError('原始错误', { status: 400 })
    expect(toGrokApiError(original)).toBe(original)
  })

  it('401 未授权：提取 message 且不可重试', () => {
    const error = new AxiosError('Request failed with status code 401', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 401,
      data: { error: { message: 'Invalid API key' } },
    } as never)
    const normalized = toGrokApiError(error)
    expect(normalized).toBeInstanceOf(GrokApiError)
    expect(normalized.message).toBe('Invalid API key')
    expect(normalized.status).toBe(401)
    expect(normalized.retryable).toBe(false)
  })

  it('429 限流：标记为可重试', () => {
    const error = new AxiosError('rate limited', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 429,
    } as never)
    expect(toGrokApiError(error).retryable).toBe(true)
  })

  it('5xx 服务端错误：标记为可重试', () => {
    const error = new AxiosError('server error', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status: 503,
      data: { error: { message: 'Service Unavailable' } },
    } as never)
    const normalized = toGrokApiError(error)
    expect(normalized.retryable).toBe(true)
    expect(normalized.message).toBe('Service Unavailable')
  })

  it('普通 Error：转换为通用网络错误', () => {
    const normalized = toGrokApiError(new Error('something failed'))
    expect(normalized).toBeInstanceOf(GrokApiError)
    expect(normalized.retryable).toBe(false)
  })
})
