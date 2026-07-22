<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Work } from '@/types'
import { CATEGORY_MAP } from '@/data/categories'

/**
 * 作品詳情。
 *
 * 這裡才載原圖（`work.src`），且圖仍受比例與 60vh 高度上限約束——
 * 牆上看不到全圖的問題在這一層解決，而不是把牆上的縮圖放大。
 */

const props = defineProps<{ work: Work }>()
const emit = defineEmits<{ close: []; step: [delta: number] }>()

const panel = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)

const category = computed(() => CATEGORY_MAP[props.work.category])

function focusableItems(): HTMLElement[] {
  if (!panel.value) return []
  return Array.from(
    panel.value.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])'),
  ).filter((el) => !el.hasAttribute('disabled'))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
    return
  }
  if (event.key === 'ArrowRight') {
    emit('step', 1)
    return
  }
  if (event.key === 'ArrowLeft') {
    emit('step', -1)
    return
  }
  if (event.key !== 'Tab') return

  // 焦點鎖在面板內，避免 Tab 跑到底下的作品牆
  const items = focusableItems()
  if (items.length === 0) return
  const first = items[0]
  const last = items[items.length - 1]
  const current = document.activeElement as HTMLElement | null

  if (event.shiftKey && (current === first || !panel.value?.contains(current))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && current === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
  closeButton.value?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div
    class="detail"
    role="dialog"
    aria-modal="true"
    :aria-label="work.title"
  >
    <div
      class="detail__backdrop"
      @click="emit('close')"
    />

    <article
      ref="panel"
      class="detail__panel"
    >
      <header class="detail__bar">
        <span class="detail__code">{{ category.code }} / {{ work.year }}</span>
        <span class="detail__nav">
          <button
            type="button"
            class="icon-button"
            aria-label="上一件"
            @click="emit('step', -1)"
          >
            ←
          </button>
          <button
            type="button"
            class="icon-button"
            aria-label="下一件"
            @click="emit('step', 1)"
          >
            →
          </button>
          <button
            ref="closeButton"
            type="button"
            class="icon-button icon-button--close"
            aria-label="關閉"
            @click="emit('close')"
          >
            ✕
          </button>
        </span>
      </header>

      <div class="detail__body">
        <figure class="detail__figure">
          <img
            class="detail__image"
            :src="work.src"
            :alt="work.alt"
            :width="work.width"
            :height="work.height"
            decoding="async"
          >
        </figure>

        <div class="detail__text">
          <h2 class="detail__title">
            {{ work.title }}
          </h2>

          <ul
            class="tags"
            aria-label="分類與媒材"
          >
            <li class="tag tag--category">
              {{ category.label }}
            </li>
            <li
              v-for="medium in work.media"
              :key="medium"
              class="tag"
            >
              {{ medium }}
            </li>
          </ul>

          <p class="detail__description">
            {{ work.description }}
          </p>

          <dl class="detail__facts">
            <dt>角色／貢獻</dt>
            <dd>{{ work.role }}</dd>
            <dt>年份</dt>
            <dd>{{ work.year }}</dd>
          </dl>

          <ul
            v-if="work.links.length > 0"
            class="detail__links"
          >
            <li
              v-for="link in work.links"
              :key="link.url"
            >
              <a
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ link.label }}
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.detail {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: clamp(0.75rem, 3vw, 2rem);
}

.detail__backdrop {
  position: absolute;
  inset: 0;
  background: rgb(28 28 26 / 0.42);
  backdrop-filter: blur(3px);
  animation: fade-in 240ms ease both;
}

.detail__panel {
  position: relative;
  width: min(1080px, 100%);
  max-height: 100%;
  overflow-y: auto;
  background: var(--bg);
  border: 1px solid var(--line-strong);
  border-radius: var(--card-radius);
  animation: panel-in 320ms var(--ease) both;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateY(1.2rem);
  }
}

.detail__bar {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  background: var(--bg);
  border-bottom: 1px solid var(--line);
}

.detail__code {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  color: var(--ink-faint);
}

.detail__nav {
  display: flex;
  gap: 0.3rem;
}

.icon-button {
  width: 2rem;
  height: 2rem;
  font-size: 0.85rem;
  color: var(--ink-soft);
  background: transparent;
  border: 1px solid var(--line);
  cursor: pointer;
  transition: color 200ms var(--ease), border-color 200ms var(--ease);
}

.icon-button:hover,
.icon-button:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}

.detail__body {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: clamp(1rem, 3vw, 2.25rem);
  padding: clamp(1rem, 3vw, 2rem);
}

.detail__figure {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.detail__image {
  /* 中圖：保持圖片固有比例縮進盒內，高度上限 60vh —— 詳情頁也不放巨圖。
     這裡不套 aspect-ratio，否則會蓋掉真圖自己的比例把畫裁歪 */
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  background: var(--surface);
  border: 1px solid var(--line);
}

.detail__title {
  font-size: clamp(1.2rem, 2.6vw, 1.7rem);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.75rem;
  list-style: none;
}

.tag {
  padding: 0.2rem 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.64rem;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  border: 1px solid var(--line-strong);
}

.tag--category {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  border-color: var(--accent);
}

.detail__description {
  margin-top: 1.1rem;
  font-size: 0.9rem;
  line-height: 1.85;
  color: var(--ink-soft);
}

.detail__facts {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.4rem 1rem;
  margin-top: 1.4rem;
  padding-top: 1.1rem;
  border-top: 1px solid var(--line);
}

.detail__facts dt {
  font-family: var(--font-mono);
  font-size: 0.64rem;
  letter-spacing: 0.06em;
  color: var(--ink-faint);
}

.detail__facts dd {
  font-size: 0.85rem;
  color: var(--ink);
}

.detail__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.4rem;
  list-style: none;
}

.detail__links a {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  padding: 0.45rem 0.8rem;
  font-size: 0.8rem;
  color: var(--ink);
  text-decoration: none;
  border: 1px solid var(--line-strong);
  transition: color 200ms var(--ease), border-color 200ms var(--ease);
}

.detail__links a:hover,
.detail__links a:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}

@media (max-width: 899px) {
  .detail {
    padding: 0;
  }

  .detail__panel {
    height: 100%;
    max-height: 100%;
    border: none;
    border-radius: 0;
  }

  .detail__body {
    grid-template-columns: minmax(0, 1fr);
  }

  .detail__image {
    max-height: 46vh;
  }
}
</style>
