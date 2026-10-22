<template>
  <div class="flex flex-col min-h-screen bg-gray-50 font-sans">

    <!-- ── Top Nav Bar ── -->
    <header class="sticky top-0 z-50 flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200">
      <div class="flex items-center gap-3.5 min-w-0">
        <NuxtLink
          :to="backUrl"
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

        <!-- Undo / Redo button group -->
        <div
          v-if="lessonForm.type === 'text'"
          class="flex items-center rounded-lg border border-gray-200 divide-x divide-gray-200 overflow-hidden"
        >
          <button
            type="button"
            @click="undoBlocks"
            :disabled="!blockEditorRef?.canUndo?.value"
            class="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <ArrowUturnLeftIcon class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            @click="redoBlocks"
            :disabled="!blockEditorRef?.canRedo?.value"
            class="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <ArrowUturnRightIcon class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Hidden file input for .md import -->
        <input
          v-if="lessonForm.type === 'text'"
          ref="mdFileInputRef"
          type="file"
          accept=".md,text/markdown,text/plain"
          class="hidden"
          aria-hidden="true"
          @change="handleMdFileImport"
        />

        <!-- Import .md button -->
        <button
          v-if="lessonForm.type === 'text'"
          type="button"
          @click="triggerMdImport"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
          title="Import konten dari file Markdown (.md)"
          aria-label="Import dari file .md"
        >
          <ArrowUpTrayIcon class="w-3.5 h-3.5 text-gray-500" />
          <span class="hidden md:inline">Import .md</span>
          <span class="md:hidden">.md</span>
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

        <!-- Export PDF button -->
        <button
          type="button"
          @click="openExportModal"
          :disabled="isExportingPdf || isLoading"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export materi lesson ini ke format PDF"
          aria-label="Export materi ke PDF"
        >
          <DocumentArrowDownIcon v-if="!isExportingPdf" class="w-3.5 h-3.5 text-gray-500" />
          <span v-else class="w-3.5 h-3.5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin shrink-0" />
          <span class="hidden md:inline">Export PDF</span>
          <span class="md:hidden">PDF</span>
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

    <!-- ── Export PDF Modal ── -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showExportModal"
          class="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-[2px]"
          @click.self="closeExportModal"
        >
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-2"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-2"
          >
            <div
              v-if="showExportModal"
              class="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]"
            >
              <!-- Modal Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white shrink-0">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-[#5530AB]/10 flex items-center justify-center shrink-0">
                    <DocumentArrowDownIcon class="w-4.5 h-4.5 text-[#5530AB]" />
                  </div>
                  <div>
                    <h2 class="text-sm font-bold text-gray-900">Export Materi ke PDF</h2>
                    <p class="text-xs text-gray-500 mt-0.5">Konfigurasi opsi ekspor sebelum mengunduh</p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="closeExportModal"
                  class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Tutup modal"
                >
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </div>

              <!-- Modal Body -->
              <div class="px-6 py-5 overflow-y-auto space-y-5 text-sm">

                <!-- Lesson Type Info Banner -->
                <div
                  class="flex items-center gap-3 p-3 rounded-lg text-xs font-medium"
                  :class="{
                    'bg-[#5530AB]/8 text-[#5530AB] border border-[#5530AB]/20': lessonForm.type === 'text',
                    'bg-blue-50 text-blue-700 border border-blue-200': lessonForm.type === 'video',
                    'bg-amber-50 text-amber-700 border border-amber-200': lessonForm.type === 'quiz',
                  }"
                >
                  <component :is="activeTypeInfo.icon" class="w-4 h-4 shrink-0" />
                  <div>
                    <span class="font-semibold">Tipe Lesson: {{ activeTypeInfo.label }}</span>
                    <span class="ml-2 opacity-75">
                      {{ lessonForm.type === 'text'
                        ? '— PDF akan memuat semua blok teks, heading, gambar, tabel, dll.'
                        : lessonForm.type === 'video'
                          ? '— PDF akan memuat tautan video, kode QR, dan catatan materi.'
                          : '— PDF berupa lembar soal kuis.'
                      }}
                    </span>
                  </div>
                </div>

                <!-- Quiz-specific option: include answer key -->
                <div v-if="lessonForm.type === 'quiz'" class="space-y-2">
                  <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Mode Lembar Kuis</label>
                  <div class="grid grid-cols-2 gap-2.5">
                    <label
                      class="flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all"
                      :class="exportOptions.includeAnswers
                        ? 'border-[#5530AB] bg-[#5530AB]/5 ring-1 ring-[#5530AB]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'"
                    >
                      <input
                        type="radio"
                        v-model="exportOptions.includeAnswers"
                        :value="true"
                        class="mt-0.5 text-[#5530AB] focus:ring-[#5530AB]"
                      />
                      <div>
                        <p class="text-xs font-semibold text-gray-900">Panduan Pengajar</p>
                        <p class="text-[11px] text-gray-500 mt-0.5">Menyertakan kunci jawaban dan pembahasan</p>
                      </div>
                    </label>
                    <label
                      class="flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all"
                      :class="!exportOptions.includeAnswers
                        ? 'border-[#5530AB] bg-[#5530AB]/5 ring-1 ring-[#5530AB]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'"
                    >
                      <input
                        type="radio"
                        v-model="exportOptions.includeAnswers"
                        :value="false"
                        class="mt-0.5 text-[#5530AB] focus:ring-[#5530AB]"
                      />
                      <div>
                        <p class="text-xs font-semibold text-gray-900">Lembar Siswa</p>
                        <p class="text-[11px] text-gray-500 mt-0.5">Tanpa kunci jawaban, siap dibagikan</p>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- PDF Options -->
                <div class="space-y-3">
                  <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Opsi Dokumen</label>

                  <!-- Include Header Logo -->
                  <label class="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors">
                    <div>
                      <p class="text-xs font-semibold text-gray-800">Logo & Header Pixelnoid</p>
                      <p class="text-[11px] text-gray-500 mt-0.5">Tampilkan kop dokumen resmi dengan logo institusi</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      :aria-checked="exportOptions.includeHeaderLogo"
                      @click="exportOptions.includeHeaderLogo = !exportOptions.includeHeaderLogo"
                      class="relative inline-flex w-10 h-5.5 shrink-0 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer"
                      :class="exportOptions.includeHeaderLogo ? 'bg-[#5530AB]' : 'bg-gray-300'"
                    >
                      <span
                        class="pointer-events-none inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-0.75 ml-0.5"
                        :class="exportOptions.includeHeaderLogo ? 'translate-x-4.5' : 'translate-x-0'"
                      />
                    </button>
                  </label>

                  <!-- Include Class Info -->
                  <label class="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors">
                    <div>
                      <p class="text-xs font-semibold text-gray-800">Info Kelas & Modul</p>
                      <p class="text-[11px] text-gray-500 mt-0.5">Tampilkan nama kelas dan modul pada dokumen PDF</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      :aria-checked="exportOptions.includeClassInfo"
                      @click="exportOptions.includeClassInfo = !exportOptions.includeClassInfo"
                      class="relative inline-flex w-10 h-5.5 shrink-0 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer"
                      :class="exportOptions.includeClassInfo ? 'bg-[#5530AB]' : 'bg-gray-300'"
                    >
                      <span
                        class="pointer-events-none inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-0.75 ml-0.5"
                        :class="exportOptions.includeClassInfo ? 'translate-x-4.5' : 'translate-x-0'"
                      />
                    </button>
                  </label>
                </div>

                <!-- Custom file name -->
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider" for="pdf-filename">
                    Nama File PDF <span class="text-gray-400 font-normal normal-case">(opsional)</span>
                  </label>
                  <div class="flex items-center gap-2">
                    <input
                      id="pdf-filename"
                      v-model="exportOptions.customFileName"
                      type="text"
                      placeholder="Materi_NamaLesson_2026.pdf"
                      class="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-800 outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <p class="text-[11px] text-gray-400">Kosongkan untuk nama otomatis berdasarkan judul lesson.</p>
                </div>

                <!-- Preview summary -->
                <div class="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p class="text-[11px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Ringkasan Dokumen</p>
                  <ul class="space-y-1 text-[11px] text-gray-600">
                    <li class="flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#5530AB] shrink-0"></span>
                      <span>Judul: <strong class="text-gray-800">{{ lessonForm.title || 'Lesson Tanpa Judul' }}</strong></span>
                    </li>
                    <li class="flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#5530AB] shrink-0"></span>
                      <span>Tipe: <strong class="text-gray-800">{{ activeTypeInfo.label }}</strong></span>
                    </li>
                    <li v-if="moduleName" class="flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#5530AB] shrink-0"></span>
                      <span>Modul: <strong class="text-gray-800">{{ moduleName }}</strong></span>
                    </li>
                    <li v-if="className" class="flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#5530AB] shrink-0"></span>
                      <span>Kelas: <strong class="text-gray-800">{{ className }}</strong></span>
                    </li>
                    <li v-if="lessonForm.xp_reward" class="flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                      <span>XP Reward: <strong class="text-amber-700">+{{ lessonForm.xp_reward }} XP</strong></span>
                    </li>
                    <li v-if="lessonForm.type === 'text'" class="flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#5530AB] shrink-0"></span>
                      <span>Total blok: <strong class="text-gray-800">{{ blocks.length }} blok</strong></span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  @click="closeExportModal"
                  :disabled="isExportingPdf"
                  class="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  @click="handleExportPdf"
                  :disabled="isExportingPdf"
                  class="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#5530AB] hover:bg-[#43238d] text-white text-sm font-semibold transition-colors active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  <span v-if="isExportingPdf" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <DocumentArrowDownIcon v-else class="w-4 h-4" />
                  <span>{{ isExportingPdf ? 'Membuat PDF...' : 'Unduh PDF' }}</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

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
  ClipboardDocumentListIcon,
  ArrowUpTrayIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import BlockEditor from '~/components/admin/modules/BlockEditor.vue'
import QuizEditor from '~/components/admin/modules/QuizEditor.vue'
import VideoEditor from '~/components/admin/modules/VideoEditor.vue'
import { exportLessonPdf } from '~/utils/exportLessonPdf'

useSeoMeta({ title: 'Edit Lesson — Admin Panel' })
definePageMeta({ layout: false })

const route = useRoute()
const lessonId = route.params.lessonId as string
const classId = route.params.classId as string

// Back button always goes to the class modules page
const backUrl = computed(() => `/classes/${classId}`)

// ── State ──────────────────────────────────────────────────────
const isLoading = ref(true)
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const canvasTitleRef = ref<HTMLElement | null>(null)
const blockEditorRef = ref<any>(null)
const mdFileInputRef = ref<HTMLInputElement | null>(null)

// Lesson metadata (populated after fetchLesson)
const moduleName = ref('')
const className = ref('')

// ── Export PDF State ───────────────────────────────────────────
const showExportModal = ref(false)
const isExportingPdf = ref(false)
const exportOptions = reactive({
  includeHeaderLogo: true,
  includeClassInfo: true,
  includeAnswers: true, // For quiz: teacher guide by default
  customFileName: '',
})

function openExportModal() {
  exportOptions.customFileName = ''
  showExportModal.value = true
}

function closeExportModal() {
  if (!isExportingPdf.value) {
    showExportModal.value = false
  }
}

async function handleExportPdf() {
  if (isExportingPdf.value) return
  isExportingPdf.value = true
  try {
    const safeTitle = (lessonForm.title || 'Lesson').trim().replace(/[^a-zA-Z0-9_\- ]/g, '_').replace(/\s+/g, '_')
    const dateStamp = new Date().toISOString().split('T')[0]

    const modeLabel = lessonForm.type === 'quiz'
      ? (exportOptions.includeAnswers ? '_PanduanPengajar' : '_LembarSiswa')
      : ''

    const autoFileName = `Materi_${safeTitle}${modeLabel}_${dateStamp}.pdf`

    await exportLessonPdf({
      lessonTitle: lessonForm.title || 'Lesson Tanpa Judul',
      lessonType: lessonForm.type,
      className: className.value || undefined,
      moduleName: moduleName.value || undefined,
      xpReward: lessonForm.xp_reward || 0,
      videoUrl: lessonForm.video_url || undefined,
      blocks: blocks.value,
      includeHeaderLogo: exportOptions.includeHeaderLogo,
      includeClassInfo: exportOptions.includeClassInfo,
      includeAnswers: exportOptions.includeAnswers,
      customFileName: exportOptions.customFileName.trim() || autoFileName,
    })

    closeExportModal()
  } catch (err: any) {
    console.error('[handleExportPdf] Error:', err)
    alert('Gagal membuat PDF: ' + (err?.message || 'Terjadi kesalahan tidak terduga.'))
  } finally {
    isExportingPdf.value = false
  }
}

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

function triggerMdImport() {
  mdFileInputRef.value?.click()
}

function handleMdFileImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const mdText = e.target?.result as string
    if (!mdText) return
    if (blockEditorRef.value?.importFromMarkdown) {
      blockEditorRef.value.importFromMarkdown(mdText)
      scheduleAutoSave()
    }
  }
  reader.readAsText(file, 'UTF-8')
  input.value = ''
}

