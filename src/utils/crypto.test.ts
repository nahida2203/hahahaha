import { describe, it, expect, beforeEach } from 'vitest'
import { encryptAES256, decryptAES256 } from './crypto'

const TEST_PLAINTEXT = 'xai-super-secret-key-abc-123456'

describe('crypto AES-256 加解密', () => {
  beforeEach(() => {
    // 依赖 .env 中的 VITE_CRYPTO_KEY（vitest 会自动加载 .env）
  })

  it('加密后可解密还原为原文', () => {
    const ciphertext = encryptAES256(TEST_PLAINTEXT)
    expect(ciphertext).not.toBe(TEST_PLAINTEXT)
    expect(ciphertext.length).toBeGreaterThan(16)
    expect(decryptAES256(ciphertext)).toBe(TEST_PLAINTEXT)
  })

  it('相同明文每次加密的密文不同（AES-256 使用随机 Salt/IV）', () => {
    const first = encryptAES256(TEST_PLAINTEXT)
    const second = encryptAES256(TEST_PLAINTEXT)
    expect(first).not.toBe(second)
  })

  it('用错误的密文解密会抛出异常而非返回空串', () => {
    expect(() => decryptAES256('U2FsdGVkX19naW5jb3JyZWN0dG9rZW4=')).toThrow()
  })

  it('空字符串或非法输入解密会抛出异常', () => {
    expect(() => decryptAES256('')).toThrow()
  })
})
