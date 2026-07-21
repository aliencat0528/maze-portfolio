import { computed, ref } from 'vue'
import type { FilterId, Work } from '@/types'
import { CATEGORIES } from '@/data/categories'
import { useLibrary } from '@/composables/useLibrary'

/**
 * 作品牆狀態：分類篩選與詳情頁選取，並與網址同步。
 *
 * 網址帶狀態的理由：分類與單件作品都要能被分享（招募端可以直接連到某一類），
 * 且開啟詳情頁走 pushState，瀏覽器上一頁＝關閉詳情，符合直覺。
 */

const VALID_CATEGORIES = new Set<string>(CATEGORIES.map((category) => category.id))

const activeCategory = ref<FilterId>('all')
const selectedId = ref<string | null>(null)

const { allWorks } = useLibrary()

const filteredWorks = computed<Work[]>(() =>
  activeCategory.value === 'all'
    ? allWorks.value
    : allWorks.value.filter((work) => work.category === activeCategory.value),
)

// 找不到就是 null——自訂作品的深連結在 IndexedDB 載完前會短暫落在這裡，屬正常
const selectedWork = computed<Work | null>(
  () => allWorks.value.find((work) => work.id === selectedId.value) ?? null,
)

/** 詳情頁的上／下一件，範圍限定在目前篩選結果內 */
const selectedIndex = computed(() =>
  filteredWorks.value.findIndex((work) => work.id === selectedId.value),
)

function buildUrl(): string {
  const params = new URLSearchParams()
  if (activeCategory.value !== 'all') params.set('c', activeCategory.value)
  if (selectedId.value) params.set('w', selectedId.value)
  const query = params.toString()
  return `${window.location.pathname}${query ? `?${query}` : ''}`
}

function readUrl(): void {
  const params = new URLSearchParams(window.location.search)
  const category = params.get('c')
  activeCategory.value = category && VALID_CATEGORIES.has(category) ? (category as FilterId) : 'all'
  selectedId.value = params.get('w')
}

export function useGallery() {
  function setCategory(id: FilterId): void {
    if (activeCategory.value === id) return
    activeCategory.value = id
    // 切分類時關閉詳情，避免停在一件不屬於新分類的作品上
    selectedId.value = null
    window.history.replaceState(null, '', buildUrl())
  }

  function openWork(id: string): void {
    selectedId.value = id
    window.history.pushState(null, '', buildUrl())
  }

  function closeWork(): void {
    if (!selectedId.value) return
    // 交給 popstate 收尾，讓「關閉」與瀏覽器上一頁是同一件事
    window.history.back()
  }

  /** step 為 +1／-1，在目前篩選結果內循環 */
  function stepWork(step: number): void {
    const list = filteredWorks.value
    if (list.length === 0 || selectedIndex.value < 0) return
    const next = (selectedIndex.value + step + list.length) % list.length
    selectedId.value = list[next].id
    window.history.replaceState(null, '', buildUrl())
  }

  return {
    categories: CATEGORIES,
    activeCategory,
    filteredWorks,
    selectedWork,
    setCategory,
    openWork,
    closeWork,
    stepWork,
    syncFromUrl: readUrl,
  }
}
