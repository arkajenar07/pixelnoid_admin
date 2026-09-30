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
            <h1 class="text-base font-medium text-gray-900 leading-none">Class Management</h1>
            <p class="text-xs text-gray-400 mt-0.5">Kelola semua kelas yang tersedia di platform</p>
          </div>
        </div>
        <button
          @click="openAddModal"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5530AB] hover:bg-[#43258e] text-white text-[0.875rem] font-medium transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-[#5530AB]/30"
        >
          <PlusIcon class="w-4 h-4" />
          Tambah Kelas
        </button>
      </header>

      <main class="p-6 space-y-6 max-w-[1440px] mx-auto">

        <!-- Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Total Kelas</p>
              <div class="w-8 h-8 rounded-lg bg-[#5530AB]/10 text-[#5530AB] flex items-center justify-center">
                <AcademicCapIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ classes.length }}</p>
            <p class="text-xs text-gray-500 mt-1">Kelas yang tersedia</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Avg. Harga Grup</p>
              <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CurrencyDollarIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ avgGroupPrice }}</p>
            <p class="text-xs text-emerald-700 font-semibold mt-1">Rata-rata harga grup</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Avg. Harga Private</p>
              <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <UserIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ avgPrivatePrice }}</p>
            <p class="text-xs text-amber-700 font-semibold mt-1">Rata-rata harga private</p>
          </div>
        </div>

        <!-- Search -->
        <div class="relative max-w-sm">
          <MagnifyingGlassIcon class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            v-model="search"
            type="text"
            placeholder="Cari nama kelas..."
            class="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-[0.9rem] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#5530AB]/50 focus:ring-2 focus:ring-[#5530AB]/10 transition-all shadow-sm"
          />
        </div>

        <!-- Table -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <!-- Loading -->
          <div v-if="isLoading" class="flex items-center justify-center py-20">
            <div class="w-7 h-7 border-2 border-gray-200 border-t-[#5530AB] rounded-full animate-spin" />
          </div>

          <!-- Empty -->
          <div v-else-if="filteredClasses.length === 0" class="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-[#5530AB]/10 flex items-center justify-center">
              <AcademicCapIcon class="w-6 h-6 text-[#5530AB]" />
            </div>
            <p class="text-gray-500 font-medium">Tidak ada kelas ditemukan</p>
            <button @click="openAddModal" class="text-[#5530AB] text-sm font-semibold hover:underline">+ Tambah kelas pertama</button>
          </div>

          <!-- Data Table -->
          <table v-else class="w-full">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50/50">
                <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest w-14">ID</th>
                <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Nama Kelas</th>
                <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest hidden md:table-cell">Harga Grup</th>
                <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest hidden md:table-cell">Harga Private</th>
                <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest hidden lg:table-cell">Dibuat</th>
                <th class="px-5 py-3.5 text-right text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="cls in filteredClasses"
                :key="cls.id"
                class="border-b border-gray-100 hover:bg-gray-50/80 transition-colors group"
              >
                <td class="px-5 py-4">
                  <span class="text-[0.8125rem] font-mono text-gray-400">#{{ cls.id }}</span>
                </td>
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-[#5530AB]/10 text-[#5530AB] flex items-center justify-center shrink-0">
                      <AcademicCapIcon class="w-4 h-4" />
                    </div>
                    <p class="text-[0.875rem] font-semibold text-gray-900 truncate max-w-[200px]">{{ cls.name }}</p>
                  </div>
                </td>
                <td class="px-5 py-4 hidden md:table-cell">
                  <span class="text-[0.875rem] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {{ formatRupiah(cls.group_price) }}
                  </span>
                </td>
                <td class="px-5 py-4 hidden md:table-cell">
                  <span class="text-[0.875rem] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                    {{ formatRupiah(cls.private_price) }}
                  </span>
                </td>
                <td class="px-5 py-4 hidden lg:table-cell">
                  <span class="text-[0.8125rem] text-gray-400">{{ formatDate(cls.created_at) }}</span>
                </td>
                <td class="px-5 py-4">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      @click="openEditModal(cls)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-[#5530AB] hover:bg-[#5530AB]/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <PencilSquareIcon class="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      @click="confirmDelete(cls.id, cls.name)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <TrashIcon class="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Table Footer -->
          <div v-if="!isLoading && filteredClasses.length > 0" class="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <p class="text-xs text-gray-400">
              Menampilkan <span class="font-semibold text-gray-600">{{ filteredClasses.length }}</span> dari
              <span class="font-semibold text-gray-600">{{ classes.length }}</span> kelas
            </p>
          </div>
        </div>

      </main>
    </div>
  </div>

  <!-- ── Add / Edit Modal ── -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
        <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="closeModal" />
        <div class="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">

          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 class="text-lg font-bold text-gray-900">{{ isEditing ? 'Edit Kelas' : 'Tambah Kelas Baru' }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ isEditing ? 'Perbarui informasi kelas yang sudah ada' : 'Buat kelas baru untuk platform' }}
              </p>
            </div>
            <button @click="closeModal" class="p-2 -mr-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-5">

            <!-- Nama Kelas -->
            <div class="space-y-1.5">
              <label class="text-[0.8125rem] font-bold text-gray-700">
                Nama Kelas <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="modalForm.name"
                type="text"
                placeholder="cth: Python Coding, Basic Web Development..."
                class="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#5530AB]/50 focus:ring-2 focus:ring-[#5530AB]/10 transition-all shadow-sm"
                :class="{ 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/10': modalErrors.name }"
              />
              <p v-if="modalErrors.name" class="text-[0.75rem] text-rose-500 flex items-center gap-1">
                <ExclamationCircleIcon class="w-3.5 h-3.5 shrink-0" />{{ modalErrors.name }}
              </p>
            </div>

            <!-- Harga Grid -->
            <div class="grid grid-cols-2 gap-4">
              <!-- Harga Grup -->
              <div class="space-y-1.5">
                <label class="text-[0.8125rem] font-bold text-gray-700">Harga Grup</label>
                <div class="relative">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono pointer-events-none">Rp</span>
                  <input
                    v-model.number="modalForm.group_price"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="150000"
                    class="w-full h-10 pl-9 pr-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#5530AB]/50 focus:ring-2 focus:ring-[#5530AB]/10 transition-all shadow-sm"
                  />
                </div>
                <p class="text-[0.7rem] text-emerald-600 font-medium">{{ formatRupiah(modalForm.group_price || 0) }}</p>
              </div>

              <!-- Harga Private -->
              <div class="space-y-1.5">
                <label class="text-[0.8125rem] font-bold text-gray-700">Harga Private</label>
                <div class="relative">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono pointer-events-none">Rp</span>
                  <input
                    v-model.number="modalForm.private_price"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="225000"
                    class="w-full h-10 pl-9 pr-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#5530AB]/50 focus:ring-2 focus:ring-[#5530AB]/10 transition-all shadow-sm"
                  />
                </div>
                <p class="text-[0.7rem] text-amber-600 font-medium">{{ formatRupiah(modalForm.private_price || 0) }}</p>
              </div>
            </div>

            <!-- Price comparison hint -->
            <div v-if="modalForm.group_price > 0 && modalForm.private_price > 0" class="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100 text-[0.75rem] text-gray-500">
              <span>💡</span>
              <span>Selisih harga: <strong class="text-gray-700">{{ formatRupiah(Math.abs((modalForm.private_price || 0) - (modalForm.group_price || 0))) }}</strong> lebih {{ (modalForm.private_price || 0) > (modalForm.group_price || 0) ? 'mahal' : 'murah' }} di private.</span>
            </div>

            <!-- Alerts -->
            <div v-if="submitError" class="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[0.8125rem]">
              <ExclamationCircleIcon class="w-4 h-4 shrink-0 mt-0.5" />
              <span>{{ submitError }}</span>
            </div>
            <div v-if="submitSuccess" class="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-[0.8125rem]">
              <CheckCircleIcon class="w-4 h-4 shrink-0 mt-0.5" />
              <span>{{ submitSuccess }}</span>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm"
            >
              Batal
            </button>
            <button
              type="button"
              @click="handleSubmit"
              :disabled="isSubmitting"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5530AB] hover:bg-[#43258e] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[0.875rem] font-bold transition-all shadow-sm"
            >
              <div v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <template v-else>
                <CheckIcon class="w-4 h-4" />
                {{ isEditing ? 'Simpan Perubahan' : 'Buat Kelas' }}
              </template>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Delete Confirm Modal ── -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="deleteModal.open" class="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="deleteModal.open = false" />
        <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-4">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 shrink-0 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <TrashIcon class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-[0.9375rem] font-bold text-gray-900">Hapus Kelas?</h3>
              <p class="text-[0.8125rem] text-gray-500 mt-1">
                Kelas <span class="font-semibold text-gray-800">"{{ deleteModal.name }}"</span> akan dihapus secara permanen.
                Pastikan tidak ada siswa terdaftar di kelas ini.
              </p>
            </div>
          </div>
          <div v-if="deleteModal.error" class="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs">
            <ExclamationCircleIcon class="w-4 h-4 shrink-0 mt-0.5" />
            <span>{{ deleteModal.error }}</span>
          </div>
          <div class="flex items-center gap-3 justify-end">
            <button
              @click="deleteModal.open = false"
              class="px-4 py-2 rounded-xl border border-gray-200 bg-white text-[0.875rem] font-bold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Batal
            </button>
            <button
              @click="executeDelete"
              :disabled="deleteModal.loading"
              class="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white text-[0.875rem] font-bold transition-all"
            >
              <div v-if="deleteModal.loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <template v-else><TrashIcon class="w-4 h-4" />Ya, Hapus</template>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Bars3Icon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  AcademicCapIcon,
  UserIcon,
  CurrencyDollarIcon,
} from '@heroicons/vue/24/outline'

