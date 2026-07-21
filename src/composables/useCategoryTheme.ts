import { watchEffect, type Ref } from 'vue'
import type { CategoryTheme, FilterId } from '@/types'
import { ALL_THEME, CATEGORY_MAP } from '@/data/categories'

/**
 * 把目前分類的主題寫進 :root 的 CSS 變數。
 *
 * 只改這六個變數，版面與主背景不動——外殼換口音，作品顏色不受干擾。
 */
export function useCategoryTheme(active: Ref<FilterId>): void {
  watchEffect(() => {
    const theme: CategoryTheme =
      active.value === 'all' ? ALL_THEME : CATEGORY_MAP[active.value].theme
    const root = document.documentElement.style

    root.setProperty('--accent', theme.accent)
    root.setProperty('--accent-soft', theme.accentSoft)
    root.setProperty('--texture', theme.texture)
    root.setProperty('--ease', theme.easing)
    root.setProperty('--card-radius', theme.radius)
    root.setProperty('--card-border', theme.border)
  })
}
