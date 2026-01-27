<script setup lang="ts">
import { ref } from 'vue'
import { resumeData } from '@/data/resumeData'
import { useTypewriter } from '@/composables/useTypewriter'

const { contacts, basic } = resumeData
const { displayText, typeText, isTyping } = useTypewriter()
const messageStatus = ref<'idle' | 'typing' | 'sent'>('idle')

const startMessage = async () => {
  messageStatus.value = 'typing'
  await typeText('> 連線建立中...', 50)
  await new Promise(r => setTimeout(r, 500))
  await typeText('> 準備傳送訊息至 ' + basic.name + '...', 30)
  await new Promise(r => setTimeout(r, 500))
  messageStatus.value = 'sent'
}

const getContactHref = (contact: typeof contacts[0]) => {
  switch (contact.type) {
    case 'email':
      return `mailto:${contact.value}`
    default:
      return contact.value
  }
}
</script>

<template>
  <div class="contact-room">
    <!-- 歡迎訊息 -->
    <section class="welcome-section terminal-box">
      <div class="terminal-header">
        <span class="terminal-dot red"></span>
        <span class="terminal-dot yellow"></span>
        <span class="terminal-dot green"></span>
        <span class="terminal-title">connection.exe</span>
      </div>

      <div class="terminal-body">
        <p class="terminal-line">> 歡迎來到終點塔</p>
        <p class="terminal-line">> 你已成功探索迷宮</p>
        <p class="terminal-line">> 建立連線以開啟新的冒險...</p>
        <p class="terminal-line typing-cursor" v-if="messageStatus === 'idle'">
          > 選擇通訊頻道_
        </p>
        <p class="terminal-line" v-else-if="messageStatus === 'typing'">
          {{ displayText }}<span v-if="isTyping" class="cursor">_</span>
        </p>
        <p class="terminal-line success" v-else>
          > 頻道開啟！請選擇聯絡方式
        </p>
      </div>
    </section>

    <!-- 聯絡方式 -->
    <section class="contact-section">
      <h2 class="section-title">> 通訊頻道</h2>

      <div class="contact-grid">
        <a
          v-for="contact in contacts"
          :key="contact.type"
          :href="getContactHref(contact)"
          target="_blank"
          rel="noopener"
          class="contact-card terminal-box"
          @mouseenter="startMessage"
        >
          <span class="contact-icon">{{ contact.icon }}</span>
          <span class="contact-label">{{ contact.label }}</span>
          <span class="contact-value text-dim">{{ contact.value }}</span>
          <span class="contact-arrow">→</span>
        </a>
      </div>
    </section>

    <!-- 結語 -->
    <section class="outro-section terminal-box">
      <p class="outro-text">
        ████████████████████████████████████████
      </p>
      <p class="outro-message">
        感謝你的探索，期待與你的連線
      </p>
      <p class="outro-text">
        ████████████████████████████████████████
      </p>
    </section>
  </div>
</template>

<style scoped>
.contact-room {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* Terminal Section */
.welcome-section {
  padding: 0;
  overflow: hidden;
}

.terminal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: #1a1a1a;
  border-bottom: 1px solid var(--color-border);
}

.terminal-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.terminal-dot.red { background: #ff5f56; }
.terminal-dot.yellow { background: #ffbd2e; }
.terminal-dot.green { background: #27ca40; }

.terminal-title {
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
  color: var(--color-text-dim);
  margin-left: 10px;
}

.terminal-body {
  padding: 20px;
}

.terminal-line {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  color: var(--room-color);
  margin-bottom: 8px;
  line-height: 1.5;
}

.terminal-line.success {
  color: #27ca40;
}

.cursor {
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Contact Section */
.section-title {
  font-family: 'VT323', monospace;
  font-size: 1.3rem;
  color: var(--room-color);
  margin-bottom: 15px;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  cursor: pointer;
}

.contact-card:hover {
  border-color: var(--room-color);
  background: rgba(255, 176, 0, 0.05);
  transform: translateX(5px);
}

.contact-card:hover .contact-arrow {
  transform: translateX(5px);
  opacity: 1;
}

.contact-icon {
  font-size: 2rem;
}

.contact-label {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  color: var(--room-color);
}

.contact-value {
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
  flex: 1;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-arrow {
  font-family: 'VT323', monospace;
  font-size: 1.5rem;
  color: var(--room-color);
  opacity: 0;
  transition: all 0.3s ease;
}

/* Outro Section */
.outro-section {
  text-align: center;
  padding: 30px;
}

.outro-text {
  font-family: 'VT323', monospace;
  font-size: 0.8rem;
  color: var(--room-color);
  opacity: 0.5;
  margin-bottom: 15px;
}

.outro-text:last-child {
  margin-bottom: 0;
  margin-top: 15px;
}

.outro-message {
  font-family: 'VT323', monospace;
  font-size: 1.3rem;
  color: var(--color-text);
}

@media (max-width: 768px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }

  .contact-value {
    display: none;
  }
}
</style>
