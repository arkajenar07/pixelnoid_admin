<template>
  <div class="flex min-h-screen bg-[#F7F7F9] text-gray-900 antialiased overflow-x-hidden" style="font-family: 'Instrument Sans', Inter, sans-serif">
    <AdminSidebar :open="sidebarOpen" @update:open="sidebarOpen = $event" />
    <div class="flex-1 w-full min-w-0 lg:ml-[260px]">

      <!-- Header -->
      <header class="sticky top-0 z-[100] flex w-full items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200">
        <div class="flex items-center gap-4">
          <button class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 transition-all lg:hidden" @click="sidebarOpen = !sidebarOpen">
            <Bars3Icon class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-base font-medium text-gray-900 leading-none">Jadwal Mengajar</h1>
            <p class="text-xs text-gray-500 mt-0.5">Kelola jadwal dan sinkronisasi ke Google Calendar</p>
          </div>
        </div>
        <NuxtLink
          to="/schedules/create"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold transition-all hover:-translate-y-0.5 shadow-sm"
        >
          <PlusIcon class="w-4 h-4" />
          <span class="hidden sm:inline">Tambah Jadwal</span>
        </NuxtLink>
      </header>

      <main class="p-6 max-w-[1440px] mx-auto">
        <!-- Google Calendar status notice -->
        <div v-if="!calStatus?.connected && calStatus !== null" class="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <ExclamationCircleIcon class="w-4 h-4 shrink-0" />
          Google Calendar belum terhubung. Jadwal akan tetap disimpan, tapi tidak disinkronkan.
          <NuxtLink to="/settings" class="ml-auto font-bold underline underline-offset-2 hover:no-underline">Hubungkan →</NuxtLink>
        </div>

        <!-- 2 Column Layout -->
        <div class="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          
          <!-- LEFT: List Jadwal -->
          <div class="xl:col-span-3 space-y-4">
            
            <!-- List Header Filter -->
            <div class="flex items-center justify-between bg-white px-5 py-4 border border-gray-200 rounded-2xl shadow-sm">
              <h2 class="text-sm font-bold text-gray-800 flex items-center gap-2">
                <CalendarDaysIcon class="w-4 h-4 text-indigo-500" />
                {{ selectedDate ? `Jadwal: ${formatDateOnly(selectedDate)}` : 'Semua Jadwal' }}
              </h2>
              <button 
                v-if="selectedDate" 
                @click="selectedDate = null" 
                class="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg"
              >
                Tampilkan Semua
              </button>
            </div>

            <!-- Table -->
            <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div v-if="isLoading" class="flex items-center justify-center py-20">
                <div class="w-7 h-7 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
              <div v-else-if="filteredSchedules.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
                <CalendarDaysIcon class="w-10 h-10 text-gray-300 mb-3" />
                <p class="text-gray-500 text-sm font-medium">Belum ada jadwal untuk {{ selectedDate ? 'tanggal ini' : 'saat ini' }}</p>
                <button v-if="selectedDate" @click="selectedDate = null" class="mt-2 text-xs font-bold text-indigo-500 hover:underline">
                  Lihat semua jadwal
                </button>
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full whitespace-nowrap">
                  <thead>
                    <tr class="border-b border-gray-100 bg-gray-50/50">
                      <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Judul</th>
                      <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest hidden md:table-cell">Waktu</th>
                      <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest hidden lg:table-cell">Mentor / Student</th>
                      <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Google Sync</th>
                      <th class="px-5 py-3.5 text-right text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="s in filteredSchedules" :key="s.id" class="border-b border-gray-100 hover:bg-gray-50/80 transition-colors group">
                      <td class="px-5 py-4">
                        <div class="flex items-center gap-2">
                          <span v-if="s.color" class="inline-block w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: colorHex(s.color) }"></span>
                          <p class="text-sm font-bold text-gray-900">{{ s.title }}</p>
                        </div>
                        <p v-if="s.location" class="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <MapPinIcon class="w-3 h-3" />{{ s.location }}
                        </p>
                        <p v-else-if="s.description" class="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">{{ stripHtml(s.description) }}</p>
                      </td>
                      <td class="px-5 py-4 hidden md:table-cell">
                        <p class="text-sm text-gray-700">{{ s.is_all_day ? '(All day) ' : '' }}{{ formatDate(s.start_at) }}</p>
                        <p v-if="!s.is_all_day" class="text-xs text-gray-400 mt-0.5">{{ formatTime(s.start_at) }} – {{ formatTime(s.end_at) }}</p>
                        <p v-if="s.recurrence && s.recurrence !== 'none'" class="text-xs text-indigo-400 mt-0.5 font-medium">↻ {{ recurrenceLabel(s.recurrence) }}</p>
                      </td>
                      <td class="px-5 py-4 hidden lg:table-cell">
                        <p v-if="s.mentor_email" class="text-xs text-gray-600 font-medium">{{ s.mentor_email }}</p>
                        <p v-if="s.student_emails?.length" class="text-xs text-gray-400 mt-0.5">{{ s.student_emails.join(', ') }}</p>
                      </td>
                      <td class="px-5 py-4">
                        <span v-if="s.google_sync_status === 'synced'" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
                          <CheckCircleIcon class="w-3.5 h-3.5" /> Synced
                        </span>
                        <div v-else-if="s.google_sync_status === 'failed'" class="flex items-center gap-2">
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100">
                            <ExclamationCircleIcon class="w-3.5 h-3.5" /> Failed
                          </span>
                          <button @click="retrySync(s)" :disabled="retrying === s.id" class="text-[11px] text-indigo-600 hover:underline font-bold disabled:opacity-50">
                            {{ retrying === s.id ? '...' : 'Retry' }}
                          </button>
                        </div>
                        <span v-else-if="s.google_sync_status === 'pending'" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-bold border border-amber-100">
                          <ClockIcon class="w-3.5 h-3.5" /> Pending
                        </span>
                        <span v-else class="text-xs text-gray-400">—</span>
                      </td>
                      <td class="px-5 py-4 text-right">
                        <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <NuxtLink
                            :to="`/schedules/${s.id}`"
                            class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
                          >
                            <PencilSquareIcon class="w-4 h-4" /> Edit
                          </NuxtLink>
                          <button @click="deleteSchedule(s)" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all">
                            <TrashIcon class="w-4 h-4" /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- RIGHT: Calendar Widget -->
          <div class="xl:col-span-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm sticky top-[88px]">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-[0.9rem] font-bold text-gray-900 capitalize tracking-tight">{{ monthName }} {{ currentYear }}</h3>
              <div class="flex items-center gap-1">
                <button @click="prevMonth" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><ChevronLeftIcon class="w-4 h-4" /></button>
                <button @click="nextMonth" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><ChevronRightIcon class="w-4 h-4" /></button>
              </div>
            </div>
            
            <div class="grid grid-cols-7 gap-1 text-center mb-2">
              <div v-for="d in ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']" :key="d" class="text-[10px] font-bold text-gray-400">
                {{ d }}
              </div>
            </div>
            
            <div class="grid grid-cols-7 gap-y-2 gap-x-1">
              <!-- Empty slots -->
              <div v-for="i in blankDays" :key="'blank'+i" class="h-8"></div>
              
              <!-- Days -->
              <button
                v-for="day in daysInMonth" 
                :key="day"
                @click="selectDate(day)"
                :class="[ 
                  'h-8 w-full rounded-lg text-[13px] font-semibold flex flex-col items-center justify-center relative transition-all border border-transparent',
                  isSelected(day) ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'text-gray-700 hover:bg-gray-50 hover:border-gray-200',
                  isToday(day) && !isSelected(day) ? 'text-indigo-600 bg-indigo-50/50' : ''
                ]"
              >
                <span class="relative z-10">{{ day }}</span>
                <span 
                  v-if="hasSchedule(day)" 
                  :class="[
                    'w-1 h-1 rounded-full absolute bottom-1 transition-colors', 
                    isSelected(day) ? 'bg-white' : 'bg-indigo-400'
                  ]"
                ></span>
              </button>
            </div>

            <div class="mt-6 pt-4 border-t border-gray-100">
              <NuxtLink
                to="/schedules/create"
                class="flex items-center justify-center gap-1.5 w-full px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-all border border-gray-200"
              >
                <PlusIcon class="w-3.5 h-3.5" />
                Buat Jadwal Baru
              </NuxtLink>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminSidebar from '~/components/AdminSidebar.vue'
