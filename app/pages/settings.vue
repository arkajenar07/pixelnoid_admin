<template>
  <div class="flex min-h-screen bg-[#F7F7F9] text-gray-900 antialiased" style="font-family: 'Instrument Sans', Inter, sans-serif">
    <AdminSidebar :open="sidebarOpen" @update:open="sidebarOpen = $event" />
    <div class="flex-1 w-full min-w-0 lg:ml-[260px]">

      <!-- Header -->
      <header class="sticky top-0 z-[100] flex w-full items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200">
        <div class="flex items-center gap-4">
          <button class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 transition-all lg:hidden" @click="sidebarOpen = !sidebarOpen">
            <Bars3Icon class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-base font-medium text-gray-900 leading-none">Settings</h1>
            <p class="text-xs text-gray-500 mt-0.5">Kelola konfigurasi platform</p>
          </div>
        </div>
      </header>

      <main class="p-6 lg:p-8 max-w-3xl mx-auto space-y-8">

        <!-- Google Calendar Card -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-gray-100 flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CalendarDaysIcon class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-gray-900">Google Calendar</h2>
              <p class="text-xs text-gray-500 mt-0.5">Sinkronisasi jadwal ke Google Calendar Pixelnoid</p>
            </div>
          </div>

          <div class="p-6">
            <!-- Loading -->
            <div v-if="isLoadingStatus" class="flex items-center gap-3 text-gray-500 text-sm">
              <div class="w-5 h-5 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
              Memeriksa status koneksi...
            </div>

            <!-- Error Banner -->
            <div v-if="errorMessage" class="mb-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm">
              <ExclamationCircleIcon class="w-4 h-4 shrink-0 mt-0.5" />
              {{ decodeURIComponent(errorMessage) }}
            </div>

            <!-- Success Banner -->
            <div v-if="successMessage" class="mb-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm">
              <CheckCircleIcon class="w-4 h-4 shrink-0 mt-0.5" />
              {{ successMessage }}
            </div>

            <!-- Not connected -->
            <template v-if="!isLoadingStatus && !status?.connected">
              <div class="flex items-center gap-2 text-sm text-gray-500 mb-5">
                <span class="inline-block w-2 h-2 rounded-full bg-gray-400"></span>
                Belum terhubung
              </div>
              <button
                @click="connectGoogle"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-all hover:-translate-y-0.5 shadow-sm">
                <CalendarDaysIcon class="w-4 h-4" />
                Hubungkan Google Calendar Pixelnoid
              </button>
            </template>

            <!-- Connected -->
            <template v-else-if="status?.connected">
              <div class="flex items-center gap-2 text-sm text-emerald-600 font-bold mb-5">
                <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                Terhubung
              </div>
              <dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
                <dt class="text-gray-500 font-medium">Akun Google</dt>
                <dd class="text-gray-900 font-medium">{{ status.googleEmail ?? '—' }}</dd>
                <dt class="text-gray-500 font-medium">Kalender Aktif</dt>
                <dd class="text-gray-900 font-medium">{{ status.calendarName ?? status.calendarId ?? '—' }}</dd>
              </dl>

              <!-- Calendar picker -->
              <div class="mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                <p class="text-sm font-bold text-gray-700 mb-3">Ganti Kalender</p>
                <div v-if="isLoadingCalendars" class="text-sm text-gray-400">Memuat daftar kalender...</div>
                <div v-else-if="calendars.length > 0" class="flex flex-col gap-2">
                  <button
                    v-for="cal in calendars" :key="cal.id"
                    @click="selectCalendar(cal)"
                    :disabled="isSelectingCalendar"
                    class="flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all text-left"
                    :class="status.calendarId === cal.id
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-bold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'"
                  >
                    <span>{{ cal.summary }}</span>
                    <CheckIcon v-if="status.calendarId === cal.id" class="w-4 h-4 text-emerald-600 shrink-0" />
                  </button>
                  <p v-if="selectCalError" class="text-xs text-rose-500 mt-1">{{ selectCalError }}</p>
                </div>
                <button v-else @click="loadCalendars" class="text-sm text-emerald-600 hover:underline">
                  Muat daftar kalender
                </button>
              </div>

              <button
                @click="disconnect"
                :disabled="isDisconnecting"
                class="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-sm font-bold hover:bg-rose-100 transition-all disabled:opacity-60"
              >
                <div v-if="isDisconnecting" class="w-3.5 h-3.5 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
                <XCircleIcon v-else class="w-4 h-4" />
                Putuskan Koneksi
              </button>
            </template>
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
  CalendarDaysIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  CheckIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'

useSeoMeta({ title: 'Settings — Admin Panel' })
definePageMeta({ layout: false })

const sidebarOpen = ref(false)
const route = useRoute()

const errorMessage = ref<string | null>((route.query.error as string | null) ?? null)
const successMessage = ref<string | null>(null)

if (route.query.connected === '1') {
  successMessage.value = 'Google Calendar berhasil dihubungkan! Pilih kalender yang ingin digunakan.'
}

interface CalendarStatus {
  connected: boolean
  googleEmail?: string
  calendarId?: string
  calendarName?: string
}

const status = ref<CalendarStatus | null>(null)
const isLoadingStatus = ref(true)
const calendars = ref<{ id: string; summary: string; primary: boolean }[]>([])
const isLoadingCalendars = ref(false)
const isSelectingCalendar = ref(false)
const selectCalError = ref('')
const isDisconnecting = ref(false)

function connectGoogle() {
  // Must use window.location.href — NOT navigateTo — so the browser sends
  // real cookies to the server route (Vue Router would intercept navigateTo)
  window.location.href = '/api/auth/google/connect'
}

async function loadStatus() {
  isLoadingStatus.value = true
  try {
    status.value = await $fetch<CalendarStatus>('/api/google-calendar/status')
    if (status.value?.connected) {
      loadCalendars()
    }
  } finally {
    isLoadingStatus.value = false
  }
}

async function loadCalendars() {
  isLoadingCalendars.value = true
  try {
    const result = await $fetch<{ calendars: typeof calendars.value }>('/api/google-calendar/calendars')
    calendars.value = result.calendars
  } catch (err: any) {
    console.error('Failed to load calendars:', err)
  } finally {
    isLoadingCalendars.value = false
  }
}

async function selectCalendar(cal: { id: string; summary: string }) {
  isSelectingCalendar.value = true
  selectCalError.value = ''
  try {
    await $fetch('/api/google-calendar/select-calendar', {
      method: 'POST',
      body: { calendarId: cal.id, calendarName: cal.summary },
    })
    if (status.value) {
      status.value.calendarId = cal.id
      status.value.calendarName = cal.summary
    }
    successMessage.value = `Kalender "${cal.summary}" dipilih.`
  } catch (err: any) {
    selectCalError.value = err?.data?.statusMessage ?? 'Gagal menyimpan kalender.'
  } finally {
    isSelectingCalendar.value = false
  }
}

async function disconnect() {
  if (!confirm('Yakin ingin memutuskan koneksi Google Calendar? Jadwal tetap aman.')) return
  isDisconnecting.value = true
  try {
    await $fetch('/api/google-calendar/disconnect', { method: 'POST' })
    status.value = { connected: false }
    calendars.value = []
    successMessage.value = null
    errorMessage.value = null
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage ?? 'Gagal memutuskan koneksi.'
  } finally {
    isDisconnecting.value = false
  }
}

onMounted(loadStatus)
</script>
