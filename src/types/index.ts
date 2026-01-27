// 房間類型定義
export type RoomType = 'origin' | 'quest' | 'treasure' | 'skill' | 'achievement' | 'contact'

// 房間配置
export interface RoomConfig {
  id: RoomType
  name: string
  englishName: string
  icon: string
  color: string
  position: { x: number; y: number }
  connections: RoomType[]
}

// 迷宮路徑
export interface MazePath {
  from: RoomType
  to: RoomType
  explored: boolean
}

// 角色位置
export interface PlayerPosition {
  x: number
  y: number
  currentRoom: RoomType | 'entrance'
}

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

// 探索狀態
export interface ExplorationState {
  visitedRooms: RoomType[]
  exploredPaths: MazePath[]
  currentRoom: RoomType | 'entrance'
  totalRooms: number
}

// 裝置類型
export type DeviceType = 'desktop' | 'mobile'
