import type { MvpChannelOption, MvpTemplate } from './types'
import { loadAppData } from '../utils/appDataLoader'

export interface TemplateCatalog {
  templates: MvpTemplate[]
  scenes: string[]
  styles: string[]
  channels: MvpChannelOption[]
}

/** 模板中心目录：动态加载外部 YAML 配置 */
export async function getTemplateCatalog(): Promise<TemplateCatalog> {
  const appData = await loadAppData()
  return {
    templates: appData.templates,
    scenes: appData.template_scenes,
    styles: appData.template_styles,
    channels: appData.channels.map((channel) => ({ id: channel.id, label: channel.name })),
  }
}

/** 首页模板推荐 */
export async function getRecommendedTemplates(count = 4): Promise<MvpTemplate[]> {
  const appData = await loadAppData()
  return appData.templates.filter((item) => item.featured).slice(0, count)
}

