import type { Category, CategoryId, CategoryTheme } from '@/types'

/**
 * 分類主題表。
 *
 * 設計約束（見 prepare.md MR-008）：切換分類只換「殼的口音」——強調色、動效曲線、
 * 卡片邊緣、背景紋理。版面與主要背景永遠中性白盒，作品顏色不被外殼吃掉。
 * 紋理一律灰階（不帶色相，否則會偏移作品的白平衡）、不透明度上限 3%。
 */

/** 把一小塊 SVG 磚做成可重複鋪底的 data URI */
function tile(size: number, marks: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${marks}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const TEXTURES: Record<CategoryId, string> = {
  // 麻布織紋
  acrylic: tile(
    12,
    '<path d="M0 6h12M6 0v12" stroke="#000" stroke-opacity="0.03" stroke-width="1.5" />',
  ),
  // 紙纖維顆粒
  watercolor: tile(
    28,
    '<circle cx="6" cy="8" r="1.6" fill="#000" fill-opacity="0.025" /><circle cx="20" cy="18" r="2.2" fill="#000" fill-opacity="0.02" /><circle cx="13" cy="24" r="1.2" fill="#000" fill-opacity="0.03" />',
  ),
  // 宣紙直式格線
  calligraphy: tile(
    40,
    '<path d="M0 0v40" stroke="#000" stroke-opacity="0.03" stroke-width="1" /><path d="M20 0v40" stroke="#000" stroke-opacity="0.015" stroke-width="1" />',
  ),
  // 石材細點
  sculpture: tile(
    10,
    '<circle cx="2" cy="2" r="1" fill="#000" fill-opacity="0.028" /><circle cx="7" cy="6" r="0.8" fill="#000" fill-opacity="0.02" />',
  ),
  // 分鏡方格
  animation: tile(
    24,
    '<rect x="0.5" y="0.5" width="23" height="23" fill="none" stroke="#000" stroke-opacity="0.028" stroke-width="1" />',
  ),
  // 數位網格＋對角掃線
  newmedia: tile(
    16,
    '<path d="M0 0h16M0 0v16" stroke="#000" stroke-opacity="0.03" stroke-width="1" /><path d="M0 16L16 0" stroke="#000" stroke-opacity="0.015" stroke-width="1" />',
  ),
}

function theme(
  id: CategoryId,
  accent: string,
  accentDark: string,
  easing: string,
  radius: string,
  border: string,
): CategoryTheme {
  return { accent, accentDark, texture: TEXTURES[id], easing, radius, border }
}

export const CATEGORIES: Category[] = [
  {
    id: 'acrylic',
    label: '壓克力畫',
    code: 'ACR',
    // 厚塗：較重的外框、幾乎不圓角、帶一點回彈
    theme: theme('acrylic', '#c2410c', '#ff8a4c', 'cubic-bezier(0.34, 1.16, 0.64, 1)', '2px', '2px'),
  },
  {
    id: 'watercolor',
    label: '水彩畫',
    code: 'WTC',
    // 柔邊：大圓角、細框、慢柔曲線
    theme: theme('watercolor', '#2563a8', '#6ea8e8', 'cubic-bezier(0.33, 1, 0.68, 1)', '14px', '1px'),
  },
  {
    id: 'calligraphy',
    label: '書法',
    code: 'CAL',
    // 提按：直角、墨色、起收筆的快慢對比
    theme: theme('calligraphy', '#3d3a35', '#d8d2c6', 'cubic-bezier(0.65, 0, 0.35, 1)', '0px', '1px'),
  },
  {
    id: 'sculpture',
    label: '立體作品',
    code: 'SCP',
    // 量體：小圓角、厚框、沉穩的減速
    theme: theme('sculpture', '#6b6355', '#c4b8a2', 'cubic-bezier(0.22, 1, 0.36, 1)', '4px', '2px'),
  },
  {
    id: 'animation',
    label: '動畫',
    code: 'ANM',
    // 現代感：無圓角、細框、快進慢出
    theme: theme('animation', '#7c3aed', '#b18aff', 'cubic-bezier(0.16, 1, 0.3, 1)', '0px', '1px'),
  },
  {
    id: 'newmedia',
    label: '新媒體',
    code: 'NEW',
    // 數位：硬切曲線、極細框
    theme: theme('newmedia', '#0d8a80', '#3fd6c8', 'cubic-bezier(0.83, 0, 0.17, 1)', '0px', '1px'),
  },
]

/** 「全部」不是分類，是篩選狀態，故用中性主題且無紋理 */
export const ALL_THEME: CategoryTheme = {
  accent: '#1c1c1a',
  accentDark: '#f0efec',
  texture: 'none',
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  radius: '2px',
  border: '1px',
}

export const CATEGORY_MAP: Record<CategoryId, Category> = CATEGORIES.reduce(
  (map, category) => {
    map[category.id] = category
    return map
  },
  {} as Record<CategoryId, Category>,
)
