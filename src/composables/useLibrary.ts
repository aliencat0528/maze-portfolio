import { computed, ref } from 'vue'
import type {
  Category,
  CategoryId,
  Exhibition,
  LibraryDocument,
  StoredCategory,
  StoredWork,
  Work,
} from '@/types'
import { WORKS } from '@/data/works'
import { CATEGORIES, resolveCategory } from '@/data/categories'
import { deleteImage, getImage, putImage } from '@/utils/idb'
import { blobToDataUrl, dataUrlToBlob, processImage } from '@/utils/image'

/**
 * 作品資料層：內建範例 + 使用者在瀏覽器內的編輯結果。
 *
 * 資料放哪（MR-009／MR-012 ②）：圖片走 IndexedDB，其餘（自訂作品、分類、展覽、
 * 覆寫、隱藏）收成單一 localStorage document `artwall.library.v2`。**沒有後端**，
 * 編輯只存在這台瀏覽器——要讓訪客看到，得用「匯出 JSON」把整個 document 帶走。
 *
 * 遷移：舊版散在 works.v1／overrides.v1／hidden.v1 三個 key，開站時若尚無 v2
 * document 就自動組出並寫入，且**不刪舊 key**（留作回滾，只在 v2 缺席時執行 → idempotent）。
 */

const LIBRARY_KEY = 'artwall.library.v2'
// 舊 key，只在遷移時讀取
const WORKS_KEY_V1 = 'artwall.works.v1'
const OVERRIDE_KEY_V1 = 'artwall.overrides.v1'
const HIDDEN_KEY_V1 = 'artwall.hidden.v1'

const customWorks = ref<Work[]>([])
const customCategories = ref<StoredCategory[]>([])
const exhibitions = ref<Exhibition[]>([])
const overrides = ref<Record<string, Partial<Work>>>({})
const hidden = ref<string[]>([])
const ready = ref(false)

/** 這次 session 產生的所有 object URL，換圖／刪除時要回收 */
const objectUrls = new Map<string, string>()

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 配額滿或無痕模式：編輯仍在畫面上有效，只是下次開站會消失
  }
}

/** blob URL 每次開站都不同，不能存進去 */
function stripImageUrls(work: Work): StoredWork {
  const rest: Partial<Work> = { ...work }
  delete rest.src
  delete rest.thumb
  return rest as StoredWork
}

/** 把記憶體狀態組回 document 形狀 */
function toDocument(): LibraryDocument {
  return {
    schemaVersion: 2,
    works: customWorks.value.map(stripImageUrls),
    categories: customCategories.value,
    exhibitions: exhibitions.value,
    overrides: overrides.value,
    hidden: hidden.value,
  }
}

function persist(): void {
  writeJson(LIBRARY_KEY, toDocument())
}

/**
 * 讀取持久層 document：已有 v2 就用；沒有但存在舊 v1 key 就遷移並寫回 v2。
 * 遷移不刪 v1（回滾用）。手改壞的 document 以預設值補齊各欄位，避免 undefined。
 */
function loadDocument(): LibraryDocument {
  const existing = readJson<Partial<LibraryDocument> | null>(LIBRARY_KEY, null)
  if (existing && existing.schemaVersion === 2) {
    return {
      schemaVersion: 2,
      works: existing.works ?? [],
      categories: existing.categories ?? [],
      exhibitions: existing.exhibitions ?? [],
      overrides: existing.overrides ?? {},
      hidden: existing.hidden ?? [],
    }
  }

  const migrated: LibraryDocument = {
    schemaVersion: 2,
    works: readJson<StoredWork[]>(WORKS_KEY_V1, []),
    categories: [],
    exhibitions: [],
    overrides: readJson<Record<string, Partial<Work>>>(OVERRIDE_KEY_V1, {}),
    hidden: readJson<string[]>(HIDDEN_KEY_V1, []),
  }
  writeJson(LIBRARY_KEY, migrated)
  return migrated
}

async function urlFor(key: string): Promise<string> {
  const cached = objectUrls.get(key)
  if (cached) return cached
  const blob = await getImage(key)
  if (!blob) return ''
  const url = URL.createObjectURL(blob)
  objectUrls.set(key, url)
  return url
}

