import { ref, watchEffect } from 'vue'
import type { SiteSettings } from '@/types'
import { DEFAULT_BACKGROUND } from '@/data/backgrounds'
import { PROFILE } from '@/data/works'

/** 站台設定：分頁標題、作者資訊、整體背景。存 localStorage，改了就生效 */

const STORAGE_KEY = 'artwall.settings.v1'

const DEFAULTS: SiteSettings = {
  siteTitle: '作品牆 Art Wall',
  name: PROFILE.name,
  statement: PROFILE.statement,
  email: PROFILE.email,
  background: DEFAULT_BACKGROUND,
}

function load(): SiteSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SiteSettings>) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

const settings = ref<SiteSettings>(load())

// 分頁標題跟著設定走
watchEffect(() => {
  document.title = settings.value.siteTitle || DEFAULTS.siteTitle
})

export function useSettings() {
  function update(patch: Partial<SiteSettings>): void {
    settings.value = { ...settings.value, ...patch }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
    } catch {
      // 存不了就只在這次瀏覽有效
    }
  }

  function reset(): void {
    settings.value = { ...DEFAULTS }
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 同上
    }
  }

  return { settings, update, reset }
}
