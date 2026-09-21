<template>
  <div class="flex flex-col min-h-screen bg-gray-50 font-['Instrument_Sans','Raleway',sans-serif]">

    <!-- ── Top Nav Bar ── -->
    <header class="sticky top-0 z-50 flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200">
      <div class="flex items-center gap-3.5 min-w-0">
        <NuxtLink
          to="/modules"
          class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-500 hover:text-[#5530AB] hover:bg-[#5530AB]/10 transition-colors shrink-0 cursor-pointer"
          title="Kembali ke Modul"
        >
          <ArrowLeftIcon class="w-4 h-4" />
        </NuxtLink>

        <div class="h-6 w-px bg-gray-200 shrink-0" />

        <div class="min-w-0 flex flex-col justify-center">
          <h1 class="text-sm font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg mt-0.5">
            {{ lessonForm.title || 'Lesson Tanpa Judul' }}
          </h1>
        </div>
      </div>

      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Quick Cross-Lesson Copy / Paste Actions -->
        <button
          v-if="lessonForm.type === 'text'"
          type="button"
          @click="copyAllLessonBlocks"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
          title="Salin semua blok konten lesson ini"
          aria-label="Salin semua blok lesson ke clipboard"
        >
          <Square2StackIcon class="w-3.5 h-3.5 text-gray-500" />
          <span class="hidden md:inline">Salin Semua Blok</span>
          <span class="md:hidden">Salin</span>
        </button>

        <button
          v-if="lessonForm.type === 'text'"
          type="button"
          @click="pasteLessonBlocks"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#5530AB]/10 hover:bg-[#5530AB]/20 text-[#5530AB] border border-[#5530AB]/20 text-xs font-medium transition-colors cursor-pointer"
          title="Tempel blok yang telah disalin dari lesson lain"
          aria-label="Tempel blok dari clipboard"
        >
          <ClipboardDocumentListIcon class="w-3.5 h-3.5 text-[#5530AB]" />
          <span class="hidden md:inline">Tempel Blok</span>
          <span class="md:hidden">Tempel</span>
        </button>

        <!-- Auto-save status pill -->
        <div
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          :class="{
            'bg-[#5530AB]/10 text-[#5530AB]': saveStatus === 'saving',
            'bg-emerald-100 text-emerald-700': saveStatus === 'saved',
            'bg-rose-100 text-rose-700': saveStatus === 'error',
            'bg-gray-100 text-gray-500': saveStatus === 'idle'
          }"
        >
          <span v-if="saveStatus === 'saving'" class="w-2.5 h-2.5 border-2 border-[#5530AB] border-t-transparent rounded-full animate-spin shrink-0" />
          <CheckCircleIcon v-else-if="saveStatus === 'saved'" class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <ExclamationTriangleIcon v-else-if="saveStatus === 'error'" class="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span v-else class="w-2 h-2 rounded-full bg-gray-300 shrink-0" />

          <span class="hidden sm:inline">
            {{ saveStatus === 'saving' ? 'Menyimpan...' : saveStatus === 'saved' ? 'Tersimpan otomatis' : saveStatus === 'error' ? 'Gagal menyimpan' : 'Semua tersimpan' }}
          </span>
          <span class="sm:hidden">
            {{ saveStatus === 'saving' ? 'Menyimpan' : saveStatus === 'saved' ? 'Tersimpan' : saveStatus === 'error' ? 'Gagal' : 'Siap' }}
          </span>
        </div>

        <!-- Save Button -->
        <button
          @click="saveNow"
          :disabled="saveStatus === 'saving'"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5530AB] hover:bg-[#43238d] text-white text-xs sm:text-sm font-semibold transition-colors active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          <ArrowPathIcon v-if="saveStatus === 'saving'" class="w-4 h-4 animate-spin" />
          <CloudArrowUpIcon v-else class="w-4 h-4" />
          <span>Simpan</span>
        </button>
      </div>
    </header>

    <!-- ── Main Area ── -->
    <div class="flex flex-1 min-h-0">

      <!-- Right: Block Editor Area -->
      <div class="flex-1 overflow-y-auto bg-gray-50">
        <!-- Loading lesson data -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-32 gap-3">
          <div class="w-9 h-9 border-2 border-[#5530AB]/20 border-t-[#5530AB] rounded-full animate-spin" />
          <p class="text-xs font-medium text-gray-400">Memuat editor lesson...</p>
        </div>

        <div v-else class="max-w-[860px] mx-auto px-16 sm:px-20 lg:px-24 py-8">
          <!-- Page title (lesson title as big heading) -->
          <div class="mb-8 pb-6 border-b border-gray-200">
            <div class="flex items-center gap-2 mb-4">
              <span
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                :class="activeTypeBadgeClass"
              >
                <component :is="activeTypeInfo.icon" class="w-3.5 h-3.5" />
                <span>{{ activeTypeInfo.label }}</span>
              </span>
              <span class="text-xs text-gray-300">•</span>
              <span v-if="lessonForm.xp_reward" class="text-xs font-semibold text-amber-700 bg-amber-100 px-4 py-2 rounded-full">
                +{{ lessonForm.xp_reward }} XP
              </span>
            </div>

            <div
              ref="canvasTitleRef"
              class="text-3xl sm:text-4xl font-bold text-gray-900 outline-none w-full leading-tight tracking-tight min-h-[52px] break-words whitespace-pre-wrap caret-[#5530AB] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 empty:before:font-bold empty:before:pointer-events-none"
              contenteditable="true"
              :data-placeholder="'Judul Lesson...'"
              @input="onTitleInput"
              v-title-init="lessonForm.title"
            />
            <p class="text-sm text-gray-500 mt-4 leading-relaxed">
              Mulai menulis konten di bawah, atau paste langsung dari <strong class="text-gray-700 font-semibold">Notion / Google Docs</strong>. Ketik <kbd class="inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-gray-200 text-gray-700 rounded font-bold mx-1">/</kbd> untuk memilih blok cepat.
            </p>
          </div>

          <!-- Conditional Editors Based on Lesson Type -->
          <ClientOnly>
            <BlockEditor
              v-if="lessonForm.type === 'text'"
              ref="blockEditorRef"
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
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  SparklesIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  QuestionMarkCircleIcon,
  TrashIcon,
  ClockIcon,
  HashtagIcon,
  Bars3BottomLeftIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  Square2StackIcon,
  ClipboardDocumentListIcon
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
const canvasTitleRef = ref<HTMLElement | null>(null)
const blockEditorRef = ref<any>(null)

function copyAllLessonBlocks() {
  if (blockEditorRef.value?.copyAllBlocks) {
    blockEditorRef.value.copyAllBlocks()
  }
}

function pasteLessonBlocks() {
  if (blockEditorRef.value?.pasteStoredBlocks) {
    const success = blockEditorRef.value.pasteStoredBlocks()
    if (success) {
      scheduleAutoSave()
    }
  }
}

const lessonTypes = [
  { value: 'text', label: 'Teks', icon: DocumentTextIcon },
  { value: 'video', label: 'Video', icon: VideoCameraIcon },
  { value: 'quiz', label: 'Quiz', icon: QuestionMarkCircleIcon },
]

const lessonForm = reactive({
  title: '',
  type: 'text',
  video_url: '',
  sort_order: 0,
  xp_reward: 0,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blocks = ref<any[]>([])

const activeTypeInfo = computed(() => {
  return lessonTypes.find(t => t.value === lessonForm.type) || lessonTypes[0]
})

// Disederhanakan menjadi warna solid, menghapus border
const activeTypeBadgeClass = computed(() => {
  if (lessonForm.type === 'video') return 'bg-blue-100 text-blue-700'
  if (lessonForm.type === 'quiz') return 'bg-amber-100 text-amber-700'
  return 'bg-[#5530AB]/10 text-[#5530AB]'
})

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
    lessonForm.title = lesson.title || ''
    lessonForm.type = lesson.type || 'text'
    lessonForm.video_url = lesson.video_url || ''
    lessonForm.sort_order = lesson.sort_order || 0
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
function onBlocksUpdate(newBlocks: any[]) {
  blocks.value = newBlocks
  scheduleAutoSave()
}

function onTitleInput(e: Event) {
  const el = e.target as HTMLElement
  lessonForm.title = el.textContent || ''
  scheduleAutoSave()
}

// Keep canvas title synchronized if updated from sidebar
watch(() => lessonForm.title, (newTitle) => {
  if (canvasTitleRef.value && document.activeElement !== canvasTitleRef.value) {
    if (canvasTitleRef.value.textContent !== newTitle) {
      canvasTitleRef.value.textContent = newTitle
    }
  }
})

// ── Custom directive: set initial title text ──────────────────
const vTitleInit = {
  mounted(el: HTMLElement, binding: { value: string }) {
    el.textContent = binding.value || ''
  },
  updated(el: HTMLElement, binding: { value: string }) {
    if (document.activeElement !== el && el.textContent !== binding.value) {
      el.textContent = binding.value || ''
    }
  },
}

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

onBeforeUnmount(() => {
  if (saveTimer) clearTimeout(saveTimer)
})
</script>