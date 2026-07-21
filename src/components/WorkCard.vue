<script setup lang="ts">
import { computed } from 'vue'
import type { Work } from '@/types'
import { CATEGORY_MAP } from '@/data/categories'
import { ASPECT_RATIO } from '@/utils/placeholder'

/**
 * 牆面上的一件作品。
 *
 * 尺寸由 `aspect` 鎖死（aspect-ratio + object-fit: cover），圖片再大也不會撐破版面；
 * 縮圖只載 `thumb`，原圖留給詳情頁。
 */

const props = defineProps<{ work: Work }>()
const emit = defineEmits<{ open: [id: string] }>()

const category = computed(() => CATEGORY_MAP[props.work.category])
const ratio = computed(() => ASPECT_RATIO[props.work.aspect])
</script>

<template>
  <button
    type="button"
    class="card"
    :style="{ '--ar': ratio }"
    :aria-label="`開啟作品：${work.title}`"
    @click="emit('open', work.id)"
  >
    <span class="card__frame">
      <img
        class="card__image"
        :src="work.thumb"
        :alt="work.alt"
        :width="work.width"
        :height="work.height"
        loading="lazy"
        decoding="async"
      >
      <span class="card__code">{{ category.code }}</span>
      <span class="card__hover">
        <span class="card__hover-media">{{ work.media.join(' · ') }}</span>
      </span>
    </span>

    <span class="card__meta">
      <span class="card__title">{{ work.title }}</span>
      <span class="card__sub">{{ category.label }} · {{ work.year }}</span>
    </span>
  </button>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
}

.card__frame {
  position: relative;
  display: block;
  /* 網格模式：寬度由欄位決定，高度由比例推得。
     長廊模式反過來（高度給定、寬度推得），覆寫在 WorkRail.vue */
  width: 100%;
  overflow: hidden;
  aspect-ratio: var(--ar);
  background: var(--surface);
  border: var(--card-border) solid var(--line-strong);
  border-radius: var(--card-radius);
  transition: border-color 320ms var(--ease), box-shadow 320ms var(--ease);
}

.card__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 480ms var(--ease);
}

.card__code {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.12rem 0.34rem;
  font-family: var(--font-mono);
  font-size: 0.58rem;
  letter-spacing: 0.12em;
  color: var(--ink-soft);
  background: rgb(255 255 255 / 0.86);
  opacity: 0;
  transition: opacity 320ms var(--ease);
}

.card__hover {
  position: absolute;
  inset: auto 0 0 0;
  padding: 1.1rem 0.7rem 0.55rem;
  background: linear-gradient(to top, rgb(20 20 18 / 0.62), transparent);
  opacity: 0;
  transition: opacity 320ms var(--ease);
}

.card__hover-media {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: #fff;
}

.card:hover .card__frame,
.card:focus-visible .card__frame {
  border-color: var(--accent);
  box-shadow: 0 10px 30px rgb(20 20 18 / 0.12);
}

.card:hover .card__image,
.card:focus-visible .card__image {
  transform: scale(1.05);
}

.card:hover .card__code,
.card:focus-visible .card__code,
.card:hover .card__hover,
.card:focus-visible .card__hover {
  opacity: 1;
}

.card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 6px;
}

.card__meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  /* 說明文字寬度跟隨卡片，長標題不會把卡片撐寬 */
  width: 100%;
  min-width: 0;
}

.card__title {
  overflow: hidden;
  font-size: 0.86rem;
  color: var(--ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card__sub {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: var(--ink-faint);
}
</style>
