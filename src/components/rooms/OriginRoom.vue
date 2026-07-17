<script setup lang="ts">
import { resumeData } from '@/data/resumeData'

const { origin, basic } = resumeData
</script>

<template>
  <div class="origin-room">
    <!-- 角色資訊 -->
    <section class="section character-info">
      <h2 class="section-title">
        > 角色檔案
      </h2>
      <div class="character-card terminal-box">
        <div class="character-header">
          <div class="character-avatar">
            <span class="avatar-placeholder">👤</span>
          </div>
          <div class="character-details">
            <h3 class="character-name">
              {{ basic.name }}
            </h3>
            <p class="character-title text-accent">
              {{ basic.title }}
            </p>
            <p class="character-tagline text-dim">
              "{{ basic.tagline }}"
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 背景故事 -->
    <section class="section">
      <h2 class="section-title">
        > 背景故事
      </h2>
      <div class="terminal-box">
        <p class="story-text">
          {{ origin.background }}
        </p>
      </div>
    </section>

    <!-- 核心價值觀 -->
    <section class="section">
      <h2 class="section-title">
        > 角色信念
      </h2>
      <ul class="list-terminal values-list">
        <li
          v-for="(value, index) in origin.values"
          :key="index"
        >
          {{ value }}
        </li>
      </ul>
    </section>

    <!-- 人生轉折點 -->
    <section class="section">
      <h2 class="section-title">
        > 命運的岔路口
      </h2>
      <div class="turning-points">
        <div
          v-for="(point, index) in origin.turningPoints"
          :key="index"
          class="turning-point terminal-box"
        >
          <div class="point-header">
            <span class="point-year text-accent">[ {{ point.year }} ]</span>
            <span class="point-title">{{ point.title }}</span>
          </div>
          <p class="point-description text-dim">
            {{ point.description }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.origin-room {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.section {
  animation: fadeIn 0.5s ease forwards;
  animation-delay: calc(var(--index, 0) * 0.1s);
}

.section:nth-child(1) { --index: 0; }
.section:nth-child(2) { --index: 1; }
.section:nth-child(3) { --index: 2; }
.section:nth-child(4) { --index: 3; }

.section-title {
  font-family: 'VT323', monospace;
  font-size: 1.3rem;
  color: var(--room-color);
  margin-bottom: 15px;
}

.character-card {
  padding: 20px;
}

.character-header {
  display: flex;
  gap: 20px;
  align-items: center;
}

.character-avatar {
  width: 80px;
  height: 80px;
  border: 3px solid var(--room-color);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

.avatar-placeholder {
  font-size: 3rem;
}

.character-details {
  flex: 1;
}

.character-name {
  font-family: 'Press Start 2P', cursive;
  font-size: 1rem;
  color: var(--color-text);
  margin-bottom: 8px;
}

.character-title {
  font-family: 'VT323', monospace;
  font-size: 1.3rem;
  margin-bottom: 5px;
}

.character-tagline {
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  font-style: italic;
}

.story-text {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  line-height: 1.8;
  color: var(--color-text);
}

.values-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.values-list li {
  font-size: 1.2rem;
}

.turning-points {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.turning-point {
  padding: 15px;
  border-left: 3px solid var(--room-color);
}

.point-header {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 8px;
}

.point-year {
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
}

.point-title {
  font-family: 'VT323', monospace;
  font-size: 1.3rem;
  color: var(--color-text);
}

.point-description {
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .character-header {
    flex-direction: column;
    text-align: center;
  }

  .character-name {
    font-size: 0.8rem;
  }
}
</style>
