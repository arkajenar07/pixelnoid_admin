<template>
  <div class="flex min-h-screen bg-[#F7F7F9] text-gray-900 antialiased overflow-x-hidden" style="font-family: 'Instrument Sans', Inter, sans-serif">
    <AdminSidebar :open="sidebarOpen" @update:open="sidebarOpen = $event" />

    <div class="flex-1 w-full min-w-0 lg:ml-[260px]">
      <!-- Header -->
      <header class="sticky top-0 z-[100] flex w-full items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200">
        <div class="flex items-center gap-4">
          <button
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 transition-all lg:hidden"
            @click="sidebarOpen = !sidebarOpen"
          >
            <Bars3Icon class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-base font-semibold text-gray-900 leading-none">Resource Management</h1>
            <p class="text-xs text-gray-500 mt-0.5">Kelola materi, ebook, template, dan link per kelas belajar</p>
          </div>
        </div>

        <button
          @click="openAddModal"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[0.875rem] font-medium transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-emerald-600/30"
        >
          <PlusIcon class="w-4 h-4" />
          Tambah Resource
        </button>
      </header>

      <main class="p-6 space-y-6 max-w-[1440px] mx-auto">
        <!-- Stats Summary -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Total Resource</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ resources.length }}</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-emerald-600 uppercase tracking-widest">Kelas Terdaftar</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">{{ classes.length }}</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-indigo-600 uppercase tracking-widest">E-Book & Panduan</p>
            <p class="text-2xl font-bold text-indigo-600 mt-1">
              {{ resources.filter(r => r.type === 'ebook' || r.type === 'pdf' || r.type === 'document').length }}
            </p>
          </div>
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-purple-600 uppercase tracking-widest">Template & Tools</p>
            <p class="text-2xl font-bold text-purple-600 mt-1">
              {{ resources.filter(r => ['template', 'figma', 'tool', 'video', 'cheatsheet', 'github'].includes(r.type || '')).length }}
            </p>
          </div>
        </div>

        <!-- Search & Filter Controls -->
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Search Bar -->
          <div class="relative flex-1">
            <MagnifyingGlassIcon class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari judul, tipe, nama kelas, atau link resource..."
              class="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-[0.9rem] text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
            />
          </div>

          <!-- Class Filter Dropdown -->
          <select
            v-model="filterClass"
            class="h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] text-gray-700 outline-none focus:border-emerald-500 transition-all cursor-pointer min-w-[170px] shadow-sm"
          >
            <option value="">Semua Kelas</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>

          <!-- Type Filter Dropdown -->
          <select
            v-model="filterType"
            class="h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] text-gray-700 outline-none focus:border-emerald-500 transition-all cursor-pointer min-w-[150px] shadow-sm"
          >
            <option value="">Semua Tipe</option>
            <option value="ebook">E-Book / PDF</option>
            <option value="template">Template / Figma</option>
            <option value="video">Video / Tutorial</option>
            <option value="cheatsheet">Cheatsheet</option>
            <option value="tool">Tools / Software</option>
            <option value="github">Code / GitHub</option>
            <option value="other">Lainnya</option>
          </select>
        </div>

        <!-- Table Card -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <!-- Loading State -->
          <div v-if="isLoading" class="flex flex-col items-center justify-center py-20">
            <div class="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <p class="text-xs text-gray-400 mt-3">Memuat data resources...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredResources.length === 0" class="flex flex-col items-center justify-center py-20 text-center px-4">
            <div class="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
              <FolderIcon class="w-7 h-7 text-gray-400" />
            </div>
            <p class="text-gray-700 font-semibold text-sm">Tidak ada resource ditemukan</p>
            <p class="text-gray-400 text-xs mt-1 max-w-sm">Mulai tambahkan resource belajar untuk mempermudah akses materi bagi siswa di setiap kelas.</p>
            <button
              @click="openAddModal"
              class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all"
            >
              Tambah Resource Sekarang
            </button>
          </div>

          <!-- Data Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-gray-100 bg-gray-50/50">
                  <th class="px-5 py-3.5 text-[0.6875rem] font-semibold text-gray-500 uppercase tracking-wider">Resource</th>
                  <th class="px-5 py-3.5 text-[0.6875rem] font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                  <th class="px-5 py-3.5 text-[0.6875rem] font-semibold text-gray-500 uppercase tracking-wider">Tipe</th>
                  <th class="px-5 py-3.5 text-[0.6875rem] font-semibold text-gray-500 uppercase tracking-wider">URL / Tautan</th>
                  <th class="px-5 py-3.5 text-[0.6875rem] font-semibold text-gray-500 uppercase tracking-wider">Ditambahkan</th>
                  <th class="px-5 py-3.5 text-[0.6875rem] font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="item in filteredResources"
                  :key="item.id"
                  class="hover:bg-gray-50/60 transition-colors group"
                >
                  <!-- Title & Description -->
                  <td class="px-5 py-4 max-w-xs sm:max-w-sm">
                    <p class="text-sm font-semibold text-gray-900">{{ item.title }}</p>
                    <p v-if="item.description" class="text-xs text-gray-500 line-clamp-2 mt-0.5">
                      {{ item.description }}
                    </p>
                    <p v-else class="text-[0.75rem] text-gray-400 italic mt-0.5">Tanpa deskripsi</p>
                  </td>

                  <!-- Kelas Badge -->
                  <td class="px-5 py-4 whitespace-nowrap">
                    <span
                      v-if="item.class_name"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      <AcademicCapIcon class="w-3.5 h-3.5 text-emerald-600" />
                      {{ item.class_name }}
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center px-2 py-0.5 rounded text-[0.7rem] font-medium bg-gray-100 text-gray-600"
                    >
                      Umum (Semua Kelas)
                    </span>
                  </td>

                  <!-- Type Badge -->
                  <td class="px-5 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold border"
                      :class="getTypeBadgeClass(item.type)"
                    >
                      <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="getTypeDotClass(item.type)"></span>
                      {{ getTypeLabel(item.type) }}
                    </span>
                  </td>

                  <!-- URL / Link -->
                  <td class="px-5 py-4 max-w-xs">
                    <div class="flex items-center gap-2">
                      <a
                        :href="item.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-medium truncate max-w-[180px]"
                        :title="item.url"
                      >
                        <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5 shrink-0" />
                        <span class="truncate">{{ formatDisplayUrl(item.url) }}</span>
                      </a>
                      <button
                        @click="copyUrl(item.url, item.id)"
                        class="text-[0.7rem] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 bg-white shrink-0"
                        title="Copy link"
                      >
                        {{ copiedId === item.id ? 'Tersalin!' : 'Copy' }}
                      </button>
                    </div>
                  </td>

                  <!-- Tanggal Dibuat -->
                  <td class="px-5 py-4 whitespace-nowrap">
                    <span class="text-xs text-gray-600">{{ formatDate(item.created_at) }}</span>
                  </td>

                  <!-- Aksi -->
                  <td class="px-5 py-4 text-right whitespace-nowrap">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        @click="openEditModal(item)"
                        class="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        title="Edit Resource"
                      >
                        <PencilSquareIcon class="w-4 h-4" />
                      </button>
                      <button
                        @click="confirmDelete(item)"
                        class="p-1.5 rounded-lg border border-gray-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Hapus Resource"
                      >
                        <TrashIcon class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <!-- Teleport Modal Tambah / Edit -->
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
          v-if="modal.isOpen"
          class="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs"
        >
          <div
            class="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
            @click.stop
          >
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 class="text-base font-semibold text-gray-900">
                  {{ modal.isEditing ? 'Edit Resource' : 'Tambah Resource Baru' }}
                </h3>
                <p class="text-xs text-gray-500 mt-0.5">Pilih kelas, kategori tipe materi, dan URL tautan</p>
              </div>
              <button
                @click="closeModal"
                class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <!-- Error Alert -->
              <div v-if="modal.error" class="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                <ExclamationCircleIcon class="w-4 h-4 shrink-0 mt-0.5" />
                <span>{{ modal.error }}</span>
              </div>

              <!-- Pilih Kelas -->
              <div class="space-y-1.5">
                <label class="font-semibold text-gray-700">Pilih Kelas</label>
                <select
                  v-model="form.class_id"
                  class="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-emerald-500 outline-none bg-white cursor-pointer"
                >
                  <option :value="null">-- Umum (Dapat diakses semua kelas) --</option>
                  <option v-for="c in classes" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </option>
                </select>
                <p class="text-[0.6875rem] text-gray-400">Pilih kelas yang dituju agar materi terorganisir sesuai kelas masing-masing.</p>
              </div>

              <!-- Judul Resource -->
              <div class="space-y-1.5">
                <label class="font-semibold text-gray-700">Judul Resource <span class="text-rose-500">*</span></label>
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="Contoh: E-Book UI/UX Design System Guidelines"
                  class="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
                />
              </div>

              <!-- Tipe Resource (Radio Pills) -->
              <div class="space-y-1.5">
                <label class="font-semibold text-gray-700">Tipe Resource</label>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="t in resourceTypes"
                    :key="t.value"
                    type="button"
                    @click="form.type = t.value"
                    class="py-1.5 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all"
                    :class="form.type === t.value ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="t.dotClass"></span>
                    {{ t.label }}
                  </button>
                </div>
              </div>

              <!-- URL / Link -->
              <div class="space-y-1.5">
                <label class="font-semibold text-gray-700">URL / Tautan Link <span class="text-rose-500">*</span></label>
                <div class="flex gap-2">
                  <input
                    v-model="form.url"
                    type="url"
                    placeholder="https://drive.google.com/... atau https://figma.com/..."
                    class="flex-1 h-10 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 outline-none"
                  />
                  <a
                    v-if="form.url"
                    :href="form.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-3 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 hover:bg-gray-50 shrink-0"
                  >
                    Test
                  </a>
                </div>
                <p class="text-[0.6875rem] text-gray-400">Pastikan link dapat diakses publik atau izin akses drive sudah disetel "Anyone with link".</p>
              </div>

              <!-- Deskripsi -->
              <div class="space-y-1.5">
                <label class="font-semibold text-gray-700">Deskripsi (Opsional)</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  placeholder="Keterangan singkat mengenai resource ini..."
                  class="w-full p-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none resize-none"
                ></textarea>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
              >
                Batal
              </button>
              <button
                type="button"
                @click="submitForm"
                :disabled="modal.saving"
                class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold transition-all shadow-xs"
              >
                <div v-if="modal.saving" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <template v-else>
                  <CheckIcon class="w-4 h-4" />
                  {{ modal.isEditing ? 'Simpan Perubahan' : 'Tambah Resource' }}
                </template>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Teleport Delete Confirmation Modal -->
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
          v-if="deleteModal.isOpen"
          class="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs"
        >
          <div
            class="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            @click.stop
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                <TrashIcon class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-gray-900">Hapus Resource?</h3>
                <p class="text-xs text-gray-500">Resource ini akan dihapus secara permanen.</p>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1">
              <p class="font-semibold text-gray-900">{{ deleteModal.target?.title }}</p>
              <p class="text-gray-500 truncate">{{ deleteModal.target?.url }}</p>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                @click="deleteModal.isOpen = false"
                class="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                @click="executeDelete"
                :disabled="deleteModal.deleting"
                class="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-semibold transition-all shadow-xs"
              >
                <div v-if="deleteModal.deleting" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <template v-else>Hapus</template>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Bars3Icon,
  PlusIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ArrowTopRightOnSquareIcon,
  AcademicCapIcon
} from '@heroicons/vue/24/outline'

