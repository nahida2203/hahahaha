import type { Channel, ChannelId } from './types'
import { loadAppData, getAppDataSync } from '../utils/appDataLoader'

export async function getChannels(): Promise<Channel[]> {
  const data = await loadAppData()
  return data.channels as Channel[]
}

/** 同步获取指定渠道 */
export function getChannelSync(id: string): Channel | null {
  const data = getAppDataSync()
  if (!data) return null
  return data.channels.find(c => c.id === id) as Channel ?? null
}

/** 同步获取所有渠道 */
export function getAllChannelsSync(): Channel[] {
  const data = getAppDataSync()
  return (data?.channels as Channel[]) ?? []
}

/** 按渠道 id 列表拼接待阅读的中文标签（如 抖音 · 视频号） */
export function formatChannels(ids: string[]): string {
  return ids.map((id) => getChannelSync(id)?.name ?? id).join(' · ')
}


