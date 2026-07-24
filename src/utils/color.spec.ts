import { describe, expect, it } from 'vitest'
import { contrastRatio, deriveAccentDark, hexToRgb, rgbToHex } from '@/utils/color'

/**
 * accentDark 推導的重點只有一個：暗展廳底（#17171a）上看得見。
 * 因此測的是「對比度達標」而非「顏色等於某個值」——後者綁死實作，改演算法就假紅。
 */

const DARK_BG = { r: 0x17, g: 0x17, b: 0x1a }
const MIN_CONTRAST = 4.5

function contrastOnDark(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) throw new Error(`無法解析：${hex}`)
  return contrastRatio(rgb, DARK_BG)
}

describe('deriveAccentDark', () => {
  it('墨色系會被提亮——這正是暗底會整個消失的那一類', () => {
    const inkDark = deriveAccentDark('#3d3a35')

    expect(inkDark).not.toBe('#3d3a35')
    expect(contrastOnDark('#3d3a35')).toBeLessThan(MIN_CONTRAST)
    expect(contrastOnDark(inkDark)).toBeGreaterThanOrEqual(MIN_CONTRAST)
  })

  it('內建六類的 accent 推導後都在暗底達標', () => {
    const accents = ['#c2410c', '#2563a8', '#3d3a35', '#6b6355', '#7c3aed', '#0d8a80']

    for (const accent of accents) {
      expect(contrastOnDark(deriveAccentDark(accent))).toBeGreaterThanOrEqual(MIN_CONTRAST)
    }
  })

  it('本來就夠亮的顏色不會被推暗', () => {
    const light = deriveAccentDark('#ffd9a0')

    expect(contrastOnDark(light)).toBeGreaterThanOrEqual(MIN_CONTRAST)
  })

  it('三碼縮寫也解析得了', () => {
    expect(hexToRgb('#f0a')).toEqual({ r: 255, g: 0, b: 170 })
    expect(contrastOnDark(deriveAccentDark('#f0a'))).toBeGreaterThanOrEqual(MIN_CONTRAST)
  })

  it('壞輸入回中性亮色，不讓使用者亂填炸掉畫面', () => {
    expect(deriveAccentDark('not-a-color')).toBe('#f0efec')
    expect(deriveAccentDark('')).toBe('#f0efec')
  })
})

describe('contrastRatio', () => {
  it('黑白對比為 21，同色為 1', () => {
    const white = { r: 255, g: 255, b: 255 }
    const black = { r: 0, g: 0, b: 0 }

    expect(contrastRatio(white, black)).toBeCloseTo(21, 1)
    expect(contrastRatio(white, white)).toBeCloseTo(1, 5)
  })
})

describe('hex 轉換', () => {
  it('round-trip 不失真', () => {
    const rgb = hexToRgb('#2563a8')

    expect(rgb).not.toBeNull()
    expect(rgbToHex(rgb!)).toBe('#2563a8')
  })
})