useSeoMeta({
  title: 'Resource Management — Admin Pixelnoid',
  description: 'Kelola aset, materi, template, dan link belajar per kelas.'
})

definePageMeta({ layout: false })

// ── State ──────────────────────────────────────────────────────────
const sidebarOpen = ref(false)
const isLoading = ref(true)
const searchQuery = ref('')
const filterClass = ref<string | number>('')
const filterType = ref('')
const copiedId = ref<number | null>(null)

interface ClassOption {
  id: number
  name: string
}

interface ResourceItem {
  id: number
  class_id?: number | null
  class_name?: string | null
  title: string
  description: string | null
  type: string | null
  url: string
  created_at: string
}

const resources = ref<ResourceItem[]>([])
const classes = ref<ClassOption[]>([])

const resourceTypes = [
  { value: 'ebook', label: 'E-Book / PDF', dotClass: 'bg-indigo-500' },
  { value: 'template', label: 'Template / Figma', dotClass: 'bg-purple-500' },
  { value: 'video', label: 'Video Tutorial', dotClass: 'bg-rose-500' },
  { value: 'cheatsheet', label: 'Cheatsheet', dotClass: 'bg-amber-500' },
  { value: 'tool', label: 'Tools / Software', dotClass: 'bg-blue-500' },
  { value: 'github', label: 'Code / GitHub', dotClass: 'bg-emerald-500' },
  { value: 'other', label: 'Lainnya', dotClass: 'bg-gray-400' }
]

