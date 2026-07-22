import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'

/**
 * 這裡測的是 wrapper 自己的邏輯：key 對應、覆寫語意、查無資料、刪除。
 *
 * payload 用 Uint8Array 而不是 Blob——fake-indexeddb 的 structured clone
 * 不認得 jsdom 的 Blob，存進去讀回來會變成空物件（實測）。那是模擬器的限制，
 * 不是 idb.ts 的問題。真正的 Blob 往返由 Playwright 在真實瀏覽器裡驗（e2e/editor.spec.ts）。
 */
type StoredPayload = Uint8Array
const payload = (text: string): StoredPayload => new TextEncoder().encode(text)
const decode = (value: unknown): string => new TextDecoder().decode(value as Uint8Array)

// idb.ts 在模組層快取 dbPromise，換掉全域 indexedDB 後那個快取仍指向舊的
// factory。每個測試都重新 import 才會拿到乾淨的連線。
async function freshIdb(): Promise<typeof import('@/utils/idb')> {
  globalThis.indexedDB = new IDBFactory()
  vi.resetModules()
  return import('@/utils/idb')
}

describe('idb', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory()
  })

  it('存進去的資料讀得回來，內容一致', async () => {
    const idb = await freshIdb()
    await idb.putImage('work-thumb', payload('hello') as unknown as Blob)

    expect(decode(await idb.getImage('work-thumb'))).toBe('hello')
  })

  it('同一個 key 再 put 是覆寫，不是新增', async () => {
    const idb = await freshIdb()
    await idb.putImage('same', payload('old') as unknown as Blob)
    await idb.putImage('same', payload('new') as unknown as Blob)

    expect(decode(await idb.getImage('same'))).toBe('new')
  })

  it('thumb 與 view 是兩筆獨立資料，不互相覆寫', async () => {
    const idb = await freshIdb()
    await idb.putImage('custom-1-thumb', payload('small') as unknown as Blob)
    await idb.putImage('custom-1-view', payload('large') as unknown as Blob)

    expect(decode(await idb.getImage('custom-1-thumb'))).toBe('small')
    expect(decode(await idb.getImage('custom-1-view'))).toBe('large')
  })

  it('沒存過的 key 回傳 undefined，不是丟例外', async () => {
    const idb = await freshIdb()
    await expect(idb.getImage('never-written')).resolves.toBeUndefined()
  })

  it('刪除後讀不到；重複刪除不報錯', async () => {
    const idb = await freshIdb()
    await idb.putImage('gone', payload('x') as unknown as Blob)
    await idb.deleteImage('gone')

    expect(await idb.getImage('gone')).toBeUndefined()
    await expect(idb.deleteImage('gone')).resolves.toBeUndefined()
  })
})