useSeoMeta({ title: 'Class Management — Admin Pixelnoid', description: 'Kelola semua kelas di platform Pixelnoid.' })
definePageMeta({ layout: false })

interface ClassItem {
  id: number
  created_at: string
  name: string
  group_price: number
  private_price: number
}

// ── State ──────────────────────────────────────────────────────────
const sidebarOpen = ref(false)
const classes = ref<ClassItem[]>([])
const isLoading = ref(true)
const search = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref('')
const editingId = ref<number | null>(null)

const modalForm = reactive({ name: '', group_price: 0, private_price: 0 })
const modalErrors = reactive({ name: '' })

const deleteModal = reactive({
  open: false,
  id: null as number | null,
  name: '',
  loading: false,
  error: '',
})

// ── Computed ───────────────────────────────────────────────────────
const filteredClasses = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return classes.value
  return classes.value.filter(c => c.name.toLowerCase().includes(q))
})

const avgGroupPrice = computed(() => {
  if (!classes.value.length) return 'Rp 0'
  const avg = classes.value.reduce((s, c) => s + (c.group_price ?? 0), 0) / classes.value.length
  return formatRupiah(avg)
})

const avgPrivatePrice = computed(() => {
  if (!classes.value.length) return 'Rp 0'
  const avg = classes.value.reduce((s, c) => s + (c.private_price ?? 0), 0) / classes.value.length
  return formatRupiah(avg)
})

