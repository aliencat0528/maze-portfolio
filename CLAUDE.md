# Art Wall 規則

> 繼承根目錄共用規則（Claude Code 已自動載入，勿重複讀取 ../CLAUDE.md）

---

## 專案概述
任意創作者的線上作品牆，數位幾何感外殼＋中性襯托作品。
**技術棧**：Vue 3 + TypeScript + Vite
**架構**：單一 SPA，無後端。repo root 在 `maze-resume-preview/maze-portfolio/`（外層 `maze-resume-preview/` 僅為包裝資料夾，無檔案）
**部署**：GitHub Pages（來源＝Actions），merge 進 `main` 自動發佈至 <https://aliencat0528.github.io/art-wall/>

> repo 已更名為 `art-wall`（MR-010），但**本機資料夾仍是 `maze-resume-preview/maze-portfolio/`**，
> 那是 v1 迷宮履歷的殘留。資料夾扁平化牽動根 `prepare.md` 索引，待主線決定。
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
```

**Commit 前必做**：`npm run lint` + `npm run build` 皆須通過。

> ESLint 釘在 v9：本機 Node 為 v18，ESLint 10 要求 Node ^20.19 以上，實測會拋
> `util.styleText is not a function`。升 Node 之前不要升 ESLint（見 MR-003）。

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
