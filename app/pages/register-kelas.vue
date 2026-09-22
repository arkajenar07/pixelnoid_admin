<template>
  <div class="flex min-h-screen bg-gray-50 antialiased font-sans">
    <AdminSidebar :open="sidebarOpen" @update:open="sidebarOpen = $event" />

    <div class="flex-1 w-full min-w-0 lg:ml-[260px] flex flex-col">
      <!-- Topbar -->
      <header class="sticky top-0 z-[100] flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200">
        <div class="flex items-center gap-4">
          <button class="lg:hidden p-2 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors" @click="sidebarOpen = !sidebarOpen">
            <Bars3Icon class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-lg font-semibold text-gray-900 m-0">Register Kelas</h1>
          </div>
        </div>

        <button
          @click="openRegisterModal"
          class="flex items-center gap-2 px-4 py-2 rounded-md bg-[#5530AB] hover:bg-[#432687] text-white text-sm font-medium transition-colors"
        >
          <PlusIcon class="w-4 h-4" />
          Daftarkan Student
        </button>
      </header>

      <main class="p-6 mx-auto w-full flex flex-col gap-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Total Registrasi</p>
              <div class="w-8 h-8 rounded-lg bg-[#5530AB]/10 text-[#5530AB] flex items-center justify-center">
                <UsersIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ members.length }}</p>
            <p class="text-xs text-gray-500 mt-1">Siswa terdaftar di seluruh kelas</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Student Terdaftar</p>
              <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <AcademicCapIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ uniqueStudents }}</p>
            <p class="text-xs text-emerald-700 font-semibold mt-1">Siswa unik</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Kelas Tersedia</p>
              <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <BookOpenIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ classes.length }}</p>
            <p class="text-xs text-gray-500 mt-1">Program & materi aktif</p>
          </div>
        </div>

        <!-- Filter + Search -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div class="relative w-full sm:w-72">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Cari nama atau email student..."
              class="w-full pl-9 pr-4 h-10 rounded-md border border-gray-200 text-sm bg-white focus:border-[#5530AB] outline-none transition-colors"
            />
          </div>
          <select v-model="filterClass" class="h-10 px-3 rounded-md border border-gray-200 text-sm bg-white focus:border-[#5530AB] outline-none transition-colors cursor-pointer min-w-[180px]">
            <option value="">Semua Kelas</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <!-- Loading -->
          <div v-if="isLoading" class="flex flex-col items-center justify-center py-16">
            <div class="w-8 h-8 border-2 border-gray-200 border-t-[#5530AB] rounded-full animate-spin"></div>
            <p class="text-sm text-gray-500 mt-4">Memuat data...</p>
          </div>

          <!-- Empty -->
          <div v-else-if="filteredMembers.length === 0" class="flex flex-col items-center justify-center py-16 text-center px-4">
            <AcademicCapIcon class="w-12 h-12 text-gray-300 mb-4" />
            <p class="text-base font-medium text-gray-900">Belum ada registrasi</p>
            <p class="text-sm text-gray-500 mt-1">Daftarkan student ke kelas menggunakan tombol di atas.</p>
          </div>

          <!-- Data Table -->
          <table v-else class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Student</th>
                <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Kelas</th>
                <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden sm:table-cell">Tanggal Daftar</th>
                <th class="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 text-sm">
              <tr v-for="m in filteredMembers" :key="m.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-md bg-[#5530AB] flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {{ getInitials(m.users?.fullname || m.users?.username || '?') }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="font-semibold text-gray-900 truncate">{{ m.users?.fullname || '—' }}</p>
                      <p class="text-xs text-gray-500 truncate mt-0.5">@{{ m.users?.username || '—' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200 text-gray-800 text-xs font-medium">
                    <BookOpenIcon class="w-3.5 h-3.5 text-gray-500" />
                    {{ m.class?.name || '—' }}
                  </span>
                </td>
                <td class="px-5 py-4 hidden sm:table-cell">
                  <p class="text-gray-600 text-sm">{{ formatDate(m.created_at) }}</p>
                </td>
                <td class="px-5 py-4 text-right">
                  <button
                    @click="removeMember(m)"
                    class="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors inline-flex"
                    title="Hapus registrasi"
                  >
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>

    <!-- ═══════════════ Register Modal ═══════════════ -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div v-if="modal.open" class="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gray-900/50" @click="modal.open = false" />
          <div class="relative w-full max-w-md bg-white rounded-lg shadow-xl flex flex-col">
            
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Daftarkan Student</h2>
              <button @click="modal.open = false" class="text-gray-400 hover:text-gray-600 transition-colors">
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>

            <!-- Modal Body -->
            <form @submit.prevent="submitRegister" class="p-6 space-y-5">
              
              <!-- Student Picker -->
              <div>
                <label class="block text-sm font-semibold text-gray-900 mb-1.5">Pilih Student <span class="text-red-500">*</span></label>
                <select v-model="form.user_id" required
                  class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:border-[#5530AB] outline-none transition-colors">
                  <option value="" disabled selected>-- Pilih Student --</option>
                  <option v-for="s in students" :key="s.id" :value="s.id">
                    {{ s.fullname || s.username || 'No Name' }}
                  </option>
                </select>
              </div>

              <!-- Class Picker -->
              <div>
                <label class="block text-sm font-semibold text-gray-900 mb-1.5">Pilih Kelas <span class="text-red-500">*</span></label>
                <select v-model.number="form.class_id" required
                  class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:border-[#5530AB] outline-none transition-colors">
                  <option value="0" disabled selected>-- Pilih Kelas --</option>
                  <option v-for="c in classes" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </option>
                </select>
              </div>

              <!-- Error message -->
              <p v-if="modal.error" class="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-md">
                {{ modal.error }}
              </p>

              <!-- Actions -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" @click="modal.open = false"
                  class="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button type="submit" :disabled="modal.saving || !form.user_id || !form.class_id"
                  class="flex items-center gap-2 px-5 py-2 rounded-md bg-[#5530AB] hover:bg-[#432687] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <div v-if="modal.saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span v-else>Daftarkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import AdminSidebar from '~/components/AdminSidebar.vue'
import {
  Bars3Icon, PlusIcon, TrashIcon, XMarkIcon, MagnifyingGlassIcon,
  AcademicCapIcon, UsersIcon, BookOpenIcon
} from '@heroicons/vue/24/outline'

useSeoMeta({ title: 'Register Kelas — Admin Panel' })
definePageMeta({ layout: false })

const sidebarOpen = ref(false)

// ── Types ──────────────────────────────────────────────────────
interface Student { id: string; fullname: string | null; username: string | null }
interface CourseClass { id: number; name: string }
interface Member {
  id: number
  created_at: string
  user_id: string
  class_id: number
  users: { fullname: string | null; username: string | null } | null
  class: { name: string } | null
}

// ── State ──────────────────────────────────────────────────────
const members = ref<Member[]>([])
const students = ref<Student[]>([])
const classes = ref<CourseClass[]>([])
const isLoading = ref(true)
const search = ref('')
const filterClass = ref<number | ''>('')

// ── Computed ───────────────────────────────────────────────────
const uniqueStudents = computed(() => new Set(members.value.map(m => m.user_id)).size)

const filteredMembers = computed(() => {
  return members.value.filter(m => {
    const q = search.value.toLowerCase()
    const matchName = m.users?.fullname?.toLowerCase().includes(q) || m.users?.username?.toLowerCase().includes(q) || !q
    const matchClass = filterClass.value === '' || m.class_id === filterClass.value
    return matchName && matchClass
  })
})

// ── Fetch ──────────────────────────────────────────────────────
async function fetchAll() {
  isLoading.value = true
  try {
    const [membersData, studentsData, classesData] = await Promise.all([
      $fetch<{ members: Member[] }>('/api/admin/class-members'),
      $fetch<{ students: Student[] }>('/api/admin/students'),$fetch<{ classes: CourseClass[] }>('/api/admin/classes'),
    ])
    members.value = membersData.members
    students.value = studentsData.students
    classes.value = classesData.classes
  } catch (e) {
    console.error('Error fetching data:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAll)

// ── Register Modal ─────────────────────────────────────────────
const modal = reactive({ open: false, saving: false, error: '' })
const form = reactive({ user_id: '', class_id: 0 })

function openRegisterModal() {
  form.user_id = ''
  form.class_id = 0
  modal.error = ''
  modal.open = true
}

async function submitRegister() {
  if (!form.user_id || !form.class_id) return
  modal.saving = true
  modal.error = ''
  try {
    await $fetch('/api/admin/class-members', {
      method: 'POST',
      body: { user_id: form.user_id, class_id: form.class_id },
    })
    modal.open = false
    await fetchAll()
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }; message?: string }
    modal.error = err?.data?.statusMessage || err?.message || 'Terjadi kesalahan.'
  } finally {
    modal.saving = false
  }
}

async function removeMember(m: Member) {
  const name = m.users?.fullname || m.users?.username || 'student ini'
  if (!confirm(`Hapus registrasi ${name} dari kelas ${m.class?.name}?`)) return
  try {
    await $fetch(`/api/admin/class-members/${m.id}`, { method: 'DELETE' })
    await fetchAll()
  } catch (e) {
    console.error('Error removing member:', e)
  }
}

// ── Helpers ────────────────────────────────────────────────────
function getInitials(name: string) {
  if (!name || name.includes('@')) return name?.[0]?.toUpperCase() || '?'
  const parts = name.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0][0].toUpperCase()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>