# Maze Portfolio 規則

> 繼承根目錄共用規則（Claude Code 已自動載入，勿重複讀取 ../CLAUDE.md）

---

## 專案概述
迷宮探索式互動履歷網站，終端機 / CRT 視覺風格。
**技術棧**：Vue 3 + TypeScript + Vite
**架構**：單一 SPA。repo root 在 `maze-resume-preview/maze-portfolio/`（外層 `maze-resume-preview/` 僅為包裝資料夾，無檔案）

---

## Commit Scopes

| Scope | 說明 |
|-------|------|
| `maze` | 迷宮地圖、探索狀態（`components/maze/`, `composables/useExploration.ts`） |
| `rooms` | 六個房間內容組件（`components/rooms/`） |
| `ui` | 通用 UI 組件（`components/ui/`） |
| `data` | 履歷資料與房間配置（`data/resumeData.ts`） |
| `styles` | 樣式與 CRT 效果（`styles/`） |
| `types` | 型別定義（`types/`） |
| `docs` | 文件 |

---

## 開發指令

```bash
npm run dev        # 開發伺服器
npm run build      # vue-tsc -b && vite build（含型別檢查）
npm run preview    # 預覽 production build
```

**Commit 前必做**：`npm run build`（型別檢查含在內）

⚠️ **本專案尚無 `npm run lint`**。根 CLAUDE.md 要求 commit 前 lint 必須通過，但此專案缺 ESLint 設定 —— 補齊前，commit 前檢查以 `npm run build` 代替。待補，見 MR-003。

---

## 文件觸發詞

| 觸發詞 | 檢查 `docs/ARCHITECTURE.md` 的區塊 |
|--------|-----------------------------------|
| `maze`, `迷宮`, `地圖` | 迷宮層、資料流 |
| `room`, `房間` | 視圖組件 |
| `composable`, `狀態`, `探索` | 狀態管理層 |
| `type`, `interface`, `型別` | 資料結構 |
| `theme`, `主題色`, `CRT` | 樣式系統 |

⚠️ `docs/ARCHITECTURE.md` 目前與實作不符（宣稱技術棧含 GSAP / VueUse / NES.css 與「角色移動」，實際引用數皆為 0）。以程式碼為準，改動前先核對，見 MR-002 / MR-003。
