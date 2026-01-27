<script setup lang="ts">
import { ref } from 'vue'
import { resumeData } from '@/data/resumeData'
import type { TreasureData } from '@/types'

const { treasures } = resumeData
const selectedTreasure = ref<TreasureData | null>(null)

const rarityLabels: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史詩',
  legendary: '傳說'
}

const selectTreasure = (treasure: TreasureData) => {
  selectedTreasure.value = treasure
}

const closeTreasure = () => {
  selectedTreasure.value = null
}
</script>

<template>
  <div class="treasure-room">
    <!-- 寶物列表 -->
    <div class="treasure-grid">
      <div
        v-for="(treasure, index) in treasures"
        :key="index"
        class="treasure-item terminal-box"
        :class="`rarity-${treasure.rarity}`"
        @click="selectTreasure(treasure)"
      >
        <div class="treasure-icon">💎</div>
        <h3 class="treasure-name">{{ treasure.name }}</h3>
        <span class="treasure-rarity">{{ rarityLabels[treasure.rarity] }}</span>
        <span class="treasure-type text-dim">{{ treasure.type }}</span>
      </div>
    </div>

    <!-- 寶物詳情彈窗 -->
    <Teleport to="body">
      <div v-if="selectedTreasure" class="treasure-modal" @click.self="closeTreasure">
        <div class="modal-content terminal-box crt-scanlines" :class="`rarity-${selectedTreasure.rarity}`">
          <button class="btn-close" @click="closeTreasure">×</button>

          <!-- 寶物標題 -->
          <header class="modal-header">
            <span class="treasure-icon-large">💎</span>
            <div class="treasure-info">
              <h2 class="treasure-title">{{ selectedTreasure.name }}</h2>
              <div class="treasure-meta">
                <span class="rarity-badge">{{ rarityLabels[selectedTreasure.rarity] }}</span>
                <span class="type-badge">{{ selectedTreasure.type }}</span>
              </div>
            </div>
          </header>

          <div class="divider"></div>

          <!-- 鍛造方式 -->
          <section class="modal-section">
            <h3 class="section-label">> 鍛造方式</h3>
            <p class="text-primary">{{ selectedTreasure.role }}</p>
          </section>

          <!-- 材料成分 -->
          <section class="modal-section">
            <h3 class="section-label">> 材料成分</h3>
            <div class="tech-tags">
              <span
                v-for="tech in selectedTreasure.technologies"
                :key="tech"
                class="tag"
              >
                {{ tech }}
              </span>
            </div>
          </section>

          <!-- 屬性加成 -->
          <section class="modal-section">
            <h3 class="section-label">> 屬性加成</h3>
            <div class="stats-list">
              <div
                v-for="stat in selectedTreasure.stats"
                :key="stat.label"
                class="stat-item"
              >
                <span class="stat-label">{{ stat.label }}</span>
                <div class="stat-bar">
                  <div
                    class="stat-fill"
                    :style="{ width: `${stat.value}%` }"
                  ></div>
                </div>
                <span class="stat-value">+{{ stat.value }}%</span>
              </div>
            </div>
          </section>

          <!-- 查看連結 -->
          <footer class="modal-footer" v-if="selectedTreasure.link">
            <a
              :href="selectedTreasure.link"
              target="_blank"
              rel="noopener"
              class="btn-terminal"
            >
              [查看詳情 →]
            </a>
          </footer>
        </div>
      </div>
    </Teleport>

    <!-- 統計資訊 -->
    <div class="treasure-stats">
      <span class="text-dim">> 收藏數量: </span>
      <span class="text-accent">{{ treasures.length }}</span>
      <span class="text-dim"> | 傳說級: </span>
      <span class="rarity-legendary">
        {{ treasures.filter(t => t.rarity === 'legendary').length }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.treasure-room {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.treasure-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.treasure-item {
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid var(--room-color);
}

.treasure-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(var(--room-color), 0.3);
}

.treasure-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.treasure-name {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  color: var(--color-text);
  margin-bottom: 5px;
}

.treasure-rarity {
  font-family: 'Press Start 2P', cursive;
  font-size: 0.5rem;
  color: var(--room-color);
  display: block;
  margin-bottom: 5px;
}

.treasure-type {
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
}

/* Modal */
.treasure-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 25px;
  position: relative;
  background: var(--color-bg);
  border: 2px solid var(--room-color);
}

.btn-close {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
}

.btn-close:hover {
  color: var(--room-color);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.treasure-icon-large {
  font-size: 3rem;
}

.treasure-title {
  font-family: 'VT323', monospace;
  font-size: 1.5rem;
  color: var(--room-color);
  margin-bottom: 5px;
}

.treasure-meta {
  display: flex;
  gap: 10px;
}

.rarity-badge,
.type-badge {
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
  padding: 2px 8px;
  border: 1px solid var(--room-color);
}

.modal-section {
  margin-bottom: 20px;
}

.section-label {
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  color: var(--room-color);
  margin-bottom: 10px;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-label {
  font-family: 'VT323', monospace;
  font-size: 1rem;
  min-width: 100px;
  color: var(--color-text);
}

.stat-bar {
  flex: 1;
  height: 15px;
  background: var(--color-border);
  border: 1px solid var(--color-text-dim);
}

.stat-fill {
  height: 100%;
  background: var(--room-color);
  transition: width 0.5s ease;
}

.stat-value {
  font-family: 'VT323', monospace;
  font-size: 1rem;
  color: var(--room-color);
  min-width: 50px;
  text-align: right;
}

.modal-footer {
  margin-top: 20px;
  text-align: center;
}

.treasure-stats {
  text-align: center;
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  padding: 15px;
  border-top: 1px dashed var(--color-border);
}

@media (max-width: 768px) {
  .treasure-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .modal-content {
    padding: 20px;
  }

  .modal-header {
    flex-direction: column;
    text-align: center;
  }
}
</style>
