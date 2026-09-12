<template>
  <div class="flex min-h-screen bg-[#F7F7F9] text-gray-900 antialiased" style="font-family: 'Instrument Sans', Inter, sans-serif">
    <AdminSidebar :open="sidebarOpen" @update:open="sidebarOpen = $event" />
    <div class="flex-1 w-full min-w-0 lg:ml-[260px]">

      <!-- Page Header -->
      <header class="sticky top-0 z-[100] flex w-full items-center gap-4 px-6 py-4 bg-white border-b border-gray-200">
        <button
          @click="sidebarOpen = !sidebarOpen"
          class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 transition-all lg:hidden"
        >
          <Bars3Icon class="w-5 h-5" />
        </button>
        <NuxtLink
          to="/schedules"
          class="hidden sm:inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 transition-all"
        >
          <ArrowLeftIcon class="w-4 h-4" />
        </NuxtLink>
        <div class="flex-1">
          <h1 class="text-base font-medium text-gray-900 leading-none">{{ isEditing ? 'Edit Jadwal' : 'Tambah Jadwal' }}</h1>
          <p class="text-xs text-gray-500 mt-0.5">{{ isEditing ? 'Perbarui detail jadwal' : 'Buat jadwal baru dan sinkronisasi ke Google Calendar' }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <NuxtLink to="/schedules" class="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all hidden sm:inline-flex">
            Batal
          </NuxtLink>
          <button
            type="button"
            @click="handleSubmit"
            :disabled="isSubmitting"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold transition-all disabled:opacity-60 shadow-sm hover:-translate-y-0.5"
          >
            <div v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <template v-else>
              <CheckIcon class="w-4 h-4" />
              {{ isEditing ? 'Simpan Perubahan' : 'Simpan Jadwal' }}
            </template>
          </button>
        </div>
      </header>

      <!-- Fetching spinner (edit mode) -->
      <div v-if="isFetching" class="flex items-center justify-center py-32">
        <div class="w-8 h-8 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>

      <main v-else class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        <!-- Cal notice -->
        <div v-if="!calStatus?.connected" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <ExclamationCircleIcon class="w-4 h-4 shrink-0" />
          Google Calendar belum terhubung. Jadwal tersimpan tapi tidak disinkronkan.
          <NuxtLink to="/settings" class="ml-auto font-bold underline underline-offset-2 hover:no-underline">Hubungkan →</NuxtLink>
        </div>

        <!-- ── TITLE ──────────────────────────────────────────────────────── -->
        <div class="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm">
          <input
            v-model="form.title"
            type="text"
            id="schedule-title"
            placeholder="Tambah judul acara..."
            class="w-full text-2xl font-semibold text-gray-900 placeholder:text-gray-300 border-0 border-b-2 border-transparent focus:border-indigo-400 outline-none bg-transparent transition-colors pb-2 leading-snug"
          />
          <p v-if="formErrors.title" class="text-xs text-rose-500 mt-2">{{ formErrors.title }}</p>
        </div>

        <!-- ── Two-column grid ────────────────────────────────────────────── -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <!-- LEFT (2/3) -->
          <div class="lg:col-span-2 space-y-5">

            <!-- DATETIME CARD -->
            <div class="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm space-y-4">
              <h2 class="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <CalendarDaysIcon class="w-4 h-4 text-indigo-400" /> Waktu
              </h2>

              <div class="flex flex-wrap items-center gap-3">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" v-model="form.is_all_day" class="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400" />
                  <span class="text-sm text-gray-700">All day</span>
                </label>
                <select v-model="form.recurrence" class="cfield w-auto">
                  <option value="none">Does not repeat</option>
                  <option value="daily">Every day</option>
                  <option value="weekly">Every week</option>
                  <option value="weekdays">Every weekday (Mon–Fri)</option>
                  <option value="monthly">Every month</option>
                </select>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Mulai</label>
                  <input v-model="form.start_date" type="date" class="cfield w-full" />
                  <input v-if="!form.is_all_day" v-model="form.start_time" type="time" class="cfield w-full" />
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Selesai</label>
                  <input v-model="form.end_date" type="date" class="cfield w-full" />
                  <input v-if="!form.is_all_day" v-model="form.end_time" type="time" class="cfield w-full" />
                </div>
              </div>
              <p class="text-xs text-indigo-500 font-medium">(GMT+07:00) Western Indonesia Time — Jakarta</p>
            </div>

            <!-- DETAIL CARD -->
            <div class="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm space-y-5">
              <h2 class="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <InformationCircleIcon class="w-4 h-4 text-indigo-400" /> Detail Acara
              </h2>

              <!-- Meet link -->
              <div class="flex items-start gap-3">
                <VideoCameraIcon class="w-5 h-5 text-gray-400 mt-2.5 shrink-0" />
                <div class="flex-1 space-y-1">
                  <label class="text-xs font-bold text-gray-500">Google Meet / Video Link</label>
                  <input v-model="form.meet_link" type="url" placeholder="https://meet.google.com/..." class="mfield" />
                </div>
              </div>

              <!-- Location -->
              <div class="flex items-start gap-3">
                <MapPinIcon class="w-5 h-5 text-gray-400 mt-2.5 shrink-0" />
                <div class="flex-1 space-y-1">
                  <label class="text-xs font-bold text-gray-500">Lokasi</label>
                  <input v-model="form.location" type="text" placeholder="Tambah lokasi..." class="mfield" />
                </div>
              </div>

              <!-- Status + Visibility -->
              <div class="flex items-start gap-3">
                <BriefcaseIcon class="w-5 h-5 text-gray-400 mt-2.5 shrink-0" />
                <div class="flex-1 grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-gray-500">Status</label>
                    <select v-model="form.status" class="cfield w-full">
                      <option value="busy">Busy</option>
                      <option value="free">Free</option>
                    </select>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-gray-500">Visibility</label>
                    <select v-model="form.visibility" class="cfield w-full">
                      <option value="default">Default</option>
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Color picker -->
              <div class="flex items-start gap-3">
                <SwatchIcon class="w-5 h-5 text-gray-400 mt-2.5 shrink-0" />
                <div class="flex-1 space-y-2">
                  <label class="text-xs font-bold text-gray-500">Warna Kalender</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="c in calColors"
                      :key="c.name"
                      type="button"
                      @click="form.color = c.name"
                      :title="c.label"
                      :class="[
                        'w-8 h-8 rounded-full transition-all hover:scale-110 focus:outline-none border-2',
                        form.color === c.name ? 'border-gray-700 scale-110 shadow-md' : 'border-transparent'
                      ]"
                      :style="{ background: c.hex }"
                    ></button>
                  </div>
                  <p class="text-xs text-gray-400 capitalize">
                    <span class="inline-block w-3 h-3 rounded-full mr-1 align-middle" :style="{ background: colorHex(form.color) }"></span>
                    {{ calColors.find(c => c.name === form.color)?.label ?? 'Blueberry' }}
                  </p>
                </div>
              </div>

              <!-- Description rich text -->
              <div class="flex items-start gap-3">
                <Bars3BottomLeftIcon class="w-5 h-5 text-gray-400 mt-2.5 shrink-0" />
                <div class="flex-1 space-y-1">
                  <label class="text-xs font-bold text-gray-500">Deskripsi</label>
                  <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-400/20 focus-within:border-indigo-400">
                    <!-- Toolbar -->
                    <div class="flex items-center gap-0.5 px-3 py-2 bg-gray-50/80 border-b border-gray-100 flex-wrap">
                      <button type="button" @click="execFormat('bold')" class="rtbtn font-bold" title="Bold">B</button>
                      <button type="button" @click="execFormat('italic')" class="rtbtn italic" title="Italic">I</button>
                      <button type="button" @click="execFormat('underline')" class="rtbtn underline" title="Underline">U</button>
                      <div class="w-px h-4 bg-gray-200 mx-1 shrink-0"></div>
                      <button type="button" @click="execFormat('insertOrderedList')" class="rtbtn" title="Numbered">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                      </button>
                      <button type="button" @click="execFormat('insertUnorderedList')" class="rtbtn" title="Bullet">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                      </button>
                      <div class="w-px h-4 bg-gray-200 mx-1 shrink-0"></div>
                      <button type="button" @click="insertLink" class="rtbtn" title="Link">
                        <LinkIcon class="w-3.5 h-3.5" />
                      </button>
                      <button type="button" @click="execFormat('removeFormat')" class="rtbtn" title="Clear format">
                        <XMarkIcon class="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div
                      ref="descEditorRef"
                      contenteditable="true"
                      class="min-h-[120px] p-4 text-sm text-gray-800 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                      data-placeholder="Tambah deskripsi acara..."
                      @input="onDescInput"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- NOTIFICATIONS CARD -->
            <div class="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm space-y-3">
              <h2 class="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <BellIcon class="w-4 h-4 text-indigo-400" /> Notifikasi
              </h2>

              <div v-for="(notif, idx) in form.notifications" :key="idx" class="flex flex-wrap items-center gap-2">
                <select v-model="notif.type" class="cfield w-36">
                  <option value="email">Email</option>
                  <option value="popup">Notification</option>
                </select>
                <input v-model.number="notif.minutes" type="number" min="0" max="40320" class="cfield w-20 text-center" />
                <select v-model="notif.unit" class="cfield w-28">
                  <option value="minutes">menit</option>
                  <option value="hours">jam</option>
                  <option value="days">hari</option>
                </select>
                <span class="text-xs text-gray-400">sebelum acara</span>
                <button @click="removeNotification(idx)" class="ml-auto text-gray-400 hover:text-rose-500 transition-colors p-1">
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                @click="addNotification"
                class="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <PlusIcon class="w-4 h-4" /> Tambah notifikasi
              </button>
            </div>

            <!-- Error / Sync warning -->
            <div v-if="submitError" class="flex items-start gap-2 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm">
              <ExclamationCircleIcon class="w-4 h-4 shrink-0 mt-0.5" />{{ submitError }}
            </div>
            <div v-if="syncWarning" class="flex items-start gap-2 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              <ExclamationCircleIcon class="w-4 h-4 shrink-0 mt-0.5" />
              Jadwal tersimpan, tapi Google Calendar sync gagal: {{ syncWarning }}
              <NuxtLink to="/schedules" class="ml-auto font-bold underline underline-offset-2">← Kembali ke list</NuxtLink>
            </div>
          </div>

          <!-- RIGHT (1/3) -->
          <div class="space-y-5">

            <!-- GUESTS CARD -->
            <div class="bg-white border border-gray-200 rounded-2xl px-5 py-5 shadow-sm space-y-4">
              <h2 class="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <UsersIcon class="w-4 h-4 text-indigo-400" /> Peserta
              </h2>

              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500">Email Mentor</label>
                <input v-model="form.mentor_email" type="email" placeholder="mentor@example.com" class="mfield" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500">Email Student <span class="font-normal text-gray-400">(pisahkan koma)</span></label>
                <textarea v-model="studentEmailsRaw" rows="2" placeholder="s1@x.com, s2@x.com" class="mfield h-auto py-2.5 resize-none"></textarea>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500">Tamu Tambahan</label>
                <div class="flex gap-2">
                  <input v-model="guestInputRaw" type="email" placeholder="email@tamu.com" class="mfield flex-1" @keydown.enter.prevent="addGuestFromInput" />
                  <button type="button" @click="addGuestFromInput" class="shrink-0 px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all">
                    Add
                  </button>
                </div>
              </div>

              <!-- Guest list -->
              <div v-if="allGuests.length" class="space-y-1.5">
                <p class="text-[11px] text-gray-400 font-medium">{{ allGuests.length }} peserta terdaftar</p>
                <div
                  v-for="(g, idx) in allGuests"
                  :key="g.email"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    :style="{ background: colorHex(form.color) + '30', color: colorHex(form.color) }">
                    {{ g.email[0].toUpperCase() }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-gray-800 truncate">{{ g.email }}</p>
                    <p class="text-[10px] text-gray-400">{{ g.role }}</p>
                  </div>
                  <button v-if="g.removable" @click="removeGuest(idx)" class="text-gray-400 hover:text-rose-500 transition-colors">
                    <XMarkIcon class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Permissions -->
              <div class="pt-3 border-t border-gray-100 space-y-2.5">
                <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Guest permissions</p>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" v-model="form.guest_permissions.modify" class="perm-check" />
                  <span class="text-sm text-gray-700">Modify event</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" v-model="form.guest_permissions.invite" class="perm-check" />
                  <span class="text-sm text-gray-700">Invite others</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" v-model="form.guest_permissions.see_list" class="perm-check" />
                  <span class="text-sm text-gray-700">See guest list</span>
                </label>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminSidebar from '~/components/AdminSidebar.vue'
import {
  Bars3Icon, ArrowLeftIcon, CheckIcon, XMarkIcon, PlusIcon,
  CalendarDaysIcon, ExclamationCircleIcon, VideoCameraIcon,
  MapPinIcon, BellIcon, UsersIcon, LinkIcon, Bars3BottomLeftIcon,
} from '@heroicons/vue/24/outline'

// ─── Heroicons not in outline — inline SVG used in template ──────────────────
// InformationCircleIcon, BriefcaseIcon, SwatchIcon → defined below as small helpers
const InformationCircleIcon = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>` }
const BriefcaseIcon = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.073a2.25 2.25 0 01-2.25 2.25h-12a2.25 2.25 0 01-2.25-2.25v-4.073M15.75 9H8.25m7.5 0V6.75A2.25 2.25 0 0013.5 4.5h-3a2.25 2.25 0 00-2.25 2.25V9m7.5 0H3.75m16.5 0H3.75" /></svg>` }
const SwatchIcon = { template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" /></svg>` }

// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps<{ scheduleId?: string }>()
const router = useRouter()
const isEditing = computed(() => !!props.scheduleId)

definePageMeta({ layout: false })

// ─── Calendar colors ──────────────────────────────────────────────────────────
const calColors = [
  { name: 'tomato',    label: 'Tomato',    hex: '#D50000' },
  { name: 'flamingo',  label: 'Flamingo',  hex: '#E67C73' },
  { name: 'tangerine', label: 'Tangerine', hex: '#F4511E' },
  { name: 'banana',    label: 'Banana',    hex: '#F6BF26' },
  { name: 'sage',      label: 'Sage',      hex: '#33B679' },
  { name: 'basil',     label: 'Basil',     hex: '#0B8043' },
  { name: 'peacock',   label: 'Peacock',   hex: '#039BE5' },
  { name: 'blueberry', label: 'Blueberry', hex: '#3F51B5' },
  { name: 'lavender',  label: 'Lavender',  hex: '#7986CB' },
  { name: 'grape',     label: 'Grape',     hex: '#8E24AA' },
  { name: 'graphite',  label: 'Graphite',  hex: '#616161' },
]
function colorHex(name?: string) { return calColors.find(c => c.name === name)?.hex ?? '#3F51B5' }

// ─── Types ────────────────────────────────────────────────────────────────────
interface GuestPermissions { modify: boolean; invite: boolean; see_list: boolean }
interface NotifEntry { type: string; minutes: number; unit: string }
interface Schedule {
  id: string; title: string; description?: string; start_at: string; end_at: string
  is_all_day?: boolean; recurrence?: string; location?: string; meet_link?: string
  mentor_email?: string; student_emails?: string[]; guest_emails?: string[]
  guest_permissions?: GuestPermissions; notifications?: NotifEntry[]
  color?: string; status?: string; visibility?: string
  google_sync_status: string
}

// ─── State ────────────────────────────────────────────────────────────────────
const sidebarOpen = ref(false)
const isFetching = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const syncWarning = ref('')
const calStatus = ref<{ connected: boolean } | null>(null)
const descEditorRef = ref<HTMLElement | null>(null)

const today = new Date().toISOString().substring(0, 10)
const form = reactive({
  title: '',
  description: '',
  start_date: today,
  start_time: '11:00',
  end_date: today,
  end_time: '12:00',
  is_all_day: false,
  recurrence: 'none',
  location: '',
  meet_link: '',
  mentor_email: '',
  color: 'blueberry',
  status: 'busy',
  visibility: 'default',
  notifications: [{ type: 'email', minutes: 30, unit: 'minutes' }] as NotifEntry[],
  guest_permissions: { modify: false, invite: true, see_list: true } as GuestPermissions,
})
const formErrors = reactive({ title: '' })
const studentEmailsRaw = ref('')
const guestEmailsRaw = ref('')
const guestInputRaw = ref('')

// ─── Computed guest list for display ─────────────────────────────────────────
const allGuests = computed(() => {
  const result: { email: string; role: string; removable: boolean }[] = []
  if (form.mentor_email.trim()) result.push({ email: form.mentor_email.trim(), role: 'Mentor', removable: false })
  for (const e of parseEmails(studentEmailsRaw.value)) result.push({ email: e, role: 'Student', removable: false })
  for (const e of parseEmails(guestEmailsRaw.value)) result.push({ email: e, role: 'Tamu', removable: true })
  return result
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseEmails(raw: string): string[] {
  return raw.split(',').map(e => e.trim()).filter(Boolean)
}
function buildISO(date: string, time: string): string {
  if (!date) return ''
  return `${date}T${time || '00:00'}:00+07:00`
}
function toLocalParts(isoStr: string) {
  if (!isoStr) return { date: '', time: '' }
  const d = new Date(isoStr)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
}
function resolvedMinutes(n: NotifEntry): number {
  if (n.unit === 'hours') return n.minutes * 60
  if (n.unit === 'days') return n.minutes * 1440
  return n.minutes
}

// ─── Notification helpers ─────────────────────────────────────────────────────
function addNotification() { form.notifications.push({ type: 'email', minutes: 30, unit: 'minutes' }) }
function removeNotification(idx: number) { form.notifications.splice(idx, 1) }

// ─── Guest helpers ────────────────────────────────────────────────────────────
function addGuestFromInput() {
  const email = guestInputRaw.value.trim()
  if (!email) return
  const existing = parseEmails(guestEmailsRaw.value)
  if (!existing.includes(email)) guestEmailsRaw.value = [...existing, email].join(', ')
  guestInputRaw.value = ''
}
function removeGuest(idx: number) {
  const nonRemovableCount = allGuests.value.filter((g, i) => i < idx && !g.removable).length
  const removables = parseEmails(guestEmailsRaw.value)
  removables.splice(idx - nonRemovableCount, 1)
  guestEmailsRaw.value = removables.join(', ')
}

// ─── Rich text ────────────────────────────────────────────────────────────────
function execFormat(cmd: string) { descEditorRef.value?.focus(); document.execCommand(cmd, false) }
function insertLink() {
  const url = prompt('URL:')
  if (url) { descEditorRef.value?.focus(); document.execCommand('createLink', false, url) }
}
function onDescInput() { form.description = descEditorRef.value?.innerHTML ?? '' }

// ─── Load data for edit mode ──────────────────────────────────────────────────
async function loadSchedule() {
  if (!props.scheduleId) return
  isFetching.value = true
  try {
    const { schedules } = await $fetch<{ schedules: Schedule[] }>('/api/admin/schedules')
    const s = schedules.find(x => x.id === props.scheduleId)
    if (!s) { router.push('/schedules'); return }

    const startParts = toLocalParts(s.start_at)
    const endParts = toLocalParts(s.end_at)
    Object.assign(form, {
      title: s.title,
      description: s.description ?? '',
      start_date: startParts.date,
      start_time: startParts.time,
      end_date: endParts.date,
      end_time: endParts.time,
      is_all_day: s.is_all_day ?? false,
      recurrence: s.recurrence ?? 'none',
      location: s.location ?? '',
      meet_link: s.meet_link ?? '',
      mentor_email: s.mentor_email ?? '',
      color: s.color ?? 'blueberry',
      status: s.status ?? 'busy',
      visibility: s.visibility ?? 'default',
      notifications: s.notifications?.map(n => ({ ...n, unit: n.unit ?? 'minutes' })) ?? [{ type: 'email', minutes: 30, unit: 'minutes' }],
      guest_permissions: s.guest_permissions ?? { modify: false, invite: true, see_list: true },
    })
    studentEmailsRaw.value = (s.student_emails ?? []).join(', ')
    guestEmailsRaw.value = (s.guest_emails ?? []).join(', ')
    await nextTick()
    if (descEditorRef.value) descEditorRef.value.innerHTML = s.description ?? ''
  } finally {
    isFetching.value = false
  }
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function handleSubmit() {
  formErrors.title = ''
  submitError.value = ''
  syncWarning.value = ''
  if (!form.title.trim()) { formErrors.title = 'Judul wajib diisi.'; return }

  const finalStart = buildISO(form.start_date, form.is_all_day ? '00:00' : form.start_time)
  const finalEnd = buildISO(form.end_date, form.is_all_day ? '00:00' : form.end_time)

  if (!form.is_all_day && new Date(finalEnd) <= new Date(finalStart)) {
    submitError.value = 'Waktu selesai harus lebih besar dari waktu mulai.'
    return
  }

  isSubmitting.value = true

  try {
    const payload = {
      title: form.title,
      description: form.description,
      start_at: finalStart,
      end_at: finalEnd,
      is_all_day: form.is_all_day,
      recurrence: form.recurrence,
      location: form.location || null,
      meet_link: form.meet_link || null,
      mentor_email: form.mentor_email || null,
      student_emails: parseEmails(studentEmailsRaw.value),
      guest_emails: parseEmails(guestEmailsRaw.value),
      guest_permissions: form.guest_permissions,
      notifications: form.notifications.map(n => ({ type: n.type, minutes: resolvedMinutes(n) })),
      color: form.color || null,
      status: form.status,
      visibility: form.visibility,
    }

    let result: any
    if (isEditing.value) {
      result = await $fetch('/api/admin/schedules/update', { method: 'PATCH', body: { id: props.scheduleId, ...payload } })
    } else {
      result = await $fetch('/api/admin/schedules/create', { method: 'POST', body: payload })
    }

    if (result.googleSync?.success) {
      router.push('/schedules')
    } else {
      syncWarning.value = result.googleSync?.error ?? 'Sync gagal'
    }
  } catch (err: any) {
    submitError.value = err?.data?.statusMessage ?? 'Terjadi kesalahan. Coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function fetchCalStatus() {
  try { calStatus.value = await $fetch<{ connected: boolean }>('/api/google-calendar/status') } catch {}
}

onMounted(() => {
  fetchCalStatus()
  loadSchedule()
})
</script>

<style scoped>
.mfield {
  @apply w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm;
}
.cfield {
  @apply h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all cursor-pointer shadow-sm;
}
.rtbtn {
  @apply w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors text-xs;
}
.perm-check {
  @apply w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400;
}
</style>
