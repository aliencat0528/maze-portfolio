<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { BackgroundId, Work } from '@/types'
import type { WorkDraft } from '@/composables/useLibrary'
import WorkForm from '@/components/WorkForm.vue'
import { BACKGROUNDS } from '@/data/backgrounds'
import { CATEGORY_MAP } from '@/data/categories'
import { useLibrary } from '@/composables/useLibrary'
import { useSettings } from '@/composables/useSettings'

/**
 * 編輯面板：改站台資訊、換整體背景、新增／編輯／移除作品、匯出匯入。
 *
 * 老實話（也寫在面板裡）：所有編輯只存在這台瀏覽器的 localStorage 與 IndexedDB，
 * 訪客看到的仍是 repo 裡的資料。要讓改動變成正式版本，得用「匯出 JSON」帶走。
 */

const emit = defineEmits<{ close: [] }>()

const { settings, update } = useSettings()
const { allWorks, addWork, updateWork, replaceImage, removeWork, restorePresets, exportJson, importJson } =
  useLibrary()

const tab = ref<'site' | 'works'>('site')
const editing = ref<Work | null>(null)
const creating = ref(false)
const status = ref('')
const busy = ref(false)
const replaceInput = ref<HTMLInputElement | null>(null)

const editableWorks = computed(() => allWorks.value)

function say(message: string) {
  status.value = message
  window.setTimeout(() => {
    if (status.value === message) status.value = ''
  }, 4000)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

async function onSubmit(payload: { draft: WorkDraft; file: File | null }) {
  busy.value = true
  try {
    if (creating.value && payload.file) {
      await addWork(payload.draft, payload.file)
      creating.value = false
      say('已新增作品')
    } else if (editing.value) {
      updateWork(editing.value.id, {
        ...payload.draft,
        alt: `${payload.draft.title}——${payload.draft.media.join('、')}`,
      })
      editing.value = null
      say('已儲存')
    }
  } catch (error) {
    say(error instanceof Error ? error.message : '操作失敗')
  } finally {
    busy.value = false
  }
}

async function onReplaceImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !editing.value) return
  busy.value = true
  try {
    await replaceImage(editing.value.id, file)
    say('已換圖')
  } finally {
    busy.value = false
    input.value = ''
  }
}

async function onRemove(work: Work) {
  await removeWork(work.id)
  if (editing.value?.id === work.id) editing.value = null
  say(work.custom ? '已刪除' : '已隱藏（可還原）')
}

