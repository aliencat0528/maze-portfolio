import type { AspectId } from '@/types'

/** 牆面縮圖的長邊上限。牆上永遠不載原圖，這是那條規則的實作處 */
const THUMB_MAX_EDGE = 800

/** 詳情頁用圖的長邊上限。仍不是原始檔，避免手機拍的 4000px 照片直接進瀏覽器 */
const VIEW_MAX_EDGE = 1800

export interface ProcessedImage {
  thumb: Blob
  view: Blob
  width: number
  height: number
  /** 依實際長寬比推薦的版位，使用者仍可在表單改 */
  aspect: AspectId
}

function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file)

  // Safari 舊版沒有 createImageBitmap，退回 <img>
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('圖片讀取失敗'))
    }
    image.src = url
  })
}

function resize(
  source: ImageBitmap | HTMLImageElement,
  maxEdge: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = Math.min(1, maxEdge / Math.max(source.width, source.height))
  const width = Math.round(source.width * scale)
  const height = Math.round(source.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')?.drawImage(source, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve({ blob, width, height }) : reject(new Error('圖片轉檔失敗'))),
      'image/jpeg',
      0.86,
    )
  })
}

/** 依長寬比挑一個最接近的版位 */
function guessAspect(width: number, height: number): AspectId {
  const ratio = width / height
  if (ratio > 1.6) return 'video'
  if (ratio > 1.15) return 'landscape'
  if (ratio < 0.85) return 'portrait'
  return 'square'
}

/**
 * 只讀尺寸、不轉檔：表單選完圖就能立刻把版位帶進去給使用者確認。
 * （若等到送出才用偵測值，表單上的預設選項會先蓋掉它）
 */
export async function detectAspect(file: File): Promise<AspectId> {
  const source = await loadBitmap(file)
  const aspect = guessAspect(source.width, source.height)
  if ('close' in source) source.close()
  return aspect
}

/**
 * 把上傳的檔案轉成「縮圖 + 詳情用圖」兩份。
 * 兩份都壓過，因為原始檔進不了瀏覽器記憶體以外的任何好處。
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  const source = await loadBitmap(file)
  const [thumb, view] = await Promise.all([
    resize(source, THUMB_MAX_EDGE),
    resize(source, VIEW_MAX_EDGE),
  ])

  if ('close' in source) source.close()

  return {
    thumb: thumb.blob,
    view: view.blob,
    width: view.width,
    height: view.height,
    aspect: guessAspect(view.width, view.height),
  }
}

/** 匯出用：blob → data URI，讓整份資料可以裝進一個 JSON 檔帶走 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** 匯入用：data URI → blob */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}
