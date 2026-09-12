<template>
  <div class="lesson-editor-root font-['Instrument_Sans','Raleway',sans-serif]">

    <!-- ── Top Nav Bar ── -->
    <header class="editor-topbar">
      <div class="flex items-center gap-3 min-w-0">
        <NuxtLink
          to="/modules"
          class="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
          title="Kembali ke Module Management"
        >
          <ArrowLeftIcon class="w-4 h-4" />
        </NuxtLink>
        <div class="min-w-0">
          <p class="text-[0.625rem] font-bold uppercase tracking-widest text-gray-400">Editing Lesson</p>
          <h1 class="text-sm font-semibold text-gray-900 truncate">{{ lessonForm.title || 'Lesson Tanpa Judul' }}</h1>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Auto-save indicator -->
        <div class="flex items-center gap-1.5 text-xs">
          <div v-if="saveStatus === 'saving'" class="w-3 h-3 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
          <div v-else-if="saveStatus === 'saved'" class="w-3 h-3 rounded-full bg-emerald-500" />
          <div v-else-if="saveStatus === 'error'" class="w-3 h-3 rounded-full bg-rose-500" />
          <div v-else class="w-3 h-3 rounded-full bg-gray-200" />
          <span class="text-gray-400">
            {{ saveStatus === 'saving' ? 'Menyimpan...' : saveStatus === 'saved' ? 'Tersimpan' : saveStatus === 'error' ? 'Gagal simpan' : 'Belum ada perubahan' }}
          </span>
        </div>

        <button
          @click="saveNow"
          :disabled="saveStatus === 'saving'"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all disabled:opacity-60"
        >
          <CloudArrowUpIcon class="w-4 h-4" />
          Simpan
        </button>
      </div>
    </header>

    <!-- ── Main Area ── -->
    <div class="editor-main">

      <!-- Left: Lesson Metadata Sidebar -->
      <aside class="editor-metadata-sidebar">
        <div class="sidebar-inner">
          <p class="sidebar-section-label">Info Lesson</p>

          <div class="form-field">
            <label class="form-label">Judul *</label>
            <input v-model="lessonForm.title" type="text" placeholder="Judul lesson"
              class="form-input" @input="scheduleAutoSave" />
          </div>

          <div v-if="lessonForm.type === 'video'" class="form-field">
            <label class="form-label">URL Video</label>
            <input v-model="lessonForm.video_url" type="url" placeholder="https://youtube.com/..."
              class="form-input" @input="scheduleAutoSave" />
          </div>

          <div class="form-field">
            <label class="form-label">Urutan</label>
            <input v-model.number="lessonForm.sort_order" type="number" min="0"
              class="form-input" @input="scheduleAutoSave" />
          </div>

          <div class="form-field">
            <label class="form-label">XP Reward</label>
            <input v-model.number="lessonForm.xp_reward" type="number" min="0"
              class="form-input" @input="scheduleAutoSave" />
          </div>

          <div class="separator" />

          <p class="sidebar-section-label">Konten</p>
          <div class="stats-grid">
            <div class="stat-item">
              <p class="stat-value">{{ blocks.length }}</p>
              <p class="stat-label">Blok</p>
            </div>
            <div class="stat-item">
              <p class="stat-value">{{ wordCount }}</p>
              <p class="stat-label">Kata</p>
            </div>
          </div>

          <div class="separator" />

          <p class="sidebar-section-label">Tips Paste</p>
          <div class="flex flex-col gap-1.5 text-xs text-gray-500">
            <div class="flex items-start gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <span class="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
              <span>Paste dari <strong class="text-emerald-700">Notion</strong> langsung ke editor</span>
            </div>
            <div class="flex items-start gap-2 p-2 bg-blue-50 rounded-xl border border-blue-100">
              <span class="text-blue-500 font-bold shrink-0 mt-0.5">✓</span>
              <span>Paste dari <strong class="text-blue-700">Google Docs</strong> otomatis format</span>
            </div>
            <div class="flex items-start gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
              <span class="text-gray-400 font-bold shrink-0 mt-0.5">+</span>
              <span>Klik <strong>+</strong> di editor untuk pilih tipe blok</span>
            </div>
          </div>

          <div class="separator" />

          <!-- Danger Zone -->
          <p class="text-[0.625rem] font-bold uppercase tracking-widest text-rose-400 mb-2">Danger Zone</p>
          <button
            @click="clearContent"
            class="w-full py-2 px-3 rounded-xl border border-rose-200 text-rose-500 text-xs font-medium hover:bg-rose-50 transition-colors text-left"
          >
            Hapus semua konten
          </button>
        </div>
      </aside>

      <!-- Right: Block Editor Area -->
      <div class="editor-canvas-wrapper">
        <!-- Loading lesson data -->
        <div v-if="isLoading" class="flex items-center justify-center py-24">
          <div class="w-8 h-8 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>

        <div v-else class="editor-canvas">
          <!-- Page title (lesson title as big heading) -->
          <div class="canvas-title-area">
            <div
              class="canvas-title-input"
              contenteditable="true"
              :data-placeholder="'Judul Lesson...'"
              @input="onTitleInput"
              v-title-init="lessonForm.title"
            />
            <p class="canvas-subtitle">Tulis konten di sini, atau <strong>paste langsung dari Notion / Google Docs</strong> — heading, list, code akan terdeteksi otomatis.</p>
          </div>

          <!-- Conditional Editors Based on Lesson Type -->
          <ClientOnly>
            <BlockEditor
              v-if="lessonForm.type === 'text'"
              v-model="blocks"
              @update:modelValue="onBlocksUpdate"
            />

            <VideoEditor
              v-else-if="lessonForm.type === 'video'"
              v-model:videoUrl="lessonForm.video_url"
              v-model="blocks"
              @update:modelValue="onBlocksUpdate"
              @update:videoUrl="scheduleAutoSave"
            />

            <QuizEditor
              v-else-if="lessonForm.type === 'quiz'"
              v-model="blocks"
              @update:modelValue="onBlocksUpdate"
            />
          </ClientOnly>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue'
