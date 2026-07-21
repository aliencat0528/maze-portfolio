/** 作品牆型別定義 */

export type CategoryId =
  | 'acrylic'
  | 'watercolor'
  | 'calligraphy'
  | 'sculpture'
  | 'animation'
  | 'newmedia'

/** 篩選列用：`all` 只存在於 UI 狀態，不會出現在 Work 上 */
export type FilterId = CategoryId | 'all'

/** 版位比例。卡片一律以此鎖定尺寸，避免圖片撐破版面 */
export type AspectId = 'square' | 'landscape' | 'portrait' | 'video'

/** 分類主題：只影響「殼」——強調色、動效曲線、卡片邊緣、背景紋理 */
export interface CategoryTheme {
  /** 強調色。僅用於線條、標籤、focus ring，不鋪大面積 */
  accent: string
  /** 強調色的低彩度版本，用於底線與 hover 底色 */
  accentSoft: string
  /** 背景紋理（SVG data URI）。一律灰階、不透明度 ≤ 3%，避免偏移作品白平衡 */
  texture: string
  /** 該分類的動效個性 */
  easing: string
  /** 卡片圓角 */
  radius: string
  /** 卡片外框寬度 */
  border: string
}

export interface Category {
  id: CategoryId
  /** 顯示名稱 */
  label: string
  /** 等寬字代號，用於幾何感標籤 */
  code: string
  theme: CategoryTheme
}

export interface WorkLink {
  label: string
  url: string
}

export interface Work {
  id: string
  title: string
  category: CategoryId
  /** 媒材標籤，如「壓克力顏料」「麻布」 */
  media: string[]
  /** 年份或日期字串 */
  year: string
  aspect: AspectId
  description: string
  /** 角色／我的貢獻 */
  role: string
  links: WorkLink[]
  /** 詳情頁用的較大圖 */
  src: string
  /** 牆面縮圖。與 src 分離，牆面永遠不載原圖 */
  thumb: string
  alt: string
  /** 原始像素尺寸，供 img width/height 防 CLS */
  width: number
  height: number
}

/** 裝置寬度模式：寬螢幕走水平長廊，窄螢幕降級為垂直網格 */
export type Viewport = 'wide' | 'narrow'
