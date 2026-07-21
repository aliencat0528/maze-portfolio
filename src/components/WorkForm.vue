<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { AspectId, CategoryId, Work, WorkLink } from '@/types'
import type { WorkDraft } from '@/composables/useLibrary'
import { CATEGORIES } from '@/data/categories'
import { detectAspect } from '@/utils/image'

/** 作品欄位表單。新增與編輯共用，差別只在要不要求上傳圖片 */

const props = defineProps<{
  mode: 'create' | 'edit'
  work?: Work | null
}>()

const emit = defineEmits<{
  submit: [payload: { draft: WorkDraft; file: File | null }]
  cancel: []
}>()

const ASPECTS: { id: AspectId; label: string }[] = [
  { id: 'square', label: '正方 1:1' },
  { id: 'landscape', label: '橫幅 3:2' },
  { id: 'portrait', label: '直幅 2:3' },
  { id: 'video', label: '影片 16:9' },
]

const draft = reactive({
  title: '',
  category: 'acrylic' as CategoryId,
  media: '',
  year: String(new Date().getFullYear()),
  aspect: 'square' as AspectId,
  description: '',
  role: '',
  links: '',
})

const file = ref<File | null>(null)
const error = ref('')

watch(
  () => props.work,
  (work) => {
    if (!work) return
    draft.title = work.title
    draft.category = work.category
    draft.media = work.media.join('、')
    draft.year = work.year
    draft.aspect = work.aspect
    draft.description = work.description
    draft.role = work.role
    draft.links = work.links.map((link) => `${link.label} | ${link.url}`).join('\n')
  },
  { immediate: true },
)

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const picked = input.files?.[0] ?? null
  file.value = picked
  if (!picked) return

  // 選完圖立刻把版位帶進表單，使用者看得到也改得掉
  try {
    draft.aspect = await detectAspect(picked)
  } catch {
    // 讀不到尺寸就維持目前選項，送出時仍會用實際處理結果補上
  }
}

/** 一行一個連結，格式「顯示文字 | 網址」——比多欄位表單好填也好讀 */
function parseLinks(value: string): WorkLink[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split('|').map((part) => part.trim())
      return { label: label || url, url: url || label }
    })
    .filter((link) => link.url)
}

function submit() {
  if (!draft.title.trim()) {
    error.value = '請填標題'
    return
  }
  if (props.mode === 'create' && !file.value) {
    error.value = '請選一張圖'
    return
  }
  error.value = ''

  emit('submit', {
    draft: {
      title: draft.title.trim(),
      category: draft.category,
      media: draft.media
        .split(/[、,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
      year: draft.year.trim(),
      aspect: draft.aspect,
      description: draft.description.trim(),
      role: draft.role.trim(),
      links: parseLinks(draft.links),
    },
    file: file.value,
  })
}
</script>

<template>
  <form
    class="form"
    @submit.prevent="submit"
  >
    <label
      v-if="mode === 'create'"
      class="field"
    >
      <span class="field__label">作品圖片</span>
      <input
        type="file"
        accept="image/*"
        class="field__file"
        @change="onFile"
      >
      <span class="field__hint">
        會自動壓成牆面縮圖（長邊 800px）與詳情用圖（1800px），並依比例帶入版位
      </span>
    </label>

    <label class="field">
      <span class="field__label">標題</span>
      <input
        v-model="draft.title"
        type="text"
        class="field__input"
        placeholder="作品名稱"
      >
    </label>

    <div class="field-row">
      <label class="field">
        <span class="field__label">分類</span>
        <select
          v-model="draft.category"
          class="field__input"
        >
          <option
            v-for="category in CATEGORIES"
            :key="category.id"
            :value="category.id"
          >
            {{ category.label }}
          </option>
        </select>
      </label>

      <label class="field">
        <span class="field__label">版位</span>
        <select
          v-model="draft.aspect"
          class="field__input"
        >
          <option
            v-for="aspect in ASPECTS"
            :key="aspect.id"
            :value="aspect.id"
          >
            {{ aspect.label }}
          </option>
        </select>
      </label>

      <label class="field field--narrow">
        <span class="field__label">年份</span>
        <input
          v-model="draft.year"
          type="text"
          class="field__input"
          placeholder="2026"
        >
      </label>
    </div>

    <label class="field">
      <span class="field__label">媒材</span>
      <input
        v-model="draft.media"
        type="text"
        class="field__input"
        placeholder="壓克力顏料、亞麻布"
      >
      <span class="field__hint">用頓號或逗號分隔</span>
    </label>

    <label class="field">
      <span class="field__label">作品敘述</span>
      <textarea
        v-model="draft.description"
        class="field__input field__input--area"
        rows="4"
        placeholder="想處理的問題、materials 的來由、觀眾的反應⋯⋯"
      />
    </label>

    <label class="field">
      <span class="field__label">角色／我的貢獻</span>
      <input
        v-model="draft.role"
        type="text"
        class="field__input"
        placeholder="創作、裝裱"
      >
    </label>

    <label class="field">
      <span class="field__label">外部連結</span>
      <textarea
        v-model="draft.links"
        class="field__input field__input--area"
        rows="2"
        placeholder="線上觀看 | https://example.com"
      />
      <span class="field__hint">一行一個，格式「顯示文字 | 網址」</span>
    </label>

    <p
      v-if="error"
      class="form__error"
      role="alert"
    >
      {{ error }}
    </p>

    <div class="form__actions">
      <button
        type="submit"
        class="button button--primary"
      >
        {{ mode === 'create' ? '新增作品' : '儲存變更' }}
      </button>
      <button
        type="button"
        class="button"
        @click="emit('cancel')"
      >
        取消
      </button>
    </div>
  </form>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr 0.7fr;
  gap: 0.6rem;
}

.field--narrow {
  min-width: 4rem;
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

.field__file {
  font-size: 0.76rem;
  color: var(--ink-soft);
}

.field__hint {
  font-size: 0.68rem;
  line-height: 1.5;
  color: var(--ink-faint);
}

.form__error {
  font-size: 0.76rem;
  color: var(--accent);
}

.form__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.button {
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
.button:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}

.button--primary {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}
</style>
