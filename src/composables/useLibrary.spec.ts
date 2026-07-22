import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
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

const CUSTOM_KEY = 'artwall.works.v1'
const OVERRIDE_KEY = 'artwall.overrides.v1'
const HIDDEN_KEY = 'artwall.hidden.v1'

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

const fakeFile = () => new File(['binary'], 'photo.jpg', { type: 'image/jpeg' })

async function freshLibrary() {
  globalThis.indexedDB = new IDBFactory()
  vi.resetModules()
  const { useLibrary } = await import('@/composables/useLibrary')
  return useLibrary()
}

function readStored<T>(key: string): T {
  return JSON.parse(window.localStorage.getItem(key) ?? 'null') as T
}

describe('useLibrary', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory()
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

    it('存進 localStorage 的資料不含 blob URL——那是每次開站重新產生的', async () => {
      const lib = await freshLibrary()
      await lib.addWork(draft, fakeFile())

      const stored = readStored<Record<string, unknown>[]>(CUSTOM_KEY)
      expect(stored).toHaveLength(1)
      expect(stored[0]).not.toHaveProperty('src')
      expect(stored[0]).not.toHaveProperty('thumb')
      expect(stored[0].imageKey).toBe(stored[0].id)
    })
  })

  describe('編輯內建作品', () => {
    it('只疊一層覆寫，不動原始資料', async () => {
      const lib = await freshLibrary()
      lib.updateWork('acr-001', { title: '改過的標題' })

      const { WORKS } = await import('@/data/works')
      expect(WORKS.find((w) => w.id === 'acr-001')?.title).not.toBe('改過的標題')
      expect(lib.allWorks.value.find((w) => w.id === 'acr-001')?.title).toBe('改過的標題')
      expect(readStored<Record<string, unknown>>(OVERRIDE_KEY)['acr-001']).toEqual({
        title: '改過的標題',
      })
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
      expect(readStored<Record<string, unknown>>(OVERRIDE_KEY) ?? {}).not.toHaveProperty(id)
      expect(readStored<Record<string, unknown>[]>(CUSTOM_KEY)[0].title).toBe('改名')
    })
  })

  describe('刪除', () => {
    it('內建作品只是隱藏，可以還原', async () => {
      const lib = await freshLibrary()
      const before = lib.allWorks.value.length
      await lib.removeWork('acr-001')

      expect(lib.allWorks.value.find((w) => w.id === 'acr-001')).toBeUndefined()
      expect(lib.allWorks.value).toHaveLength(before - 1)
      expect(readStored<string[]>(HIDDEN_KEY)).toContain('acr-001')

      lib.restorePresets()
      expect(lib.allWorks.value.find((w) => w.id === 'acr-001')).toBeDefined()
    })

    it('自訂作品是真刪除，restorePresets 不會把它救回來', async () => {
      const lib = await freshLibrary()
      const id = await lib.addWork(draft, fakeFile())
      await lib.removeWork(id)

      expect(lib.allWorks.value.find((w) => w.id === id)).toBeUndefined()
      expect(readStored<unknown[]>(CUSTOM_KEY)).toHaveLength(0)

      lib.restorePresets()
      expect(lib.allWorks.value.find((w) => w.id === id)).toBeUndefined()
    })

    it('restorePresets 清掉覆寫與隱藏，但不碰自訂作品', async () => {
      const lib = await freshLibrary()
      const id = await lib.addWork(draft, fakeFile())
      lib.updateWork('acr-001', { title: '改過' })
      await lib.removeWork('acr-002')

      lib.restorePresets()

      expect(readStored<Record<string, unknown>>(OVERRIDE_KEY)).toEqual({})
      expect(readStored<string[]>(HIDDEN_KEY)).toEqual([])
      expect(lib.allWorks.value.find((w) => w.id === id)).toBeDefined()
    })
  })

  describe('匯出／匯入', () => {
    it('匯出內容含版本、自訂作品、覆寫與隱藏清單', async () => {
      const lib = await freshLibrary()
      await lib.addWork(draft, fakeFile())
      lib.updateWork('acr-001', { title: '改過' })
      await lib.removeWork('acr-002')

      const parsed = JSON.parse(await lib.exportJson())
      expect(parsed.version).toBe(1)
      expect(parsed.works).toHaveLength(1)
      expect(parsed.works[0]).not.toHaveProperty('src')
      expect(parsed.overrides['acr-001']).toEqual({ title: '改過' })
      expect(parsed.hidden).toContain('acr-002')
    })

    it('匯入到另一台瀏覽器後，覆寫與隱藏都還原得回來', async () => {
      const source = await freshLibrary()
      await source.addWork(draft, fakeFile())
      source.updateWork('acr-001', { title: '改過' })
      await source.removeWork('acr-002')
      const payload = await source.exportJson()

      const target = await freshLibrary()
      window.localStorage.clear()
      await target.importJson(payload)

      expect(target.allWorks.value[0].title).toBe('無題習作')
      expect(target.allWorks.value.find((w) => w.id === 'acr-001')?.title).toBe('改過')
      expect(target.allWorks.value.find((w) => w.id === 'acr-002')).toBeUndefined()
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
  })
})
