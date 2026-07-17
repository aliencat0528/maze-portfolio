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

/**
 * 渲染尺寸（MR-006）。
 *
 * 重畫前走廊是 stroke-width 11 的裸線條，看起來像水管而不是地牢 —— 沒有地板、
 * 沒有牆、沒有厚度。現在改成兩層畫法：
 *
 *   1. 牆層：把所有可走區域「膨脹」WALL 後填磚牆紋理
 *   2. 地板層：同樣的形狀以正常大小填地板色，蓋在牆層上
 *
 * 牆因此只留在地板沒覆蓋到的地方。走廊接房間處，走廊地板會在房間牆上打出一個
 * 洞 —— 那就是門框，不需要特別判斷哪裡該開門。
 *
 * 牆層不套迷霧、永遠可見 = MR-006 的「全圖輪廓可見」；迷霧只調地板與內容。
 */
const CELL = 48
/** viewBox 外距。要留得比牆厚 + 發光半徑大，否則邊緣房間的光暈與標籤會被 viewBox 切掉 */
const PADDING = 34
const WALL = 5
const ROOM_FLOOR = CELL
const CORRIDOR_FLOOR = 18

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

/** 攤平成一維陣列，讓牆層與地板層共用同一份幾何，不會兩層畫出不同形狀 */
const corridorArms = computed(() =>
  corridors.value.flatMap(cell =>
    armsOf(cell).map(arm => ({ ...arm, fog: cellFog(cell) }))
  )
)

const nodes = computed(() => {
  const entrance = {
    id: 'entrance' as NodeId,
    name: 'START',
    icon: '',
    center: centerOf(maze.nodeCell.get('entrance') as Point),
    fog: nodeFog('entrance'),
    isEntrance: true
  }
  const rooms = roomConfigs.map(room => ({
    id: room.id as NodeId,
    name: room.name,
    icon: room.icon,
    center: centerOf(maze.nodeCell.get(room.id) as Point),
    fog: nodeFog(room.id),
    isEntrance: false
  }))
  return [entrance, ...rooms]
})

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
      <defs>
        <!-- 磚牆紋理。userSpaceOnUse 讓磚縫跨格對齊，不會每格重新起算 -->
        <pattern
          id="brickWall"
          width="16"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <rect
            width="16"
            height="8"
            class="brick-face"
          />
          <path
            d="M0 0.5 H16 M0 4.5 H16 M5 0.5 V4.5 M13 4.5 V8"
            class="brick-mortar"
          />
        </pattern>

        <!-- 虛空網格：v1 有這層底紋，重寫時弄丟了，補回來 -->
        <pattern
          id="voidGrid"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M12 0 V12 M0 12 H12"
            class="void-line"
          />
        </pattern>
      </defs>

      <rect
        width="100%"
        height="100%"
        fill="url(#voidGrid)"
      />

      <!-- 第 1 層：牆體（膨脹後的可走區域）。不套迷霧 —— 這就是全圖輪廓 -->
      <g class="walls">
        <line
          v-for="arm in corridorArms"
          :key="`w-${arm.key}`"
          :x1="arm.x1"
          :y1="arm.y1"
          :x2="arm.x2"
          :y2="arm.y2"
          class="wall-stroke"
          :stroke-width="CORRIDOR_FLOOR + WALL * 2"
        />
        <rect
          v-for="node in nodes"
          :key="`w-${node.id}`"
          class="wall-fill"
          :x="node.center.x - ROOM_FLOOR / 2 - WALL"
          :y="node.center.y - ROOM_FLOOR / 2 - WALL"
          :width="ROOM_FLOOR + WALL * 2"
          :height="ROOM_FLOOR + WALL * 2"
        />
      </g>

      <!-- 第 2 層：地板。蓋掉牆層，只在沒地板的地方留下牆 -->
      <g class="floors">
        <line
          v-for="arm in corridorArms"
          :key="`f-${arm.key}`"
          :x1="arm.x1"
          :y1="arm.y1"
          :x2="arm.x2"
          :y2="arm.y2"
          :class="['floor-stroke', `fog-${arm.fog}`]"
          :stroke-width="CORRIDOR_FLOOR"
        />
        <rect
          v-for="node in nodes"
          :key="`f-${node.id}`"
          :class="['floor-fill', `fog-${node.fog}`, `theme-${node.id}`]"
          :x="node.center.x - ROOM_FLOOR / 2"
          :y="node.center.y - ROOM_FLOOR / 2"
          :width="ROOM_FLOOR"
          :height="ROOM_FLOOR"
        />
      </g>

      <!-- 第 3 層：房間內容。點擊區也在這層 -->
      <g
        v-for="node in nodes"
        :key="`c-${node.id}`"
        class="room-node"
        :class="[`theme-${node.id}`, `fog-${node.fog}`, { current: standingOn === node.id }]"
        :transform="`translate(${node.center.x}, ${node.center.y})`"
        @click="handleNodeClick(node.id)"
      >
        <!-- 透明點擊區：地板已在下層畫好，這裡只負責收事件 -->
        <rect
          class="hit-area"
          :x="-ROOM_FLOOR / 2"
          :y="-ROOM_FLOOR / 2"
          :width="ROOM_FLOOR"
          :height="ROOM_FLOOR"
        />

        <template v-if="node.isEntrance">
          <text
            class="entrance-label"
            y="3"
            text-anchor="middle"
          >
            START
          </text>
        </template>

        <!-- 已探明才露出圖示與名稱；未探明的只有輪廓，探明前不知道是什麼房間 -->
        <template v-else-if="node.fog === 'visible'">
          <text
            class="room-icon"
            y="-3"
            text-anchor="middle"
          >
            {{ node.icon }}
          </text>
          <text
            class="room-name"
            y="15"
            text-anchor="middle"
          >
            {{ node.name }}
          </text>
        </template>
        <text
          v-else-if="node.fog === 'dim'"
          class="room-unknown"
          y="6"
          text-anchor="middle"
        >
          ?
        </text>
      </g>

      <!-- 第 4 層：角色 -->
      <g
        class="player"
        :class="{ moving: isMoving }"
        :transform="`translate(${playerPos.x}, ${playerPos.y})`"
      >
        <circle
          class="player-glow"
          r="13"
        />
        <rect
          class="player-body"
          x="-4"
          y="-5"
          width="8"
          height="10"
        />
      </g>
    </svg>

    <!-- HUD -->
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
  max-width: 620px;
  height: auto;
  max-height: 60vh;
}

