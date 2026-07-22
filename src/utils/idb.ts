/**
 * 極小的 IndexedDB 封裝，只用來存上傳的圖片 blob。
 *
 * 為什麼不用 localStorage：localStorage 上限約 5MB 且只能存字串，
 * 一張手機拍的作品照轉 base64 就吃掉大半。IndexedDB 可直接存 blob、額度大得多。
 * 只有這一個用途，不值得為它裝一個套件。
 */

const DB_NAME = 'artwall'
const DB_VERSION = 1
const STORE = 'images'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const request = action(transaction.objectStore(STORE))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
  )
}

export function putImage(key: string, blob: Blob): Promise<IDBValidKey> {
  return run('readwrite', (store) => store.put(blob, key))
}

export function getImage(key: string): Promise<Blob | undefined> {
  return run('readonly', (store) => store.get(key) as IDBRequest<Blob | undefined>)
}

export function deleteImage(key: string): Promise<undefined> {
  return run('readwrite', (store) => store.delete(key) as IDBRequest<undefined>)
}
