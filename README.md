![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

# Maze Portfolio - 迷宮履歷

一個以迷宮探索為主題的互動式履歷網站，結合終端機風格、CRT 螢幕效果與像素字體，打造獨特的遊戲化履歷體驗。

## 特色

- **迷宮探索體驗**：俯視地圖 + 房間導航的混合模式
- **終端機風格介面**：CRT 掃描線、螢光文字效果
- **多彩主題色系**：每個房間擁有專屬識別色
- **響應式設計**：支援桌面與手機瀏覽
- **打字機動畫**：開機動畫與文字逐字顯示效果

## 房間區塊

| 房間 | 主題色 | 內容 |
|------|--------|------|
| 起源之廳 | 翠綠 | 自傳、背景故事、價值觀 |
| 試煉之路 | 赤紅 | 工作經歷、關卡式呈現 |
| 寶藏室 | 金黃 | 作品集、稀有度分類 |
| 技能樹 | 寶藍 | 技能等級、分類展示 |
| 成就牆 | 紫羅蘭 | 證照、獎項、隱藏成就 |
| 終點塔 | 琥珀橙 | 聯絡資訊 |

## 技術棧

- **框架**: Vue 3 + TypeScript
- **建置工具**: Vite
- **UI 框架**: NES.css
- **動畫**: GSAP
- **樣式**: CSS Variables + CRT Effects

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
```

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
