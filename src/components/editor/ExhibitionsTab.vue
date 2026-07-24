<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { Exhibition, Work } from '@/types'
import { useLibrary } from '@/composables/useLibrary'
import { EDITOR_STATUS } from '@/components/editor/status'

/**
 * 展覽分頁：新增／編輯／刪除展覽，並編排作品動線（有序）與前言（MR-012 ①）。
 * 展覽與分類正交——同一件作品可屬某分類、又出現在多個展覽裡。
 */

const { allWorks, exhibitions, addExhibition, updateExhibition, removeExhibition } = useLibrary()
const { say } = inject(EDITOR_STATUS)!

const open = ref(false)
const editingId = ref<string | null>(null)
const title = ref('')
const preface = ref('')
const workIds = ref<string[]>([])
const error = ref('')

const orderedWorks = computed<Work[]>(() =>
  workIds.value
    .map((id) => allWorks.value.find((work) => work.id === id))
    .filter((work): work is Work => Boolean(work)),
)
const availableWorks = computed<Work[]>(() =>
  allWorks.value.filter((work) => !workIds.value.includes(work.id)),
)

function reset() {
  title.value = ''
  preface.value = ''
  workIds.value = []
  error.value = ''
}

function startCreate() {
  reset()
  editingId.value = null
  open.value = true
}

function startEdit(exhibition: Exhibition) {
  title.value = exhibition.title
  preface.value = exhibition.preface
  workIds.value = [...exhibition.workIds]
  error.value = ''
  editingId.value = exhibition.id
  open.value = true
}

function cancel() {
  open.value = false
}

function addToLine(id: string) {
  workIds.value = [...workIds.value, id]
}

function removeFromLine(id: string) {
  workIds.value = workIds.value.filter((workId) => workId !== id)
}

function move(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= workIds.value.length) return
  const next = [...workIds.value]
  ;[next[index], next[target]] = [next[target], next[index]]
  workIds.value = next
}

function submit() {
  const name = title.value.trim()
  if (!name) {
    error.value = '請填展覽名稱'
    return
  }
  if (editingId.value) {
    updateExhibition(editingId.value, { title: name, preface: preface.value.trim(), workIds: workIds.value })
    say('已儲存展覽')
  } else {
    addExhibition({
      id: `ex-${Date.now().toString(36)}`,
      title: name,
      preface: preface.value.trim(),
      workIds: workIds.value,
    })
    say('已新增展覽')
  }
  open.value = false
}

function onDelete(exhibition: Exhibition) {
  removeExhibition(exhibition.id)
  say('已刪除展覽')
  if (editingId.value === exhibition.id) open.value = false
}
</script>

<template>
  <div>
    <section
      v-if="open"
      class="block"
    >
      <h3 class="block__title">
        {{ editingId ? '編輯展覽' : '新增展覽' }}
      </h3>

      <label class="field">
        <span class="field__label">展覽名稱</span>
        <input
          v-model="title"
          type="text"
          class="field__input"
          placeholder="2025 個展：材料的記憶"
        >
      </label>

      <label class="field">
        <span class="field__label">前言</span>
        <textarea
          v-model="preface"
          class="field__input field__input--area"
          rows="3"
          placeholder="這條動線想說的話⋯⋯"
        />
      </label>

      <h3 class="block__title block__title--sub">
        動線（{{ orderedWorks.length }} 件，順序即展出動線）
      </h3>
      <ul
        v-if="orderedWorks.length"
        class="line-list"
      >
        <li
          v-for="(work, index) in orderedWorks"
          :key="work.id"
          class="line-row"
        >
          <span class="line-row__index">{{ index + 1 }}</span>
          <span class="line-row__title">{{ work.title }}</span>
          <span class="line-row__actions">
            <button
              type="button"
              class="button button--small"
              :disabled="index === 0"
              aria-label="上移"
              @click="move(index, -1)"
            >
              ↑
            </button>
            <button
              type="button"
              class="button button--small"
              :disabled="index === orderedWorks.length - 1"
              aria-label="下移"
              @click="move(index, 1)"
            >
              ↓
            </button>
            <button
              type="button"
              class="button button--small"
              @click="removeFromLine(work.id)"
            >
              移除
            </button>
          </span>
        </li>
      </ul>
      <p
        v-else
        class="block__note"
      >
        還沒有加入作品。從下方挑選加入動線。
      </p>

      <h3
        v-if="availableWorks.length"
        class="block__title block__title--sub"
      >
        加入作品
      </h3>
      <ul
        v-if="availableWorks.length"
        class="line-list"
      >
        <li
          v-for="work in availableWorks"
          :key="work.id"
          class="line-row"
        >
          <span class="line-row__title">{{ work.title }}</span>
          <button
            type="button"
            class="button button--small"
            @click="addToLine(work.id)"
          >
            ＋ 加入
          </button>
        </li>
      </ul>

      <p
        v-if="error"
        class="form__error"
        role="alert"
      >
        {{ error }}
      </p>

      <div class="block__actions">
        <button
          type="button"
          class="button button--primary"
          @click="submit"
        >
          {{ editingId ? '儲存' : '新增' }}
        </button>
        <button
          type="button"
          class="button"
          @click="cancel"
        >
          取消
        </button>
      </div>
    </section>

    <section
      v-else
      class="block"
    >
      <button
        type="button"
        class="button button--primary"
        @click="startCreate"
      >
        ＋ 新增展覽
      </button>

      <ul
        v-if="exhibitions.length"
        class="line-list"
      >
        <li
          v-for="exhibition in exhibitions"
          :key="exhibition.id"
          class="line-row"
        >
          <span class="line-row__meta">
            <span class="line-row__title">{{ exhibition.title }}</span>
            <span class="line-row__sub">{{ exhibition.workIds.length }} 件</span>
          </span>
          <span class="line-row__actions">
            <button
              type="button"
              class="button button--small"
              @click="startEdit(exhibition)"
            >
              編輯
            </button>
            <button
              type="button"
              class="button button--small"
              @click="onDelete(exhibition)"
            >
              刪除
            </button>
          </span>
        </li>
      </ul>
      <p
        v-else
        class="block__note"
      >
        還沒有展覽。展覽是有序的策展動線，帶前言，與分類正交——建立後站頭會出現「依展覽」切換。
      </p>
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

.block__title--sub {
  margin-top: 1.4rem;
  color: var(--ink-faint);
}

.block__note {
  margin: 0.8rem 0;
  font-size: 0.72rem;
  line-height: 1.7;
  color: var(--ink-faint);
}

.block__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 1rem;
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

.form__error {
  margin-top: 0.4rem;
  font-size: 0.76rem;
  color: var(--accent);
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

.button:disabled {
  opacity: 0.4;
  cursor: default;
}

.button--primary {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-color: var(--accent);
}

.button--small {
  padding: 0.3rem 0.5rem;
  font-size: 0.7rem;
}

.line-list {
  margin-top: 0.7rem;
  list-style: none;
}

.line-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.45rem 0;
  border-bottom: 1px solid var(--line);
}

.line-row__index {
  flex-shrink: 0;
  width: 1.4rem;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--ink-faint);
  text-align: center;
}

.line-row__meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.line-row__title {
  flex: 1;
  overflow: hidden;
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-row__sub {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: var(--ink-faint);
}

.line-row__actions {
  display: flex;
  flex-shrink: 0;
  gap: 0.25rem;
}
</style>
