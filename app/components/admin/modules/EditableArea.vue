<template>
  <div
    ref="elRef"
    class="px-editable"
    :class="customClass"
    contenteditable="true"
    role="textbox"
    tabindex="0"
    aria-multiline="true"
    :aria-label="ariaLabel || placeholder || 'Area teks editor'"
    :data-placeholder="placeholder"
    @input="onInput"
    @keydown="onKeyDown"
    @paste="onPaste"
    @focus="onFocus"
    @blur="onBlur"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
  customClass?: string
  ariaLabel?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'keydown', ev: KeyboardEvent): void
  (e: 'paste', ev: ClipboardEvent): void
  (e: 'focus', ev: FocusEvent): void
  (e: 'blur', ev: FocusEvent): void
}>()

const elRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (elRef.value) {
    elRef.value.innerHTML = props.modelValue || ''
  }
})

// Synchronize external changes ONLY when the element is not currently being edited by user
watch(
  () => props.modelValue,
  (newVal) => {
    if (!elRef.value) return
    // If user is currently focused/typing in this element, NEVER overwrite DOM innerHTML!
    if (document.activeElement === elRef.value) return

    const safeVal = newVal || ''
    if (elRef.value.innerHTML !== safeVal) {
      elRef.value.innerHTML = safeVal
    }
  }
)

function onInput() {
  if (!elRef.value) return
  emit('update:modelValue', elRef.value.innerHTML)
}

function onKeyDown(ev: KeyboardEvent) {
  emit('keydown', ev)
}

function onPaste(ev: ClipboardEvent) {
  emit('paste', ev)
}

function onFocus(ev: FocusEvent) {
  emit('focus', ev)
}

function onBlur(ev: FocusEvent) {
  emit('blur', ev)
}

function focusEnd() {
  if (!elRef.value) return
  elRef.value.focus()
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  range.selectNodeContents(elRef.value)
  range.collapse(false)
  sel.removeAllRanges()
  sel.addRange(range)
}

function focusStart() {
  if (!elRef.value) return
  elRef.value.focus()
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  range.selectNodeContents(elRef.value)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

defineExpose({
  elRef,
  focusEnd,
  focusStart,
})
</script>

<style scoped>
.px-editable {
  outline: none;
  word-break: break-word;
  white-space: pre-wrap;
  transition: background-color 0.15s ease;
}

.px-editable:focus,
.px-editable:focus-visible {
  outline: none;
}

.px-editable:empty::before {
  content: attr(data-placeholder);
  color: #cbd5e1;
  pointer-events: none;
  font-style: normal;
}
</style>