// ── Form & Modal State ─────────────────────────────────────────────
const modal = reactive({
  isOpen: false,
  isEditing: false,
  editingId: null as number | null,
  saving: false,
  error: ''
})

const form = reactive({
  class_id: null as number | null,
  title: '',
  description: '',
  type: 'ebook',
  url: ''
})

const deleteModal = reactive({
  isOpen: false,
  deleting: false,
  target: null as ResourceItem | null
})

// ── Helpers ────────────────────────────────────────────────────────
function getTypeLabel(type: string | null) {
  const found = resourceTypes.find(t => t.value === (type || '').toLowerCase())
  return found ? found.label : (type || 'Lainnya')
}

function getTypeBadgeClass(type: string | null) {
  switch ((type || '').toLowerCase()) {
    case 'ebook':
    case 'pdf':
      return 'bg-indigo-50 border-indigo-200 text-indigo-700'
    case 'template':
    case 'figma':
      return 'bg-purple-50 border-purple-200 text-purple-700'
    case 'video':
      return 'bg-rose-50 border-rose-200 text-rose-700'
    case 'cheatsheet':
      return 'bg-amber-50 border-amber-200 text-amber-700'
    case 'tool':
      return 'bg-blue-50 border-blue-200 text-blue-700'
    case 'github':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700'
    default:
      return 'bg-gray-100 border-gray-200 text-gray-700'
  }
}

