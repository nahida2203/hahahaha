import type { ChannelId } from './types'
import type { OutputType } from '../stores/creation'
import { getAppDataSync } from '../utils/appDataLoader'

export type AssetPolicy = 'required' | 'recommended' | 'optional'

/** 创作场景（从动态数据源加载） */
export interface CreationScenario {
  id: string
  title: string
  description: string
  eyebrow: string
  color: string
  channels: ChannelId[]
  outputTypes: OutputType[]
  assetPolicy: AssetPolicy
  assetHint: string
  promptTemplate: string
  templateId?: string
}

/** 全部创作场景 */
export function getScenariosSync(): CreationScenario[] {
  return getAppDataSync()?.creation_scenarios ?? []
}

/** 按 id 获取场景 */
export function getScenarioSync(id?: string): CreationScenario | undefined {
  if (!id) return undefined
  return getScenariosSync().find((item) => item.id === id)
}
