<script setup lang="ts">
import { computed } from 'vue'
import { roomConfigs } from '@/data/resumeData'
import { useExploration } from '@/composables/useExploration'
import { useDevice } from '@/composables/useDevice'
import { cellKey, walkableNeighbors } from '@/composables/useMaze'
import type { MazeCell, NodeId, Point } from '@/types'

const {
  maze,
  playerCell,
  isMoving,
  showOverview,
  standingOn,
  explorationProgress,
  nodeFog,
  cellFog,
  goToNode,
  toggleOverview
} = useExploration()

const { isMobile } = useDevice()

/** 一格的邊長（SVG 單位），走廊格與房間格同寬 */
const CELL = 48
const PADDING = 20

const viewBox = computed(
  () => `0 0 ${maze.width * CELL + PADDING * 2} ${maze.height * CELL + PADDING * 2}`
)

/** 格子座標 → 該格中心的 SVG 座標 */
const centerOf = (point: Point) => ({
  x: PADDING + point.x * CELL + CELL / 2,
  y: PADDING + point.y * CELL + CELL / 2
})

const corridors = computed(() =>
  [...maze.cells.values()].filter(cell => cell.kind === 'corridor')
)

/**
 * 走廊臂：從格子中心往每個可走的鄰居方向畫半格。
 * 相鄰兩格各畫自己的一半，接起來剛好是完整通道 —— 直線、轉角、T 字、
 * 十字路口都由這一條規則涵蓋，不需要判斷走廊形狀。
 */
const armsOf = (cell: MazeCell) => {
  const center = centerOf(cell.point)
  return walkableNeighbors(cell.point, maze.cells).map(neighbor => {
    const target = centerOf(neighbor)
    return {
      key: `${cellKey(cell.point)}->${cellKey(neighbor)}`,
      x1: center.x,
      y1: center.y,
      x2: (center.x + target.x) / 2,
      y2: (center.y + target.y) / 2
    }
  })
}

const roomNodes = computed(() =>
  roomConfigs.map(room => ({
    ...room,
    center: centerOf(maze.nodeCell.get(room.id) as Point),
    fog: nodeFog(room.id)
  }))
)

const entranceNode = computed(() => ({
  center: centerOf(maze.nodeCell.get('entrance') as Point),
  fog: nodeFog('entrance')
}))

const playerPos = computed(() => centerOf(playerCell.value))

/** 站在房間上但尚未進入時，提示可以按 Enter */
const canEnterHere = computed(() => Boolean(standingOn.value && standingOn.value !== 'entrance'))

const handleNodeClick = (nodeId: NodeId) => {
  goToNode(nodeId)
}
</script>

<template>
  <div
    class="maze-map"
    :class="{ 'maze-map--mobile': isMobile }"
  >
    <svg
      :viewBox="viewBox"
      class="maze-svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- 走廊 -->
      <g class="corridors">
        <template
          v-for="cell in corridors"
          :key="cellKey(cell.point)"
        >
          <line
            v-for="arm in armsOf(cell)"
            :key="arm.key"
            :x1="arm.x1"
            :y1="arm.y1"
            :x2="arm.x2"
            :y2="arm.y2"
            :class="['corridor', `fog-${cellFog(cell)}`]"
          />
        </template>
      </g>

      <!-- 入口 -->
      <g
        v-if="entranceNode.fog !== 'hidden'"
        class="entrance-node"
        :transform="`translate(${entranceNode.center.x}, ${entranceNode.center.y})`"
      >
        <rect
          class="entrance-box"
          x="-16"
          y="-16"
          width="32"
          height="32"
        />
        <!-- 標籤放在框外下方：角色圓點會停在入口正中央，放框內會被蓋住 -->
        <text
          class="entrance-label"
          y="27"
          text-anchor="middle"
        >
          START
        </text>
      </g>

      <!-- 房間 -->
      <g
        v-for="room in roomNodes"
        v-show="room.fog !== 'hidden'"
        :key="room.id"
        class="room-node"
        :class="[`theme-${room.id}`, `fog-${room.fog}`, { current: standingOn === room.id }]"
        :transform="`translate(${room.center.x}, ${room.center.y})`"
        @click="handleNodeClick(room.id)"
      >
        <rect
          class="room-box"
          x="-21"
          y="-21"
          width="42"
          height="42"
          rx="2"
        />

        <!-- 已探明的房間才露出圖示與名稱；只是「鄰接可見」的房間僅有輪廓與問號 -->
        <template v-if="room.fog === 'visible'">
          <text
            class="room-icon"
            y="-2"
            text-anchor="middle"
          >
            {{ room.icon }}
          </text>
          <text
            class="room-name"
            y="15"
            text-anchor="middle"
          >
            {{ room.name }}
          </text>
        </template>
        <text
          v-else
          class="room-unknown"
          y="5"
          text-anchor="middle"
        >
          ?
        </text>
      </g>

      <!-- 角色 -->
      <g
        class="player"
        :class="{ moving: isMoving }"
        :transform="`translate(${playerPos.x}, ${playerPos.y})`"
      >
        <circle
          class="player-dot"
          r="6"
        />
      </g>
    </svg>

    <!-- 探索進度 -->
    <div class="maze-hud">
      <div class="hud-progress">
        <span class="hud-label">探索進度</span>
        <progress
          class="nes-progress"
          :value="explorationProgress.visited"
          :max="explorationProgress.total"
        />
        <span class="hud-value">
          {{ explorationProgress.visited }}/{{ explorationProgress.total }}
        </span>
      </div>

      <button
        type="button"
        class="nes-btn"
        @click="toggleOverview"
      >
        {{ showOverview ? '返回探索' : '總覽' }}
      </button>
    </div>

    <!-- 操作提示 -->
    <p class="maze-hint">
      <template v-if="showOverview">
        總覽模式：全圖已揭開，可直接點選任一房間
      </template>
      <template v-else-if="canEnterHere">
        按 Enter 進入房間
      </template>
      <template v-else-if="isMobile">
        點選房間，角色會自動走過去
      </template>
      <template v-else>
        方向鍵移動 ｜ 點選房間自動尋路 ｜ Enter 進入
      </template>
    </p>
  </div>
