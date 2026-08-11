/**
 * 读取图片文件并压缩为 dataURL（移动端相机照片通常数 MB，
 * 压缩后便于 localStorage 持久化预览；存储统计仍使用真实 file.size）。
 */
export function readImageFileAsDataURL(file: File, maxDimension = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : ''
      if (!raw) {
        reject(new Error('读取文件失败'))
        return
      }
      const image = new Image()
      image.onerror = () => reject(new Error('图片格式无法解析'))
      image.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('图片处理失败'))
          return
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      image.src = raw
    }
    reader.readAsDataURL(file)
  })
}

/** 校验文件是否为图片（按扩展名 + MIME 类型） */
export function isImageFile(file: File): boolean {
  const okMime = file.type.startsWith('image/')
  const okExt = /\.(jpe?g|png|webp|gif|heic)$/i.test(file.name)
  return okMime || okExt
}
