import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import type { LibraryDocument, StoredCategory } from '@/types'
import type { WorkDraft } from '@/composables/useLibrary'

/**
 * useLibrary 的狀態是模組層 singleton（開站只有一份資料），
 * 所以每個測試都要 resetModules 重新載入，否則會吃到上一個測試的殘留。
 *
 * processImage 走 canvas，jsdom 沒有實作，這裡整個 mock 掉——
 * 本檔測的是「資料怎麼合併與持久化」，不是圖片壓縮。
 */
vi.mock('@/utils/image', () => ({
  processImage: vi.fn(async () => ({
    thumb: new Blob(['thumb']),
    view: new Blob(['view']),
    width: 1200,
    height: 800,
    aspect: 'landscape' as const,
  })),
  blobToDataUrl: vi.fn(async () => 'data:image/jpeg;base64,AAAA'),
  dataUrlToBlob: vi.fn(async () => new Blob(['restored'])),
}))

const LIBRARY_KEY = 'artwall.library.v2'
const WORKS_KEY_V1 = 'artwall.works.v1'
const OVERRIDE_KEY_V1 = 'artwall.overrides.v1'
const HIDDEN_KEY_V1 = 'artwall.hidden.v1'

const draft: WorkDraft = {
  title: '無題習作',
  category: 'acrylic',
  media: ['壓克力顏料', '麻布'],
  year: '2026',
  aspect: 'square',
  description: '測試用作品',
  role: '創作',
  links: [],
}

const customCategory: StoredCategory = {
  id: 'mixed',
  label: '複合媒材',
  code: 'MIX',
  accent: '#3d3a35',
  texturePresetId: 'linen',
  custom: true,
}

const fakeFile = () => new File(['binary'], 'photo.jpg', { type: 'image/jpeg' })

async function freshLibrary() {
  globalThis.indexedDB = new IDBFactory()
  vi.resetModules()
  const { useLibrary } = await import('@/composables/useLibrary')
  return useLibrary()
}

/** 持久層現在是單一 document，測試一律讀它 */
function readDoc(): LibraryDocument {
  return JSON.parse(window.localStorage.getItem(LIBRARY_KEY) ?? 'null') as LibraryDocument
}