async function onExport() {
  const json = await exportJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `artwall-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  say('已下載 JSON')
}

async function onImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  busy.value = true
  try {
    await importJson(await file.text())
    say('已匯入')
  } catch {
    say('匯入失敗：檔案格式不符')
  } finally {
    busy.value = false
    input.value = ''
  }
}

function pickBackground(id: BackgroundId) {
  update({ background: id })
}
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
          type="button"
          class="tab"
          :class="{ 'is-active': tab === 'site' }"
          @click="tab = 'site'"
        >
          站台
        </button>
        <button
          type="button"
          class="tab"
          :class="{ 'is-active': tab === 'works' }"
          @click="tab = 'works'"
        >
          作品
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
      <template v-if="tab === 'site'">
        <section class="block">
          <h3 class="block__title">
            整體背景
          </h3>
          <div class="swatches">
            <button
              v-for="background in BACKGROUNDS"
              :key="background.id"
              type="button"
              class="swatch"
              :class="{ 'is-active': settings.background === background.id }"
              :style="{
                background: background.tokens['--bg'],
                color: background.tokens['--ink'],
                borderColor: background.tokens['--line-strong'],
              }"
              @click="pickBackground(background.id)"
            >
              {{ background.label }}
            </button>
          </div>
        </section>

        <section class="block">
          <h3 class="block__title">
            站台資訊
          </h3>
          <label class="field">
            <span class="field__label">分頁標題</span>
            <input
              :value="settings.siteTitle"
              type="text"
              class="field__input"
              @input="update({ siteTitle: ($event.target as HTMLInputElement).value })"
            >
          </label>
          <label class="field">
            <span class="field__label">姓名／站名</span>
            <input
              :value="settings.name"
              type="text"
              class="field__input"
              @input="update({ name: ($event.target as HTMLInputElement).value })"
            >
          </label>
          <label class="field">
            <span class="field__label">簡介</span>
            <textarea
              :value="settings.statement"
              class="field__input field__input--area"
              rows="3"
              @input="update({ statement: ($event.target as HTMLTextAreaElement).value })"
            />
          </label>
          <label class="field">
            <span class="field__label">聯絡信箱</span>
            <input
              :value="settings.email"
              type="email"
              class="field__input"
              @input="update({ email: ($event.target as HTMLInputElement).value })"
            >
          </label>
        </section>

        <section class="block">
          <h3 class="block__title">
            資料
          </h3>
          <p class="block__note">
            編輯只存在這台瀏覽器（localStorage 與 IndexedDB）。訪客看到的仍是專案內建資料——
            要讓改動成為正式版本，請匯出 JSON 交給開發流程。
          </p>
          <div class="block__actions">
            <button
              type="button"
              class="button"
              @click="onExport"
            >
              匯出 JSON
            </button>
            <label class="button">
              匯入 JSON
              <input
                type="file"
                accept="application/json"
                class="visually-hidden"
                @change="onImport"
              >
            </label>
            <button
              type="button"
              class="button"
              @click="restorePresets(); say('已還原內建作品')"
            >
              還原內建作品
            </button>
          </div>
        </section>
      </template>

      <template v-else>
        <section
          v-if="creating || editing"
          class="block"
        >
          <h3 class="block__title">
            {{ creating ? '新增作品' : `編輯：${editing?.title}` }}
          </h3>

          <div
            v-if="editing?.custom"
            class="block__actions"
          >
            <label class="button">
              換一張圖
              <input
                ref="replaceInput"
                type="file"
                accept="image/*"
                class="visually-hidden"
                @change="onReplaceImage"
              >
            </label>
          </div>

          <WorkForm
            :key="editing?.id ?? 'new'"
            :mode="creating ? 'create' : 'edit'"
            :work="editing"
            @submit="onSubmit"
            @cancel="creating = false; editing = null"
          />
        </section>

        <section
          v-else
          class="block"
        >
          <button
            type="button"
            class="button button--primary"
            @click="creating = true"
          >
            ＋ 新增作品
          </button>

          <ul class="work-list">
            <li
              v-for="work in editableWorks"
              :key="work.id"
              class="work-row"
            >
              <img
                :src="work.thumb"
                :alt="work.alt"
                class="work-row__thumb"
                width="48"
                height="48"
              >
              <span class="work-row__meta">
                <span class="work-row__title">{{ work.title }}</span>
                <span class="work-row__sub">
                  {{ CATEGORY_MAP[work.category].label }} · {{ work.year }}
                  <em v-if="work.custom">· 自訂</em>
                </span>
              </span>
              <span class="work-row__actions">
                <button
                  type="button"
                  class="button button--small"
                  @click="editing = work"
                >
                  編輯
                </button>
                <button
                  type="button"
                  class="button button--small"
                  @click="onRemove(work)"
                >
                  {{ work.custom ? '刪除' : '隱藏' }}
                </button>
              </span>
            </li>
          </ul>
        </section>
      </template>
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

.block + .block {
  margin-top: 1.6rem;
  padding-top: 1.2rem;
  border-top: 1px solid var(--line);
}

.block__title {
  margin-bottom: 0.7rem;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--accent);
}

.block__note {
  margin-bottom: 0.8rem;
  font-size: 0.72rem;
  line-height: 1.7;
  color: var(--ink-faint);
}

.block__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.8rem;
}

.swatches {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
}

.swatch {
  padding: 1rem 0.6rem;
  font-size: 0.76rem;
  border: 1px solid;
  border-radius: var(--card-radius);
  cursor: pointer;
  transition: box-shadow 200ms var(--ease);
}

.swatch.is-active {
  box-shadow: 0 0 0 2px var(--accent);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.7rem;
}

.field__label {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}

.field__input {
  width: 100%;
  padding: 0.45rem 0.55rem;
  font: inherit;
  font-size: 0.82rem;
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--line-strong);
  border-radius: var(--card-radius);
}

.field__input:focus-visible {
  border-color: var(--accent);
  outline: none;
}

.field__input--area {
  resize: vertical;
  line-height: 1.7;
}

.button {
  display: inline-block;
  padding: 0.45rem 0.85rem;
  font-size: 0.78rem;
  color: var(--ink-soft);
  background: transparent;
  border: 1px solid var(--line-strong);
  border-radius: var(--card-radius);
  cursor: pointer;
  transition: color 200ms var(--ease), border-color 200ms var(--ease);
}

.button:hover,
.button:focus-within {
  color: var(--accent);
  border-color: var(--accent);
}

.button--primary {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-color: var(--accent);
}

.button--small {
  padding: 0.3rem 0.55rem;
  font-size: 0.7rem;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.work-list {
  margin-top: 1rem;
  list-style: none;
}

.work-row {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--line);
}

.work-row__thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  background: var(--surface);
  border: 1px solid var(--line);
}

.work-row__meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.work-row__title {
  overflow: hidden;
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-row__sub {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: var(--ink-faint);
}

.work-row__sub em {
  color: var(--accent);
  font-style: normal;
}

.work-row__actions {
  display: flex;
  flex-shrink: 0;
  gap: 0.3rem;
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
