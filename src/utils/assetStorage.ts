import type { Asset } from '../api/types'
import { STORAGE_KEYS } from '../api/types'

/** 素材库读写（localStorage 'funong-mvp.assets.v1'），供素材库页与创作第 2 步共用 */
export function readAssetsFromStorage(): Asset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.assets)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return (parsed.filter(isValidAsset) as Asset[]).map((item) => ({
      ...item,
      name: item.name.replace(/示例图$/u, ''),
    }))
  } catch {
    return []
  }
}

export function writeAssetsToStorage(list: Asset[]): void {
  localStorage.setItem(STORAGE_KEYS.assets, JSON.stringify(list))
}

function isValidAsset(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.size === 'number' &&
    item.type === 'image'
  )
}
