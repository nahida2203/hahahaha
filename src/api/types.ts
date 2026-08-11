/**
 * user-mvp 数据契约（P2 定义，P1/P3 共享，字段一经发布保持稳定）。
 *
 * localStorage keys：
 * - 'funong-mvp.projects.v1' -> Project[]
 * - 'funong-mvp.assets.v1'   -> Asset[]
 * - 'funong-mvp.quota.v1'    -> QuotaState
 *
 * 说明：assets 中相册/拍照素材以 dataURL 形式存入 url 字段，
 * 受 localStorage 容量限制（约 5MB），MVP 演示期可接受；正式版替换为对象存储 URL。
 */

/** 支持的目标渠道（MVP 三个） */
export type ChannelId = 'douyin' | 'shipinhao' | 'pengyouquan'

/** 素材来源 */
export type AssetSource = 'sample' | 'album' | 'camera'

/** 渠道字典项 */
export interface Channel {
  id: ChannelId
  /** 渠道名称，如 抖音 */
  name: string
  /** Element Plus 图标组件名（@element-plus/icons-vue），组件内映射渲染 */
  icon: string
  /** 渠道一句话描述 */
  description: string
  /** 示例文案风格说明 */
  copyStyle: string
}

/** 素材（localStorage 'funong-mvp.assets.v1'） */
export interface Asset {
  id: string
  name: string
  /** 文件大小（字节） */
  size: number
  /** 素材类型，MVP 仅图片 */
  type: 'image'
  /** 预览地址：内置图走打包资源路径，相册/拍照为 dataURL */
  url?: string
  source: AssetSource
  createdAt: string
}

/** 创作记录中引用的素材（仅存 id/name，不复制图片） */
export interface ProjectAssetRef {
  id: string
  name: string
  /** 扩展字段（可选）：素材原图/压缩图地址；相册与拍照素材保存后可用 url 恢复预览，示例图通常为 null（按 id 从 mock 找回） */
  url?: string | null
  /** 扩展字段（可选）：素材来源 */
  source?: AssetSource
}

/** 单个渠道的生成结果 */
export interface GeneratedResult {
  channelId: ChannelId
  text: string
  /** 示例海报图地址 */
  posterUrl?: string | null
  /** 视频生成结果地址（视频流程使用） */
  videoUrl?: string | null
  /** 生成来源：grok（真实模型） / local（本地模拟降级） */
  source?: 'grok' | 'local'
}

/** 创作记录（localStorage 'funong-mvp.projects.v1'，数组元素必须含 id/title/channels/createdAt/coverUrl 供首页只读展示） */
export interface Project {
  id: string
  title: string
  /** 渠道 id 列表 */
  channels: string[]
  createdAt: string
  /** 封面图（取第一张素材或海报） */
  coverUrl?: string | null
  /** 使用的提示词 */
  prompt: string
  /** 引用的素材 */
  assets: ProjectAssetRef[]
  /** 按渠道生成的版本 */
  results: GeneratedResult[]
  /** 本次生成消耗额度 */
  quotaCost: number
  /** 扩展字段（可选）：来源模板 id，P1 “使用此模板”带入 */
  templateId?: string
}

/** 额度消费明细 */
export interface QuotaLedgerEntry {
  id: string
  createdAt: string
  /** 消费时关联的创作标题 */
  title: string
  /** 消耗点数（正数） */
  cost: number
  /** 消费后余额 */
  balanceAfter: number
}

/** 额度状态（localStorage 'funong-mvp.quota.v1'） */
export interface QuotaState {
  balance: number
  total: number
  ledger: QuotaLedgerEntry[]
}

/** 创作流程中的待选素材（示例素材或本次临时上传） */
export interface CreationAssetSelection {
  id: string
  name: string
  size: number
  url?: string
  source: AssetSource
}

/** 常量：额度与存储口径（演示用） */
export const QUOTA_INITIAL_BALANCE = 688
export const QUOTA_COST_PER_VERSION = 100
export const MEDIA_QUOTA_COST_IMAGE = 20
export const MEDIA_QUOTA_COST_VIDEO = 40
export const STORAGE_TOTAL_BYTES = 500 * 1024 * 1024
/** 示例图按固定大小计入存储 */
export const SAMPLE_ASSET_SIZE_BYTES = 2 * 1024 * 1024

/** localStorage key 常量 */
export const STORAGE_KEYS = {
  session: 'funong-mvp.session.v1',
  projects: 'funong-mvp.projects.v1',
  assets: 'funong-mvp.assets.v1',
  quota: 'funong-mvp.quota.v1',
} as const

export type MvpChannelId = 'douyin' | 'shipinhao' | 'pengyouquan'
export type MvpTemplateScene = '新品上市' | '节日营销' | '产地故事' | '丰收节' | '品牌故事'
export type MvpTemplateStyle = '清新自然' | '大气正式' | '年轻潮流' | '质朴乡土'

export interface MvpChannelOption {
  id: MvpChannelId
  label: string
}

export interface MvpTemplate {
  id: string
  title: string
  description: string
  scene: MvpTemplateScene
  style: MvpTemplateStyle
  channelIds: MvpChannelId[]
  promptExample: string
  coverUrl: string
  coverAlt: string
  featured?: boolean
}

/** 运行时校验渠道 id（兼容外部字符串输入） */
export function isChannelId(value: unknown): value is ChannelId {
  return value === 'douyin' || value === 'shipinhao' || value === 'pengyouquan'
}
