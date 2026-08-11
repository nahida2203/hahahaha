/** 生成简单唯一 id（演示用，前缀 + 时间戳 + 随机） */
export function genId(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}-${rand}`
}

/** 生成 ISO 时间字符串 */
export function nowIso(): string {
  return new Date().toISOString()
}

/** 格式化日期时间，如 08-08 15:30 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
