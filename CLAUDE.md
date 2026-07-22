# Art Wall 規則

> 繼承根目錄共用規則（Claude Code 已自動載入，勿重複讀取 ../CLAUDE.md）

---

## 專案概述
任意創作者的線上作品牆，數位幾何感外殼＋中性襯托作品。
**技術棧**：Vue 3 + TypeScript + Vite
**架構**：單一 SPA，無後端。repo root 在根目錄下的 `art-wall/`，與其餘子專案同層
**部署**：GitHub Pages（來源＝Actions），merge 進 `main` 自動發佈至 <https://aliencat0528.github.io/art-wall/>

> 名稱沿革：v1 為「迷宮履歷」，MR-008 轉為作品牆，MR-010 更名 repo，D-004／MR-011 扁平化本機路徑。
> 舊路徑 `maze-resume-preview/maze-portfolio/` 已不存在。
>
> `vite.config.ts` 的 `base` 必須等於 `/<repo 名稱>/`，改 repo 名稱時要一起改，否則資產全數 404。

---

## Commit Scopes

| Scope | 說明 |
|-------|------|
| `wall` | 作品牆與卡片、開場序列（`components/WorkRail`, `WorkCard`, `IntroSequence`） |
| `detail` | 作品詳情頁（`components/WorkDetail.vue`） |
| `editor` | 編輯面板與表單（`components/EditorPanel`, `WorkForm`） |
| `data` | 作品、分類主題、背景主題（`data/`） |
| `store` | 持久層與資料合併（`composables/useLibrary`, `useSettings`, `utils/idb`） |
| `styles` | 全站 token 與基礎樣式（`styles/`） |
| `types` | 型別定義（`types/`） |
| `deploy` | 建置與部署設定（`vite.config.ts` 的 `base`、`.github/workflows/`） |
| `docs` | 文件 |

---

## 開發指令

```bash
npm run dev        # 開發伺服器
npm run build      # vue-tsc -b && vite build（含型別檢查）
npm run preview    # 預覽 production build
npm run lint       # ESLint（--max-warnings 0）
npm run test       # 單元測試（Vitest，composables / utils）
npm run coverage   # 單元測試 + 覆蓋率
npm run test:e2e   # E2E（Playwright，自動 build + preview；首次需 npx playwright install chromium）
```

**Commit 前必做**：`npm run lint` + `npm run test` + `npm run build` 皆須通過。
測試分層與範圍見 `docs/TESTING.md`。

> **Node 18 版本鎖（升 Node 20 前都不要動）**：本機 Node 為 v18。
> - ESLint 釘 v9——v10 要 Node ^20.19，實測拋 `util.styleText is not a function`（MR-003）
> - Vitest 釘 `~3.2`、用 jsdom 不用 happy-dom、Playwright 設定與 E2E 用 `.js` 不用 `.ts`（MR-013）

---

## 文件觸發詞

| 觸發詞 | 檢查 `docs/ARCHITECTURE.md` 的區塊 |
|--------|-----------------------------------|
| `wall`, `作品牆`, `長廊`, `版位` | 版面尺寸的唯一真相 |
| `card`, `detail`, `詳情` | 視圖層、模組職責 |
| `composable`, `狀態`, `篩選` | 狀態層、資料流 |
| `upload`, `上傳`, `儲存`, `IndexedDB` | 持久層、資料流（寫入） |
| `theme`, `主題`, `accent`, `背景` | 兩層主題系統 |
| `type`, `interface`, `型別` | 模組職責 |

| 觸發詞 | 檢查其他文件 |
|--------|-------------|
| `deploy`, `部署`, `base`, `Pages`, `workflow` | `docs/DEPLOYMENT.md` |
| `test`, `測試`, `vitest`, `playwright`, `e2e`, `coverage` | `docs/TESTING.md` |