function getTypeDotClass(type: string | null) {
  switch ((type || '').toLowerCase()) {
    case 'ebook':
    case 'pdf':
      return 'bg-indigo-500'
    case 'template':
    case 'figma':
      return 'bg-purple-500'
    case 'video':
      return 'bg-rose-500'
    case 'cheatsheet':
      return 'bg-amber-500'
    case 'tool':
      return 'bg-blue-500'
    case 'github':
      return 'bg-emerald-500'
    default:
      return 'bg-gray-400'
  }
}

function formatDisplayUrl(url: string) {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    return parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '')
  } catch {
    return url
  }
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function copyUrl(url: string, id: number) {
  if (!url) return
  navigator.clipboard.writeText(url)
  copiedId.value = id
  setTimeout(() => {
    if (copiedId.value === id) copiedId.value = null
  }, 2000)
}

// ── Filtered Resources ─────────────────────────────────────────────
const filteredResources = computed(() => {
  return resources.value.filter(item => {
    // Search
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchTitle = item.title?.toLowerCase().includes(q)
      const matchDesc = item.description?.toLowerCase().includes(q)
      const matchType = item.type?.toLowerCase().includes(q)
      const matchUrl = item.url?.toLowerCase().includes(q)
      const matchClass = item.class_name?.toLowerCase().includes(q)
      if (!matchTitle && !matchDesc && !matchType && !matchUrl && !matchClass) return false
    }

    // Class filter
    if (filterClass.value !== '') {
      if (item.class_id !== Number(filterClass.value)) {
        return false
      }
    }

    // Type filter
    if (filterType.value && item.type !== filterType.value) {
      return false
    }

    return true
  })
})

// ── Data Fetching ──────────────────────────────────────────────────
async function fetchResources() {
  isLoading.value = true
  try {
    const res = await $fetch<{ resources: ResourceItem[]; classes: ClassOption[] }>('/api/admin/resources')
    resources.value = res.resources || []
    classes.value = res.classes || []
  } catch (err: any) {
    console.error('Error fetching resources:', err)
  } finally {
    isLoading.value = false
  }
}

// ── Modal Actions ──────────────────────────────────────────────────
function openAddModal() {
  modal.isEditing = false
  modal.editingId = null
  modal.error = ''
  form.class_id = filterClass.value !== '' ? Number(filterClass.value) : null
  form.title = ''
  form.description = ''
  form.type = 'ebook'
  form.url = ''
  modal.isOpen = true
}

function openEditModal(item: ResourceItem) {
  modal.isEditing = true
  modal.editingId = item.id
  modal.error = ''
  form.class_id = item.class_id ?? null
  form.title = item.title || ''
  form.description = item.description || ''
  form.type = item.type || 'other'
  form.url = item.url || ''
  modal.isOpen = true
}

function closeModal() {
  modal.isOpen = false
  modal.error = ''
}

async function submitForm() {
  if (!form.title.trim()) {
    modal.error = 'Judul resource wajib diisi.'
    return
  }
  if (!form.url.trim()) {
    modal.error = 'URL resource wajib diisi.'
    return
  }

  modal.saving = true
  modal.error = ''

  try {
    if (modal.isEditing && modal.editingId) {
      await $fetch(`/api/admin/resources/${modal.editingId}`, {
        method: 'PUT',
        body: form
      })
    } else {
      await $fetch('/api/admin/resources', {
        method: 'POST',
        body: form
      })
    }

    closeModal()
    await fetchResources()
  } catch (err: any) {
    modal.error = err?.data?.statusMessage || err?.message || 'Gagal menyimpan resource.'
  } finally {
    modal.saving = false
  }
}

function confirmDelete(item: ResourceItem) {
  deleteModal.target = item
  deleteModal.isOpen = true
}

async function executeDelete() {
  if (!deleteModal.target) return
  deleteModal.deleting = true
  try {
    await $fetch(`/api/admin/resources/${deleteModal.target.id}`, {
      method: 'DELETE'
    })
    deleteModal.isOpen = false
    deleteModal.target = null
    await fetchResources()
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Gagal menghapus resource.')
  } finally {
    deleteModal.deleting = false
  }
}

onMounted(() => {
  fetchResources()
})
</script>
