<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { FilterId, Work } from '@/types'
import WorkCard from '@/components/WorkCard.vue'
import { useIsWide } from '@/composables/useMediaQuery'

/**
 * 作品牆本體。
 *
 * 寬螢幕＝水平長廊：固定軌道高度、卡片以 aspect-ratio 決定寬度、上中下交叉懸掛。
 * 因為軌道高度固定且每張卡片都 ≤ 軌道高，交叉排列不可能把版面推爆。
 * 窄螢幕＝垂直網格：手機上水平捲動會和頁面捲動打架，直接降級。
 */

const props = defineProps<{ works: Work[]; active: FilterId }>()
const emit = defineEmits<{ open: [id: string] }>()

const isWide = useIsWide()
const rail = ref<HTMLElement | null>(null)
const progress = ref(0)

/** 切換分類時換掉 key，讓卡片重新播放漸入並把長廊捲回起點 */
const listKey = computed(() => props.active)

function updateProgress() {
  const el = rail.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  progress.value = max > 0 ? el.scrollLeft / max : 0
}

/**
 * 直向滾輪映射為水平捲動。
 * 只在長廊模式、且使用者確實是直向滾動時接管；橫向滾輪／觸控板手勢交還原生行為。
 */
function onWheel(event: WheelEvent) {
  const el = rail.value
  if (!el || !isWide.value) return
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
  const max = el.scrollWidth - el.clientWidth
  if (max <= 0) return
  event.preventDefault()
  el.scrollLeft += event.deltaY
}

onMounted(() => {
  rail.value?.addEventListener('wheel', onWheel, { passive: false })
  updateProgress()
})

onBeforeUnmount(() => {
  rail.value?.removeEventListener('wheel', onWheel)
})

watch(
  () => props.works,
  () => {
    rail.value?.scrollTo({ left: 0 })
    progress.value = 0
  },
)
</script>

<template>
  <section
    class="wall"
    :class="isWide ? 'wall--rail' : 'wall--grid'"
    aria-label="作品牆"
  >
    <p
      v-if="works.length === 0"
      class="wall__empty"
    >
      這個分類還沒有作品。
    </p>

    <ul
      v-else
      :key="listKey"
      ref="rail"
      class="wall__track"
      tabindex="0"
      aria-label="作品清單，可用方向鍵瀏覽"
      @scroll="updateProgress"
    >
      <li
        v-for="(work, index) in works"
        :key="work.id"
        class="wall__item"
        :class="`is-${work.aspect}`"
        :style="{ '--i': Math.min(index, 12) }"
      >
        <WorkCard
          :work="work"
          @open="emit('open', $event)"
        />
      </li>
    </ul>

    <!-- 水平捲動會讓人失去「還有多少」的感覺，補一條進度指示 -->
    <div
      v-if="isWide && works.length > 0"
      class="wall__progress"
      aria-hidden="true"
    >
      <span
        class="wall__progress-bar"
        :style="{ transform: `scaleX(${progress || 0.02})` }"
      />
    </div>
  </section>
</template>

<style scoped>
.wall {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.wall__empty {
  padding: 4rem var(--page-x);
  font-size: 0.9rem;
  color: var(--ink-faint);
}

.wall__track {
  list-style: none;
}

.wall__track:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -4px;
}

.wall__item {
  animation: rise-in 620ms var(--ease) both;
  animation-delay: calc(var(--i) * 55ms);
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(1.4rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---- 長廊模式（≥900px）---- */
.wall--rail .wall__track {
  display: flex;
  align-items: stretch;
  gap: var(--wall-gap);
  height: var(--rail-h);
  /* 下方留 3.5rem：卡片說明文字絕對定位在圖片下緣，靠底懸掛的卡片要有地方放 */
  padding: 2.5rem var(--page-x) 4rem;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x proximity;
  overscroll-behavior-x: contain;
  /* 藏掉原生水平捲軸——它會橫過畫面中段壓住作品說明。
     方位感改由下方的進度指示提供，滾輪／方向鍵／拖曳皆照常 */
  scrollbar-width: none;
}

.wall--rail .wall__track::-webkit-scrollbar {
  display: none;
}

.wall--rail .wall__item {
  flex: 0 0 auto;
  height: 84%;
  scroll-snap-align: center;
}

/* 各版位的高度差，讓長廊有起伏而非一條齊平的帶子 */
.wall--rail .wall__item.is-portrait {
  height: 100%;
}

.wall--rail .wall__item.is-landscape {
  height: 78%;
}

.wall--rail .wall__item.is-video {
  height: 74%;
}

/* 交叉懸掛：上／中／下輪替。卡片高度皆 ≤ 軌道高，故不會溢出 */
.wall--rail .wall__item:nth-child(3n + 1) {
  align-self: flex-start;
}

.wall--rail .wall__item:nth-child(3n + 2) {
  align-self: center;
}

.wall--rail .wall__item:nth-child(3n) {
  align-self: flex-end;
}

/* 長廊模式的尺寸來源：軌道高 → 卡片高 → 圖框高 → 由 aspect-ratio 反推圖框寬。
   卡片寬度因此完全由圖框決定，說明文字絕對定位、不參與寬度計算，
   標題再長也不會把卡片撐寬。 */
.wall--rail :deep(.card) {
  align-items: flex-start;
  height: 100%;
}

.wall--rail :deep(.card__frame) {
  width: auto;
  height: 100%;
}

.wall--rail :deep(.card__meta) {
  position: absolute;
  top: calc(100% + 0.55rem);
  left: 0;
}

.wall__progress {
  position: absolute;
  right: var(--page-x);
  bottom: 0.3rem;
  left: var(--page-x);
  height: 1px;
  background: var(--line);
}

.wall__progress-bar {
  display: block;
  height: 100%;
  background: var(--accent);
  transform-origin: left center;
  transition: transform 120ms linear;
}

/* ---- 網格模式（<900px）---- */
/* 平板（600–899px）三欄：兩欄在這個寬度會讓單張圖大到要捲動才看得完 */
.wall--grid .wall__track {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--wall-gap);
  padding: 1.5rem var(--page-x) 3rem;
}

@media (max-width: 599px) {
  .wall--grid .wall__track {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 橫幅與影片佔滿兩欄，其餘各佔一欄——固定規則，不用 dense 重排，閱讀順序才不會亂 */
.wall--grid .wall__item.is-landscape,
.wall--grid .wall__item.is-video {
  grid-column: span 2;
}

@media (max-width: 460px) {
  .wall--grid .wall__track {
    grid-template-columns: minmax(0, 1fr);
  }

  .wall--grid .wall__item.is-landscape,
  .wall--grid .wall__item.is-video {
    grid-column: span 1;
  }
}
</style>
