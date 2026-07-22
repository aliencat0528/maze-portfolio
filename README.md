給任意創作者用的線上作品牆：資料驅動、可切分類、可在瀏覽器內編輯與上傳。

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

# Art Wall - 作品牆

## 功能特色

- **開場序列** — 3.4 秒幾何動畫後進站。Skip 常駐、只播一次，系統設定為減少動態時不播
- **水平長廊** — 寬螢幕以固定軌道高度橫向展開，作品上中下交叉懸掛；窄螢幕自動降級為網格
- **版位鎖定** — 正方 1:1／橫幅 3:2／直幅 2:3／影片 16:9 四種版位，比例由 CSS 鎖死，圖片不會撐破版面
- **分類切換** — 壓克力、水彩、書法、立體、動畫、新媒體。切換時換的是強調色、動效曲線、卡片邊緣與背景紋理，版面與主背景維持中性，不吃作品顏色
- **整體背景** — 白盒／暖紙／清水模／暗展廳，與分類主題正交
- **作品詳情** — 中圖、媒材標籤、敘述、角色與貢獻、外部連結、年份。Esc 關閉、左右鍵換件、焦點鎖定
- **瀏覽器內編輯** — 改站台資訊、上傳作品、編修敘述、隱藏內建作品、匯出匯入 JSON
- **可分享網址** — `?c=<分類>` 與 `?w=<作品>` 皆為深連結，開詳情走 pushState，上一頁＝關閉

## 快速開始

```bash
npm install
npm run dev
# 預期：VITE v5 ready，開 http://localhost:5173/
```

想重看開場動畫：`http://localhost:5173/?intro=1`

## 使用方式

### 換上自己的作品

編輯 `src/data/works.ts`，把 `SEEDS` 換成你的作品。目前圖片是程式產生的幾何佔位圖
（`src/utils/placeholder.ts`），換真圖時每件作品需要：

```typescript
{
  id: 'acr-001',
  title: '午後的重量',
  category: 'acrylic',        // 見 src/data/categories.ts
  media: ['壓克力顏料', '亞麻布'],
  year: '2025',
  aspect: 'portrait',         // square | landscape | portrait | video
  description: '⋯⋯',
  role: '創作、裝裱',
  links: [{ label: '完整系列', url: 'https://example.com' }],
}
```

換真圖時把 `src` 指向原圖、`thumb` 指向長邊 800px 的壓縮版（牆面永遠不載原圖），
並填上 `width` / `height` 實際像素以避免版面跳動。

### 在瀏覽器內編輯

頁尾「編輯內容」可改站台資訊、上傳作品、編修欄位。上傳的圖會自動壓成牆面縮圖（800px）
與詳情用圖（1800px），並依實際比例帶入版位。

> **限制**：編輯只存在該瀏覽器（localStorage 與 IndexedDB），**沒有後端**。
> 訪客看到的仍是 `src/data/works.ts` 的內容。要讓改動成為正式版本，
> 請用面板的「匯出 JSON」把資料帶進開發流程。

## 專案結構

```
src/
├── components/         # 站頭、長廊、卡片、詳情、開場、編輯面板
├── composables/        # 作品資料層、篩選與網址同步、外觀套用、媒體查詢
├── data/               # 作品、分類主題、背景主題
├── styles/             # 全站 token 與基礎樣式
├── types/              # 型別定義
└── utils/              # 佔位圖產生、圖片壓縮、IndexedDB
```

模組職責、資料流與兩層主題系統見 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。

## 測試

```bash
npm run lint    # ESLint --max-warnings 0
npm run build   # vue-tsc 型別檢查 + vite build
```

**Commit 前必做**：兩者皆須通過。

> ESLint 釘在 v9：ESLint 10 要求 Node ^20.19 以上，在 Node 18 會拋
> `util.styleText is not a function`。

## 技術棧

- **框架**：Vue 3 + TypeScript
- **建置**：Vite
- **樣式**：CSS Variables，無 UI 框架、無動畫函式庫
- **儲存**：localStorage（文字與設定）+ IndexedDB（圖片 blob）
- **檢查**：ESLint 9 + typescript-eslint + eslint-plugin-vue

## 版本歷史

### v2.0.0 (2026-07-21)

- **重構為作品牆** — 迷宮履歷全數移除，改為資料驅動的作品牆＋詳情頁（MR-008，← D-003）
- **分類切換取代顏色切換** — 六分類各有強調色、動效曲線、卡片邊緣與紋理；強調色貫穿站頭、卡片外框、進度條與頁尾
- **整體背景切換** — 四種背景，暗色底改用各分類的 `accentDark`
- **瀏覽器內編輯與上傳** — IndexedDB 存圖、localStorage 存文字，可匯出匯入 JSON（MR-009）
- **移除** — `nes.css` 依賴、CRT 樣式、六房間與迷宮邏輯

### v1.1.0 (2026-07-17)

- 迷宮層重寫為地牢格子圖、琥珀單色終端機調色盤、技術債清理（MR-002／MR-005／MR-003）

### v1.0.0 (2025-01-27)

- 初始版本：迷宮探索式履歷框架、六個主題房間、終端機風格與 CRT 效果

## 授權

MIT License
