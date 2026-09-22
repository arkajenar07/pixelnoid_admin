<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  HomeIcon,
  BanknotesIcon,
  UsersIcon,
  TicketIcon,
  AcademicCapIcon,
  BookOpenIcon,
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
      { name: 'Module Management', href: '/modules', icon: BookOpenIcon },
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

// State untuk menyimpan nama judul grup yang terbuka
const openGroups = ref<string[]>([])

// Fungsi untuk toggle buka/tutup dropdown
const toggleGroup = (title: string) => {
  if (openGroups.value.includes(title)) {
    openGroups.value = openGroups.value.filter(g => g !== title)
  } else {
    openGroups.value.push(title)
  }
}

// Otomatis buka grup yang didalamnya terdapat route aktif
const autoOpenActiveGroup = () => {
  navigationGroups.forEach(group => {
    const hasActiveItem = group.items.some(item => item.href === route.path)
    if (hasActiveItem && !openGroups.value.includes(group.title)) {
      openGroups.value.push(group.title)
    }
  })
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
    <!-- Mobile overlay -->
    <div
      v-show="open"
      class="fixed inset-0 z-[110] bg-gray-900/50 lg:hidden"
      @click="emit('update:open', false)"
    />

    <!-- Sidebar -->
    <aside :class="[
      open ? 'translate-x-0' : '-translate-x-full',
      'fixed inset-y-0 left-0 z-[120] w-[260px] bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col'
    ]">
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-200 shrink-0">
        <span class="text-xl font-bold tracking-wider text-[#5530AB]">PIXELNOID</span>
      </div>

      <!-- Nav links -->
      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div v-for="group in navigationGroups" :key="group.title" class="space-y-1">
          <!-- Dropdown Header/Trigger -->
          <button
            @click="toggleGroup(group.title)"
            class="flex items-center justify-between w-full px-3 py-2 text-xs font-bold tracking-wider text-gray-500 rounded-md hover:bg-gray-50 transition-colors"
          >
            <span>{{ group.title }}</span>
            <ChevronDownIcon
              class="w-4 h-4 text-gray-400 transition-transform duration-200"
              :class="[openGroups.includes(group.title) ? 'rotate-180' : '']"
            />
          </button>

          <!-- Dropdown Content -->
          <div
            v-show="openGroups.includes(group.title)"
            class="space-y-0.5 pl-2"
          >
            <NuxtLink
              v-for="item in group.items"
              :key="item.name"
              :to="item.href"
              class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="[
                route.path === item.href
                  ? 'bg-[#F4F1FA] text-[#5530AB]'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              ]"
            >
              <component
                :is="item.icon"
                class="w-5 h-5 shrink-0"
                :class="route.path === item.href ? 'text-[#5530AB]' : 'text-gray-400'"
              />
              {{ item.name }}
            </NuxtLink>
          </div>
        </div>
      </nav>

      <!-- User + Logout -->
      <div class="p-4 border-t border-gray-200 shrink-0">
        <div class="flex items-center gap-3 px-3 py-3 rounded-md bg-gray-50 mb-3">
          <div class="w-8 h-8 rounded-md bg-[#F4F1FA] flex items-center justify-center text-[#5530AB] font-bold text-xs shrink-0">
            {{ user?.email?.charAt(0).toUpperCase() || 'A' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-gray-900 truncate">{{ user?.email }}</p>
            <p class="text-[10px] font-medium text-gray-500 uppercase mt-0.5">Administrator</p>
          </div>
        </div>

        <button
          @click="handleLogout"
          class="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <ArrowRightOnRectangleIcon class="w-5 h-5 shrink-0 text-red-500" />
          Logout
        </button>
      </div>
    </aside>
  </div>
</template>