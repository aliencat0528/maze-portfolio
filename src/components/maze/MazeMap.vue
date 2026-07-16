<script setup lang="ts">
import { computed } from 'vue'
import { roomConfigs } from '@/data/resumeData'
import { useExploration } from '@/composables/useExploration'
import { useDevice } from '@/composables/useDevice'
import type { RoomType } from '@/types'

const emit = defineEmits<{
  (e: 'select-room', roomId: RoomType): void
}>()

const { isRoomVisited, isPathExplored, currentRoom } = useExploration()
const { isMobile } = useDevice()

// 計算房間在 SVG 中的位置
const roomPositions = computed(() => {
  const positions: Record<string, { x: number; y: number }> = {
    entrance: { x: 200, y: 250 },
    origin: { x: 120, y: 80 },
    quest: { x: 200, y: 80 },
    treasure: { x: 280, y: 80 },
    skill: { x: 80, y: 170 },
    achievement: { x: 200, y: 170 },
    contact: { x: 200, y: 320 }
  }
  return positions
})

// 生成路徑連線
const pathConnections = computed(() => {
  const connections: { from: string; to: string; explored: boolean }[] = []
  const added = new Set<string>()

  // 入口到各房間的連線
  roomConfigs.forEach(room => {
    const key = `entrance-${room.id}`
    if (!added.has(key)) {
      connections.push({
        from: 'entrance',
        to: room.id,
        explored: isPathExplored('entrance', room.id)
      })
      added.add(key)
    }
  })

  // 房間之間的連線
  roomConfigs.forEach(room => {
    room.connections.forEach(connectedId => {
      const key = [room.id, connectedId].sort().join('-')
      if (!added.has(key)) {
        connections.push({
          from: room.id,
          to: connectedId,
          explored: isPathExplored(room.id, connectedId)
        })
        added.add(key)
      }
    })
  })

  return connections
})

// 取得路徑的 SVG path
const getPathD = (from: string, to: string) => {
  const fromPos = roomPositions.value[from]
  const toPos = roomPositions.value[to]

  if (!fromPos || !toPos) return ''

  // 簡單直線連接
  return `M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`
}

// 點擊房間
const handleRoomClick = (roomId: RoomType) => {
  emit('select-room', roomId)
}

// 入口位置
const entrancePosition = computed(() => roomPositions.value.entrance)
</script>

<template>
  <div
    class="maze-map"
    :class="{ 'maze-map--mobile': isMobile }"
  >
    <svg
      viewBox="0 0 400 400"
      class="maze-svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- 背景網格 -->
      <defs>
        <pattern
          id="grid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="#1a1a1a"
            stroke-width="0.5"
          />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="url(#grid)"
      />

      <!-- 路徑連線 -->
      <g class="paths">
        <path
          v-for="conn in pathConnections"
          :key="`${conn.from}-${conn.to}`"
          :d="getPathD(conn.from, conn.to)"
          :class="[
            'maze-path',
            conn.explored ? 'path-explored' : 'path-unexplored'
          ]"
          fill="none"
        />
      </g>

      <!-- 入口節點 -->
      <g
        class="entrance-node"
        :transform="`translate(${entrancePosition?.x ?? 200}, ${entrancePosition?.y ?? 250})`"
      >
        <circle
          r="15"
          fill="#0a0a0a"
          stroke="#14fdce"
          stroke-width="2"
          :class="{ current: currentRoom === 'entrance' }"
        />
        <text
          y="35"
          text-anchor="middle"
          fill="#14fdce"
          font-size="12"
          class="font-terminal"
        >
          START
        </text>
      </g>

      <!-- 房間節點 -->
      <g
        v-for="room in roomConfigs"
        :key="room.id"
        class="room-node"
        :class="[
          `theme-${room.id}`,
          { visited: isRoomVisited(room.id) },
          { current: currentRoom === room.id }
        ]"
        :transform="`translate(${roomPositions[room.id]?.x || 0}, ${roomPositions[room.id]?.y || 0})`"
        @click="handleRoomClick(room.id)"
      >
        <!-- 房間外框 -->
        <rect
          x="-30"
          y="-25"
          width="60"
          height="50"
          rx="4"
          fill="#0a0a0a"
          :stroke="room.color"
          stroke-width="2"
          class="room-bg"
        />
        <!-- 房間圖示 -->
        <text
          y="-5"
          text-anchor="middle"
          font-size="20"
        >
          {{ room.icon }}
        </text>
        <!-- 房間名稱 -->
        <text
          y="18"
          text-anchor="middle"
          :fill="room.color"
          font-size="10"
          class="font-terminal"
        >
          {{ room.name }}
        </text>
      </g>
    </svg>

    <!-- 探索進度 -->
    <div class="exploration-status">
      <span class="status-label">> 探索進度:</span>
      <span class="status-value">
        {{ useExploration().explorationProgress.value.visited }}/{{ useExploration().explorationProgress.value.total }}
      </span>
    </div>

    <!-- 操作提示 -->
    <div class="maze-hint">
      <template v-if="isMobile">
        點擊房間進入探索
      </template>
      <template v-else>
        點擊房間進入 | 方向鍵移動
      </template>
    </div>
  </div>
</template>

<style scoped>
.maze-map {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.maze-svg {
  width: 100%;
  max-width: 500px;
  height: auto;
  max-height: 60vh;
}

.maze-path {
  transition: all 0.5s ease;
}

.room-node {
  cursor: pointer;
  transition: all 0.3s ease;
}

.room-node:hover .room-bg {
  filter: brightness(1.3);
  stroke-width: 3;
}

.room-node.visited .room-bg {
  filter: drop-shadow(0 0 8px var(--room-color));
}

.room-node.current .room-bg {
  animation: room-pulse 1.5s infinite;
}

@keyframes room-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 5px var(--room-color));
  }
  50% {
    filter: drop-shadow(0 0 15px var(--room-color));
  }
}

.entrance-node circle {
  transition: all 0.3s ease;
}

.entrance-node circle.current {
  animation: entrance-pulse 1.5s infinite;
}

@keyframes entrance-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 5px #14fdce);
  }
  50% {
    filter: drop-shadow(0 0 15px #14fdce);
  }
}

.exploration-status {
  margin-top: 20px;
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  color: var(--color-text);
}

.status-label {
  color: var(--color-text-dim);
}

.status-value {
  color: var(--color-origin);
  text-shadow: 0 0 5px var(--color-origin);
}

.maze-hint {
  margin-top: 10px;
  font-family: 'VT323', monospace;
  font-size: 1rem;
  color: var(--color-text-dim);
}

/* 手機版調整 */
.maze-map--mobile .maze-svg {
  max-height: 50vh;
}

.maze-map--mobile .room-node text {
  font-size: 8px;
}
</style>