function undoBlocks() {
  blockEditorRef.value?.undo?.()
}

function redoBlocks() {
  blockEditorRef.value?.redo?.()
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
  class_modules?: {
    id: number
    title?: string
    class_id: number
  } | null
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

    // Capture module name for PDF metadata
    moduleName.value = lesson.class_modules?.title || ''

    // Resolve class name from global cache
    const numericClassId = Number(classId)
    const classesCache = useState<{ id: number; name: string }[]>('admin_classes_cache', () => [])
    const cachedClass = classesCache.value.find(c => c.id === numericClassId)
    if (cachedClass) {
      className.value = cachedClass.name
    } else if (numericClassId) {
      // Fetch class list if cache is empty
      try {
        const classData = await $fetch<{ classes: { id: number; name: string }[] }>('/api/admin/classes')
        classesCache.value = classData.classes
        className.value = classData.classes.find(c => c.id === numericClassId)?.name || ''
      } catch (classErr) {
        console.warn('Could not fetch class name for PDF metadata:', classErr)
      }
    }

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
    // Invalidate modules cache for this class so modules page re-fetches latest lesson data
    const modulesCache = useState<Record<number, any[]>>('admin_modules_cache_by_class', () => ({}))
    const numericClassId = Number(classId)
    if (numericClassId && modulesCache.value[numericClassId]) {
      delete modulesCache.value[numericClassId]
    }
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
