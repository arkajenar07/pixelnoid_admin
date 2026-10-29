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

// Synchronize changes when modelValue differs from innerHTML (e.g. on Undo, Redo, or Turn Into)
watch(
  () => props.modelValue,
  (newVal) => {
    if (!elRef.value) return
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

function isAtStart(): boolean {
  if (!elRef.value) return false
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!range.collapsed) return false
  if (!elRef.value.contains(range.startContainer)) return false

  const preRange = document.createRange()
  preRange.selectNodeContents(elRef.value)
  preRange.setEnd(range.startContainer, range.startOffset)
  return preRange.toString().replace(/\u200B/g, '').length === 0
}

function isAtEnd(): boolean {
  if (!elRef.value) return false
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!range.collapsed) return false
  if (!elRef.value.contains(range.endContainer)) return false

  const postRange = document.createRange()
  postRange.selectNodeContents(elRef.value)
  postRange.setStart(range.endContainer, range.endOffset)
  return postRange.toString().replace(/\u200B/g, '').length === 0
}

function splitAtCaret(): { beforeHtml: string; afterHtml: string } {
  if (!elRef.value) return { beforeHtml: '', afterHtml: '' }
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) {
    return { beforeHtml: elRef.value.innerHTML, afterHtml: '' }
  }
  const range = sel.getRangeAt(0)

  if (!elRef.value.contains(range.startContainer)) {
    return { beforeHtml: elRef.value.innerHTML, afterHtml: '' }
  }

  // Pre-caret range
  const preRange = document.createRange()
  preRange.selectNodeContents(elRef.value)
  preRange.setEnd(range.startContainer, range.startOffset)
  const preFrag = preRange.cloneContents()
  const preDiv = document.createElement('div')
  preDiv.appendChild(preFrag)
  const beforeHtml = preDiv.innerHTML

  // Post-caret range
  const postRange = document.createRange()
  postRange.selectNodeContents(elRef.value)
  postRange.setStart(range.endContainer, range.endOffset)
  const postFrag = postRange.cloneContents()
  const postDiv = document.createElement('div')
  postDiv.appendChild(postFrag)
  const afterHtml = postDiv.innerHTML

  return { beforeHtml, afterHtml }
}

defineExpose({
  elRef,
  focusEnd,
  focusStart,
  isAtStart,
  isAtEnd,
  splitAtCaret,
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
