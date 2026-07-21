import { onBeforeUnmount, readonly, ref, type Ref } from 'vue'

/** 追蹤一條 media query 的成立與否，元件卸載時自動解除監聽 */
export function useMediaQuery(query: string): Readonly<Ref<boolean>> {
  const matches = ref(false)

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const list = window.matchMedia(query)
    matches.value = list.matches

    const update = (event: MediaQueryListEvent) => {
      matches.value = event.matches
    }
    list.addEventListener('change', update)
    onBeforeUnmount(() => list.removeEventListener('change', update))
  }

  return readonly(matches)
}

/** 寬螢幕才走水平長廊；窄螢幕降級為垂直網格，避免與頁面捲動打架 */
export function useIsWide() {
  return useMediaQuery('(min-width: 900px)')
}

/** 尊重系統的減少動態設定：開場動畫與所有轉場都要照做 */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
