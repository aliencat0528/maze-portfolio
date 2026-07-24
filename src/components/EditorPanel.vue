<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, ref } from 'vue'
import SiteTab from '@/components/editor/SiteTab.vue'
import WorksTab from '@/components/editor/WorksTab.vue'
import CategoriesTab from '@/components/editor/CategoriesTab.vue'
import ExhibitionsTab from '@/components/editor/ExhibitionsTab.vue'
import { EDITOR_STATUS } from '@/components/editor/status'

/**
 * 編輯面板殼：分頁切換 + 狀態列。各分頁（站台／作品／分類）為獨立元件，
 * 透過 provide 取得 `say`／`runBusy`（見 `editor/status.ts`）。
 *
 * 老實話（也寫在站台分頁裡）：所有編輯只存在這台瀏覽器的 localStorage 與 IndexedDB，
 * 訪客看到的仍是 repo 裡的資料。要讓改動變成正式版本，得用「匯出 JSON」帶走。
 */

const emit = defineEmits<{ close: [] }>()

type Tab = 'site' | 'works' | 'categories' | 'exhibitions'
const TABS: { id: Tab; label: string }[] = [
  { id: 'site', label: '站台' },
  { id: 'works', label: '作品' },
  { id: 'categories', label: '分類' },
  { id: 'exhibitions', label: '展覽' },
]
const tab = ref<Tab>('site')

const status = ref('')
const busy = ref(false)

function say(message: string) {
  status.value = message
  window.setTimeout(() => {
    if (status.value === message) status.value = ''
  }, 4000)
}

async function runBusy(task: () => Promise<void>) {
  busy.value = true
  try {
    await task()
  } catch (error) {
    say(error instanceof Error ? error.message : '操作失敗')
  } finally {
    busy.value = false
  }
}

provide(EDITOR_STATUS, { say, runBusy })

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <aside
    class="editor"
    role="dialog"
    aria-label="編輯內容"
  >
    <header class="editor__bar">
      <div class="editor__tabs">
        <button
          v-for="item in TABS"
          :key="item.id"
          type="button"
          class="tab"
          :class="{ 'is-active': tab === item.id }"
          @click="tab = item.id"
        >
          {{ item.label }}
        </button>
      </div>
      <button
        type="button"
        class="icon-button"
        aria-label="關閉編輯面板"
        @click="emit('close')"
      >
        ✕
      </button>
    </header>

    <div class="editor__body">
      <SiteTab v-if="tab === 'site'" />
      <WorksTab v-else-if="tab === 'works'" />
      <CategoriesTab v-else-if="tab === 'categories'" />
      <ExhibitionsTab v-else />
    </div>

    <footer
      class="editor__status"
      aria-live="polite"
    >
      {{ busy ? '處理中⋯' : status }}
    </footer>
  </aside>
</template>

<style scoped>
.editor {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
  display: flex;
  flex-direction: column;
  width: min(420px, 100%);
  background: var(--bg);
  border-left: 1px solid var(--line-strong);
  box-shadow: -12px 0 40px rgb(0 0 0 / 0.12);
  animation: slide-in 280ms var(--ease) both;
}

@keyframes slide-in {
  from {
    transform: translateX(2rem);
    opacity: 0;
  }
}

.editor__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--line);
}

.editor__tabs {
  display: flex;
  gap: 0.3rem;
}

.tab {
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  color: var(--ink-faint);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--card-radius);
  cursor: pointer;
}

.tab.is-active {
  color: var(--accent);
  border-color: var(--accent);
}

.icon-button {
  width: 2rem;
  height: 2rem;
  color: var(--ink-soft);
  background: transparent;
  border: 1px solid var(--line);
  cursor: pointer;
}

.icon-button:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.editor__body {
  flex: 1;
  padding: 1rem 0.9rem 2rem;
  overflow-y: auto;
}

.editor__status {
  padding: 0.5rem 0.9rem;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--accent);
  border-top: 1px solid var(--line);
  min-height: 2rem;
}
</style>
