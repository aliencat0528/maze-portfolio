<script setup lang="ts">
import type { Category, FilterId } from '@/types'

/** 站頭：左為作者資訊，右為分類切換（原本的顏色切換改為分類切換，見 MR-008） */

defineProps<{
  categories: Category[]
  active: FilterId
  count: number
  name: string
  statement: string
}>()

const emit = defineEmits<{ select: [id: FilterId] }>()
</script>

<template>
  <header class="header">
    <div class="header__identity">
      <h1 class="header__name">
        {{ name }}
      </h1>
      <p class="header__statement">
        {{ statement }}
      </p>
    </div>

    <nav
      class="header__nav"
      aria-label="作品分類"
    >
      <ul class="filters">
        <li>
          <button
            type="button"
            class="filter"
            :class="{ 'is-active': active === 'all' }"
            :aria-pressed="active === 'all'"
            @click="emit('select', 'all')"
          >
            <span class="filter__code">ALL</span>
            <span class="filter__label">全部</span>
          </button>
        </li>
        <li
          v-for="category in categories"
          :key="category.id"
        >
          <button
            type="button"
            class="filter"
            :class="{ 'is-active': active === category.id }"
            :aria-pressed="active === category.id"
            @click="emit('select', category.id)"
          >
            <span class="filter__code">{{ category.code }}</span>
            <span class="filter__label">{{ category.label }}</span>
          </button>
        </li>
      </ul>
      <p
        class="header__count"
        aria-live="polite"
      >
        {{ count }} 件
      </p>
    </nav>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.25rem 2rem;
  padding: clamp(1.25rem, 3vw, 2rem) var(--page-x) 1rem;
  /* 站頭底線用強調色：切換分類時整條線換色，是最不干擾作品又看得見的訊號 */
  border-bottom: 2px solid var(--accent);
  transition: border-color 320ms var(--ease);
}

.header__name {
  position: relative;
  display: inline-block;
  padding-bottom: 0.3rem;
  font-size: clamp(1.1rem, 2.4vw, 1.5rem);
  font-weight: 600;
  letter-spacing: 0.12em;
}

/* 姓名下的短強調線，跟著分類換色 */
.header__name::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 2.4rem;
  height: 3px;
  background: var(--accent);
  transition: background-color 320ms var(--ease), width 320ms var(--ease);
}

.header__statement {
  max-width: 34ch;
  margin-top: 0.35rem;
  font-size: 0.82rem;
  line-height: 1.6;
  color: var(--ink-soft);
}

.header__nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filters {
  display: flex;
  gap: 0.35rem;
  list-style: none;
  overflow-x: auto;
  scrollbar-width: none;
}

.filters::-webkit-scrollbar {
  display: none;
}

.filter {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  padding: 0.4rem 0.7rem;
  white-space: nowrap;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--card-radius);
  cursor: pointer;
  transition: background-color 220ms var(--ease), border-color 220ms var(--ease),
    color 220ms var(--ease);
}

.filter__code {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  color: var(--ink-faint);
  transition: color 220ms var(--ease);
}

.filter__label {
  font-size: 0.82rem;
  color: var(--ink-soft);
  transition: color 220ms var(--ease);
}

.filter:hover {
  border-color: var(--line-strong);
}

/* 選中的分類：強調色外框 + 底色，深淺背景下都成立
   （不靠固定的淺色底，否則暗展廳背景會整塊發亮） */
.filter.is-active {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  border-color: var(--accent);
  box-shadow: inset 0 -3px 0 var(--accent);
}

.filter.is-active .filter__code,
.filter.is-active .filter__label {
  color: var(--accent);
}

.header__count {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}

@media (max-width: 899px) {
  .header {
    align-items: stretch;
    padding-bottom: 0.75rem;
  }

  .header__nav {
    width: 100%;
    justify-content: space-between;
  }

  .filters {
    /* 窄螢幕讓分類列可橫向滑動，不換行擠壓版面 */
    margin-right: 0.5rem;
    padding-bottom: 0.25rem;
  }
}
</style>