// ── Helpers ────────────────────────────────────────────────────────
function formatRupiah(value: number): string {
  if (!value && value !== 0) return 'Rp —'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr))
}

// ── Fetch ──────────────────────────────────────────────────────────
async function fetchClasses() {
  isLoading.value = true
  try {
    const result = await $fetch<{ classes: ClassItem[] }>('/api/admin/classes')
    classes.value = result.classes
  } catch (err: any) {
    console.error('Gagal mengambil data kelas:', err?.data?.statusMessage ?? err?.message)
  } finally {
    isLoading.value = false
  }
}
onMounted(fetchClasses)

// ── Modal helpers ──────────────────────────────────────────────────
function resetModal() {
  Object.assign(modalForm, { name: '', group_price: 0, private_price: 0 })
  Object.assign(modalErrors, { name: '' })
  submitError.value = ''
  submitSuccess.value = ''
  editingId.value = null
}

function openAddModal() {
  resetModal()
  isEditing.value = false
  showModal.value = true
}

function openEditModal(cls: ClassItem) {
  resetModal()
  isEditing.value = true
  editingId.value = cls.id
  Object.assign(modalForm, {
    name: cls.name,
    group_price: cls.group_price ?? 0,
    private_price: cls.private_price ?? 0,
  })
  showModal.value = true
}

function closeModal() { showModal.value = false }

function validateModal(): boolean {
  let valid = true
  Object.assign(modalErrors, { name: '' })
  if (!modalForm.name.trim()) { modalErrors.name = 'Nama kelas wajib diisi.'; valid = false }
  return valid
}

async function handleSubmit() {
  if (!validateModal()) return
  isSubmitting.value = true
  submitError.value = ''
  submitSuccess.value = ''
  try {
    if (isEditing.value && editingId.value !== null) {
      await $fetch(`/api/admin/classes/${editingId.value}`, { method: 'PUT', body: modalForm })
      submitSuccess.value = 'Kelas berhasil diperbarui.'
    } else {
      await $fetch('/api/admin/classes', { method: 'POST', body: modalForm })
      submitSuccess.value = 'Kelas berhasil ditambahkan.'
    }
    await fetchClasses()
    setTimeout(() => closeModal(), 1000)
  } catch (err: any) {
    submitError.value = err?.data?.statusMessage || err?.message || 'Terjadi kesalahan, coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}

// ── Delete ─────────────────────────────────────────────────────────
function confirmDelete(id: number, name: string) {
  deleteModal.id = id
  deleteModal.name = name
  deleteModal.error = ''
  deleteModal.loading = false
  deleteModal.open = true
}

async function executeDelete() {
  if (!deleteModal.id) return
  deleteModal.loading = true
  deleteModal.error = ''
  try {
    await $fetch(`/api/admin/classes/${deleteModal.id}`, { method: 'DELETE' })
    deleteModal.open = false
    await fetchClasses()
  } catch (err: any) {
    deleteModal.error = err?.data?.statusMessage || err?.message || 'Gagal menghapus kelas.'
  } finally {
    deleteModal.loading = false
  }
}
</script>
