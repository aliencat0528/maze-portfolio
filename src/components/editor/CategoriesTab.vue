<script setup lang="ts">
import { computed, inject, reactive, ref } from 'vue'
import type { StoredCategory, TexturePresetId } from '@/types'
import { TEXTURE_PRESETS } from '@/data/categories'
import { contrastRatio, deriveAccentDark, hexToRgb } from '@/utils/color'
import { useLibrary } from '@/composables/useLibrary'
import { EDITOR_STATUS } from '@/components/editor/status'

/**
 * 分類分頁：新增／編輯／刪除自訂分類。
 *
 * 使用者只選名稱／代號／顏色／紋理預設（MR-012 ③）——easing/radius/border 隨紋理帶入，
 * accentDark 由 accent 自動推導並在此即時預覽是否在暗底達標。內建六類為唯讀基準。
 */

const { categories, customCategories, addCategory, updateCategory, removeCategory } = useLibrary()
const { say } = inject(EDITOR_STATUS)!

const DARK_BG = { r: 0x17, g: 0x17, b: 0x1a }
const MIN_CONTRAST = 4.5
const PRESET_IDS = Object.keys(TEXTURE_PRESETS) as TexturePresetId[]

const builtinCategories = computed(() => categories.value.filter((category) => !category.custom))

const open = ref(false)
const editingId = ref<string | null>(null)
const error = ref('')

const draft = reactive({
  label: '',
  code: '',
  accent: '#c2410c',
  texturePresetId: 'linen' as TexturePresetId,
})

// 即時預覽：暗底版本與其對比度
const derivedDark = computed(() => deriveAccentDark(draft.accent))
const darkContrast = computed(() => {
  const rgb = hexToRgb(derivedDark.value)
  return rgb ? contrastRatio(rgb, DARK_BG) : 0
})
const previewTexture = computed(() => TEXTURE_PRESETS[draft.texturePresetId].texture)

function resetDraft() {
  draft.label = ''
  draft.code = ''
  draft.accent = '#c2410c'
  draft.texturePresetId = 'linen'
  error.value = ''
}

function startCreate() {
  resetDraft()
  editingId.value = null
  open.value = true
}

function startEdit(category: StoredCategory) {
  draft.label = category.label
  draft.code = category.code
  draft.accent = category.accent
  draft.texturePresetId = category.texturePresetId
  error.value = ''
  editingId.value = category.id
  open.value = true
}

function cancel() {
  open.value = false
}

function submit() {
  const label = draft.label.trim()
  const code = draft.code.trim().toUpperCase()
  if (!label) {
    error.value = '請填分類名稱'
    return
  }
  if (!code) {
    error.value = '請填代號（等寬字標籤用）'
    return
  }
  if (!hexToRgb(draft.accent)) {
    error.value = '顏色格式不正確'
    return
  }

  if (editingId.value) {
    updateCategory(editingId.value, { label, code, accent: draft.accent, texturePresetId: draft.texturePresetId })
    say('已儲存分類')
  } else {
    const category: StoredCategory = {
      id: `cat-${Date.now().toString(36)}`,
      label,
      code,
      accent: draft.accent,
      texturePresetId: draft.texturePresetId,
      custom: true,
    }
    addCategory(category)
    say('已新增分類')
  }
  open.value = false
}

function onDelete(category: StoredCategory) {
  if (removeCategory(category.id)) {
    say('已刪除分類')
    if (editingId.value === category.id) open.value = false
  } else {
    say('此分類仍有作品使用，先改分類或刪作品再試')
  }
}
</script>

