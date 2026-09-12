<template>
  <div class="flex min-h-screen bg-[#F7F7F9] antialiased font-['Instrument_Sans','Raleway',sans-serif]">
    <AdminSidebar :open="sidebarOpen" @update:open="sidebarOpen = $event" />

    <div class="flex-1 w-full min-w-0 lg:ml-[260px] flex flex-col">

      <!-- Topbar -->
      <header class="sticky top-0 z-[100] flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div class="flex items-center gap-4">
          <button class="lg:hidden p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors" @click="sidebarOpen = !sidebarOpen">
            <Bars3Icon class="w-5 h-5" />
          </button>
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/[0.04] text-[0.625rem] font-bold tracking-wider uppercase text-violet-600">
                <AcademicCapIcon class="w-3 h-3" />
                Registrasi
              </span>
            </div>
            <h1 class="text-base font-semibold text-gray-900">Register Kelas</h1>
          </div>
        </div>

        <button
          @click="openRegisterModal"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-violet-500/20"
        >
          <PlusIcon class="w-4 h-4" />
          Daftarkan Student
        </button>
      </header>

      <main class="p-6 max-w-[960px] mx-auto w-full space-y-5">

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <UsersIcon class="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ members.length }}</p>
              <p class="text-xs text-gray-500 mt-0.5">Total Registrasi</p>
            </div>
          </div>
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <AcademicCapIcon class="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ uniqueStudents }}</p>
              <p class="text-xs text-gray-500 mt-0.5">Student Terdaftar</p>
            </div>
          </div>
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 col-span-2 sm:col-span-1">
            <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <BookOpenIcon class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ classes.length }}</p>
              <p class="text-xs text-gray-500 mt-0.5">Kelas Tersedia</p>
            </div>
          </div>
        </div>

        <!-- Filter + Search -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div class="relative w-full sm:w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Cari nama atau email student..."
              class="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 text-sm outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all bg-white"
            />
          </div>
          <select v-model="filterClass" class="h-10 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-violet-500/50 transition-all bg-white cursor-pointer">
            <option value="">Semua Kelas</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          <!-- Loading -->
          <div v-if="isLoading" class="flex items-center justify-center py-20">
            <div class="w-8 h-8 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
          </div>

          <!-- Empty -->
          <div v-else-if="filteredMembers.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              <AcademicCapIcon class="w-7 h-7 text-violet-300" />
            </div>
            <p class="text-sm font-semibold text-gray-700 mb-1">Belum ada registrasi</p>
            <p class="text-xs text-gray-400">Daftarkan student ke kelas menggunakan tombol di atas.</p>
          </div>

          <!-- Data Table -->
          <table v-else class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                <th class="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kelas</th>
                <th class="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Tanggal Daftar</th>
                <th class="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="m in filteredMembers" :key="m.id" class="hover:bg-gray-50/70 transition-colors group">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-sm">
                      {{ getInitials(m.users?.fullname || m.users?.username || '?') }}
                    </div>
                    <div class="min-w-0">
                      <p class="font-semibold text-gray-900 truncate leading-tight">{{ m.users?.fullname || '—' }}</p>
                      <p class="text-xs text-gray-400 truncate mt-0.5">@{{ m.users?.username || '—' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
                    <BookOpenIcon class="w-3 h-3" />
                    {{ m.class?.name || '—' }}
                  </span>
                </td>
                <td class="px-5 py-4 hidden sm:table-cell">
                  <p class="text-gray-500 text-xs">{{ formatDate(m.created_at) }}</p>
                </td>
                <td class="px-5 py-4 text-right">
                  <button
                    @click="removeMember(m)"
                    class="p-1.5 rounded-lg text-gray-300 group-hover:text-gray-400 hover:!text-rose-500 hover:bg-rose-50 transition-all"
                    title="Hapus registrasi"
                  >
                    <TrashIcon class="w-4 h-4" />
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
      <Transition name="modal">
        <div v-if="modal.open" class="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="modal.open = false" />
          <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-violet-600 to-violet-500">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <AcademicCapIcon class="w-4 h-4 text-white" />
                </div>
                <h2 class="text-base font-semibold text-white">Daftarkan Student ke Kelas</h2>
              </div>
              <button @click="modal.open = false" class="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>

            <!-- Modal Body -->
            <form @submit.prevent="submitRegister" class="p-6 space-y-5">

              <!-- Student Picker -->
              <div>
                <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">
                  Pilih Student *
                </label>
                <select v-model="form.user_id" required
                  class="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-violet-500/50 transition-all bg-white cursor-pointer">
                  <option value="" disabled selected>Pilih Student</option>
                  <option v-for="s in students" :key="s.id" :value="s.id">
                    {{ s.fullname || s.username || 'No Name' }}
                  </option>
                </select>
              </div>

              <!-- Class Picker -->
              <div>
                <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">
                  Pilih Kelas *
                </label>
                <select v-model.number="form.class_id" required
                  class="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-violet-500/50 transition-all bg-white cursor-pointer">
                  <option value="0" disabled selected>Pilih Kelas</option>
                  <option v-for="c in classes" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </option>
                </select>
              </div>

              <!-- Error message -->
              <p v-if="modal.error" class="text-sm text-rose-500 bg-rose-50 border border-rose-100 px-4 py-3 rounded-xl">
                {{ modal.error }}
              </p>

              <!-- Actions -->
              <div class="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" @click="modal.open = false"
                  class="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button type="submit" :disabled="modal.saving || !form.user_id || !form.class_id"
                  class="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  <div v-if="modal.saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <PlusIcon v-else class="w-4 h-4" />
                  Daftarkan
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
      $fetch<{ students: Student[] }>('/api/admin/students'),
      $fetch<{ classes: CourseClass[] }>('/api/admin/classes'),
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

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.98); }
</style>
