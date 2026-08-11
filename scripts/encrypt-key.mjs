/**
 * 福农AI创 - AES-256 密钥加密工具
 *
 * 用途：为 config.yaml / appData.yaml 中的敏感字段（API Key、演示密码等）生成密文。
 * 用法（PowerShell）：
 *   node scripts/encrypt-key.mjs "xai-<your-api-key>"
 *
 * 解密密钥从 .env 的 VITE_CRYPTO_KEY 读取；未设置时可用 --key 指定：
 *   node scripts/encrypt-key.mjs "secret" --key "my-strong-key"
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import CryptoJS from 'crypto-js'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadKey(argv) {
  const flagIndex = argv.indexOf('--key')
  if (flagIndex !== -1 && argv[flagIndex + 1]) return argv[flagIndex + 1]
  const envPath = resolve(rootDir, '.env')
  if (existsSync(envPath)) {
    const match = readFileSync(envPath, 'utf8').match(/^VITE_CRYPTO_KEY\s*=\s*(.+)\s*$/m)
    if (match?.[1]) return match[1].trim()
  }
  throw new Error('未找到 VITE_CRYPTO_KEY（请先复制 .env.example 为 .env 并填写密钥，或使用 --key 指定）')
}

const plaintext = process.argv[2]
if (!plaintext) {
  console.error('用法: node scripts/encrypt-key.mjs "<明文>" [--key "<AES密钥>"]')
  process.exit(1)
}

const key = loadKey(process.argv)
const ciphertext = CryptoJS.AES.encrypt(plaintext, key).toString()
console.log(`加密结果：${ciphertext}`)
console.log(`使用说明：将该值填入 config.yaml / appData.yaml 的 *_encrypted 字段。`)
