<script setup lang="ts">
import { resumeData } from '@/data/resumeData'

const { skills } = resumeData

const categoryIcons: Record<string, string> = {
  magic: '🔮',
  equipment: '🛡️',
  passive: '💫',
  talent: '🌟'
}

const getLevelBars = (level: number) => {
  return {
    filled: level,
    empty: 5 - level
  }
}
</script>

<template>
  <div class="skill-room">
    <!-- 技能類別 -->
    <div class="skill-categories">
      <section
        v-for="category in skills"
        :key="category.category"
        class="skill-category terminal-box"
      >
        <!-- 類別標題 -->
        <header class="category-header">
          <span class="category-icon">{{ categoryIcons[category.category] }}</span>
          <h2 class="category-title">{{ category.categoryName }}</h2>
        </header>

        <div class="divider"></div>

        <!-- 技能列表 -->
        <div class="skill-list">
          <div
            v-for="skill in category.skills"
            :key="skill.name"
            class="skill-item"
          >
            <span class="skill-name">{{ skill.name }}</span>
            <div class="skill-level">
              <span
                v-for="n in getLevelBars(skill.level).filled"
                :key="`filled-${n}`"
                class="level-bar filled"
              >▓</span>
              <span
                v-for="n in getLevelBars(skill.level).empty"
                :key="`empty-${n}`"
                class="level-bar empty"
              >░</span>
            </div>
            <span class="skill-level-text">Lv.{{ skill.level }}</span>
          </div>
        </div>
      </section>
    </div>

    <!-- 技能總覽 -->
    <div class="skill-summary">
      <span class="text-dim">> 已習得技能: </span>
      <span class="text-accent">
        {{ skills.reduce((acc, cat) => acc + cat.skills.length, 0) }}
      </span>
      <span class="text-dim"> | 最高等級: </span>
      <span class="text-accent">Lv.5</span>
    </div>
  </div>
</template>

<style scoped>
.skill-room {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skill-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.skill-category {
  padding: 20px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.category-icon {
  font-size: 1.5rem;
}

.category-title {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  color: var(--room-color);
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skill-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.skill-name {
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  color: var(--color-text);
  min-width: 100px;
}

.skill-level {
  flex: 1;
  display: flex;
  gap: 2px;
  font-family: monospace;
  font-size: 1rem;
}

.level-bar {
  width: 20px;
  text-align: center;
}

.level-bar.filled {
  color: var(--room-color);
  text-shadow: 0 0 5px var(--room-color);
}

.level-bar.empty {
  color: var(--color-border);
}

.skill-level-text {
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
  color: var(--room-color);
  min-width: 40px;
  text-align: right;
}

.skill-summary {
  text-align: center;
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  padding: 15px;
  border-top: 1px dashed var(--color-border);
}

@media (max-width: 768px) {
  .skill-categories {
    grid-template-columns: 1fr;
  }

  .skill-item {
    flex-wrap: wrap;
  }

  .skill-name {
    min-width: 80px;
    flex: 1;
  }

  .skill-level {
    order: 3;
    flex: 100%;
    margin-top: 5px;
  }
}
</style>
