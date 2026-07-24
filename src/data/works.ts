import type { AspectId, CategoryId, Work, WorkLink } from '@/types'
import { categoryOf } from '@/data/categories'
import { ASPECT_SIZE, createPlaceholder } from '@/utils/placeholder'

/**
 * 作品資料。目前全為幾何佔位圖（見 `utils/placeholder.ts`）。
 *
 * 換上真圖時只要改兩件事：
 *   1. `src` 指向原圖，`thumb` 指向長邊 800px 的壓縮版（牆面不載原圖）
 *   2. `width` / `height` 填原圖實際像素，避免 CLS
 * `aspect` 決定它在牆上佔哪種版位，與圖片實際比例不符時會以 object-fit: cover 裁切。
 */

interface WorkSeed {
  id: string
  title: string
  category: CategoryId
  media: string[]
  year: string
  aspect: AspectId
  description: string
  role: string
  links?: WorkLink[]
}

function toWork(seed: WorkSeed): Work {
  const { accent } = categoryOf(seed.category).theme
  const image = createPlaceholder(seed.id, seed.aspect, accent)
  const { width, height } = ASPECT_SIZE[seed.aspect]

  return {
    ...seed,
    links: seed.links ?? [],
    src: image,
    thumb: image,
    width,
    height,
    alt: `${seed.title}——${categoryOf(seed.category).label}，${seed.media.join('、')}`,
  }
}

const SEEDS: WorkSeed[] = [
  {
    id: 'acr-001',
    title: '午後的重量',
    category: 'acrylic',
    media: ['壓克力顏料', '亞麻布'],
    year: '2025',
    aspect: 'portrait',
    description:
      '以刮刀堆疊七層顏料，讓下層的冷色從裂縫透出。想處理的是「厚度本身能不能成為光」這個問題。',
    role: '創作、裝裱',
  },
  {
    id: 'acr-002',
    title: '街區切片',
    category: 'acrylic',
    media: ['壓克力顏料', '木板'],
    year: '2024',
    aspect: 'landscape',
    description: '同一條街早中晚三個時段的色溫並置，刻意保留筆觸邊界不做過渡。',
    role: '創作',
  },
  {
    id: 'wtc-001',
    title: '雨後三十分鐘',
    category: 'watercolor',
    media: ['透明水彩', '棉紙'],
    year: '2025',
    aspect: 'landscape',
    description: '趁紙面半乾時落筆，讓水痕自己決定邊界。全幅只用了三個顏色。',
    role: '創作',
  },
  {
    id: 'wtc-002',
    title: '窗台植物誌',
    category: 'watercolor',
    media: ['透明水彩', '代針筆'],
    year: '2024',
    aspect: 'square',
    description: '連續三十天記錄同一盆植物，這是第十九天。線稿刻意壓在色層之下。',
    role: '創作',
    links: [{ label: '完整系列', url: 'https://example.com/plant-diary' }],
  },
  {
    id: 'wtc-003',
    title: '海線',
    category: 'watercolor',
    media: ['透明水彩', '粗紋水彩紙'],
    year: '2023',
    aspect: 'portrait',
    description: '直幅構圖把水平線推到很低的位置，讓天空的漸層有足夠距離展開。',
    role: '創作',
  },
  {
    id: 'cal-001',
    title: '行草．千字文節錄',
    category: 'calligraphy',
    media: ['墨', '生宣'],
    year: '2025',
    aspect: 'portrait',
    description: '一氣呵成不修改的版本。第三行的枯筆是紙張吸墨速度造成的意外，予以保留。',
    role: '書寫、鈐印',
  },
  {
    id: 'cal-002',
    title: '橫幅．靜',
    category: 'calligraphy',
    media: ['墨', '灑金宣'],
    year: '2024',
    aspect: 'landscape',
    description: '單字放到極大，測試留白比例到什麼程度會開始壓迫字本身。',
    role: '書寫',
  },
  {
    id: 'scp-001',
    title: '摺疊的容器',
    category: 'sculpture',
    media: ['陶土', '化妝土'],
    year: '2025',
    aspect: 'square',
    description: '手捏成形後刻意在半乾狀態壓塌一側，讓變形成為造型的一部分。',
    role: '成形、燒製',
  },
  {
    id: 'scp-002',
    title: '支點',
    category: 'sculpture',
    media: ['檜木', '黃銅'],
    year: '2024',
    aspect: 'portrait',
    description: '整件作品只靠一個銅製支點站立，重心偏移約 4 度，看起來隨時會倒但不會。',
    role: '設計、製作',
  },
  {
    id: 'anm-001',
    title: '通勤 90 秒',
    category: 'animation',
    media: ['2D 逐格', 'After Effects'],
    year: '2025',
    aspect: 'video',
    description: '一鏡到底的橫向卷軸動畫，背景循環但前景元素永不重複。',
    role: '分鏡、動態、後期',
    links: [{ label: '線上觀看', url: 'https://example.com/commute-90' }],
  },
  {
    id: 'anm-002',
    title: '形變練習',
    category: 'animation',
    media: ['2D 逐格'],
    year: '2024',
    aspect: 'square',
    description: '12 秒循環，處理質量感在極端擠壓與伸展下還能不能被辨識。',
    role: '動態',
  },
  {
    id: 'anm-003',
    title: '片頭：無聲的城市',
    category: 'animation',
    media: ['2D 逐格', 'Blender'],
    year: '2023',
    aspect: 'video',
    description: '為獨立紀錄片製作的片頭，2D 手繪角色與 3D 場景合成。',
    role: '動態設計、合成',
  },
  {
    id: 'new-001',
    title: '呼吸的網格',
    category: 'newmedia',
    media: ['即時運算', 'WebGL', '麥克風輸入'],
    year: '2025',
    aspect: 'video',
    description: '網格密度由環境音量驅動，觀眾越安靜畫面越緻密。展場實測平均停留 4 分鐘。',
    role: '概念、程式、現場調校',
    links: [{ label: '互動版本', url: 'https://example.com/breathing-grid' }],
  },
  {
    id: 'new-002',
    title: '延遲的鏡子',
    category: 'newmedia',
    media: ['即時影像', '感測器'],
    year: '2024',
    aspect: 'landscape',
    description: '把觀眾的影像延遲 1.5 秒回放，多數人會在第三次揮手時發現不對。',
    role: '概念、程式、裝置',
  },
]

export const WORKS: Work[] = SEEDS.map(toWork)

/** 作者資訊。真資料到位前先放佔位文字 */
export const PROFILE = {
  name: '創作者姓名',
  statement: '在紙、布、陶土與程式之間工作。關心材料被使用時留下的痕跡。',
  email: 'hello@example.com',
}
