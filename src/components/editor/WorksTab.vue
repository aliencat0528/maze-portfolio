<script setup lang="ts">
import { inject, ref } from 'vue'
import type { Work } from '@/types'
import WorkForm from '@/components/WorkForm.vue'
import { categoryOf } from '@/data/categories'
import { useLibrary, type WorkDraft } from '@/composables/useLibrary'
import { EDITOR_STATUS } from '@/components/editor/status'

/** 作品分頁：新增／編輯／換圖／刪除，列出所有作品 */

const { allWorks, categories, addWork, updateWork, replaceImage, removeWork } = useLibrary()
const { say, runBusy } = inject(EDITOR_STATUS)!

const editing = ref<Work | null>(null)
const creating = ref(false)

async function onSubmit(payload: { draft: WorkDraft; file: File | null }) {
  await runBusy(async () => {
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
  })
}

async function onReplaceImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !editing.value) return
  const id = editing.value.id
  await runBusy(async () => {
    await replaceImage(id, file)
    say('已換圖')
  })
  input.value = ''
}

async function onRemove(work: Work) {
  await removeWork(work.id)
  if (editing.value?.id === work.id) editing.value = null
  say(work.custom ? '已刪除' : '已隱藏（可還原）')
}
</script>

<template>
  <div>
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
          v-for="work in allWorks"
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
              {{ categoryOf(work.category, categories).label }} · {{ work.year }}
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
  </div>
</template>

<style scoped>
.block__title {
  margin-bottom: 0.7rem;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--accent);
}

.block__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.8rem;
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
</style>
