<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import IntroSequence from '@/components/IntroSequence.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import WorkDetail from '@/components/WorkDetail.vue'
import WorkRail from '@/components/WorkRail.vue'
import { useCategoryTheme } from '@/composables/useCategoryTheme'
import { useGallery } from '@/composables/useGallery'
import { usePrefersReducedMotion } from '@/composables/useMediaQuery'
import { PROFILE } from '@/data/works'

const INTRO_KEY = 'artwall.intro.seen.v1'

const {
  categories,
  activeCategory,
  filteredWorks,
  selectedWork,
  setCategory,
  openWork,
  closeWork,
  stepWork,
  syncFromUrl,
} = useGallery()

useCategoryTheme(activeCategory)

const reducedMotion = usePrefersReducedMotion()

/** localStorage 在 Safari 無痕模式會丟例外，不能讓開場判斷連累整站 */
function readIntroSeen(): boolean {
  try {
    return window.localStorage.getItem(INTRO_KEY) === '1'
  } catch {
    return false
  }
}

function writeIntroSeen(): void {
  try {
    window.localStorage.setItem(INTRO_KEY, '1')
  } catch {
    // 存不了就算了，最多下次再播一次開場
  }
}

const params = new URLSearchParams(window.location.search)

// 已看過、系統要求減少動態、或帶著作品深連結進站 → 不播開場，直接進牆。
// `?intro=1` 強制重播，方便重看與展示（減少動態設定仍優先）
const showIntro = ref(
  !reducedMotion.value && (params.get('intro') === '1' || (!readIntroSeen() && !params.has('w'))),
)

function finishIntro(): void {
  showIntro.value = false
  writeIntroSeen()
}

onMounted(() => {
  syncFromUrl()
  window.addEventListener('popstate', syncFromUrl)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', syncFromUrl)
})
</script>

<template>
  <div class="app">
    <SiteHeader
      :categories="categories"
      :active="activeCategory"
      :count="filteredWorks.length"
      @select="setCategory"
    />

    <main class="app__main">
      <WorkRail
        :works="filteredWorks"
        :active="activeCategory"
        @open="openWork"
      />
    </main>

    <footer class="app__footer">
      <p class="app__hint">
        滾動瀏覽長廊 · 點擊作品看細節
      </p>
      <a
        class="app__contact"
        :href="`mailto:${PROFILE.email}`"
      >{{ PROFILE.email }}</a>
    </footer>

    <WorkDetail
      v-if="selectedWork"
      :work="selectedWork"
      @close="closeWork"
      @step="stepWork"
    />

    <IntroSequence
      v-if="showIntro"
      @done="finishIntro"
    />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
}

.app__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
  padding: 1rem var(--page-x) 1.5rem;
  border-top: 1px solid var(--line);
}

.app__hint,
.app__contact {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}

.app__contact {
  color: var(--ink-soft);
  text-decoration: none;
  border-bottom: 1px solid var(--line-strong);
  transition: color 200ms var(--ease), border-color 200ms var(--ease);
}

.app__contact:hover,
.app__contact:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}

@media (max-width: 899px) {
  .app__hint {
    display: none;
  }
}
</style>
