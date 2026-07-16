<script setup lang="ts">
import { resumeData } from '@/data/resumeData'

const { achievements } = resumeData

const typeIcons: Record<string, string> = {
  badge: '🎖️',
  trophy: '🏆',
  hidden: '❓'
}
</script>

<template>
  <div class="achievement-room">
    <!-- 成就列表 -->
    <div class="achievement-grid">
      <div
        v-for="(achievement, index) in achievements"
        :key="index"
        class="achievement-card terminal-box"
        :class="{ locked: !achievement.unlocked }"
      >
        <!-- 成就圖示 -->
        <div class="achievement-icon">
          <span v-if="achievement.unlocked">{{ typeIcons[achievement.type] }}</span>
          <span
            v-else
            class="locked-icon"
          >🔒</span>
        </div>

        <!-- 成就內容 -->
        <div class="achievement-content">
          <div class="achievement-header">
            <span class="achievement-type">[ {{ achievement.typeName }} ]</span>
            <span
              v-if="achievement.year"
              class="achievement-year"
            >{{ achievement.year }}</span>
          </div>

          <h3 class="achievement-name">
            {{ achievement.unlocked ? achievement.name : '???' }}
          </h3>

          <p class="achievement-description text-dim">
            {{ achievement.unlocked ? achievement.description : '尚未解鎖此成就' }}
          </p>
        </div>

        <!-- 解鎖狀態 -->
        <div class="achievement-status">
          <span
            v-if="achievement.unlocked"
            class="status-unlocked"
          >
            ✓ 已解鎖
          </span>
          <span
            v-else
            class="status-locked"
          >
            未解鎖
          </span>
        </div>
      </div>
    </div>

    <!-- 成就統計 -->
    <div class="achievement-stats terminal-box">
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-icon">🎖️</span>
          <span class="stat-label">勳章</span>
          <span class="stat-value">
            {{ achievements.filter(a => a.type === 'badge' && a.unlocked).length }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🏆</span>
          <span class="stat-label">戰利品</span>
          <span class="stat-value">
            {{ achievements.filter(a => a.type === 'trophy' && a.unlocked).length }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">❓</span>
          <span class="stat-label">隱藏</span>
          <span class="stat-value">
            {{ achievements.filter(a => a.type === 'hidden' && a.unlocked).length }}/{{ achievements.filter(a => a.type === 'hidden').length }}
          </span>
        </div>
      </div>

      <div class="progress-row">
        <span class="text-dim">> 完成度: </span>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{
              width: `${(achievements.filter(a => a.unlocked).length / achievements.length) * 100}%`
            }"
          />
        </div>
        <span class="text-accent">
          {{ achievements.filter(a => a.unlocked).length }}/{{ achievements.length }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.achievement-room {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.achievement-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.achievement-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  transition: all 0.3s ease;
}

.achievement-card:hover {
  border-color: var(--room-color);
}

.achievement-card.locked {
  opacity: 0.6;
}

.achievement-card.locked:hover {
  opacity: 0.8;
}

.achievement-icon {
  font-size: 2.5rem;
  min-width: 60px;
  text-align: center;
}

.locked-icon {
  filter: grayscale(100%);
}

.achievement-content {
  flex: 1;
}

.achievement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.achievement-type {
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
  color: var(--room-color);
}

.achievement-year {
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
  color: var(--color-text-dim);
}

.achievement-name {
  font-family: 'VT323', monospace;
  font-size: 1.3rem;
  color: var(--color-text);
  margin-bottom: 5px;
}

.achievement-description {
  font-family: 'VT323', monospace;
  font-size: 1rem;
  line-height: 1.4;
}

.achievement-status {
  min-width: 80px;
  text-align: right;
}

.status-unlocked {
  font-family: 'VT323', monospace;
  font-size: 1rem;
  color: var(--room-color);
}

.status-locked {
  font-family: 'VT323', monospace;
  font-size: 1rem;
  color: var(--color-text-dim);
}

.achievement-stats {
  padding: 20px;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-label {
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
  color: var(--color-text-dim);
}

.stat-value {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  color: var(--room-color);
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background: var(--color-border);
  border: 2px solid var(--color-text-dim);
}

.progress-fill {
  height: 100%;
  background: var(--room-color);
  transition: width 0.5s ease;
}

@media (max-width: 768px) {
  .achievement-card {
    flex-direction: column;
    text-align: center;
  }

  .achievement-header {
    flex-direction: column;
    gap: 5px;
  }

  .achievement-status {
    width: 100%;
    text-align: center;
  }

  .stats-row {
    flex-wrap: wrap;
    gap: 20px;
  }
}
</style>
