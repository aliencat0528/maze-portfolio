<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTypewriter } from '@/composables/useTypewriter'
import type { RoomConfig } from '@/types'

const props = defineProps<{
  room: RoomConfig
}>()

const emit = defineEmits<{
  (e: 'exit'): void
}>()

const { displayText, typeText } = useTypewriter()
const isLoaded = ref(false)

const themeClass = computed(() => `theme-${props.room.id}`)

onMounted(async () => {
  await typeText(`> 進入 ${props.room.name}...`, 30)
  await new Promise(resolve => setTimeout(resolve, 300))
  isLoaded.value = true
})

const handleExit = () => {
  emit('exit')
}
</script>

<template>
  <div
    class="room-container crt-screen crt-scanlines"
    :class="themeClass"
  >
    <div class="room-content">
      <!-- 頂部導航 -->
      <header class="room-header">
        <div class="room-title">
          <span class="room-icon">{{ room.icon }}</span>
          <h1 class="title-main">
            {{ room.englishName }}
          </h1>
        </div>
        <button
          class="btn-terminal btn-exit"
          @click="handleExit"
        >
          [ESC] 返回迷宮
        </button>
      </header>

      <!-- 載入動畫 -->
      <div
        v-if="!isLoaded"
        class="loading-screen"
      >
        <p class="loading-text typing-cursor">
          {{ displayText }}
        </p>
        <div class="loading-bar">
          <div class="loading-bar-fill" />
        </div>
      </div>

      <!-- 房間內容 -->
      <main
        v-else
        class="room-main fade-in"
      >
        <div class="room-subtitle">
          <span class="text-dim">> </span>
          <span class="text-accent">{{ room.name }}</span>
        </div>

        <div class="divider" />

        <!-- 插槽內容 -->
        <slot />
      </main>

      <!-- 底部狀態 -->
      <footer class="room-footer">
        <span class="text-dim">位置: {{ room.name }}</span>
        <span class="text-dim">|</span>
        <span :style="{ color: room.color }">
          ████ {{ room.id.toUpperCase() }} ████
        </span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.room-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.room-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 2px solid var(--color-border);
  flex-shrink: 0;
}

.room-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.room-icon {
  font-size: 2rem;
}

.title-main {
  font-family: 'Press Start 2P', cursive;
  font-size: 0.9rem;
  color: var(--room-color);
  text-shadow: 0 0 10px var(--room-color);
}

.btn-exit {
  font-size: 0.9rem;
  padding: 5px 15px;
}

.loading-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.loading-text {
  font-family: 'VT323', monospace;
  font-size: 1.5rem;
  color: var(--room-color);
}

.loading-bar {
  width: 200px;
  height: 20px;
  border: 2px solid var(--color-border);
  background: var(--color-bg);
  overflow: hidden;
}

.loading-bar-fill {
  height: 100%;
  width: 0%;
  background: var(--room-color);
  animation: loading 0.8s ease-out forwards;
}

@keyframes loading {
  from { width: 0%; }
  to { width: 100%; }
}

.room-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
}

.room-subtitle {
  font-family: 'VT323', monospace;
  font-size: 1.3rem;
  margin-bottom: 10px;
}

.room-footer {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--color-border);
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
  flex-shrink: 0;
}

/* 響應式 */
@media (max-width: 768px) {
  .room-content {
    padding: 15px;
  }

  .room-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .title-main {
    font-size: 0.7rem;
  }

  .btn-exit {
    font-size: 0.8rem;
    align-self: flex-end;
  }
}
</style>
