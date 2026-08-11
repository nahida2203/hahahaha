import CryptoJS from 'crypto-js'

/**
 * 解密 AES256 加密的字符串
 * @param ciphertext 密文
 * @returns 明文
 */
export function decryptAES256(ciphertext: string): string {
  const secretKey = import.meta.env.VITE_CRYPTO_KEY
  if (!secretKey) {
    throw new Error('Missing VITE_CRYPTO_KEY environment variable')
  }
  
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    if (!decrypted) {
      throw new Error('Decryption failed (empty string)')
    }
    return decrypted
  } catch (error) {
    console.error('Failed to decrypt sensitive data:', error)
    throw new Error('Decryption failed')
  }
}

/**
 * 加密字符串 (用于测试或生成配置)
 * @param text 明文
 * @returns 密文
 */
export function encryptAES256(text: string): string {
  const secretKey = import.meta.env.VITE_CRYPTO_KEY
  if (!secretKey) {
    throw new Error('Missing VITE_CRYPTO_KEY environment variable')
  }
  return CryptoJS.AES.encrypt(text, secretKey).toString()
}
