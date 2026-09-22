<template>
  <div class="flex min-h-screen bg-gray-50 text-gray-900 font-sans antialiased overflow-x-hidden">
    <AdminSidebar :open="sidebarOpen" @update:open="sidebarOpen = $event" />

    <div class="flex-1 w-full min-w-0 lg:ml-[260px]">
      <!-- Header -->
      <header class="sticky top-0 z-[100] flex w-full items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200">
        <div class="flex items-center gap-4">
          <button
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors lg:hidden"
            @click="sidebarOpen = !sidebarOpen"
          >
            <Bars3Icon class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-lg font-semibold text-gray-900 leading-tight">Absensi & Presensi</h1>
          </div>
        </div>

        <button
          @click="openAddModal"
          class="flex items-center gap-2 px-4 py-2 rounded-md bg-[#5530AB] hover:bg-[#432687] text-white text-sm font-medium transition-colors"
        >
          <PlusIcon class="w-4 h-4" />
          Tambah Absensi
        </button>
      </header>

      <main class="p-6 space-y-6 max-w-7xl mx-auto">
        <!-- Stats Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Total Presensi</p>
              <div class="w-8 h-8 rounded-lg bg-[#5530AB]/10 text-[#5530AB] flex items-center justify-center">
                <ClipboardDocumentCheckIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ absensiList.length }}</p>
            <p class="text-xs text-gray-500 mt-1">Seluruh sesi kehadiran</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Menunggu Approval</p>
              <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <ClockIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">
              {{ absensiList.filter(a => a.status === 'pending').length }}
            </p>
            <p class="text-xs text-amber-700 font-semibold mt-1">Perlu tinjauan admin</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Disetujui</p>
              <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircleIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">
              {{ absensiList.filter(a => a.status === 'approved').length }}
            </p>
            <p class="text-xs text-emerald-700 font-semibold mt-1">Presensi terverifikasi</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Ditolak</p>
              <div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <XCircleIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">
              {{ absensiList.filter(a => a.status === 'rejected').length }}
            </p>
            <p class="text-xs text-rose-700 font-semibold mt-1">Tidak memenuhi syarat</p>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Search Bar -->
          <div class="relative flex-1">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari mentor, murid, topik..."
              class="w-full h-10 pl-10 pr-4 rounded-md border border-gray-200 bg-white text-sm focus:border-[#5530AB] outline-none transition-colors"
            />
          </div>

          <!-- Status Filter -->
          <select
            v-model="filterStatus"
            class="h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:border-[#5530AB] outline-none transition-colors min-w-[160px]"
          >
            <option value="">Semua Status</option>
            <option value="pending">Menunggu Approval</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>

          <!-- Mentor Filter -->
          <select
            v-model="filterMentor"
            class="h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:border-[#5530AB] outline-none transition-colors min-w-[160px]"
          >
            <option value="">Semua Mentor</option>
            <option v-for="m in mentors" :key="m.id" :value="m.id">{{ m.fullname }}</option>
          </select>
        </div>

        <!-- Main Table Card -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <!-- Loading State -->
          <div v-if="isLoading" class="flex flex-col items-center justify-center py-16">
            <div class="w-8 h-8 border-2 border-gray-200 border-t-[#5530AB] rounded-full animate-spin"></div>
            <p class="text-sm text-gray-500 mt-4">Memuat data absensi...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredAbsensi.length === 0" class="flex flex-col items-center justify-center py-16 text-center px-4">
            <CheckBadgeIcon class="w-12 h-12 text-gray-300 mb-4" />
            <p class="text-base font-medium text-gray-900">Tidak ada data absensi</p>
            <p class="text-sm text-gray-500 mt-1">Belum ada rekapan absensi atau tidak ada yang cocok dengan filter.</p>
            <button
              @click="openAddModal"
              class="mt-6 px-4 py-2 rounded-md bg-[#5530AB] hover:bg-[#432687] text-white text-sm font-medium transition-colors"
            >
              Tambah Absensi
            </button>
          </div>

          <!-- Data Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-gray-200 bg-gray-50">
                  <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Tanggal & Sesi</th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Mentor</th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Murid yang Hadir</th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Bukti Foto</th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 text-sm">
                <tr v-for="item in filteredAbsensi" :key="item.id" class="hover:bg-gray-50 transition-colors">
                  <!-- Tanggal & Jam -->
                  <td class="px-4 py-4 align-top">
                    <div class="font-medium text-gray-900">
                      {{ formatDate(item.session_date) }}
                    </div>
                    <div class="flex items-center gap-1.5 text-gray-500 mt-1">
                      <ClockIcon class="w-4 h-4 text-gray-400" />
                      <span>{{ item.session_time }}</span>
                    </div>
                    <div v-if="item.topic" class="mt-2 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md inline-block">
                      {{ item.topic }}
                    </div>
                  </td>

                  <!-- Mentor -->
                  <td class="px-4 py-4 align-top">
                    <div class="font-medium text-gray-900">{{ item.mentor?.fullname || 'Mentor tidak ditemukan' }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">@{{ item.mentor?.username || '-' }}</div>
                  </td>

                  <!-- Murid (Bisa Banyak) -->
                  <td class="px-4 py-4 align-top max-w-[280px]">
                    <div class="flex flex-wrap gap-2">
                      <div
                        v-for="st in (item.students || []).slice(0, 3)"
                        :key="st.id"
                        class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-medium text-gray-800"
                      >
                        <span class="truncate max-w-[120px]">{{ st.fullname }}</span>
                      </div>
                      <button
                        v-if="(item.students || []).length > 3"
                        @click="showAllStudents(item)"
                        class="px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-200"
                      >
                        +{{ (item.students || []).length - 3 }} lainnya
                      </button>
                      <span v-if="(!item.students || item.students.length === 0)" class="text-xs text-gray-400 italic">
                        Belum ada murid
                      </span>
                    </div>
                  </td>

                  <!-- Bukti Foto Absen -->
                  <td class="px-4 py-4 align-top">
                    <div v-if="item.bukti_foto">
                      <button
                        @click="previewImage(item.bukti_foto, item)"
                        class="text-[#5530AB] text-sm font-medium hover:underline flex items-center gap-1"
                      >
                        <EyeIcon class="w-4 h-4" /> Lihat Foto
                      </button>
                    </div>
                    <div v-else class="text-sm text-gray-500 flex items-center gap-1 italic">
                      <PhotoIcon class="w-4 h-4" /> Tidak ada
                    </div>
                  </td>

                  <!-- Status Approval -->
                  <td class="px-4 py-4 align-top">
                    <div class="flex flex-col gap-1">
                      <span class="text-sm font-semibold text-gray-900">
                        {{ item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu' }}
                      </span>
                      <p v-if="item.status === 'rejected' && item.rejection_reason" class="text-xs text-red-600 mt-1 max-w-[180px]">
                        Alasan: {{ item.rejection_reason }}
                      </p>
                    </div>
                  </td>

                  <!-- Aksi -->
                  <td class="px-4 py-4 align-top text-right">
                    <div class="flex items-center justify-end gap-2">
                      <!-- Quick Approve / Reject for Pending -->
                      <template v-if="item.status === 'pending'">
                        <button
                          @click="quickUpdateStatus(item, 'approved')"
                          title="Setujui Absensi"
                          class="p-1.5 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <CheckIcon class="w-5 h-5" />
                        </button>
                        <button
                          @click="openRejectModal(item)"
                          title="Tolak Absensi"
                          class="p-1.5 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <XMarkIcon class="w-5 h-5" />
                        </button>
                      </template>
                      <!-- Edit Button -->
                      <button
                        @click="openEditModal(item)"
                        title="Edit Absensi"
                        class="p-1.5 text-gray-600 hover:text-[#5530AB] hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <PencilSquareIcon class="w-5 h-5" />
                      </button>
                      <!-- Delete Button -->
                      <button
                        @click="deleteAbsensi(item)"
                        title="Hapus Absensi"
                        class="p-1.5 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <TrashIcon class="w-5 h-5" />
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

    <!-- MODAL FORM: TAMBAH / EDIT ABSENSI -->
    <div v-if="isModalOpen" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/50">
      <div class="w-full max-w-2xl bg-white rounded-lg shadow-lg flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ editingId ? 'Edit Data Absensi' : 'Tambah Absensi & Presensi' }}
          </h2>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <form @submit.prevent="saveAbsensi" class="p-6 overflow-y-auto space-y-5">
          <!-- Mentor -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-1.5">Mentor <span class="text-red-500">*</span></label>
            <select v-model="form.mentor_id" required class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:border-[#5530AB] outline-none">
              <option value="" disabled>-- Pilih Mentor --</option>
              <option v-for="m in mentors" :key="m.id" :value="m.id">{{ m.fullname }}</option>
            </select>
          </div>

          <!-- Murid -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-sm font-semibold text-gray-900">Murid Hadir <span class="text-red-500">*</span></label>
              <button type="button" @click="toggleSelectAllStudents" class="text-xs text-[#5530AB] font-medium hover:underline">
                {{ isAllStudentsSelected ? 'Batal Pilih Semua' : 'Pilih Semua' }}
              </button>
            </div>
            <div class="border border-gray-300 rounded-md bg-white">
              <div class="p-2 border-b border-gray-200">
                <input v-model="studentSearchQuery" type="text" placeholder="Cari murid..." class="w-full h-8 px-3 text-sm bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-[#5530AB]" />
              </div>
              <div class="max-h-40 overflow-y-auto p-2 space-y-1 bg-gray-50">
                <label v-for="st in filteredStudentOptions" :key="st.id" class="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                  <input type="checkbox" :value="st.id" v-model="form.student_ids" class="w-4 h-4 rounded text-[#5530AB] focus:ring-[#5530AB] border-gray-300" />
                  <span class="text-sm text-gray-900">{{ st.fullname }}</span>
                </label>
                <div v-if="filteredStudentOptions.length === 0" class="py-4 text-center text-sm text-gray-500">Tidak ada murid</div>
              </div>
            </div>
          </div>

          <!-- Waktu -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-900 mb-1.5">Tanggal <span class="text-red-500">*</span></label>
              <input v-model="form.session_date" type="date" required class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:border-[#5530AB] outline-none" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-900 mb-1.5">Jam Sesi <span class="text-red-500">*</span></label>
              <input v-model="form.session_time" type="text" placeholder="14:00 - 15:30 WIB" required class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:border-[#5530AB] outline-none" />
            </div>
          </div>

          <!-- Topik -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-1.5">Topik / Materi (Opsional)</label>
            <input v-model="form.topic" type="text" placeholder="Contoh: Belajar Vue" class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:border-[#5530AB] outline-none" />
          </div>

          <!-- Bukti Foto -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-1.5">Bukti Foto</label>
            <div class="flex items-center gap-4">
               <button type="button" @click="triggerFileInput" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md border border-gray-300 transition-colors">
                 Unggah Foto
               </button>
               <span v-if="isUploadingPhoto" class="text-sm text-gray-500">Mengunggah...</span>
               <span v-else-if="form.bukti_foto" class="text-sm text-green-600 font-medium flex items-center gap-2">
                 Foto terunggah <button type="button" @click="form.bukti_foto = ''" class="text-red-600 hover:underline">Hapus</button>
               </span>
               <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
            </div>
            <div class="mt-2 flex gap-2">
              <input v-model="form.bukti_foto" type="url" placeholder="URL gambar..." class="flex-1 h-9 px-3 rounded-md border border-gray-300 text-sm focus:border-[#5530AB] outline-none" />
            </div>
          </div>

          <!-- Status & Catatan -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label class="block text-sm font-semibold text-gray-900 mb-1.5">Status Approval</label>
              <select v-model="form.status" class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:border-[#5530AB] outline-none">
                <option value="pending">Menunggu Approval</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
            <div v-if="form.status === 'rejected'">
               <label class="block text-sm font-semibold text-red-600 mb-1.5">Alasan Penolakan</label>
               <input v-model="form.rejection_reason" type="text" placeholder="Alasan..." class="w-full h-10 px-3 rounded-md border border-red-300 bg-white text-sm focus:border-red-500 outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-1.5">Catatan (Opsional)</label>
            <textarea v-model="form.notes" rows="2" class="w-full p-3 rounded-md border border-gray-300 bg-white text-sm focus:border-[#5530AB] outline-none resize-none"></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" @click="closeModal" class="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Batal</button>
            <button type="submit" :disabled="isSubmitting || form.student_ids.length === 0" class="px-5 py-2 rounded-md bg-[#5530AB] hover:bg-[#432687] text-white text-sm font-medium disabled:opacity-50">
              {{ editingId ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL REJECT -->
    <div v-if="isRejectModalOpen" class="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-gray-900/50">
      <div class="w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Tolak Absensi</h3>
        <p class="text-sm text-gray-600 mb-4">Berikan alasan penolakan untuk absensi ini.</p>
        <input v-model="rejectReasonInput" type="text" placeholder="Alasan..." class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:border-red-500 outline-none mb-4" />
        <div class="flex justify-end gap-2">
          <button @click="isRejectModalOpen = false" class="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Batal</button>
          <button @click="confirmReject" class="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Tolak</button>
        </div>
      </div>
    </div>

    <!-- MODAL PREVIEW FOTO -->
    <div v-if="previewPhotoUrl" class="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/80" @click="previewPhotoUrl = ''">
      <div class="relative w-full max-w-3xl flex justify-center" @click.stop>
        <button @click="previewPhotoUrl = ''" class="absolute -top-10 right-0 text-white hover:text-gray-300 flex items-center gap-1 font-medium">
          <XMarkIcon class="w-6 h-6" /> Tutup
        </button>
        <img :src="previewPhotoUrl" class="max-h-[85vh] w-auto rounded-md shadow-lg" alt="Bukti Foto" />
      </div>
    </div>

    <!-- MODAL DETAIL SISWA -->
    <div v-if="showStudentModalItem" class="fixed inset-0 z-[215] flex items-center justify-center p-4 bg-gray-900/50" @click="showStudentModalItem = null">
      <div class="w-full max-w-sm bg-white rounded-lg p-6 shadow-lg" @click.stop>
        <div class="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
          <h3 class="text-base font-semibold text-gray-900">Murid Hadir</h3>
          <button @click="showStudentModalItem = null"><XMarkIcon class="w-5 h-5 text-gray-500 hover:text-gray-900"/></button>
        </div>
        <div class="max-h-64 overflow-y-auto space-y-2">
          <div v-for="st in showStudentModalItem.students" :key="st.id" class="p-2 bg-gray-50 rounded-md border border-gray-200 text-sm font-medium text-gray-800">
            {{ st.fullname }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Bars3Icon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  PhotoIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'

const sidebarOpen = ref(false)
const isLoading = ref(true)
const isSubmitting = ref(false)
const isUploadingPhoto = ref(false)

const absensiList = ref<any[]>([])
const mentors = ref<any[]>([])
const students = ref<any[]>([])

const searchQuery = ref('')
const filterStatus = ref('')
const filterMentor = ref('')
const studentSearchQuery = ref('')

const isModalOpen = ref(false)
const editingId = ref<number | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const previewPhotoUrl = ref('')
const showStudentModalItem = ref<any>(null)
const isRejectModalOpen = ref(false)
const rejectingItem = ref<any>(null)
const rejectReasonInput = ref('')

const form = ref({
  mentor_id: '',
  student_ids: [] as string[],
  session_date: new Date().toISOString().split('T')[0],
  session_time: '14:00 - 15:30 WIB',
  topic: '',
  bukti_foto: '',
  status: 'pending',
  notes: '',
  rejection_reason: '',
})

const supabaseUser = useSupabaseUser()

const fetchData = async () => {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/absensi')
    absensiList.value = res.absensi || []
    mentors.value = res.mentors || []
    students.value = res.students || []
  } catch (err: any) {
    alert(err?.message || 'Gagal memuat data absensi.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => { fetchData() })

const filteredAbsensi = computed(() => {
  return absensiList.value.filter(item => {
    if (filterStatus.value && item.status !== filterStatus.value) return false
    if (filterMentor.value && item.mentor_id !== filterMentor.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const mentor = item.mentor?.fullname?.toLowerCase() || ''
      const topic = item.topic?.toLowerCase() || ''
      const matchStudents = (item.students || []).some((st: any) => st.fullname?.toLowerCase().includes(q))
      if (!mentor.includes(q) && !topic.includes(q) && !matchStudents) return false
    }
    return true
  })
})

const filteredStudentOptions = computed(() => {
  if (!studentSearchQuery.value.trim()) return students.value
  const q = studentSearchQuery.value.toLowerCase()
  return students.value.filter(s => s.fullname?.toLowerCase().includes(q))
})

const isAllStudentsSelected = computed(() => students.value.length > 0 && form.value.student_ids.length === students.value.length)
const toggleSelectAllStudents = () => { form.value.student_ids = isAllStudentsSelected.value ? [] : students.value.map(s => s.id) }
const formatDate = (dateStr: string) => { try { return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return dateStr } }
const previewImage = (url: string, item: any) => { previewPhotoUrl.value = url }
const showAllStudents = (item: any) => { showStudentModalItem.value = item }

const openAddModal = () => {
  editingId.value = null
  studentSearchQuery.value = ''
  form.value = { mentor_id: mentors.value[0]?.id || '', student_ids: [], session_date: new Date().toISOString().split('T')[0], session_time: '14:00 - 15:30 WIB', topic: '', bukti_foto: '', status: 'pending', notes: '', rejection_reason: '' }
  isModalOpen.value = true
}

const openEditModal = (item: any) => {
  editingId.value = item.id
  form.value = { mentor_id: item.mentor_id, student_ids: item.student_ids ? [...item.student_ids] : (item.students || []).map((s: any) => s.id), session_date: item.session_date, session_time: item.session_time, topic: item.topic, bukti_foto: item.bukti_foto, status: item.status, notes: item.notes, rejection_reason: item.rejection_reason }
  isModalOpen.value = true
}

const closeModal = () => { isModalOpen.value = false; editingId.value = null }
const triggerFileInput = () => { fileInputRef.value?.click() }

const handleFileUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files?.length) return
  const formData = new FormData()
  formData.append('file', target.files[0])
  isUploadingPhoto.value = true
  try {
    const res: any = await $fetch('/api/admin/absensi/upload', { method: 'POST', body: formData })
    if (res.url) form.value.bukti_foto = res.url
  } catch {
    alert('Gagal mengunggah foto.')
  } finally {
    isUploadingPhoto.value = false
  }
}

const saveAbsensi = async () => {
  isSubmitting.value = true
  try {
    const payload = { ...form.value, approved_by: supabaseUser.value?.id }
    if (editingId.value) await $fetch(`/api/admin/absensi/${editingId.value}`, { method: 'PUT', body: payload })
    else await $fetch('/api/admin/absensi', { method: 'POST', body: payload })
    closeModal()
    await fetchData()
  } catch {
    alert('Gagal menyimpan absensi.')
  } finally {
    isSubmitting.value = false
  }
}

const quickUpdateStatus = async (item: any, status: string) => {
  try {
    await $fetch(`/api/admin/absensi/${item.id}`, { method: 'PUT', body: { status, approved_by: supabaseUser.value?.id } })
    await fetchData()
  } catch {
    alert('Gagal update status.')
  }
}

const openRejectModal = (item: any) => { rejectingItem.value = item; rejectReasonInput.value = ''; isRejectModalOpen.value = true }
const confirmReject = async () => {
  try {
    await $fetch(`/api/admin/absensi/${rejectingItem.value.id}`, { method: 'PUT', body: { status: 'rejected', rejection_reason: rejectReasonInput.value || 'Ditolak', approved_by: null } })
    isRejectModalOpen.value = false
    await fetchData()
  } catch {
    alert('Gagal menolak absensi.')
  }
}

const deleteAbsensi = async (item: any) => {
  if (!confirm('Hapus absensi ini?')) return
  try {
    await $fetch(`/api/admin/absensi/${item.id}`, { method: 'DELETE' })
    await fetchData()
  } catch {
    alert('Gagal menghapus.')
  }
}
</script>