describe('useLibrary', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory()
    window.localStorage.clear()
  })

  describe('新增作品', () => {
    it('新作品排在內建作品前面——剛上傳要馬上看得到', async () => {
      const lib = await freshLibrary()
      const id = await lib.addWork(draft, fakeFile())

      expect(lib.allWorks.value[0].id).toBe(id)
      expect(id).toMatch(/^custom-/)
      expect(lib.allWorks.value[0].custom).toBe(true)
    })

    it('alt 由標題與媒材組出來，不留空', async () => {
      const lib = await freshLibrary()
      await lib.addWork(draft, fakeFile())

      expect(lib.allWorks.value[0].alt).toBe('無題習作——壓克力顏料、麻布')
    })

    it('尺寸與版位取自處理後的圖，draft 沒指定 aspect 時用偵測值', async () => {
      const lib = await freshLibrary()
      await lib.addWork({ ...draft, aspect: '' as never }, fakeFile())

      const added = lib.allWorks.value[0]
      expect(added.width).toBe(1200)
      expect(added.height).toBe(800)
      expect(added.aspect).toBe('landscape')
    })

    it('draft 指定的 aspect 優先於偵測值', async () => {
      const lib = await freshLibrary()
      await lib.addWork(draft, fakeFile())

      expect(lib.allWorks.value[0].aspect).toBe('square')
    })

    it('存進 document 的資料不含 blob URL——那是每次開站重新產生的', async () => {
      const lib = await freshLibrary()
      await lib.addWork(draft, fakeFile())

      const doc = readDoc()
      expect(doc.schemaVersion).toBe(2)
      expect(doc.works).toHaveLength(1)
      expect(doc.works[0]).not.toHaveProperty('src')
      expect(doc.works[0]).not.toHaveProperty('thumb')
      expect(doc.works[0].imageKey).toBe(doc.works[0].id)
    })
  })

  describe('編輯內建作品', () => {
    it('只疊一層覆寫，不動原始資料', async () => {
      const lib = await freshLibrary()
      lib.updateWork('acr-001', { title: '改過的標題' })

      const { WORKS } = await import('@/data/works')
      expect(WORKS.find((w) => w.id === 'acr-001')?.title).not.toBe('改過的標題')
      expect(lib.allWorks.value.find((w) => w.id === 'acr-001')?.title).toBe('改過的標題')
      expect(readDoc().overrides['acr-001']).toEqual({ title: '改過的標題' })
    })

    it('同一件作品連續改兩個欄位會累積，不是互相覆蓋', async () => {
      const lib = await freshLibrary()
      lib.updateWork('acr-001', { title: 'A' })
      lib.updateWork('acr-001', { year: '2099' })

      const work = lib.allWorks.value.find((w) => w.id === 'acr-001')
      expect(work?.title).toBe('A')
      expect(work?.year).toBe('2099')
    })

    it('改自訂作品是直接改資料，不寫進 overrides', async () => {
      const lib = await freshLibrary()
      const id = await lib.addWork(draft, fakeFile())
      lib.updateWork(id, { title: '改名' })

      expect(lib.allWorks.value[0].title).toBe('改名')
      expect(readDoc().overrides).not.toHaveProperty(id)
      expect(readDoc().works[0].title).toBe('改名')
    })
  })

  describe('刪除', () => {
    it('內建作品只是隱藏，可以還原', async () => {
      const lib = await freshLibrary()
      const before = lib.allWorks.value.length
      await lib.removeWork('acr-001')

      expect(lib.allWorks.value.find((w) => w.id === 'acr-001')).toBeUndefined()
      expect(lib.allWorks.value).toHaveLength(before - 1)
      expect(readDoc().hidden).toContain('acr-001')

      lib.restorePresets()
      expect(lib.allWorks.value.find((w) => w.id === 'acr-001')).toBeDefined()
    })

    it('自訂作品是真刪除，restorePresets 不會把它救回來', async () => {
      const lib = await freshLibrary()
      const id = await lib.addWork(draft, fakeFile())
      await lib.removeWork(id)

      expect(lib.allWorks.value.find((w) => w.id === id)).toBeUndefined()
      expect(readDoc().works).toHaveLength(0)

      lib.restorePresets()
      expect(lib.allWorks.value.find((w) => w.id === id)).toBeUndefined()
    })

    it('restorePresets 清掉覆寫與隱藏，但不碰自訂作品', async () => {
      const lib = await freshLibrary()
      const id = await lib.addWork(draft, fakeFile())
      lib.updateWork('acr-001', { title: '改過' })
      await lib.removeWork('acr-002')

      lib.restorePresets()

      expect(readDoc().overrides).toEqual({})
      expect(readDoc().hidden).toEqual([])
      expect(lib.allWorks.value.find((w) => w.id === id)).toBeDefined()
    })
  })

  describe('v1 → v2 遷移', () => {
    it('舊三個 key 會被組成 v2 document，資料保真', async () => {
      window.localStorage.setItem(
        WORKS_KEY_V1,
        JSON.stringify([{ id: 'custom-old', imageKey: 'custom-old', title: '舊作品', category: 'acrylic', media: [], year: '2024', aspect: 'square', description: '', role: '', links: [], width: 10, height: 10, alt: '', custom: true }]),
      )
      window.localStorage.setItem(OVERRIDE_KEY_V1, JSON.stringify({ 'acr-001': { title: '舊改名' } }))
      window.localStorage.setItem(HIDDEN_KEY_V1, JSON.stringify(['acr-002']))

      const lib = await freshLibrary()
      await lib.init()

      const doc = readDoc()
      expect(doc.schemaVersion).toBe(2)
      expect(doc.works).toHaveLength(1)
      expect(doc.works[0].title).toBe('舊作品')
      expect(doc.overrides['acr-001']).toEqual({ title: '舊改名' })
      expect(doc.hidden).toContain('acr-002')
      // 新結構補齊、不是 undefined
      expect(doc.categories).toEqual([])
      expect(doc.exhibitions).toEqual([])
    })

    it('遷移後保留舊 key，留一條回滾的路', async () => {
      window.localStorage.setItem(HIDDEN_KEY_V1, JSON.stringify(['acr-002']))

      const lib = await freshLibrary()
      await lib.init()

      expect(window.localStorage.getItem(HIDDEN_KEY_V1)).not.toBeNull()
    })

    it('已有 v2 document 時不再讀舊 key——舊值不會蓋掉新值', async () => {
      window.localStorage.setItem(
        LIBRARY_KEY,
        JSON.stringify({ schemaVersion: 2, works: [], categories: [], exhibitions: [], overrides: { 'acr-001': { title: 'v2 的值' } }, hidden: [] }),
      )
      window.localStorage.setItem(OVERRIDE_KEY_V1, JSON.stringify({ 'acr-001': { title: 'v1 的舊值' } }))

      const lib = await freshLibrary()
      await lib.init()

      expect(lib.allWorks.value.find((w) => w.id === 'acr-001')?.title).toBe('v2 的值')
    })

    it('document 缺欄位（手改壞）以預設值補齊，不讓 undefined 擴散', async () => {
      window.localStorage.setItem(LIBRARY_KEY, JSON.stringify({ schemaVersion: 2 }))

      const lib = await freshLibrary()
      await lib.init()

      expect(lib.allWorks.value.length).toBeGreaterThan(0)
      expect(lib.categories.value.length).toBeGreaterThan(0)
      expect(lib.exhibitions.value).toEqual([])
    })
  })

  describe('自訂分類', () => {
    it('合併清單＝內建 + 自訂，accentDark 由 accent 自動推導', async () => {
      const lib = await freshLibrary()
      lib.addCategory(customCategory)

      const resolved = lib.categories.value.find((c) => c.id === 'mixed')
      expect(resolved?.label).toBe('複合媒材')
      expect(resolved?.custom).toBe(true)
      // 墨色系被提亮，不會與原色相同（否則暗底看不見）
      expect(resolved?.theme.accentDark).not.toBe(customCategory.accent)
      expect(resolved?.theme.easing).toBe(lib.categories.value[0].theme.easing)
    })

    it('有作品引用時擋下刪除，不製造孤兒作品', async () => {
      const lib = await freshLibrary()
      lib.addCategory(customCategory)
      await lib.addWork({ ...draft, category: 'mixed' }, fakeFile())

      expect(lib.removeCategory('mixed')).toBe(false)
      expect(lib.categories.value.some((c) => c.id === 'mixed')).toBe(true)
    })

    it('沒有作品引用就刪得掉', async () => {
      const lib = await freshLibrary()
      lib.addCategory(customCategory)

      expect(lib.removeCategory('mixed')).toBe(true)
      expect(lib.categories.value.some((c) => c.id === 'mixed')).toBe(false)
      expect(readDoc().categories).toHaveLength(0)
    })
  })

  describe('匯出／匯入', () => {
    it('匯出即 v2 document，含分類與展覽', async () => {
      const lib = await freshLibrary()
      await lib.addWork(draft, fakeFile())
      lib.addCategory(customCategory)
      lib.updateWork('acr-001', { title: '改過' })
      await lib.removeWork('acr-002')

      const parsed = JSON.parse(await lib.exportJson())
      expect(parsed.schemaVersion).toBe(2)
      expect(parsed.works).toHaveLength(1)
      expect(parsed.works[0]).not.toHaveProperty('src')
      expect(parsed.categories).toHaveLength(1)
      expect(parsed.exhibitions).toEqual([])
      expect(parsed.overrides['acr-001']).toEqual({ title: '改過' })
      expect(parsed.hidden).toContain('acr-002')
    })

    it('匯入到另一台瀏覽器後，覆寫、隱藏與自訂分類都還原得回來', async () => {
      const source = await freshLibrary()
      await source.addWork(draft, fakeFile())
      source.addCategory(customCategory)
      source.updateWork('acr-001', { title: '改過' })
      await source.removeWork('acr-002')
      const payload = await source.exportJson()

      const target = await freshLibrary()
      window.localStorage.clear()
      await target.importJson(payload)

      expect(target.allWorks.value[0].title).toBe('無題習作')
      expect(target.allWorks.value.find((w) => w.id === 'acr-001')?.title).toBe('改過')
      expect(target.allWorks.value.find((w) => w.id === 'acr-002')).toBeUndefined()
      expect(target.categories.value.some((c) => c.id === 'mixed')).toBe(true)
    })

    it('重複匯入同一份資料不會產生重複作品', async () => {
      const source = await freshLibrary()
      await source.addWork(draft, fakeFile())
      const payload = await source.exportJson()

      const target = await freshLibrary()
      window.localStorage.clear()
      await target.importJson(payload)
      await target.importJson(payload)

      const customCount = target.allWorks.value.filter((w) => w.custom).length
      expect(customCount).toBe(1)
    })

    it('吃得下舊的 v1 匯出檔（無分類／展覽欄位）', async () => {
      const lib = await freshLibrary()
      const v1Payload = JSON.stringify({
        version: 1,
        works: [{ id: 'custom-v1', imageKey: 'custom-v1', title: 'v1 作品', category: 'acrylic', media: [], year: '2024', aspect: 'square', description: '', role: '', links: [], width: 10, height: 10, alt: '', custom: true, thumbData: '', viewData: '' }],
        overrides: { 'acr-001': { title: 'v1 覆寫' } },
        hidden: ['acr-002'],
      })

      await lib.importJson(v1Payload)

      expect(lib.allWorks.value.find((w) => w.id === 'custom-v1')?.title).toBe('v1 作品')
      expect(lib.allWorks.value.find((w) => w.id === 'acr-001')?.title).toBe('v1 覆寫')
      expect(readDoc().schemaVersion).toBe(2)
    })

    it('匯入帶進未定義的孤兒分類時不炸，以中性 fallback 呈現', async () => {
      const lib = await freshLibrary()
      const payload = JSON.stringify({
        schemaVersion: 2,
        works: [{ id: 'ghost-work', imageKey: 'ghost-work', title: '孤兒', category: 'ghost', media: [], year: '2026', aspect: 'square', description: '', role: '', links: [], width: 10, height: 10, alt: '', custom: true, thumbData: '', viewData: '' }],
        categories: [],
        exhibitions: [],
        overrides: {},
        hidden: [],
      })

      await lib.importJson(payload)
      const { categoryOf } = await import('@/data/categories')

      expect(lib.allWorks.value.find((w) => w.id === 'ghost-work')?.category).toBe('ghost')
      expect(() => categoryOf('ghost', lib.categories.value)).not.toThrow()
      expect(categoryOf('ghost', lib.categories.value).theme.texture).toBe('none')
    })
  })
})
