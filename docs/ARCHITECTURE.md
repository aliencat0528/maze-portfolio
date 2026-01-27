# 系統架構文件

## 架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                          App.vue                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     狀態管理層                             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │  │
│  │  │useExploration│  │  useDevice  │  │useTypewriter│       │  │
│  │  │  探索狀態    │  │  裝置偵測   │  │  打字效果   │       │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     視圖切換層                             │  │
│  │                                                           │  │
│  │   ┌─────────────┐         ┌─────────────────────────┐    │  │
│  │   │  MazeMap    │  ←───→  │     RoomContainer       │    │  │
│  │   │  迷宮地圖    │         │  ┌─────────────────┐   │    │  │
│  │   └─────────────┘         │  │   房間內容組件   │   │    │  │
│  │                           │  │  OriginRoom     │   │    │  │
│  │                           │  │  QuestRoom      │   │    │  │
│  │                           │  │  TreasureRoom   │   │    │  │
│  │                           │  │  SkillRoom      │   │    │  │
│  │                           │  │  AchievementRoom│   │    │  │
│  │                           │  │  ContactRoom    │   │    │  │
│  │                           │  └─────────────────┘   │    │  │
│  │                           └─────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      資料層                                │  │
│  │  ┌─────────────┐  ┌─────────────┐                        │  │
│  │  │ resumeData  │  │ roomConfigs │                        │  │
│  │  │  履歷內容    │  │  房間配置   │                        │  │
│  │  └─────────────┘  └─────────────┘                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 專案結構

```
src/
├── components/
│   ├── maze/
│   │   └── MazeMap.vue          # 迷宮地圖組件
│   ├── rooms/
│   │   ├── OriginRoom.vue       # 起源之廳（自傳）
│   │   ├── QuestRoom.vue        # 試煉之路（工作經歷）
│   │   ├── TreasureRoom.vue     # 寶藏室（作品集）
│   │   ├── SkillRoom.vue        # 技能樹
│   │   ├── AchievementRoom.vue  # 成就牆
│   │   └── ContactRoom.vue      # 終點塔（聯絡）
│   └── ui/
│       └── RoomContainer.vue    # 房間容器組件
├── composables/
│   ├── useExploration.ts        # 探索狀態管理
│   ├── useDevice.ts             # 裝置偵測
│   └── useTypewriter.ts         # 打字機效果
├── data/
│   └── resumeData.ts            # 履歷資料 & 房間配置
├── styles/
│   ├── main.css                 # 主樣式
│   └── crt.css                  # CRT 效果樣式
├── types/
│   └── index.ts                 # TypeScript 類型定義
├── App.vue                      # 根組件
└── main.ts                      # 入口文件
```

## 核心模組說明

### 1. 狀態管理 (Composables)

#### useExploration
負責管理迷宮探索狀態：
- `currentRoom`: 當前所在房間
- `visitedRooms`: 已訪問房間列表
- `exploredPaths`: 已探索路徑
- `enterRoom()`: 進入房間
- `exitRoom()`: 返回迷宮

#### useDevice
負責裝置偵測：
- `deviceType`: 桌面/手機
- `isMobile`: 是否為手機
- `screenWidth/Height`: 螢幕尺寸

#### useTypewriter
打字機效果：
- `typeText()`: 逐字顯示文字
- `displayText`: 當前顯示文字
- `isTyping`: 是否正在打字

### 2. 視圖組件

#### MazeMap
迷宮地圖組件，使用 SVG 繪製：
- 房間節點
- 路徑連線
- 探索狀態視覺化
- 點擊互動

#### RoomContainer
房間容器組件，提供：
- 統一的房間佈局
- 載入動畫
- 返回按鈕
- 主題色套用

### 3. 資料結構

#### RoomConfig
```typescript
interface RoomConfig {
  id: RoomType
  name: string
  englishName: string
  icon: string
  color: string
  position: { x: number; y: number }
  connections: RoomType[]
}
```

#### ResumeData
```typescript
interface ResumeData {
  basic: BasicInfo
  origin: OriginData
  quests: QuestData[]
  treasures: TreasureData[]
  skills: SkillData[]
  achievements: AchievementData[]
  contacts: ContactData[]
}
```

## 技術棧

| 類別 | 技術 | 用途 |
|------|------|------|
| 框架 | Vue 3 | 響應式 UI 框架 |
| 語言 | TypeScript | 型別安全 |
| 建置 | Vite | 快速開發與建置 |
| UI | NES.css | 像素風格元件 |
| 動畫 | GSAP | 複雜動畫控制 |
| 工具 | VueUse | Vue 組合式工具庫 |

## 資料流

```
用戶點擊房間
     ↓
MazeMap 發出 select-room 事件
     ↓
App.vue 呼叫 enterRoom()
     ↓
useExploration 更新狀態
     ↓
視圖切換到 RoomContainer + 對應房間組件
     ↓
房間組件讀取 resumeData 渲染內容
```

## 樣式系統

### CSS 變數
```css
:root {
  --color-origin: #14fdce;     /* 起源之廳 */
  --color-quest: #ff6b6b;      /* 試煉之路 */
  --color-treasure: #ffd93d;   /* 寶藏室 */
  --color-skill: #6bcfff;      /* 技能樹 */
  --color-achievement: #c77dff; /* 成就牆 */
  --color-contact: #ffb000;    /* 終點塔 */
  --color-bg: #0a0a0a;
  --color-text: #e0e0e0;
}
```

### 主題類別
每個房間透過 `theme-{roomId}` 類別套用主題色：
```css
.theme-origin { --room-color: var(--color-origin); }
.theme-quest { --room-color: var(--color-quest); }
/* ... */
```

## 響應式設計

| 斷點 | 裝置 | 調整 |
|------|------|------|
| >= 768px | 桌面 | 完整迷宮地圖、角色移動 |
| < 768px | 手機 | 簡化地圖、點擊選擇 |
