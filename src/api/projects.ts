import type { Project } from './types'
import { getAppDataSync } from '../utils/appDataLoader'

/**
 * 示例创作记录（仅作演示种子数据，默认不自动写入；
 * stores/projects 提供 seedDemoData 供“演示账号说明/重置”类入口按需调用）。
 */
export function getDemoProjectsSync(): Project[] {
  return getAppDataSync()?.demo_projects ?? []
}