import {
  Bars3Icon, PlusIcon, CalendarDaysIcon, PencilSquareIcon, TrashIcon,
  ExclamationCircleIcon, CheckCircleIcon, ClockIcon, MapPinIcon,
  ChevronLeftIcon, ChevronRightIcon,
} from '@heroicons/vue/24/outline'

useSeoMeta({ title: 'Jadwal Mengajar — Admin Panel' })
definePageMeta({ layout: false })

const sidebarOpen = ref(false)

interface Schedule {
  id: string
  title: string
  description?: string
  start_at: string
  end_at: string
  is_all_day?: boolean
  recurrence?: string
  location?: string
  color?: string
  mentor_email?: string
  student_emails?: string[]
  google_sync_status: string
}

const schedules = ref<Schedule[]>([])
const isLoading = ref(true)
const retrying = ref<string | null>(null)
const calStatus = ref<{ connected: boolean } | null>(null)

// ── Colors & Formatting ────────────────────────────────────────────────────────
const calColors = [
  { name: 'tomato', hex: '#D50000' }, { name: 'flamingo', hex: '#E67C73' },
  { name: 'tangerine', hex: '#F4511E' }, { name: 'banana', hex: '#F6BF26' },
  { name: 'sage', hex: '#33B679' }, { name: 'basil', hex: '#0B8043' },
  { name: 'peacock', hex: '#039BE5' }, { name: 'blueberry', hex: '#3F51B5' },
  { name: 'lavender', hex: '#7986CB' }, { name: 'grape', hex: '#8E24AA' },
  { name: 'graphite', hex: '#616161' },
]
function colorHex(name: string) { return calColors.find(c => c.name === name)?.hex ?? '#3F51B5' }
function stripHtml(html: string) { return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }
function formatTime(iso: string) { return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }
function recurrenceLabel(r: string) {
  const map: Record<string, string> = { daily: 'Setiap hari', weekly: 'Setiap minggu', weekdays: 'Setiap hari kerja', monthly: 'Setiap bulan' }
  return map[r] ?? r
}

