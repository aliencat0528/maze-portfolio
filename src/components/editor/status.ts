import type { InjectionKey } from 'vue'

/**
 * 編輯面板的狀態列契約。殼（EditorPanel）持有 status/busy 並顯示在頁尾，
 * 各分頁透過 inject 取得 `say`（顯示訊息）與 `runBusy`（包 busy 與錯誤處理），
 * 不必各自重造 try/finally。
 */
export interface EditorStatus {
  /** 顯示一則短訊息，4 秒後自動清掉 */
  say: (message: string) => void
  /** 執行非同步工作，期間顯示「處理中」，失敗自動回報訊息 */
  runBusy: (task: () => Promise<void>) => Promise<void>
}

export const EDITOR_STATUS: InjectionKey<EditorStatus> = Symbol('editor-status')
