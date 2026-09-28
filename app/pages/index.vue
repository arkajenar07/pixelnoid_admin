<template>
  <div class="min-h-screen bg-gray-50 font-sans relative overflow-x-hidden">
    <AdminSidebar :open="sidebarOpen" @update:open="sidebarOpen = $event" />

    <div class="lg:ml-[260px] flex-1 min-w-0 flex flex-col">
      <!-- Header -->
      <header class="sticky top-0 z-[100] flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-200">
        <button class="lg:hidden p-2 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors" @click="sidebarOpen = !sidebarOpen" aria-label="Menu">
          <Bars3Icon class="w-5 h-5" />
        </button>
        <div class="flex-1">
          <h1 class="text-lg font-semibold text-gray-900 m-0">Dashboard</h1>
        </div>
      </header>

      <main class="p-6 lg:p-8 flex flex-col gap-6">
        <!-- Overview Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Stat Total Students -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Total Students</p>
              <div class="w-8 h-8 rounded-lg bg-[#5530AB]/10 text-[#5530AB] flex items-center justify-center">
                <UsersIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ totalStudents }}</p>
            <p class="text-xs text-gray-500 mt-1">Siswa terdaftar di platform</p>
          </div>
          
          <!-- Stat Active Mentors -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Active Mentors</p>
              <div class="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                <AcademicCapIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ totalMentors }}</p>
            <p class="text-xs text-gray-500 mt-1">Mentor aktif pembimbing</p>
          </div>

          <!-- Stat Saldo -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Saldo Bulan Ini</p>
              <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <BanknotesIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ formatCurrency(currentMonthBalance) }}</p>
            <p class="text-xs text-emerald-700 font-semibold mt-1">Pembaruan bulan berjalan</p>
          </div>
        </div>

        <div class="grid gap-6">
          <div class="flex flex-col gap-6">
            
            <!-- Upcoming Schedules -->
            <div class="bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
              <div class="p-5 border-b border-gray-200 flex items-center justify-between">
                <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <CalendarDaysIcon class="w-5 h-5 text-[#5530AB]" />
                  Upcoming Schedules
                </h2>
                <NuxtLink to="/schedules" class="text-sm font-medium text-[#5530AB] hover:underline">Kelola Jadwal →</NuxtLink>
              </div>
              <div class="p-0">
                <div v-if="upcomingSchedules.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarDaysIcon class="w-8 h-8 text-gray-300 mb-2" />
                  <p class="text-sm font-medium text-gray-500">Belum ada jadwal terdekat.</p>
                </div>
                <div v-else class="flex flex-col">
                  <div v-for="s in upcomingSchedules" :key="s.id" class="flex items-start gap-4 p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <div class="w-12 h-12 rounded-md bg-[#5530AB] text-white flex flex-col items-center justify-center shrink-0">
                      <span class="text-base font-bold leading-none">{{ new Date(s.start_at).getDate() }}</span>
                      <span class="text-[0.65rem] font-medium uppercase mt-1">{{ new Date(s.start_at).toLocaleString('id-ID', { month: 'short' }) }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <h3 class="text-sm font-bold text-gray-900 truncate">{{ s.title }}</h3>
                      <p class="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <ClockIcon class="w-3.5 h-3.5"/> 
                        {{ formatTime(s.start_at) }} - {{ formatTime(s.end_at) }}
                      </p>
                      <div class="mt-2" v-if="s.mentor_email">
                        <span class="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md">
                          Mentor: {{ s.mentor_email.split('@')[0] }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- New Users Split -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- New Students -->
              <div class="bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
                <div class="p-5 border-b border-gray-200 flex items-center justify-between">
                  <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <AcademicCapIcon class="w-5 h-5 text-[#5530AB]" />
                    Pendaftar Student
                  </h2>
                  <NuxtLink to="/users" class="text-sm font-medium text-[#5530AB] hover:underline">Semua</NuxtLink>
                </div>
                <div class="p-0">
                  <div v-if="recentStudents.length === 0" class="py-8 text-center text-sm text-gray-500">Belum ada student.</div>
                  <div v-for="u in recentStudents" :key="u.id" class="flex items-center gap-3 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <div class="w-10 h-10 rounded-md bg-[#5530AB] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {{ u.fullname.charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-gray-900 truncate">{{ u.fullname }}</p>
                      <p class="text-xs text-gray-500 truncate mt-0.5">{{ u.email || u.username }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- New Mentors -->
              <div class="bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
                <div class="p-5 border-b border-gray-200 flex items-center justify-between">
                  <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <UserCircleIcon class="w-5 h-5 text-[#5530AB]" />
                    Pendaftar Mentor
                  </h2>
                  <NuxtLink to="/users" class="text-sm font-medium text-[#5530AB] hover:underline">Semua</NuxtLink>
                </div>
                <div class="p-0">
                  <div v-if="recentMentors.length === 0" class="py-8 text-center text-sm text-gray-500">Belum ada mentor.</div>
                  <div v-for="u in recentMentors" :key="u.id" class="flex items-center gap-3 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <div class="w-10 h-10 rounded-md bg-[#5530AB] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {{ u.fullname.charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-gray-900 truncate">{{ u.fullname }}</p>
                      <p class="text-xs text-gray-500 truncate mt-0.5">{{ u.email || u.username }}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Student Progress Widget -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <!-- Widget Header -->
          <div class="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
            <div class="flex items-center gap-2 flex-1">
              <ChartBarIcon class="w-5 h-5 text-[#5530AB]" />
              <h2 class="text-base font-semibold text-gray-900">Progress Belajar Siswa</h2>
              <span class="text-[0.65rem] font-bold px-2 py-0.5 rounded-md bg-[#5530AB]/10 text-[#5530AB] uppercase tracking-wide">Kehadiran</span>
            </div>
            <div class="flex items-center gap-2">
              <!-- Class Filter -->
              <select
                v-model="selectedClassId"
                @change="filterProgress"
                class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5530AB]/30"
              >
                <option :value="null">Semua Kelas</option>
                <option v-for="cls in allClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
              </select>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="progressLoading" class="flex items-center justify-center py-16">
            <div class="w-8 h-8 border-4 border-[#5530AB]/20 border-t-[#5530AB] rounded-full animate-spin"></div>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredProgressData.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
            <ChartBarIcon class="w-10 h-10 text-gray-200 mb-3" />
            <p class="text-sm font-medium text-gray-400">Belum ada data progress.</p>
          </div>

          <!-- Progress Content -->
          <div v-else class="p-5 flex flex-col gap-8">
            <div v-for="cls in filteredProgressData" :key="cls.id">
              <!-- Class Title -->
              <div class="flex items-center gap-3 mb-4">
                <div class="h-px flex-1 bg-gray-100"></div>
                <span class="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{{ cls.name }}</span>
                <span class="text-xs text-gray-400">{{ cls.totalSessions }} sesi</span>
                <div class="h-px flex-1 bg-gray-100"></div>
              </div>

              <!-- Avg Progress Badge -->
              <div class="flex items-center gap-2 mb-4">
                <div class="text-xs font-semibold text-gray-500">Rata-rata kelas:</div>
                <div class="flex items-center gap-1.5">
                  <div class="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-gray-300 rounded-full transition-all duration-700" :style="{ width: cls.avgProgress + '%' }"></div>
                  </div>
                  <span class="text-xs font-bold text-gray-600">{{ cls.avgProgress }}%</span>
                </div>
              </div>

              <!-- Students -->
              <div class="flex flex-col gap-2.5">
                <div
                  v-for="(student, idx) in cls.students"
                  :key="student.id"
                  class="flex items-center gap-3 group"
                >
                  <!-- Rank -->
                  <div
                    class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    :class="[
                      idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                      idx === 1 ? 'bg-gray-200 text-gray-600' :
                      idx === 2 ? 'bg-orange-200 text-orange-700' :
                      'bg-gray-100 text-gray-400'
                    ]"
                  >
                    {{ idx + 1 }}
                  </div>

                  <!-- Name -->
                  <div class="w-28 sm:w-36 shrink-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">{{ student.fullname }}</p>
                    <p class="text-[0.65rem] text-gray-400">{{ student.attended }}/{{ student.totalSessions }} sesi</p>
                  </div>

                  <!-- Progress Bar -->
                  <div class="flex-1 flex items-center gap-2">
                    <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                      <!-- Class average marker -->
                      <div
                        v-if="cls.avgProgress > 0"
                        class="absolute top-0 bottom-0 w-0.5 bg-gray-300 z-10"
                        :style="{ left: cls.avgProgress + '%' }"
                      ></div>
                      <!-- Student bar -->
                      <div
                        class="h-full rounded-full transition-all duration-700 ease-out"
                        :class="[
                          student.progressPct >= cls.avgProgress ? 'bg-[#5530AB]' : 'bg-gray-300'
                        ]"
                        :style="{ width: student.progressPct + '%' }"
                      ></div>
                    </div>
                    <span
                      class="w-10 text-right text-xs font-bold"
                      :class="student.progressPct >= cls.avgProgress ? 'text-[#5530AB]' : 'text-gray-400'"
                    >{{ student.progressPct }}%</span>
                  </div>

                  <!-- Above/Below avg badge -->
                  <div class="shrink-0 hidden sm:block">
                    <span
                      v-if="student.progressPct > cls.avgProgress"
                      class="text-[0.6rem] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700"
                    >↑ Atas rata-rata</span>
                    <span
                      v-else-if="student.progressPct < cls.avgProgress"
                      class="text-[0.6rem] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-500"
                    >↓ Bawah rata-rata</span>
                    <span
                      v-else
                      class="text-[0.6rem] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"
                    >= Rata-rata</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminSidebar from '~/components/AdminSidebar.vue'
import { 
  Bars3Icon, 
  Squares2X2Icon, 
  UsersIcon, 
  AcademicCapIcon, 
  BanknotesIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'

useSeoMeta({ title: 'Dashboard — Admin Panel' })
definePageMeta({ layout: false })

const sidebarOpen = ref(false)
const supabase = useSupabaseClient()

const totalStudents = ref(0)
const totalMentors = ref(0)
const currentMonthBalance = ref(0)

const upcomingSchedules = ref<any[]>([])
const recentStudents = ref<any[]>([])
const recentMentors = ref<any[]>([])

// Student Progress
const progressData = ref<any[]>([])
const filteredProgressData = ref<any[]>([])
const allClasses = ref<any[]>([])
const selectedClassId = ref<number | null>(null)
const progressLoading = ref(false)

function filterProgress() {
  if (!selectedClassId.value) {
    filteredProgressData.value = progressData.value
  } else {
    filteredProgressData.value = progressData.value.filter(c => c.id === selectedClassId.value)
  }
}

const fetchProgress = async () => {
  progressLoading.value = true
  try {
    const { classes } = await $fetch<{ classes: any[] }>('/api/admin/student-progress-overview')
    progressData.value = classes ?? []
    allClasses.value = classes?.map(c => ({ id: c.id, name: c.name })) ?? []
    filterProgress()
  } catch (e) {
    console.error('Failed to fetch progress:', e)
  } finally {
    progressLoading.value = false
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0)
}

function formatTime(iso: string) { 
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
}

const fetchStats = async () => {
  try {
    // 1. Fetch Users from API (bypasses RLS just like users.vue)
    const { users } = await $fetch<{ users: any[] }>('/api/admin/list-users')
    if (users) {
      totalStudents.value = users.filter((u: any) => (u.roles || []).includes('student')).length
      totalMentors.value = users.filter((u: any) => (u.roles || []).includes('mentor')).length
      
      recentStudents.value = users.filter((u: any) => (u.roles || []).includes('student')).slice(0, 5)
      recentMentors.value = users.filter((u: any) => (u.roles || []).includes('mentor')).slice(0, 5)
    }

    // 2. Fetch Schedules
    const { schedules } = await $fetch<{ schedules: any[] }>('/api/admin/schedules')
    if (schedules) {
      const nowMs = Date.now()
      // Sort ascending, filter future schedules or today
      upcomingSchedules.value = schedules
        .filter((s: any) => {
           const sTime = new Date(s.start_at).getTime()
           return sTime >= nowMs - (24 * 60 * 60 * 1000) // from today 
        })
        .sort((a: any, b: any) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
        .slice(0, 4)
    }

    // 3. Fetch Financial Records from API
    const now = new Date()
    const { financial } = await $fetch<{ financial: any[] }>('/api/admin/financial')
    if (financial) {
      // Filter for current month and lunas/completed
      const currentMonthRecords = financial.filter((r: any) => {
        const recordDate = new Date(r.created_at)
        return recordDate.getMonth() === now.getMonth() && 
               recordDate.getFullYear() === now.getFullYear() &&
               (r.status === 'lunas' || r.status === 'completed')
      })
      
      const income = currentMonthRecords.filter((d: any) => d.type === 'income').reduce((sum, d) => sum + (d.amount || 0), 0)
      const expense = currentMonthRecords.filter((d: any) => d.type === 'expense').reduce((sum, d) => sum + (d.amount || 0), 0)
      currentMonthBalance.value = income - expense
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

onMounted(() => {
  fetchStats()
  fetchProgress()
})
</script>