import { watchEffect, type Ref } from 'vue'
import type { BackgroundId, CategoryTheme, FilterId } from '@/types'
import { ALL_THEME, categoryOf } from '@/data/categories'
import { BACKGROUND_MAP, DEFAULT_BACKGROUND } from '@/data/backgrounds'
import { useLibrary } from '@/composables/useLibrary'

/**
 * 把「整體背景」與「分類主題」兩層一起寫進 :root。
 *
 * 兩層正交：背景管中性色（底、字、線），分類管強調色與個性（動效、邊緣、紋理）。
 * 唯一的交叉點是強調色——暗底要換用 accentDark，否則墨色系會整個消失。
 */
export function useAppearance(active: Ref<FilterId>, background: Ref<BackgroundId>): void {
  const { categories } = useLibrary()
  watchEffect(() => {
    const root = document.documentElement.style
    const scheme = BACKGROUND_MAP[background.value] ?? BACKGROUND_MAP[DEFAULT_BACKGROUND]
    const theme: CategoryTheme =
      active.value === 'all' ? ALL_THEME : categoryOf(active.value, categories.value).theme

    for (const [token, value] of Object.entries(scheme.tokens)) {
      root.setProperty(token, value)
    }

    root.setProperty('--accent', scheme.dark ? theme.accentDark : theme.accent)
    root.setProperty('--texture', theme.texture)
    root.setProperty('--ease', theme.easing)
    root.setProperty('--card-radius', theme.radius)
    root.setProperty('--card-border', theme.border)
    // 紋理是黑線，暗底要反相成微亮的線才看得見（實作在 main.css 的 body::before）
    document.documentElement.dataset.scheme = scheme.dark ? 'dark' : 'light'
  })
}
