<script setup lang="ts">
import { onMounted, watch } from 'vue'
import {
  HomeIcon,
  BanknotesIcon,
  UsersIcon,
  TicketIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentCheckIcon,
  FolderIcon,
  CheckBadgeIcon,
  DocumentChartBarIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'

defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open'])

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()

const handleLogout = async () => {
  await supabase.auth.signOut()
  navigateTo('/login')
}

// Navigasi dikelompokkan berdasarkan fungsi / hierarki
const navigationGroups = [
  {
    title: 'Menu Utama',
    items: [
      { name: 'Dashboard', href: '/', icon: HomeIcon },
    ]
  },
  {
    title: 'Akademik & Siswa',
    items: [
      { name: 'Student Management', href: '/students', icon: ClipboardDocumentCheckIcon },
      { name: 'Progress Reports', href: '/progress-reports', icon: DocumentChartBarIcon },
      { name: 'Absensi', href: '/absensi', icon: CheckBadgeIcon },
      { name: 'Register Kelas', href: '/register-kelas', icon: AcademicCapIcon },
      { name: 'Jadwal Mengajar', href: '/schedules', icon: CalendarDaysIcon },
    ]
  },
  {
    title: 'Materi & Pembelajaran',
    items: [
      { name: 'List Kelas', href: '/classes', icon: AcademicCapIcon },
      { name: 'Resources', href: '/resources', icon: FolderIcon },
    ]
  },
  {
    title: 'Keuangan & Promosi',
    items: [
      { name: 'Financial Tracker', href: '/financial', icon: BanknotesIcon },
      { name: 'Vouchers', href: '/vouchers', icon: TicketIcon },
    ]
  },
  {
    title: 'Sistem & Pengaturan',
    items: [
      { name: 'Users', href: '/users', icon: UsersIcon },
      { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
    ]
  }
]

// Gunakan useState agar state grup yang terbuka tersimpan antar navigasi halaman (menghindari flicker/jumping saat ganti rute)
const openGroups = useState<string[]>('admin_sidebar_open_groups', () => [])

// Cek apakah item aktif (termasuk subroute)
const isItemActive = (href: string) => {
  if (href === '/') return route.path === '/'
  return route.path === href || route.path.startsWith(href + '/')
}

// Otomatis buka grup yang didalamnya terdapat route aktif
const autoOpenActiveGroup = () => {
  navigationGroups.forEach(group => {
    const hasActiveItem = group.items.some(item => isItemActive(item.href))
    if (hasActiveItem && !openGroups.value.includes(group.title)) {
      openGroups.value.push(group.title)
    }
  })
}

// Langsung buka grup aktif di server & client saat inisialisasi agar instan
autoOpenActiveGroup()

// Fungsi untuk toggle buka/tutup dropdown dengan animasi mulus
const toggleGroup = (title: string) => {
  if (openGroups.value.includes(title)) {
    openGroups.value = openGroups.value.filter(g => g !== title)
  } else {
    openGroups.value.push(title)
  }
}

onMounted(() => {
  autoOpenActiveGroup()
})

watch(() => route.path, () => {
  autoOpenActiveGroup()
})
</script>

<template>
  <div>
    <!-- Mobile overlay with smooth fade transition -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[110] bg-gray-900/50 backdrop-blur-xs lg:hidden"
        @click="emit('update:open', false)"
      />
    </Transition>

    <!-- Sidebar with smooth slide & shadow -->
    <aside
      :class="[
        open ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        'fixed inset-y-0 left-0 z-[120] w-[260px] bg-white border-r border-gray-200 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 flex flex-col select-none'
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
        <NuxtLink to="/" class="flex items-center gap-2 group transition-transform duration-200 hover:scale-[1.02]">
          <span class="text-xl font-bold tracking-wider text-[#5530AB] transition-colors duration-200 group-hover:text-[#43258e]">
            PIXELNOID
          </span>
        </NuxtLink>
      </div>

      <!-- Nav links -->
      <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div v-for="group in navigationGroups" :key="group.title" class="space-y-1">
          <!-- Dropdown Header/Trigger -->
          <button
            type="button"
            @click="toggleGroup(group.title)"
            class="flex items-center justify-between w-full px-3 py-2 text-[11px] font-bold tracking-wider text-gray-400 hover:text-gray-700 uppercase rounded-lg hover:bg-gray-50/80 transition-all duration-200 cursor-pointer"
          >
            <span>{{ group.title }}</span>
            <ChevronDownIcon
              class="w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ease-in-out"
              :class="[openGroups.includes(group.title) ? 'rotate-180' : '']"
            />
          </button>

          <!-- Smooth Accordion Content using CSS Grid animation -->
          <div
            class="grid transition-all duration-300 ease-in-out"
            :class="openGroups.includes(group.title) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'"
          >
            <div class="overflow-hidden space-y-1 pl-1">
              <NuxtLink
                v-for="item in group.items"
                :key="item.name"
                :to="item.href"
                class="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-out group overflow-hidden"
                :class="[
                  isItemActive(item.href)
                    ? 'bg-[#F4F1FA] text-[#5530AB] font-semibold shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 hover:translate-x-1'
                ]"
              >
                <!-- Active Accent Indicator Line -->
                <span
                  v-if="isItemActive(item.href)"
                  class="absolute left-0 top-2 bottom-2 w-1 bg-[#5530AB] rounded-r-full transition-all duration-300"
                />

                <component
                  :is="item.icon"
                  class="w-5 h-5 shrink-0 transition-all duration-200 group-hover:scale-110"
                  :class="isItemActive(item.href) ? 'text-[#5530AB]' : 'text-gray-400 group-hover:text-gray-700'"
                />
                <span class="truncate">{{ item.name }}</span>

                <!-- Subtle active indicator dot -->
                <span
                  v-if="isItemActive(item.href)"
                  class="ml-auto w-1.5 h-1.5 rounded-full bg-[#5530AB] transition-opacity duration-300"
                />
              </NuxtLink>
            </div>
          </div>
        </div>
      </nav>

      <!-- User + Logout -->
      <div class="p-4 border-t border-gray-100 shrink-0 bg-white">
        <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50/80 border border-gray-100 mb-2 transition-all duration-200 hover:bg-gray-100/60">
          <div class="w-8 h-8 rounded-lg bg-[#5530AB]/10 flex items-center justify-center text-[#5530AB] font-bold text-xs shrink-0 shadow-xs">
            {{ user?.email?.charAt(0).toUpperCase() || 'A' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-gray-900 truncate">{{ user?.email }}</p>
            <p class="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-0.5">Administrator</p>
          </div>
        </div>

        <button
          type="button"
          @click="handleLogout"
          class="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50/80 transition-all duration-200 hover:translate-x-1 cursor-pointer group"
        >
          <ArrowRightOnRectangleIcon class="w-4 h-4 shrink-0 text-red-500 transition-transform duration-200 group-hover:scale-110" />
          Logout
        </button>
      </div>
    </aside>
  </div>
</template>