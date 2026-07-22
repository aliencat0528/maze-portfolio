import { computed, ref } from 'vue'
import type { Work } from '@/types'
import { WORKS } from '@/data/works'
import { deleteImage, getImage, putImage } from '@/utils/idb'
import { blobToDataUrl, dataUrlToBlob, processImage } from '@/utils/image'

/**
 * 作品資料層：內建範例 + 使用者在瀏覽器內的編輯結果。
 *
 * 資料放哪（MR-009）：圖片走 IndexedDB，文字與設定走 localStorage，**沒有後端**。
 * 因此編輯只存在這台瀏覽器——要讓訪客看到，必須用「匯出 JSON」把資料帶走、
 * 放進 repo 的 `data/works.ts` 或之後接上的後端。介面上會把這件事講明白。
 */

const CUSTOM_KEY = 'artwall.works.v1'
const OVERRIDE_KEY = 'artwall.overrides.v1'
const HIDDEN_KEY = 'artwall.hidden.v1'

/** 存進 localStorage 的自訂作品：不含 blob URL，那是每次開站重新產生的 */
type StoredWork = Omit<Work, 'src' | 'thumb'> & { imageKey: string }

const customWorks = ref<Work[]>([])
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

function persistCustom(): void {
  writeJson(CUSTOM_KEY, customWorks.value.map(stripImageUrls))
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

/** 開站時把 IndexedDB 的圖片接回作品資料 */
async function init(): Promise<void> {
  if (ready.value) return
  overrides.value = readJson(OVERRIDE_KEY, {})
  hidden.value = readJson(HIDDEN_KEY, [])

  const stored = readJson<StoredWork[]>(CUSTOM_KEY, [])
  customWorks.value = await Promise.all(
    stored.map(async (work) => ({
      ...work,
      thumb: await urlFor(`${work.imageKey}-thumb`),
      src: await urlFor(`${work.imageKey}-view`),
    })),
  )
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
    persistCustom()
    return id
  }

  /** 改文字欄位。內建作品不改原始資料，只疊一層覆寫，隨時可還原 */
  function updateWork(id: string, patch: Partial<Work>): void {
    const index = customWorks.value.findIndex((work) => work.id === id)
    if (index >= 0) {
      const next = [...customWorks.value]
      next[index] = { ...next[index], ...patch }
      customWorks.value = next
      persistCustom()
      return
    }
    overrides.value = { ...overrides.value, [id]: { ...overrides.value[id], ...patch } }
    writeJson(OVERRIDE_KEY, overrides.value)
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
      persistCustom()
      return
    }
    hidden.value = [...hidden.value, id]
    writeJson(HIDDEN_KEY, hidden.value)
  }

  /** 還原所有對內建作品的改動（自訂作品不受影響） */
  function restorePresets(): void {
    overrides.value = {}
    hidden.value = []
    writeJson(OVERRIDE_KEY, {})
    writeJson(HIDDEN_KEY, [])
  }

  /** 匯出整份資料（含圖片 base64），這是把編輯結果帶離這台瀏覽器的唯一途徑 */
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
    return JSON.stringify({ version: 1, works, overrides: overrides.value, hidden: hidden.value }, null, 2)
  }

  async function importJson(text: string): Promise<void> {
    const parsed = JSON.parse(text) as {
      works?: (StoredWork & { thumbData: string; viewData: string })[]
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

    if (parsed.overrides) overrides.value = parsed.overrides
    if (parsed.hidden) hidden.value = parsed.hidden
    persistCustom()
    writeJson(OVERRIDE_KEY, overrides.value)
    writeJson(HIDDEN_KEY, hidden.value)
  }

  return {
    ready,
    allWorks,
    init,
    addWork,
    updateWork,
    replaceImage,
    removeWork,
    restorePresets,
    exportJson,
    importJson,
  }
}
