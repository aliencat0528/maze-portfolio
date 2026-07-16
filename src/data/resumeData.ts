import type { EntranceConfig, ResumeData, RoomConfig } from '@/types'

// 迷宮入口。
// 刻意只連接起源之廳：先前 MazeMap 把入口硬連到全部 6 個房間，繞過了 connections，
// 迷宮因此退化成一張畫成地圖的選單。入口單一出口才有「從頭走起」的敘事（MR-002）。
export const entranceConfig: EntranceConfig = {
  position: { x: 0, y: 0 },
  connections: ['origin']
}

// 房間配置。position 為邏輯座標，connections 決定走廊 —— 兩者是迷宮的唯一真相。
export const roomConfigs: RoomConfig[] = [
  {
    id: 'origin',
    name: '起源之廳',
    englishName: 'HALL OF ORIGIN',
    icon: '📜',
    position: { x: 1, y: 0 },
    connections: ['skill', 'quest']
  },
  {
    id: 'quest',
    name: '試煉之路',
    englishName: 'PATH OF TRIALS',
    icon: '⚔️',
    position: { x: 2, y: 0 },
    connections: ['origin', 'treasure', 'achievement']
  },
  {
    id: 'treasure',
    name: '寶藏室',
    englishName: 'TREASURE VAULT',
    icon: '💎',
    position: { x: 3, y: 0 },
    connections: ['quest', 'achievement']
  },
  {
    id: 'skill',
    name: '技能樹',
    englishName: 'SKILL TREE',
    icon: '🛠️',
    position: { x: 0, y: 1 },
    connections: ['origin', 'achievement']
  },
  {
    id: 'achievement',
    name: '成就牆',
    englishName: 'WALL OF GLORY',
    icon: '🏆',
    position: { x: 2, y: 1 },
    connections: ['quest', 'treasure', 'skill', 'contact']
  },
  {
    id: 'contact',
    name: '終點塔',
    englishName: 'TOWER OF CONNECTION',
    icon: '📬',
    position: { x: 2, y: 2 },
    connections: ['achievement']
  }
]

// 範例履歷資料（使用者可自行修改）
export const resumeData: ResumeData = {
  basic: {
    name: '冒險者',
    title: '前端法師',
    tagline: '用程式碼編織魔法，讓介面栩栩如生',
    avatar: ''
  },

  origin: {
    background: '出生於數位世界的邊境，自幼對程式碼的奧秘充滿好奇。在無數個深夜與 bug 戰鬥中成長，逐漸領悟了前端開發的真諦。',
    values: [
      '使用者體驗至上',
      '程式碼即藝術',
      '持續學習，永不止步'
    ],
    turningPoints: [
      {
        title: '踏入程式之門',
        description: '第一次用 HTML 寫出 "Hello World"，開啟了通往數位世界的大門',
        year: '2018'
      },
      {
        title: '框架的覺醒',
        description: '學會 Vue.js 後，發現了前端開發的無限可能',
        year: '2020'
      }
    ]
  },

  quests: [
    {
      company: '魔法科技株式會社',
      position: '前端工程師',
      period: '2022.01 - 至今',
      difficulty: 4,
      objectives: [
        '開發並維護電商平台前端系統',
        '優化網站效能與使用者體驗',
        '帶領 3 人小組進行新功能開發'
      ],
      achievements: [
        '將頁面載入速度提升 40%',
        '實現 95% 以上的使用者滿意度',
        '成功上線 10+ 個重要功能模組'
      ],
      skills: ['Vue.js', 'TypeScript', 'Sass']
    },
    {
      company: '新創冒險公會',
      position: '全端開發實習生',
      period: '2021.06 - 2021.12',
      difficulty: 3,
      objectives: [
        '協助開發公司內部管理系統',
        '學習前後端技術整合'
      ],
      achievements: [
        '獨立完成 5 個內部工具',
        '獲得優秀實習生評價'
      ],
      skills: ['React', 'Node.js', 'MongoDB']
    }
  ],

  treasures: [
    {
      name: '魔法電商平台',
      type: '電子商務',
      rarity: 'legendary',
      role: '主要開發者',
      technologies: ['Vue 3', 'TypeScript', 'Pinia', 'Element Plus'],
      stats: [
        { label: '效能提升', value: 40 },
        { label: '使用者滿意度', value: 95 },
        { label: '程式碼覆蓋率', value: 85 }
      ],
      link: 'https://example.com/project1'
    },
    {
      name: '冒險者管理系統',
      type: '企業應用',
      rarity: 'epic',
      role: '全端開發',
      technologies: ['React', 'Node.js', 'PostgreSQL'],
      stats: [
        { label: '自動化程度', value: 80 },
        { label: '錯誤減少', value: 60 }
      ],
      link: 'https://example.com/project2'
    },
    {
      name: '像素藝術產生器',
      type: '創意工具',
      rarity: 'rare',
      role: '獨立開發',
      technologies: ['Canvas API', 'JavaScript'],
      stats: [
        { label: '下載次數', value: 1000 }
      ]
    }
  ],

  skills: [
    {
      category: 'magic',
      categoryName: '魔法系技能（程式語言）',
      skills: [
        { name: 'JavaScript', level: 5 },
        { name: 'TypeScript', level: 4 },
        { name: 'HTML/CSS', level: 5 },
        { name: 'Python', level: 3 }
      ]
    },
    {
      category: 'equipment',
      categoryName: '裝備欄（框架/工具）',
      skills: [
        { name: 'Vue.js', level: 5 },
        { name: 'React', level: 4 },
        { name: 'Node.js', level: 3 },
        { name: 'Git', level: 4 }
      ]
    },
    {
      category: 'passive',
      categoryName: '被動技能（軟實力）',
      skills: [
        { name: '團隊協作', level: 4 },
        { name: '問題解決', level: 5 },
        { name: '溝通表達', level: 4 }
      ]
    },
    {
      category: 'talent',
      categoryName: '種族天賦（語言能力）',
      skills: [
        { name: '中文', level: 5 },
        { name: '英文', level: 4 },
        { name: '日文', level: 2 }
      ]
    }
  ],

  achievements: [
    {
      type: 'badge',
      typeName: '勳章',
      name: 'AWS 雲端從業人員認證',
      description: '取得 Amazon Web Services 官方認證',
      year: '2023',
      unlocked: true
    },
    {
      type: 'trophy',
      typeName: '戰利品',
      name: '黑客松優勝',
      description: '在 24 小時內打造創新應用並獲得評審青睞',
      year: '2022',
      unlocked: true
    },
    {
      type: 'hidden',
      typeName: '隱藏成就',
      name: '千日不輟',
      description: '連續 1000 天在 GitHub 上提交程式碼',
      unlocked: false
    }
  ],

  contacts: [
    {
      type: 'email',
      label: '傳送訊息',
      value: 'adventurer@example.com',
      icon: '📧'
    },
    {
      type: 'linkedin',
      label: '公會連結',
      value: 'https://linkedin.com/in/example',
      icon: '💼'
    },
    {
      type: 'github',
      label: '技能書庫',
      value: 'https://github.com/example',
      icon: '📚'
    },
    {
      type: 'website',
      label: '傳送門',
      value: 'https://example.com',
      icon: '🌐'
    }
  ]
}