<template>
  <div>
    <section
      v-if="open"
      class="block"
    >
      <h3 class="block__title">
        {{ editingId ? '編輯分類' : '新增分類' }}
      </h3>

      <label class="field">
        <span class="field__label">名稱</span>
        <input
          v-model="draft.label"
          type="text"
          class="field__input"
          placeholder="複合媒材"
        >
      </label>

      <div class="field-row">
        <label class="field">
          <span class="field__label">代號</span>
          <input
            v-model="draft.code"
            type="text"
            class="field__input"
            maxlength="4"
            placeholder="MIX"
          >
        </label>
        <div class="field field--color">
          <span class="field__label">強調色</span>
          <span class="color-input">
            <input
              v-model="draft.accent"
              type="color"
              class="color-input__well"
              aria-label="強調色調色盤"
            >
            <input
              v-model="draft.accent"
              type="text"
              class="field__input"
              spellcheck="false"
              aria-label="強調色 HEX"
            >
          </span>
        </div>
      </div>

      <label class="field">
        <span class="field__label">紋理個性（動效與邊緣隨紋理帶入）</span>
        <select
          v-model="draft.texturePresetId"
          class="field__input"
        >
          <option
            v-for="presetId in PRESET_IDS"
            :key="presetId"
            :value="presetId"
          >
            {{ TEXTURE_PRESETS[presetId].label }}
          </option>
        </select>
      </label>

      <div class="preview">
        <span
          class="preview__chip preview__chip--light"
          :style="{ color: draft.accent, borderColor: draft.accent, backgroundImage: previewTexture }"
        >
          {{ draft.code || '代號' }}
        </span>
        <span
          class="preview__chip preview__chip--dark"
          :style="{ color: derivedDark }"
        >
          {{ draft.code || '代號' }}
        </span>
        <span
          class="preview__badge"
          :class="darkContrast >= MIN_CONTRAST ? 'is-ok' : 'is-warn'"
        >
          暗底對比 {{ darkContrast.toFixed(1) }}
          {{ darkContrast >= MIN_CONTRAST ? '✓' : '偏低' }}
        </span>
      </div>

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
        ＋ 新增分類
      </button>

      <ul
        v-if="customCategories.length"
        class="cat-list"
      >
        <li
          v-for="category in customCategories"
          :key="category.id"
          class="cat-row"
        >
          <span
            class="cat-row__dot"
            :style="{ background: category.accent }"
          />
          <span class="cat-row__meta">
            <span class="cat-row__label">{{ category.label }}</span>
            <span class="cat-row__code">{{ category.code }} · {{ TEXTURE_PRESETS[category.texturePresetId].label }}</span>
          </span>
          <span class="cat-row__actions">
            <button
              type="button"
              class="button button--small"
              @click="startEdit(category)"
            >
              編輯
            </button>
            <button
              type="button"
              class="button button--small"
              @click="onDelete(category)"
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
        還沒有自訂分類。內建六類（下方）為基準，新增的分類會一起出現在篩選列與作品表單。
      </p>

      <h3 class="block__title block__title--sub">
        內建分類（唯讀）
      </h3>
      <ul class="cat-list">
        <li
          v-for="category in builtinCategories"
          :key="category.id"
          class="cat-row cat-row--readonly"
        >
          <span
            class="cat-row__dot"
            :style="{ background: category.theme.accent }"
          />
          <span class="cat-row__meta">
            <span class="cat-row__label">{{ category.label }}</span>
            <span class="cat-row__code">{{ category.code }}</span>
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

.block__title--sub {
  margin-top: 1.6rem;
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
  margin-top: 0.9rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.7rem;
  min-width: 0;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 0.6rem;
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

.color-input {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.color-input__well {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: transparent;
  border: 1px solid var(--line-strong);
  border-radius: var(--card-radius);
  cursor: pointer;
}

.preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0.3rem 0 0.2rem;
}

.preview__chip {
  padding: 0.4rem 0.7rem;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  border: 1px solid transparent;
  border-radius: var(--card-radius);
}

.preview__chip--light {
  background-color: var(--surface);
}

.preview__chip--dark {
  background-color: #17171a;
  border-color: #2c2c31;
}

.preview__badge {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
}

.preview__badge.is-ok {
  color: #0d8a80;
}

.preview__badge.is-warn {
  color: #c2410c;
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

.button--primary {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-color: var(--accent);
}

.button--small {
  padding: 0.3rem 0.55rem;
  font-size: 0.7rem;
}

.cat-list {
  margin-top: 0.9rem;
  list-style: none;
}

.cat-row {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--line);
}

.cat-row--readonly {
  opacity: 0.75;
}

.cat-row__dot {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
}

.cat-row__meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.cat-row__label {
  overflow: hidden;
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cat-row__code {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: var(--ink-faint);
}

.cat-row__actions {
  display: flex;
  flex-shrink: 0;
  gap: 0.3rem;
}
</style>