function revoke(imageKey: string): void {
  for (const suffix of ['thumb', 'view']) {
    const key = `${imageKey}-${suffix}`
    const url = objectUrls.get(key)
    if (url) {
      URL.revokeObjectURL(url)
      objectUrls.delete(key)
    }
  }
}

/** 把 StoredWork 接回圖片 URL 成完整 Work */
async function hydrate(work: StoredWork): Promise<Work> {
  return {
    ...work,
    thumb: await urlFor(`${work.imageKey}-thumb`),
    src: await urlFor(`${work.imageKey}-view`),
  }
}

/** 開站時把持久層 document 讀進來、圖片接回作品資料 */
async function init(): Promise<void> {
  if (ready.value) return
  const doc = loadDocument()
  overrides.value = doc.overrides
  hidden.value = doc.hidden
  customCategories.value = doc.categories
  exhibitions.value = doc.exhibitions
  customWorks.value = await Promise.all(doc.works.map(hydrate))
  ready.value = true
}

/** 自訂作品排前面：剛上傳的東西要馬上看得到 */
const allWorks = computed<Work[]>(() => [
  ...customWorks.value,
  ...WORKS.filter((work) => !hidden.value.includes(work.id)).map((work) => ({
    ...work,
    ...overrides.value[work.id],
  })),
])

/** 內建 + 自訂分類的合併清單，供篩選列、表單、外觀層使用 */
const categories = computed<Category[]>(() => [
  ...CATEGORIES,
  ...customCategories.value.map(resolveCategory),
])

export type WorkDraft = Omit<Work, 'src' | 'thumb' | 'width' | 'height' | 'alt' | 'id'>

