<template>
  <div class="editorjs-wrapper">
    <!-- Editor.js container -->
    <div id="editorjs-container" ref="editorContainer" class="editorjs-canvas" />

    <!-- Empty add button when no content -->
    <div v-if="isReady && isEmpty" class="flex justify-center pt-2">
      <button
        type="button"
        @click="focusEditor"
        class="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 hover:border-emerald-500 text-gray-400 hover:text-emerald-600 text-xs font-medium transition-all hover:bg-emerald-50/50"
      >
        <PlusIcon class="w-4 h-4" />
        Klik di sini atau paste konten dari Notion / Google Docs
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="!isReady" class="flex items-center justify-center py-16">
      <div class="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'

export interface Block {
  id: string
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'code' | 'quote' | 'callout' | 'bulletList' | 'numberedList' | 'divider' | 'image'
  content?: string
  language?: string
  items?: string[]
  url?: string
  caption?: string
}

// Internal Editor.js block format
interface EditorJsBlock {
  id?: string
  type: string
  data: Record<string, any>
}

const props = defineProps<{
  modelValue: Block[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', blocks: Block[]): void
}>()

const editorContainer = ref<HTMLElement | null>(null)
const isReady = ref(false)
const isEmpty = ref(false)

let editorInstance: any = null
let isSaving = false
let initTimeout: ReturnType<typeof setTimeout> | null = null

// ── Format Converters ────────────────────────────────────────────

/** Convert our custom Block format → Editor.js OutputData blocks */
function ourBlocksToEditorJs(blocks: Block[]): EditorJsBlock[] {
  return blocks
    .filter(b => !(b.type === 'paragraph' && !b.content?.trim()))
    .map(b => {
      switch (b.type) {
        case 'heading1':
          return { id: b.id, type: 'header', data: { text: b.content || '', level: 1 } }
        case 'heading2':
          return { id: b.id, type: 'header', data: { text: b.content || '', level: 2 } }
        case 'heading3':
          return { id: b.id, type: 'header', data: { text: b.content || '', level: 3 } }
        case 'paragraph':
          return { id: b.id, type: 'paragraph', data: { text: b.content || '' } }
        case 'code':
          return { id: b.id, type: 'code', data: { code: b.content || '' } }
        case 'quote':
          return { id: b.id, type: 'quote', data: { text: b.content || '', caption: '', alignment: 'left' } }
        case 'callout':
          // Map callout → paragraph with custom styling via inline class
          return { id: b.id, type: 'paragraph', data: { text: `💡 ${b.content || ''}` } }
        case 'bulletList':
          return { id: b.id, type: 'list', data: { style: 'unordered', items: b.items?.length ? b.items : [b.content || ''] } }
        case 'numberedList':
          return { id: b.id, type: 'list', data: { style: 'ordered', items: b.items?.length ? b.items : [b.content || ''] } }
        case 'divider':
          return { id: b.id, type: 'delimiter', data: {} }
        case 'image':
          return {
            id: b.id,
            type: 'paragraph',
            data: { text: b.url ? `[Image: ${b.url}]` : '' }
          }
        default:
          return { id: b.id, type: 'paragraph', data: { text: b.content || '' } }
      }
    })
}

/** Convert Editor.js blocks → our custom Block format */
function editorJsToOurBlocks(editorBlocks: EditorJsBlock[]): Block[] {
  function genId() {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
  }

  return editorBlocks.map(b => {
    const id = b.id || genId()
    switch (b.type) {
      case 'header': {
        const level = b.data.level || 1
        const typeMap: Record<number, Block['type']> = { 1: 'heading1', 2: 'heading2', 3: 'heading3' }
        return { id, type: typeMap[level] || 'heading1', content: b.data.text || '' }
      }
      case 'paragraph':
        return { id, type: 'paragraph', content: b.data.text || '' }
      case 'code':
        return { id, type: 'code', content: b.data.code || '', language: b.data.language || '' }
      case 'quote':
        return { id, type: 'quote', content: b.data.text || '' }
      case 'list':
        if (b.data.style === 'ordered') {
          return { id, type: 'numberedList', content: b.data.items?.[0] || '', items: b.data.items || [] }
        }
        return { id, type: 'bulletList', content: b.data.items?.[0] || '', items: b.data.items || [] }
      case 'delimiter':
        return { id, type: 'divider', content: '' }
      case 'image':
        return { id, type: 'image', url: b.data.file?.url || b.data.url || '', caption: b.data.caption || '' }
      default:
        return { id, type: 'paragraph', content: b.data.text || b.data.content || '' }
    }
  })
}

// ── Editor.js Init ───────────────────────────────────────────────

async function initEditor(initialBlocks: Block[]) {
  if (!editorContainer.value) return

  // Dynamically import to avoid SSR issues
  const [
    { default: EditorJS },
    { default: Header },
    { default: List },
    { default: Code },
    { default: Quote },
    { default: Delimiter },
  ] = await Promise.all([
    import('@editorjs/editorjs'),
    import('@editorjs/header'),
    import('@editorjs/list'),
    import('@editorjs/code'),
    import('@editorjs/quote'),
    import('@editorjs/delimiter'),
  ])

  // Destroy previous instance if any
  if (editorInstance) {
    try { editorInstance.destroy() } catch (_) {}
    editorInstance = null
  }

  const editorBlocks = ourBlocksToEditorJs(initialBlocks)

  editorInstance = new EditorJS({
    holder: editorContainer.value,
    data: {
      blocks: editorBlocks.length > 0 ? editorBlocks : [],
    },
    placeholder: 'Mulai menulis, atau paste konten dari Notion / Google Docs...',
    inlineToolbar: ['bold', 'italic', 'link'],
    tools: {
      header: {
        class: Header,
        config: {
          levels: [1, 2, 3],
          defaultLevel: 2,
        },
        inlineToolbar: true,
      },
      list: {
        class: List,
        inlineToolbar: true,
        config: { defaultStyle: 'unordered' },
      },
      code: { class: Code },
      quote: {
        class: Quote,
        inlineToolbar: true,
      },
      delimiter: { class: Delimiter },
    },
    onChange: async () => {
      if (isSaving) return
      try {
        const output = await editorInstance?.save()
        if (output?.blocks) {
          const converted = editorJsToOurBlocks(output.blocks)
          isEmpty.value = converted.length === 0 || converted.every(b => !b.content && b.type === 'paragraph')
          emit('update:modelValue', converted)
        }
      } catch (e) {
        console.error('EditorJS save error:', e)
      }
    },
    onReady: () => {
      isReady.value = true
      isEmpty.value = editorBlocks.length === 0
    },
  })
}

// ── Lifecycle ─────────────────────────────────────────────────────

onMounted(async () => {
  await nextTick()
  await initEditor(props.modelValue || [])
})

// Watch for external value changes (e.g., when lesson data is fetched)
let isFirstLoad = true
watch(
  () => props.modelValue,
  async (newVal) => {
    if (isFirstLoad) {
      isFirstLoad = false
      return // Already initialized in onMounted
    }
    // Only reinit if editor doesn't exist yet
    if (!editorInstance && newVal?.length > 0) {
      await nextTick()
      await initEditor(newVal)
    }
  },
  { deep: false }
)

onBeforeUnmount(() => {
  if (initTimeout) clearTimeout(initTimeout)
  try {
    editorInstance?.destroy()
  } catch (_) {}
  editorInstance = null
})

function focusEditor() {
  editorContainer.value?.click()
}
</script>

<style>
/* ── Editor.js Custom Styling ── */
.editorjs-wrapper {
  min-height: 200px;
}

.editorjs-canvas {
  min-height: 160px;
}

/* Editor container */
.codex-editor {
  font-family: 'Instrument Sans', 'Raleway', sans-serif;
}

/* Remove default padding from editor */
.codex-editor__redactor {
  padding-bottom: 80px !important;
}

/* Toolbar */
.ce-toolbar__content {
  max-width: none !important;
}

/* Block content */
.ce-block__content {
  max-width: none !important;
}

/* Paragraph */
.ce-paragraph {
  font-size: 0.9375rem;
  line-height: 1.75;
  color: #1f2937;
}

.ce-paragraph[data-placeholder]:empty::before {
  color: #9ca3af !important;
  font-style: italic;
}

/* Headers */
.ce-header {
  font-weight: 700;
  line-height: 1.35;
  color: #111827;
  padding: 4px 0 !important;
}

h1.ce-header { font-size: 1.875rem; }
h2.ce-header { font-size: 1.375rem; }
h3.ce-header { font-size: 1.125rem; }

/* Lists */
.cdx-list {
  font-size: 0.9375rem;
  line-height: 1.75;
  color: #1f2937;
}

.cdx-list__item {
  padding: 2px 0;
}

/* Code block */
.ce-code__textarea {
  background: #0f172a !important;
  color: #6ee7b7 !important;
  border-radius: 12px !important;
  padding: 16px !important;
  font-size: 0.8125rem !important;
  line-height: 1.6 !important;
  border: 1px solid #1e293b !important;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace !important;
  min-height: 80px;
  resize: vertical;
}

/* Quote */
.cdx-quote {
  border-left: 4px solid #10b981 !important;
  background: rgba(16, 185, 129, 0.04);
  border-radius: 0 12px 12px 0;
  padding: 12px 16px !important;
  margin: 8px 0;
}

.cdx-quote__text {
  font-style: italic;
  color: #374151;
  font-size: 0.9375rem;
  min-height: 40px;
}

.cdx-quote__caption {
  color: #6b7280;
  font-size: 0.8125rem;
  margin-top: 4px;
}

/* Delimiter */
.ce-delimiter {
  line-height: 1.6rem;
  width: 100%;
  text-align: center;
  font-size: 2rem;
  color: #d1d5db;
}

.ce-delimiter:before {
  content: '—';
}

/* Inline toolbar */
.ce-inline-toolbar {
  border-radius: 10px !important;
  border: 1px solid #e5e7eb !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
}

/* Block add button */
.ce-toolbar__plus {
  color: #9ca3af !important;
  background: white !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 8px !important;
  width: 28px !important;
  height: 28px !important;
}

.ce-toolbar__plus:hover {
  color: #10b981 !important;
  border-color: #10b981 !important;
  background: #f0fdf4 !important;
}

/* Settings button */
.ce-toolbar__settings-btn {
  color: #9ca3af !important;
  background: white !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 8px !important;
  width: 28px !important;
  height: 28px !important;
}

.ce-toolbar__settings-btn:hover {
  color: #374151 !important;
  border-color: #d1d5db !important;
  background: #f9fafb !important;
}

/* Popover / settings panel */
.ce-popover {
  border-radius: 14px !important;
  border: 1px solid #e5e7eb !important;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
}

.ce-popover-item:hover {
  background: #f0fdf4 !important;
}

.ce-popover-item--active {
  background: #f0fdf4 !important;
  color: #059669 !important;
}

/* Block hover highlight */
.ce-block:hover .ce-block__content {
  background: rgba(0,0,0,0.015);
  border-radius: 8px;
}

.ce-block--selected .ce-block__content {
  background: rgba(16, 185, 129, 0.06) !important;
  border-radius: 8px;
}
</style>
