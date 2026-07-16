![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

# Maze Portfolio - 迷宮履歷

一個以迷宮探索為主題的互動式履歷網站，結合琥珀單色終端機風格與像素 UI，打造獨特的遊戲化履歷體驗。

## 功能特色

- **可實際行走的地牢迷宮**：角色沿走廊逐格移動，房間連通關係由資料層的 `connections` 決定
- **迷霧探索**：已訪問全亮、鄰接房間只露出輪廓與問號、其餘全黑
- **自動尋路**：點選房間後角色以 BFS 走過去，手機與桌機共用同一套邏輯
- **雙軌制**：「總覽」可一鍵揭開全圖 —— 遊戲層是加分，不是擋住履歷的路障
- **琥珀單色終端機**：全站單一色相，六房間僅以色溫區分
- **響應式設計**：桌面方向鍵移動，手機點選尋路
- **打字機動畫**：開機動畫與文字逐字顯示效果

## 房間區塊

六個房間在琥珀單色下僅以「色溫」區分，模擬單色 CRT 只有一種磷光的物理限制。

| 房間 | 色溫 | 內容 |
|------|------|------|
| 起源之廳 | 最淡金 | 自傳、背景故事、價值觀 |
| 寶藏室 | 金黃 | 作品集、稀有度分類 |
| 成就牆 | 淺琥珀 | 證照、獎項、隱藏成就 |
| 終點塔 | 基準琥珀 | 聯絡資訊 |
| 技能樹 | 橘琥珀 | 技能等級、分類展示 |
| 試煉之路 | 深橘（最熱） | 工作經歷、關卡式呈現 |

## 技術棧

- **框架**: Vue 3 + TypeScript
- **建置工具**: Vite
- **UI 框架**: NES.css（`nes-core`，配色由 `nes-amber.css` 覆寫為琥珀）
- **樣式**: CSS Variables + CRT Effects
- **檢查**: ESLint 9 + typescript-eslint + eslint-plugin-vue

> 動畫全部以 CSS 實作，無動畫函式庫。

## 安裝與執行

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 建置生產版本
npm run build

# 預覽生產版本
npm run preview

# Lint 檢查（--max-warnings 0）
npm run lint
```

**Commit 前必做**：`npm run lint` + `npm run build` 皆須通過。

> ESLint 釘在 v9：ESLint 10 要求 Node ^20.19 以上，在 Node 18 會拋
> `util.styleText is not a function`。

## 操作方式

| 裝置 | 移動 | 進入房間 |
|------|------|---------|
| 桌機 | 方向鍵 / WASD 逐格 | 站上房間後按 Enter，或點選房間自動尋路 |
| 手機 | 點選房間自動尋路 | 尋路抵達後自動開啟 |

## 測試清單

- [ ] 開機動畫播畢後顯示迷宮，角色位於 START
- [ ] 起點只看得到起源之廳的暗輪廓與「?」，其餘房間全黑
- [ ] 方向鍵可沿走廊移動，撞牆時原地不動
- [ ] 走進房間後該房間轉為全亮並顯示圖示與名稱，探索進度 +1
- [ ] 站在房間上按 Enter 可開啟房間內容，Esc 返回
- [ ] 點選可見房間時角色自動尋路走過去並開啟
- [ ] 點選全黑（未探明）房間無反應
- [ ] 「總覽」可揭開全圖，再按可返回探索模式
- [ ] Console 無 `[maze]` 繞徑失敗警告

## 專案結構

```
src/
├── components/
│   ├── maze/           # 迷宮相關組件
│   ├── rooms/          # 房間內容組件
│   └── ui/             # 通用 UI 組件
├── composables/        # Vue 組合式函數
├── data/               # 履歷資料
├── styles/             # 樣式檔案
└── types/              # TypeScript 類型定義
```

## 自訂內容

編輯 `src/data/resumeData.ts` 檔案來替換為你自己的履歷內容：

```typescript
export const resumeData: ResumeData = {
  basic: {
    name: '你的名字',
    title: '你的職稱',
    tagline: '你的一句話介紹',
    avatar: ''
  },
  // ... 更多內容
}
```

## 版本歷史

### v1.1.0 (2026-07-17)
- **迷宮層重寫為地牢格子圖**（MR-002）
  - `connections` 成為迷宮拓撲的唯一真相，刪除 MazeMap 內硬編的 SVG 座標
  - 入口改為只連接起源之廳；先前硬連全部 6 房，迷宮退化成畫成地圖的選單
  - 新增 `useMaze.ts`：格子展開、L 形走廊繞徑、BFS 尋路
  - 角色有實際格子座標，方向鍵逐格移動；點選房間則自動尋路
  - 迷霧三層：已訪問全亮／鄰接輪廓／其餘全黑
  - 新增「總覽」可一鍵揭開全圖（MR-001 雙軌制）
- **琥珀單色終端機調色盤**（MR-005）
  - 全站單一色相，六房間僅以色溫區分
- **技術債清理**（MR-003）
  - 移除實際引用數為 0 的 `gsap`、`@vueuse/core`
  - nes.css 改為實際採用，import 來源改 `nes-core.min.css`（288K → 52K）
  - 導入 ESLint + `npm run lint`
  - 移除死型別 `PlayerPosition`、`ExplorationState`、`MazePath`
  - 移除 `RoomConfig.color`，主題色統一由 CSS 變數提供
  - dist CSS：308.64 kB → 82.79 kB（gzip 39.85 → 13.00 kB）

### v1.0.0 (2025-01-27)
- **初始版本**
  - 建立完整迷宮探索式履歷框架
  - 實作 6 個主題房間（起源、試煉、寶藏、技能、成就、終點）
  - 終端機風格 + CRT 效果
  - 多彩主題色系統
  - 響應式設計支援桌面與手機
  - 打字機動畫與開機效果

## 授權

MIT License
