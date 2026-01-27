<script setup lang="ts">
import { ref } from 'vue'
import { resumeData } from '@/data/resumeData'

const { quests } = resumeData
const activeQuest = ref(0)

const nextQuest = () => {
  if (activeQuest.value < quests.length - 1) {
    activeQuest.value++
  }
}

const prevQuest = () => {
  if (activeQuest.value > 0) {
    activeQuest.value--
  }
}

const getDifficultyStars = (level: number) => {
  return '★'.repeat(level) + '☆'.repeat(5 - level)
}
</script>

<template>
  <div class="quest-room">
    <!-- 關卡導航 -->
    <div class="quest-nav">
      <button
        class="btn-terminal btn-nav"
        :disabled="activeQuest === 0"
        @click="prevQuest"
      >
        [◀ 上一關]
      </button>
      <span class="quest-indicator">
        關卡 {{ activeQuest + 1 }} / {{ quests.length }}
      </span>
      <button
        class="btn-terminal btn-nav"
        :disabled="activeQuest === quests.length - 1"
        @click="nextQuest"
      >
        [下一關 ▶]
      </button>
    </div>

    <!-- 關卡內容 -->
    <div class="quest-content">
      <div
        v-for="(quest, index) in quests"
        :key="index"
        class="quest-card terminal-box"
        :class="{ active: activeQuest === index }"
      >
        <!-- 關卡標題 -->
        <header class="quest-header">
          <div class="quest-title-row">
            <h2 class="quest-title">
              <span class="text-accent">【關卡 {{ index + 1 }}】</span>
              {{ quest.company }}
            </h2>
            <span class="quest-period text-dim">{{ quest.period }}</span>
          </div>
          <div class="quest-meta">
            <span class="quest-position">職位: {{ quest.position }}</span>
            <span class="quest-difficulty">
              難度: <span class="stars">{{ getDifficultyStars(quest.difficulty) }}</span>
            </span>
          </div>
        </header>

        <div class="divider"></div>

        <!-- 任務目標 -->
        <section class="quest-section">
          <h3 class="section-label">> 任務目標</h3>
          <ul class="list-terminal">
            <li v-for="(obj, i) in quest.objectives" :key="i">
              {{ obj }}
            </li>
          </ul>
        </section>

        <!-- 獲得經驗值 -->
        <section class="quest-section">
          <h3 class="section-label">> 獲得經驗值</h3>
          <ul class="list-terminal achievements-list">
            <li v-for="(achievement, i) in quest.achievements" :key="i">
              <span class="xp-badge">+EXP</span>
              {{ achievement }}
            </li>
          </ul>
        </section>

        <!-- 解鎖技能 -->
        <section class="quest-section">
          <h3 class="section-label">> 解鎖技能</h3>
          <div class="skills-unlocked">
            <span
              v-for="skill in quest.skills"
              :key="skill"
              class="tag skill-tag"
            >
              {{ skill }}
            </span>
          </div>
        </section>
      </div>
    </div>

    <!-- 任務總覽 -->
    <div class="quest-overview">
      <span class="text-dim">> 已完成關卡: </span>
      <span class="text-accent">{{ quests.length }}</span>
      <span class="text-dim"> | 累積經驗: </span>
      <span class="text-accent">∞</span>
    </div>
  </div>
</template>

<style scoped>
.quest-room {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.quest-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.btn-nav {
  font-size: 0.9rem;
  padding: 8px 15px;
}

.btn-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.quest-indicator {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  color: var(--room-color);
}

.quest-content {
  position: relative;
  min-height: 400px;
}

.quest-card {
  display: none;
  padding: 20px;
}

.quest-card.active {
  display: block;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.quest-header {
  margin-bottom: 15px;
}

.quest-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.quest-title {
  font-family: 'VT323', monospace;
  font-size: 1.5rem;
  color: var(--color-text);
}

.quest-period {
  font-family: 'VT323', monospace;
  font-size: 1rem;
}

.quest-meta {
  display: flex;
  gap: 20px;
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
}

.quest-position {
  color: var(--color-text);
}

.quest-difficulty .stars {
  color: var(--room-color);
}

.quest-section {
  margin-bottom: 20px;
}

.section-label {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  color: var(--room-color);
  margin-bottom: 10px;
}

.achievements-list li {
  display: flex;
  align-items: center;
  gap: 10px;
}

.xp-badge {
  font-family: 'Press Start 2P', cursive;
  font-size: 0.5rem;
  padding: 2px 6px;
  background: var(--room-color);
  color: var(--color-bg);
}

.skills-unlocked {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag {
  background: rgba(255, 107, 107, 0.1);
}

.quest-overview {
  text-align: center;
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  padding: 15px;
  border-top: 1px dashed var(--color-border);
}

@media (max-width: 768px) {
  .quest-nav {
    flex-direction: column;
    gap: 10px;
  }

  .quest-title-row {
    flex-direction: column;
  }

  .quest-meta {
    flex-direction: column;
    gap: 5px;
  }
}
</style>
