// IndexedDB：jsdom 沒有實作，用 fake-indexeddb 補上（idb.ts 直接吃全域 indexedDB）
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, vi } from 'vitest'

/**
 * jsdom 沒有 URL.createObjectURL / revokeObjectURL。
 * useLibrary 用它把 IndexedDB 的 blob 接成 <img src>，缺了會整串炸掉。
 * 這裡給一個可預期的假實作，測試才能直接斷言 URL 內容。
 */
let objectUrlSeq = 0
const objectUrlStore = new Map<string, Blob>()

beforeEach(() => {
  objectUrlSeq = 0
  objectUrlStore.clear()
  window.localStorage.clear()

  URL.createObjectURL = vi.fn((blob: Blob) => {
    const url = `blob:mock/${++objectUrlSeq}`
    objectUrlStore.set(url, blob)
    return url
  })

  URL.revokeObjectURL = vi.fn((url: string) => {
    objectUrlStore.delete(url)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** 讓測試能檢查某個 object URL 是否已被回收 */
export function objectUrlAlive(url: string): boolean {
  return objectUrlStore.has(url)
}
