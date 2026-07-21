import type { Background, BackgroundId } from '@/types'

/**
 * 整體視覺背景。
 *
 * 只覆寫中性層（底色、字色、線條），分類主題那一層不動——
 * 兩者正交：任何背景 × 任何分類都要能看。
 */
export const BACKGROUNDS: Background[] = [
  {
    id: 'white-cube',
    label: '白盒',
    dark: false,
    tokens: {
      '--bg': '#f7f6f3',
      '--surface': '#eceae5',
      '--ink': '#1c1c1a',
      '--ink-soft': '#55534d',
      '--ink-faint': '#8c8981',
      '--line': '#dedbd4',
      '--line-strong': '#c8c4bb',
    },
  },
  {
    id: 'warm-paper',
    label: '暖紙',
    dark: false,
    tokens: {
      '--bg': '#f4ece0',
      '--surface': '#e9dfd0',
      '--ink': '#231e17',
      '--ink-soft': '#5c5346',
      '--ink-faint': '#948a7a',
      '--line': '#ded2c0',
      '--line-strong': '#c8b9a3',
    },
  },
  {
    id: 'concrete',
    label: '清水模',
    dark: false,
    tokens: {
      '--bg': '#eceded',
      '--surface': '#e0e2e3',
      '--ink': '#1a1c1d',
      '--ink-soft': '#4e5254',
      '--ink-faint': '#868b8d',
      '--line': '#d5d8d9',
      '--line-strong': '#bcc0c2',
    },
  },
  {
    id: 'gallery-dark',
    label: '暗展廳',
    dark: true,
    tokens: {
      '--bg': '#17171a',
      '--surface': '#202024',
      '--ink': '#f0efec',
      '--ink-soft': '#b0aea8',
      '--ink-faint': '#7e7c76',
      '--line': '#2c2c31',
      '--line-strong': '#43434a',
    },
  },
]

export const BACKGROUND_MAP: Record<BackgroundId, Background> = BACKGROUNDS.reduce(
  (map, background) => {
    map[background.id] = background
    return map
  },
  {} as Record<BackgroundId, Background>,
)

export const DEFAULT_BACKGROUND: BackgroundId = 'white-cube'