import {
  ArrowLeftIcon, CloudArrowUpIcon,
} from '@heroicons/vue/24/outline'
import BlockEditor from '~/components/admin/modules/BlockEditor.vue'
import QuizEditor from '~/components/admin/modules/QuizEditor.vue'
import VideoEditor from '~/components/admin/modules/VideoEditor.vue'

useSeoMeta({ title: 'Edit Lesson — Admin Panel' })
definePageMeta({ layout: false })

const route = useRoute()
const lessonId = route.params.lessonId as string

// ── State ──────────────────────────────────────────────────────
const isLoading = ref(true)
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

const lessonForm = reactive({
  title: '',
  type: 'text',
  video_url: '',
  sort_order: 0,
  xp_reward: 0,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blocks = ref<any[]>([])

// ── Fetch lesson data ──────────────────────────────────────────
interface LessonData {
  id: number
  title: string
  type: string
  video_url: string | null
  sort_order: number
  xp_reward?: number
  content: any[] | null
}

async function fetchLesson() {
  isLoading.value = true
  try {
    const data = await $fetch<{ lesson: LessonData }>(`/api/admin/lessons/${lessonId}`)
    const lesson = data.lesson
    lessonForm.title = lesson.title
    lessonForm.type = lesson.type
    lessonForm.video_url = lesson.video_url || ''
    lessonForm.sort_order = lesson.sort_order
    lessonForm.xp_reward = lesson.xp_reward || 0
    let parsedContent: any = lesson.content
    if (typeof parsedContent === 'string') {
      try {
        parsedContent = JSON.parse(parsedContent)
      } catch (e) {
        console.error('Failed parsing lesson content JSON:', e)
        parsedContent = []
      }
    }
    blocks.value = Array.isArray(parsedContent) && parsedContent.length > 0
      ? parsedContent
      : [{ id: crypto.randomUUID(), type: 'paragraph', content: '' }]
  } catch (e) {
    console.error('Error fetching lesson:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchLesson)

// ── Block Editor handlers ─────────────────────────────────────
function onBlocksUpdate(newBlocks: Block[]) {
  blocks.value = newBlocks
  scheduleAutoSave()
}

function onTitleInput(e: Event) {
  const el = e.target as HTMLElement
  lessonForm.title = el.textContent || ''
  scheduleAutoSave()
}

// ── Custom directive: set initial title text ──────────────────
const vTitleInit = {
  mounted(el: HTMLElement, binding: { value: string }) {
    el.textContent = binding.value || ''
  },
}

// ── Word count ────────────────────────────────────────────────
const wordCount = computed(() => {
  const allText = blocks.value
    .map(b => {
      if (Array.isArray(b.items)) return b.items.join(' ')
      return b.content || ''
    })
    .join(' ')
  return allText.trim() ? allText.trim().split(/\s+/).length : 0
})

// ── Auto-save with debounce ───────────────────────────────────
let saveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleAutoSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveNow(), 2000)
}

async function saveNow() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
  saveStatus.value = 'saving'
  try {
    await $fetch(`/api/admin/lessons/${lessonId}`, {
      method: 'PUT',
      body: {
        title: lessonForm.title,
        type: lessonForm.type,
        video_url: lessonForm.video_url || null,
        sort_order: lessonForm.sort_order,
        xp_reward: Number(lessonForm.xp_reward) || 0,
        content: blocks.value,
      },
    })
    saveStatus.value = 'saved'
    setTimeout(() => { if (saveStatus.value === 'saved') saveStatus.value = 'idle' }, 3000)
  } catch (e) {
    console.error('Save failed:', e)
    saveStatus.value = 'error'
  }
}

function clearContent() {
  if (!confirm('Hapus semua blok konten lesson ini?')) return
  blocks.value = [{ id: crypto.randomUUID(), type: 'paragraph', content: '' }]
  scheduleAutoSave()
}

onBeforeUnmount(() => {
  if (saveTimer) clearTimeout(saveTimer)
})


</script>

<style scoped>
.lesson-editor-root {
  @apply flex flex-col min-h-screen bg-[#FAFBFC];
}

/* ── Top Bar ── */
.editor-topbar {
  @apply sticky top-0 z-[200] flex items-center justify-between gap-4 px-6 py-3 bg-white border-b border-gray-200 shadow-sm;
}

/* ── Main Layout ── */
.editor-main {
  @apply flex flex-1 min-h-0;
}

/* ── Left Sidebar ── */
.editor-metadata-sidebar {
  @apply hidden lg:flex flex-col w-[280px] shrink-0 bg-white border-r border-gray-200 overflow-y-auto;
  height: calc(100vh - 57px);
  position: sticky;
  top: 57px;
}

.sidebar-inner {
  @apply p-5 flex flex-col gap-3;
}

.sidebar-section-label {
  @apply text-[0.625rem] font-bold uppercase tracking-widest text-gray-400 mb-1;
}

.separator {
  @apply border-t border-gray-100 my-1;
}

.form-field {
  @apply flex flex-col gap-1;
}

.form-label {
  @apply text-[0.75rem] font-medium text-gray-600;
}

.form-input {
  @apply w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all bg-white;
}

.stats-grid {
  @apply grid grid-cols-2 gap-2;
}

.stat-item {
  @apply bg-gray-50 rounded-xl p-3 text-center;
}

.stat-value {
  @apply text-xl font-bold text-gray-900;
}

.stat-label {
  @apply text-[0.625rem] text-gray-400 uppercase tracking-wider mt-0.5;
}

.block-type-legend {
  @apply flex flex-col gap-1;
}

.legend-item {
  @apply flex items-center gap-2 text-xs text-gray-600;
}

.legend-icon {
  @apply w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-[0.6875rem] font-bold text-gray-600 shrink-0;
}

/* ── Editor Canvas ── */
.editor-canvas-wrapper {
  @apply flex-1 overflow-y-auto;
}

.editor-canvas {
  @apply max-w-[780px] mx-auto px-6 lg:px-12 py-10;
}

.canvas-title-area {
  @apply mb-6 pb-6 border-b border-gray-100;
}

.canvas-title-input {
  @apply text-4xl font-bold text-gray-900 outline-none w-full leading-tight;
  caret-color: #10B981;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 52px;
}

.canvas-title-input:empty::before {
  content: attr(data-placeholder);
  @apply text-gray-200 pointer-events-none;
}

.canvas-subtitle {
  @apply text-sm text-gray-400 mt-3;
}

.kbd-key {
  @apply inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-gray-100 border border-gray-200 rounded;
}
</style>
