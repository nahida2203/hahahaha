import type { Asset } from './types'
import { getAppDataSync } from '../utils/appDataLoader'

/**
 * 内置示例素材：从动态加载的应用数据源（data/appData.yaml）读取，
 * 上传到素材库时按素材 size 计入存储。
 */
export function getSampleAssetsSync(): Asset[] {
  const data = getAppDataSync()
  return data?.assets ?? []
}

/** 按 id 获取内置示例素材 */
export function getSampleAssetSync(id: string): Asset | null {
  return getSampleAssetsSync().find((item) => item.id === id) ?? null
}