// Helper: converts UTC ISO string to local YYYY-MM-DD
function toLocalDateStr(isoString: string) {
  const d = new Date(isoString)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function formatDateOnly(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// Helper: checks if a schedule falls on a target local date string (YYYY-MM-DD)
function doesScheduleFallOnDate(s: Schedule, targetDateStr: string) {
  const targetDate = new Date(targetDateStr)
  
  const startStr = toLocalDateStr(s.start_at)
  const startDate = new Date(startStr)
  
  // 1. Target date cannot be before the first occurrence date
  if (targetDate < startDate) return false
  
  // 2. If no recurrence, must exactly match
  if (!s.recurrence || s.recurrence === 'none') {
    return targetDateStr === startStr
  }
  
  // 3. Handle recurrence
  if (s.recurrence === 'daily') return true
  
  if (s.recurrence === 'weekly') {
    return targetDate.getDay() === startDate.getDay()
  }
  
  if (s.recurrence === 'weekdays') {
    const d = targetDate.getDay()
    return d >= 1 && d <= 5
  }
  
  if (s.recurrence === 'monthly') {
    return targetDate.getDate() === startDate.getDate()
  }
  
  return false
}

// ── Calendar Logic ─────────────────────────────────────────────────────────────
const currentDate = new Date()
const currentMonth = ref(currentDate.getMonth())
const currentYear = ref(currentDate.getFullYear())
const selectedDate = ref<string | null>(null)

const monthName = computed(() => {
  return new Date(currentYear.value, currentMonth.value).toLocaleString('id-ID', { month: 'long' })
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const blankDays = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay() // 0 = Sunday
})

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function selectDate(day: number) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const dateStr = `${currentYear.value}-${pad(currentMonth.value + 1)}-${pad(day)}`
  
  if (selectedDate.value === dateStr) {
    selectedDate.value = null // unselect toggle
  } else {
    selectedDate.value = dateStr
  }
}

function isSelected(day: number) {
  if (!selectedDate.value) return false
  const pad = (n: number) => n.toString().padStart(2, '0')
  return selectedDate.value === `${currentYear.value}-${pad(currentMonth.value + 1)}-${pad(day)}`
}

function isToday(day: number) {
  const today = new Date()
  return today.getDate() === day && today.getMonth() === currentMonth.value && today.getFullYear() === currentYear.value
}

function hasSchedule(day: number) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const dateStr = `${currentYear.value}-${pad(currentMonth.value + 1)}-${pad(day)}`
  return schedules.value.some(s => doesScheduleFallOnDate(s, dateStr))
}

const filteredSchedules = computed(() => {
  if (!selectedDate.value) return schedules.value
  return schedules.value.filter(s => doesScheduleFallOnDate(s, selectedDate.value!))
})

// ── API Calls ──────────────────────────────────────────────────────────────────
async function fetchSchedules() {
  isLoading.value = true
  try {
    const { schedules: data } = await $fetch<{ schedules: Schedule[] }>('/api/admin/schedules')
    schedules.value = data
  } finally {
    isLoading.value = false
  }
}

async function fetchCalStatus() {
  try { calStatus.value = await $fetch<{ connected: boolean }>('/api/google-calendar/status') } catch {}
}

async function deleteSchedule(s: Schedule) {
  if (!confirm(`Hapus jadwal "${s.title}"? Event Google Calendar juga akan dihapus.`)) return
  try {
    await $fetch('/api/admin/schedules/delete', { method: 'DELETE', body: { id: s.id } })
    await fetchSchedules()
  } catch (err: any) {
    alert(err?.data?.statusMessage ?? 'Gagal menghapus jadwal.')
  }
}

async function retrySync(s: Schedule) {
  retrying.value = s.id
  try {
    await $fetch('/api/google-calendar/sync/retry', { method: 'POST', body: { scheduleId: s.id } })
    await fetchSchedules()
  } finally {
    retrying.value = null
  }
}

onMounted(() => { fetchSchedules(); fetchCalStatus() })
</script>
