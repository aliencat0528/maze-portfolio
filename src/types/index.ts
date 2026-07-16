// 房間類型定義
export type RoomType = 'origin' | 'quest' | 'treasure' | 'skill' | 'achievement' | 'contact'

// 迷宮節點識別：入口不是房間，但同樣佔一個格子
export type NodeId = RoomType | 'entrance'

// 格子座標（非像素座標）
export interface Point {
  x: number
  y: number
}

// 房間配置。position 為邏輯格子座標，由 useMaze 展開為實際格子；
// connections 是迷宮拓撲的唯一真相（MR-002）。
//
// 刻意不含 color：主題色由 crt.css 的 --color-{id} 變數經 .theme-{id} 套用，
// 資料層再放一份 hex 會變成第二份真相（與 position 同類的問題）。
export interface RoomConfig {
  id: RoomType
  name: string
  englishName: string
  icon: string
  position: Point
  connections: RoomType[]
}

// 入口配置：入口只連接起源之廳，不再直連全部房間
export interface EntranceConfig {
  position: Point
  connections: RoomType[]
}

// 格子種類：房間方塊，或連接房間的走廊
export type CellKind = 'room' | 'corridor'

// 迷宮中的一個可走格子
export interface MazeCell {
  point: Point
  kind: CellKind
  nodeId?: NodeId
}

// 迷霧層級：已訪問全亮 / 鄰接暗輪廓 / 其餘全黑（MR-002）
export type FogLevel = 'visible' | 'dim' | 'hidden'

// 基本資料
export interface BasicInfo {
  name: string
  title: string
  tagline: string
  avatar: string
}

// 自傳區
export interface OriginData {
  background: string
  values: string[]
  turningPoints: {
    title: string
    description: string
    year: string
  }[]
}

// 工作經歷
export interface QuestData {
  company: string
  position: string
  period: string
  difficulty: number // 1-5
  objectives: string[]
  achievements: string[]
  skills: string[]
}

// 作品集
export interface TreasureData {
  name: string
  type: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  role: string
  technologies: string[]
  stats: {
    label: string
    value: number
  }[]
  link?: string
}

// 技能
export interface SkillData {
  category: 'magic' | 'equipment' | 'passive' | 'talent'
  categoryName: string
  skills: {
    name: string
    level: number // 1-5
    icon?: string
  }[]
}

// 成就
export interface AchievementData {
  type: 'badge' | 'trophy' | 'hidden'
  typeName: string
  name: string
  description: string
  year?: string
  unlocked: boolean
}

// 聯絡資訊
export interface ContactData {
  type: 'email' | 'linkedin' | 'github' | 'website'
  label: string
  value: string
  icon: string
}

// 完整履歷資料
export interface ResumeData {
  basic: BasicInfo
  origin: OriginData
  quests: QuestData[]
  treasures: TreasureData[]
  skills: SkillData[]
  achievements: AchievementData[]
  contacts: ContactData[]
}

// 裝置類型
export type DeviceType = 'desktop' | 'mobile'
