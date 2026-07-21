<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import EditorPanel from '@/components/EditorPanel.vue'
import IntroSequence from '@/components/IntroSequence.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import WorkDetail from '@/components/WorkDetail.vue'
import WorkRail from '@/components/WorkRail.vue'
import { useAppearance } from '@/composables/useAppearance'
import { useGallery } from '@/composables/useGallery'
import { useLibrary } from '@/composables/useLibrary'
import { usePrefersReducedMotion } from '@/composables/useMediaQuery'
import { useSettings } from '@/composables/useSettings'

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

const { settings } = useSettings()
const { init } = useLibrary()

useAppearance(
  activeCategory,
  computed(() => settings.value.background),
)

const reducedMotion = usePrefersReducedMotion()
const editorOpen = ref(false)

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
  init()
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
      :name="settings.name"
      :statement="settings.statement"
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
      <div class="app__footer-right">
        <button
          type="button"
          class="app__edit"
          @click="editorOpen = true"
        >
          編輯內容
        </button>
        <a
          class="app__contact"
          :href="`mailto:${settings.email}`"
        >{{ settings.email }}</a>
      </div>
    </footer>

    <WorkDetail
      v-if="selectedWork"
      :work="selectedWork"
      @close="closeWork"
      @step="stepWork"
    />

    <EditorPanel
      v-if="editorOpen"
      @close="editorOpen = false"
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
  /* 頁尾也用強調色收邊，讓分類的存在感貫穿整頁 */
  border-top: 2px solid var(--accent);
}

.app__footer-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app__hint,
.app__contact,
.app__edit {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}

.app__edit {
  padding: 0.3rem 0.6rem;
  background: transparent;
  border: 1px solid var(--line-strong);
  border-radius: var(--card-radius);
  cursor: pointer;
  transition: color 200ms var(--ease), border-color 200ms var(--ease);
}

.app__contact {
  color: var(--ink-soft);
  text-decoration: none;
  border-bottom: 1px solid var(--accent);
  transition: color 200ms var(--ease);
}

.app__edit:hover,
.app__edit:focus-visible,
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