/* --- 紋理 --------------------------------------------------------- */
.brick-face {
  fill: var(--color-wall);
}

.brick-mortar {
  stroke: var(--color-wall-mortar);
  stroke-width: 1;
  fill: none;
}

.void-line {
  stroke: var(--color-void-grid);
  stroke-width: 0.5;
  fill: none;
}

/* --- 牆體：永遠可見，構成全圖輪廓 --------------------------------- */
.wall-fill {
  fill: url(#brickWall);
}

.wall-stroke {
  stroke: url(#brickWall);
  stroke-linecap: butt;
}

/* --- 地板：迷霧只作用在這層與內容層 ------------------------------- */
.floor-fill,
.floor-stroke {
  transition: fill 0.5s ease, stroke 0.5s ease;
}

.floor-stroke {
  stroke-linecap: butt;
}

.floor-fill.fog-hidden {
  fill: var(--color-floor-dark);
}

.floor-stroke.fog-hidden {
  stroke: var(--color-floor-dark);
}

.floor-fill.fog-dim {
  fill: var(--color-floor-dim);
}

.floor-stroke.fog-dim {
  stroke: var(--color-floor-dim);
}

/* 探明的地板染上該房間的色溫，並透出微光 —— 這是探索的獎勵 */
.floor-fill.fog-visible {
  fill: var(--color-floor-lit);
  filter: drop-shadow(0 0 7px var(--room-color, var(--color-amber)));
}

.floor-stroke.fog-visible {
  stroke: var(--color-floor-lit);
}

/* --- 內容 --------------------------------------------------------- */
.room-node {
  cursor: pointer;
}

.hit-area {
  fill: transparent;
}

.room-node:hover .room-icon {
  filter: drop-shadow(0 0 6px var(--room-color));
}

.room-node.current .room-name {
  animation: name-pulse 1.6s infinite;
}

.entrance-label,
.room-unknown {
  font-family: 'Press Start 2P', cursive;
}

.entrance-label {
  font-size: 6px;
  fill: var(--color-amber);
}

.room-icon {
  font-size: 18px;
}

.room-name {
  font-family: 'VT323', monospace;
  font-size: 9px;
  fill: var(--room-color);
  text-shadow: 0 0 4px var(--room-color);
}

.room-unknown {
  font-size: 11px;
  fill: var(--color-text-dim);
}

@keyframes name-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.45;
  }
}

/* --- 角色 --------------------------------------------------------- */
.player {
  transition: transform 0.09s linear;
}

.player-glow {
  fill: var(--color-amber);
  opacity: 0.16;
}

.player-body {
  fill: var(--color-amber-bright);
  filter: drop-shadow(0 0 5px var(--color-amber-bright));
  animation: player-blink 1.2s infinite;
}

.player.moving .player-body {
  animation: none;
}

@keyframes player-blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.6;
  }
}

/* --- HUD ---------------------------------------------------------- */
.maze-hud {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 18px;
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
  width: 150px;
  height: 24px;
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
</style>
