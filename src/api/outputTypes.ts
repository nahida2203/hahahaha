import type { OutputType } from '../stores/creation'
import { getAppDataSync } from '../utils/appDataLoader'

/** 输出类型选项（从动态数据源加载） */
export interface OutputTypeOption {
  id: OutputType
  label: string
  description: string
  icon: string
  needsImage: boolean
}

/** 全部输出类型选项 */
export function getOutputTypesSync(): OutputTypeOption[] {
  return getAppDataSync()?.output_types ?? []
}
