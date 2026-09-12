<template>
  <div class="min-h-screen bg-[#F8F9FD] font-['Instrument_Sans','Raleway',sans-serif] relative overflow-x-hidden">
    <AdminSidebar :open="sidebarOpen" @update:open="sidebarOpen = $event" />

    <div class="lg:ml-[260px] flex-1 min-w-0 relative z-10 flex flex-col">
      <header class="sticky top-0 z-[100] flex items-center gap-4 px-6 py-4 bg-[#F8F9FD]/85 backdrop-blur-xl border-b border-gray-200">
        <button class="lg:hidden p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors" @click="sidebarOpen = !sidebarOpen" aria-label="Menu">
          <Bars3Icon class="w-5 h-5" />
        </button>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-0.5">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-rose-500/20 bg-rose-500/[0.04] text-[0.625rem] font-bold tracking-wider uppercase text-rose-600">
              <Squares2X2Icon class="w-3 h-3" />
              Admin Overview
            </span>
          </div>
          <h1 class="text-[1.0625rem] font-medium text-gray-900 m-0 tracking-tight mt-2">
            System overview and quick metrics.
          </h1>
        </div>
      </header>

      <main class="p-6 lg:p-8 flex flex-col gap-8">
        <!-- Overview Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[40px] rounded-full group-hover:bg-rose-500/10 transition-colors"></div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <UsersIcon class="w-5 h-5" />
              </div>
              <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Students</h3>
            </div>
            <p class="text-3xl font-black text-gray-900 tracking-tight">{{ totalStudents }}</p>
            <div class="flex items-center gap-2 mt-2 text-[0.6875rem] font-bold text-emerald-600">
              <span>Updated</span>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] rounded-full group-hover:bg-indigo-500/10 transition-colors"></div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <AcademicCapIcon class="w-5 h-5" />
              </div>
              <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Mentors</h3>
            </div>
            <p class="text-3xl font-black text-gray-900 tracking-tight">{{ totalMentors }}</p>
            <div class="flex items-center gap-2 mt-2 text-[0.6875rem] font-bold text-emerald-600">
              <span>Updated</span>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full group-hover:bg-emerald-500/10 transition-colors"></div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BanknotesIcon class="w-5 h-5" />
              </div>
              <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Saldo Bulan Ini</h3>
            </div>
            <p class="text-3xl font-black text-gray-900 tracking-tight">{{ formatCurrency(currentMonthBalance) }}</p>
            <div class="flex items-center gap-2 mt-2 text-[0.6875rem] font-bold text-emerald-600">
              <span>Updated</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <!-- Recent Activity Log -->
          <div class="xl:col-span-2 flex flex-col gap-6">
            
            <!-- Upcoming Schedules -->
            <div class="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div class="p-6 lg:p-7 border-b border-gray-100 flex items-center justify-between">
                <h2 class="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <CalendarDaysIcon class="w-5 h-5 text-indigo-500" />
                  Upcoming Schedules
                </h2>
                <NuxtLink to="/schedules" class="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">Kelola Jadwal →</NuxtLink>
              </div>
              <div class="p-6">
                <div v-if="upcomingSchedules.length === 0" class="flex flex-col items-center justify-center py-10 text-center">
                  <CalendarDaysIcon class="w-8 h-8 text-gray-300 mb-2" />
                  <p class="text-sm text-gray-500 font-medium">Belum ada jadwal terdekat.</p>
                </div>
                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-for="s in upcomingSchedules" :key="s.id" class="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group shadow-sm hover:shadow-md">
                    <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center shrink-0 border border-indigo-100 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <span class="text-sm font-black leading-none">{{ new Date(s.start_at).getDate() }}</span>
                      <span class="text-[0.6rem] font-bold uppercase mt-0.5">{{ new Date(s.start_at).toLocaleString('id-ID', { month: 'short' }) }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <h3 class="text-[0.9rem] font-bold text-gray-900 truncate">{{ s.title }}</h3>
                      <p class="text-[0.75rem] text-gray-500 mt-0.5 flex items-center gap-1"><ClockIcon class="w-3 h-3"/> {{ formatTime(s.start_at) }} - {{ formatTime(s.end_at) }}</p>
                      <div class="flex gap-1.5 mt-2 overflow-x-hidden">
                        <span v-if="s.mentor_email" class="text-[0.65rem] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md truncate max-w-full border border-emerald-100" title="Mentor">M: {{ s.mentor_email.split('@')[0] }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- New Users Split -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- New Students -->
              <div class="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div class="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 class="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <AcademicCapIcon class="w-4 h-4 text-rose-500" />
                    Pendaftar Student
                  </h2>
                  <NuxtLink to="/users" class="text-[0.8rem] font-bold text-rose-600 hover:underline">Semua</NuxtLink>
                </div>
                <div class="p-0">
                  <div v-if="recentStudents.length === 0" class="py-10 text-center text-sm text-gray-500">Belum ada student.</div>
                  <div v-for="u in recentStudents" :key="u.id" class="flex items-center gap-3 p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <div class="w-9 h-9 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center text-xs font-bold shrink-0">
                      {{ u.fullname.charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-[0.875rem] font-bold text-gray-900 truncate">{{ u.fullname }}</p>
                      <p class="text-[0.7rem] text-gray-500 truncate">{{ u.email || u.username }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- New Mentors -->
              <div class="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div class="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 class="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <UserCircleIcon class="w-4 h-4 text-emerald-500" />
                    Pendaftar Mentor
                  </h2>
                  <NuxtLink to="/users" class="text-[0.8rem] font-bold text-emerald-600 hover:underline">Semua</NuxtLink>
                </div>
                <div class="p-0">
                  <div v-if="recentMentors.length === 0" class="py-10 text-center text-sm text-gray-500">Belum ada mentor.</div>
                  <div v-for="u in recentMentors" :key="u.id" class="flex items-center gap-3 p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <div class="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-xs font-bold shrink-0">
                      {{ u.fullname.charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-[0.875rem] font-bold text-gray-900 truncate">{{ u.fullname }}</p>
                      <p class="text-[0.7rem] text-gray-500 truncate">{{ u.email || u.username }}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Quick Actions & System Resources -->
          <div class="flex flex-col gap-8">
            <div class="bg-gray-900 rounded-[2rem] p-8 shadow-2xl shadow-gray-300 relative overflow-hidden group">
              <div class="absolute -top-10 -right-10 w-40 h-40 bg-rose-500 blur-[50px] rounded-full opacity-30 group-hover:opacity-40 transition-opacity"></div>
              <h2 class="text-lg font-bold text-white tracking-tight mb-6 relative z-10">Quick Actions</h2>
              <div class="flex flex-col gap-3 relative z-10">
                <button class="w-full flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-left group/btn">
                  <span class="text-[0.875rem] font-bold text-white">Create Broadcast</span>
                  <ArrowRightIcon class="w-4 h-4 text-gray-400 group-hover/btn:translate-x-1 transition-transform" />
                </button>
                <button class="w-full flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-left group/btn">
                  <span class="text-[0.875rem] font-bold text-white">Add New Mentor</span>
                  <ArrowRightIcon class="w-4 h-4 text-gray-400 group-hover/btn:translate-x-1 transition-transform" />
                </button>
                <button class="w-full flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-left group/btn">
                  <span class="text-[0.875rem] font-bold text-white">Review Reports</span>
                  <span class="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[0.625rem] font-black">12</span>
                </button>
              </div>
            </div>

            <div class="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-6 lg:p-8">
              <h2 class="text-lg font-bold text-gray-900 tracking-tight mb-6">System Resources</h2>
              <div class="space-y-5">
                <div>
                  <div class="flex justify-between text-[0.75rem] font-bold mb-2">
                    <span class="text-gray-600">Database Storage</span>
                    <span class="text-gray-900">45% (45GB / 100GB)</span>
                  </div>
                  <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-indigo-500 w-[45%]"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-[0.75rem] font-bold mb-2">
                    <span class="text-gray-600">Server Memory (RAM)</span>
                    <span class="text-gray-900">72% (11.5GB / 16GB)</span>
                  </div>
                  <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-amber-500 w-[72%]"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-[0.75rem] font-bold mb-2">
                    <span class="text-gray-600">API Request Quota</span>
                    <span class="text-gray-900">12% (1.2M / 10M)</span>
                  </div>
                  <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 w-[12%]"></div>
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
  ShieldExclamationIcon, 
  BanknotesIcon,
  UserPlusIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  ClockIcon
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

    // 2. Fetch Financial Records from API
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
})
</script>
