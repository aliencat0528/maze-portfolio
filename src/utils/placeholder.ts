import type { AspectId } from '@/types'

/**
 * 幾何佔位圖產生器。
 *
 * 真作品圖到位前的暫代方案：以 seed 產生穩定不亂跳的幾何構圖，輸出 SVG data URI，
 * 不需要任何 binary 檔案、不發網路請求。替換真圖時只要改 `works[].src` / `.thumb`。
 */

/** 各版位的標稱像素尺寸，同時作為 img 的 width/height（防 CLS） */
export const ASPECT_SIZE: Record<AspectId, { width: number; height: number }> = {
  square: { width: 1000, height: 1000 },
  landscape: { width: 1200, height: 800 },
  portrait: { width: 800, height: 1200 },
  video: { width: 1280, height: 720 },
}

/** CSS aspect-ratio 用的數值，與 ASPECT_SIZE 同源 */
export const ASPECT_RATIO: Record<AspectId, string> = {
  square: '1 / 1',
  landscape: '3 / 2',
  portrait: '2 / 3',
  video: '16 / 9',
}

/** FNV-1a：把 seed 字串轉成整數，確保同一件作品每次重整構圖一致 */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32：小而穩定的偽隨機數列 */
function createRandom(seed: string): () => number {
  let state = hashSeed(seed)
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function toDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s{2,}/g, ' '))}`
}

/**
 * 產生一張幾何佔位圖。
 *
 * @param seed   通常傳作品 id，保證構圖穩定
 * @param aspect 版位，決定畫布長寬
 * @param accent 該分類的強調色
 */
export function createPlaceholder(seed: string, aspect: AspectId, accent: string): string {
  const { width, height } = ASPECT_SIZE[aspect]
  const random = createRandom(seed)
  const unit = Math.min(width, height)
  const shapes: string[] = []

  // 底層網格：數位幾何感的骨架
  const step = Math.round(unit / 8)
  for (let x = step; x < width; x += step) {
    shapes.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#000" stroke-opacity="0.05" />`)
  }
  for (let y = step; y < height; y += step) {
    shapes.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#000" stroke-opacity="0.05" />`)
  }

  // 上層幾何量體：3～5 個圓／方／斜線，位置與大小由 seed 決定
  const count = 3 + Math.floor(random() * 3)
  for (let i = 0; i < count; i += 1) {
    const cx = Math.round(random() * width)
    const cy = Math.round(random() * height)
    const size = Math.round(unit * (0.14 + random() * 0.3))
    const opacity = (0.16 + random() * 0.4).toFixed(2)
    const kind = Math.floor(random() * 3)

    if (kind === 0) {
      shapes.push(`<circle cx="${cx}" cy="${cy}" r="${size / 2}" fill="${accent}" fill-opacity="${opacity}" />`)
    } else if (kind === 1) {
      const angle = Math.round(random() * 90)
      shapes.push(
        `<rect x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" fill="${accent}" fill-opacity="${opacity}" transform="rotate(${angle} ${cx} ${cy})" />`,
      )
    } else {
      shapes.push(
        `<path d="M${cx} ${cy} L${cx + size} ${cy + size}" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="${Math.round(unit * 0.02)}" stroke-linecap="square" />`,
      )
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#ecebe8" />
    ${shapes.join('')}
  </svg>`

  return toDataUri(svg)
}