export function useLibrary() {
  /** 新增一件作品；圖片會被壓成縮圖與詳情用圖兩份 */
  async function addWork(draft: WorkDraft, file: File): Promise<string> {
    const processed = await processImage(file)
    const id = `custom-${Date.now().toString(36)}`
    const imageKey = id

    await Promise.all([
      putImage(`${imageKey}-thumb`, processed.thumb),
      putImage(`${imageKey}-view`, processed.view),
    ])

    customWorks.value = [
      {
        ...draft,
        id,
        imageKey,
        custom: true,
        aspect: draft.aspect || processed.aspect,
        width: processed.width,
        height: processed.height,
        alt: `${draft.title}——${draft.media.join('、')}`,
        thumb: await urlFor(`${imageKey}-thumb`),
        src: await urlFor(`${imageKey}-view`),
      },
      ...customWorks.value,
    ]
    persist()
    return id
  }

  /** 改文字欄位。內建作品不改原始資料，只疊一層覆寫，隨時可還原 */
  function updateWork(id: string, patch: Partial<Work>): void {
    const index = customWorks.value.findIndex((work) => work.id === id)
    if (index >= 0) {
      const next = [...customWorks.value]
      next[index] = { ...next[index], ...patch }
      customWorks.value = next
      persist()
      return
    }
    overrides.value = { ...overrides.value, [id]: { ...overrides.value[id], ...patch } }
    persist()
  }

  /** 換掉自訂作品的圖片 */
  async function replaceImage(id: string, file: File): Promise<void> {
    const work = customWorks.value.find((item) => item.id === id)
    if (!work?.imageKey) return

    const processed = await processImage(file)
    revoke(work.imageKey)
    await Promise.all([
      putImage(`${work.imageKey}-thumb`, processed.thumb),
      putImage(`${work.imageKey}-view`, processed.view),
    ])

    updateWork(id, {
      width: processed.width,
      height: processed.height,
      thumb: await urlFor(`${work.imageKey}-thumb`),
      src: await urlFor(`${work.imageKey}-view`),
    })
  }

  /** 自訂作品是真刪除；內建作品只是隱藏，可還原 */
  async function removeWork(id: string): Promise<void> {
    const work = customWorks.value.find((item) => item.id === id)
    if (work?.imageKey) {
      revoke(work.imageKey)
      await Promise.all([
        deleteImage(`${work.imageKey}-thumb`),
        deleteImage(`${work.imageKey}-view`),
      ])
      customWorks.value = customWorks.value.filter((item) => item.id !== id)
      persist()
      return
    }
    hidden.value = [...hidden.value, id]
    persist()
  }

  /** 還原所有對內建作品的改動（自訂作品與分類、展覽不受影響） */
  function restorePresets(): void {
    overrides.value = {}
    hidden.value = []
    persist()
  }

  /** 新增自訂分類 */
  function addCategory(category: StoredCategory): void {
    customCategories.value = [...customCategories.value, category]
    persist()
  }

  /** 更新自訂分類欄位 */
  function updateCategory(id: CategoryId, patch: Partial<StoredCategory>): void {
    customCategories.value = customCategories.value.map((category) =>
      category.id === id ? { ...category, ...patch } : category,
    )
    persist()
  }

  /**
   * 刪除自訂分類。有作品引用就擋下（MR-012 ④）——回傳 false 讓 UI 提示，
   * 而非讓作品變成孤兒。內建分類不可刪，這裡也只動 customCategories。
   */
  function removeCategory(id: CategoryId): boolean {
    if (allWorks.value.some((work) => work.category === id)) return false
    customCategories.value = customCategories.value.filter((category) => category.id !== id)
    persist()
    return true
  }

  function addExhibition(exhibition: Exhibition): void {
    exhibitions.value = [...exhibitions.value, exhibition]
    persist()
  }

  function updateExhibition(id: string, patch: Partial<Exhibition>): void {
    exhibitions.value = exhibitions.value.map((exhibition) =>
      exhibition.id === id ? { ...exhibition, ...patch } : exhibition,
    )
    persist()
  }

  function removeExhibition(id: string): void {
    exhibitions.value = exhibitions.value.filter((exhibition) => exhibition.id !== id)
    persist()
  }

  /** 匯出整份 document（含圖片 base64），這是把編輯結果帶離這台瀏覽器的唯一途徑 */
  async function exportJson(): Promise<string> {
    const works = await Promise.all(
      customWorks.value.map(async (work) => {
        const thumbBlob = await getImage(`${work.imageKey}-thumb`)
        const viewBlob = await getImage(`${work.imageKey}-view`)
        return {
          ...stripImageUrls(work),
          thumbData: thumbBlob ? await blobToDataUrl(thumbBlob) : '',
          viewData: viewBlob ? await blobToDataUrl(viewBlob) : '',
        }
      }),
    )
    return JSON.stringify(
      {
        schemaVersion: 2,
        works,
        categories: customCategories.value,
        exhibitions: exhibitions.value,
        overrides: overrides.value,
        hidden: hidden.value,
      },
      null,
      2,
    )
  }

  /** 匯入。同時吃 v1（`version:1`，無分類／展覽）與 v2（`schemaVersion:2`） */
  async function importJson(text: string): Promise<void> {
    const parsed = JSON.parse(text) as {
      version?: number
      schemaVersion?: number
      works?: (StoredWork & { thumbData: string; viewData: string })[]
      categories?: StoredCategory[]
      exhibitions?: Exhibition[]
      overrides?: Record<string, Partial<Work>>
      hidden?: string[]
    }

    for (const work of parsed.works ?? []) {
      const { thumbData, viewData, ...rest } = work
      if (thumbData) await putImage(`${work.imageKey}-thumb`, await dataUrlToBlob(thumbData))
      if (viewData) await putImage(`${work.imageKey}-view`, await dataUrlToBlob(viewData))
      customWorks.value = [
        {
          ...rest,
          thumb: await urlFor(`${work.imageKey}-thumb`),
          src: await urlFor(`${work.imageKey}-view`),
        },
        ...customWorks.value.filter((item) => item.id !== work.id),
      ]
    }

    if (parsed.categories) customCategories.value = parsed.categories
    if (parsed.exhibitions) exhibitions.value = parsed.exhibitions
    if (parsed.overrides) overrides.value = parsed.overrides
    if (parsed.hidden) hidden.value = parsed.hidden
    persist()
  }

  return {
    ready,
    allWorks,
    categories,
    customCategories,
    exhibitions,
    init,
    addWork,
    updateWork,
    replaceImage,
    removeWork,
    restorePresets,
    addCategory,
    updateCategory,
    removeCategory,
    addExhibition,
    updateExhibition,
    removeExhibition,
    exportJson,
    importJson,
  }
}