</template>

<style scoped>
.maze-map {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 16px;
}

.maze-svg {
  width: 100%;
  max-width: 560px;
  height: auto;
  max-height: 58vh;
}

/* --- 迷霧 --------------------------------------------------------- */
.fog-visible {
  opacity: 1;
}

.fog-dim {
  opacity: 0.28;
}

/* 房間靠 v-show 移除，走廊只掛 class —— 少了這條規則走廊會套用預設
   opacity 1，整張圖的走廊全部曝光（迷霧等同失效）。 */
.fog-hidden {
  opacity: 0;
}

/* --- 走廊 --------------------------------------------------------- */
.corridor {
  stroke: var(--color-amber);
  stroke-width: 11;
  stroke-linecap: butt;
  transition: opacity 0.4s ease;
}

.corridor.fog-visible {
  filter: drop-shadow(0 0 4px var(--color-amber));
}

/* --- 入口 --------------------------------------------------------- */
.entrance-box {
  fill: var(--color-bg);
  stroke: var(--color-amber);
  stroke-width: 2;
}

.entrance-label {
  font-family: 'Press Start 2P', cursive;
  font-size: 6px;
  fill: var(--color-amber);
}

/* --- 房間 --------------------------------------------------------- */
.room-node {
  cursor: pointer;
  transition: opacity 0.4s ease;
}

.room-box {
  fill: var(--color-bg);
  stroke: var(--room-color);
  stroke-width: 2;
}

.room-node.fog-visible .room-box {
  filter: drop-shadow(0 0 6px var(--room-color));
}

.room-node:hover .room-box {
  stroke-width: 3;
  filter: drop-shadow(0 0 12px var(--room-color));
}

.room-node.current .room-box {
  animation: room-pulse 1.5s infinite;
}

.room-icon {
  font-size: 17px;
}

.room-name {
  font-family: 'VT323', monospace;
  font-size: 9px;
  fill: var(--room-color);
}

.room-unknown {
  font-family: 'Press Start 2P', cursive;
  font-size: 10px;
  fill: var(--room-color);
}

@keyframes room-pulse {
  0%,
  100% {
    filter: drop-shadow(0 0 5px var(--room-color));
  }

  50% {
    filter: drop-shadow(0 0 16px var(--room-color));
  }
}

/* --- 角色 --------------------------------------------------------- */
.player {
  transition: transform 0.09s linear;
}

.player-dot {
  fill: var(--color-amber-bright);
  stroke: var(--color-bg);
  stroke-width: 1.5;
  filter: drop-shadow(0 0 6px var(--color-amber-bright));
  animation: player-blink 1.2s infinite;
}

.player.moving .player-dot {
  animation: none;
}

@keyframes player-blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.55;
  }
}

/* --- HUD ---------------------------------------------------------- */
.maze-hud {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 16px;
}

.hud-progress {
  display: flex;
  gap: 10px;
  align-items: center;
}

.hud-label,
.hud-value {
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  white-space: nowrap;
}

.hud-label {
  color: var(--color-text-dim);
}

.hud-value {
  color: var(--color-amber);
  text-shadow: 0 0 5px var(--color-amber);
}

.hud-progress .nes-progress {
  width: 160px;
  height: 26px;
  margin: 0;
}

.maze-hint {
  margin-top: 10px;
  font-family: 'VT323', monospace;
  font-size: 1rem;
  color: var(--color-text-dim);
  text-align: center;
}

/* --- 手機 --------------------------------------------------------- */
.maze-map--mobile .maze-svg {
  max-height: 48vh;
}

.maze-map--mobile .maze-hud {
  flex-direction: column;
  gap: 10px;
}

.maze-map--mobile .hud-progress .nes-progress {
  width: 120px;
}
</style>
