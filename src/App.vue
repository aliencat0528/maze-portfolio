<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import MazeMap from '@/components/maze/MazeMap.vue'
import RoomContainer from '@/components/ui/RoomContainer.vue'
import OriginRoom from '@/components/rooms/OriginRoom.vue'
import QuestRoom from '@/components/rooms/QuestRoom.vue'
import TreasureRoom from '@/components/rooms/TreasureRoom.vue'
import SkillRoom from '@/components/rooms/SkillRoom.vue'
import AchievementRoom from '@/components/rooms/AchievementRoom.vue'
import ContactRoom from '@/components/rooms/ContactRoom.vue'
import { useExploration } from '@/composables/useExploration'
import { useDevice } from '@/composables/useDevice'
import { useTypewriter } from '@/composables/useTypewriter'
import { roomConfigs, resumeData } from '@/data/resumeData'
import type { RoomType } from '@/types'

const { currentRoom, enterRoom, exitRoom, isTransitioning } = useExploration()
const { isMobile } = useDevice()
const { displayText, typeText } = useTypewriter()

const isBooting = ref(true)
const showMaze = ref(false)

// 當前房間配置
const currentRoomConfig = computed(() => {
  if (currentRoom.value === 'entrance') return null
  return roomConfigs.find(r => r.id === currentRoom.value)
})

// 房間組件映射
const roomComponents: Record<RoomType, typeof OriginRoom> = {
  origin: OriginRoom,
  quest: QuestRoom,
  treasure: TreasureRoom,
  skill: SkillRoom,
  achievement: AchievementRoom,
  contact: ContactRoom
}

// 處理選擇房間
const handleSelectRoom = (roomId: RoomType) => {
  enterRoom(roomId)
}

// 處理返回迷宮
const handleExitRoom = () => {
  exitRoom()
}

// 鍵盤控制
const handleKeydown = (e: KeyboardEvent) => {
  if (currentRoom.value !== 'entrance' && e.key === 'Escape') {
    handleExitRoom()
  }
}

// 開機動畫
onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)

  await typeText('> 系統啟動中...', 50)
  await new Promise(r => setTimeout(r, 300))
  await typeText('> 載入迷宮資料...', 40)
  await new Promise(r => setTimeout(r, 300))
  await typeText(`> 歡迎，${resumeData.basic.name}`, 40)
  await new Promise(r => setTimeout(r, 500))
  isBooting.value = false
  showMaze.value = true
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="app" :class="{ 'is-mobile': isMobile }">
    <!-- 開機畫面 -->
    <Transition name="fade">
      <div v-if="isBooting" class="boot-screen crt-screen crt-scanlines">
        <div class="boot-content">
          <h1 class="boot-title font-pixel">MAZE PORTFOLIO</h1>
          <p class="boot-text typing-cursor">{{ displayText }}</p>
          <div class="boot-progress">
            <div class="boot-progress-bar"></div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 主要內容 -->
    <Transition name="fade">
      <div v-if="showMaze" class="main-container crt-screen crt-scanlines crt-boot">
        <!-- 迷宮視圖（入口） -->
        <Transition name="slide" mode="out-in">
          <div v-if="currentRoom === 'entrance'" key="maze" class="maze-view">
            <!-- 頂部標題 -->
            <header class="maze-header">
              <h1 class="maze-title font-pixel">
                <span class="title-icon">🏰</span>
                {{ resumeData.basic.name }} 的迷宮
              </h1>
              <p class="maze-subtitle text-dim">{{ resumeData.basic.tagline }}</p>
            </header>

            <!-- 迷宮地圖 -->
            <MazeMap @select-room="handleSelectRoom" />

            <!-- 底部提示 -->
            <footer class="maze-footer">
              <p class="footer-text text-dim">
                探索迷宮，發現隱藏的寶藏
              </p>
            </footer>
          </div>

          <!-- 房間視圖 -->
          <RoomContainer
            v-else-if="currentRoomConfig"
            key="room"
            :room="currentRoomConfig"
            @exit="handleExitRoom"
          >
            <component :is="roomComponents[currentRoom as RoomType]" />
          </RoomContainer>
        </Transition>

        <!-- 過場遮罩 -->
        <Transition name="fade">
          <div v-if="isTransitioning" class="transition-overlay">
            <div class="transition-text">Loading...</div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
}

/* Boot Screen */
.boot-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  z-index: 1000;
}

.boot-content {
  text-align: center;
  padding: 40px;
}

.boot-title {
  font-size: 1.5rem;
  color: var(--color-origin);
  text-shadow: 0 0 20px var(--color-origin);
  margin-bottom: 30px;
  animation: glitch 2s infinite;
}

@keyframes glitch {
  0%, 90%, 100% { transform: translate(0); }
  92% { transform: translate(-2px, 1px); }
  94% { transform: translate(2px, -1px); }
  96% { transform: translate(-1px, -1px); }
  98% { transform: translate(1px, 1px); }
}

.boot-text {
  font-family: 'VT323', monospace;
  font-size: 1.5rem;
  color: var(--color-origin);
  margin-bottom: 20px;
}

.boot-progress {
  width: 300px;
  height: 20px;
  border: 2px solid var(--color-origin);
  margin: 0 auto;
  overflow: hidden;
}

.boot-progress-bar {
  height: 100%;
  background: var(--color-origin);
  animation: loading 2s ease-out forwards;
}

@keyframes loading {
  0% { width: 0%; }
  100% { width: 100%; }
}

/* Main Container */
.main-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Maze View */
.maze-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.maze-header {
  text-align: center;
  padding: 20px 0;
  flex-shrink: 0;
}

.maze-title {
  font-size: 1rem;
  color: var(--color-origin);
  text-shadow: 0 0 10px var(--color-origin);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.title-icon {
  font-size: 1.5rem;
}

.maze-subtitle {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  margin-top: 10px;
}

.maze-footer {
  text-align: center;
  padding: 15px 0;
  flex-shrink: 0;
}

.footer-text {
  font-family: 'VT323', monospace;
  font-size: 1rem;
}

/* Transition Overlay */
.transition-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.transition-text {
  font-family: 'VT323', monospace;
  font-size: 1.5rem;
  color: var(--color-origin);
  animation: blink 0.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Mobile */
.is-mobile .maze-title {
  font-size: 0.8rem;
}

.is-mobile .boot-title {
  font-size: 1rem;
}

.is-mobile .boot-progress {
  width: 200px;
}
</style>
