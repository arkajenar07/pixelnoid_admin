<script setup lang="ts">
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
  VideoCameraIcon,
  FolderIcon,
  CheckBadgeIcon,
  DocumentChartBarIcon
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

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Student Management', href: '/students', icon: ClipboardDocumentCheckIcon },
  { name: 'Progress Reports', href: '/progress-reports', icon: DocumentChartBarIcon },
  { name: 'Absensi', href: '/absensi', icon: CheckBadgeIcon },
  { name: 'Module Management', href: '/modules', icon: BookOpenIcon },
  { name: 'Resources', href: '/resources', icon: FolderIcon },
  { name: 'Financial Tracker', href: '/financial', icon: BanknotesIcon },
  { name: 'Users', href: '/users', icon: UsersIcon },
  { name: 'Vouchers', href: '/vouchers', icon: TicketIcon },
  { name: 'Register Kelas', href: '/register-kelas', icon: AcademicCapIcon },
  { name: 'Jadwal Mengajar', href: '/schedules', icon: CalendarDaysIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]
</script>

<template>
  <div>
    <!-- Mobile overlay -->
    <div
      v-show="open"
      class="fixed inset-0 z-[110] bg-gray-900/50 backdrop-blur-sm lg:hidden"
      @click="emit('update:open', false)"
    />

    <!-- Sidebar -->
    <aside :class="[
      open ? 'translate-x-0' : '-translate-x-full',
      'fixed inset-y-0 left-0 z-[120] w-[260px] bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col'
    ]">
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-200 shrink-0">
        <span class="text-xl font-bold tracking-wider text-emerald-600">PIXELNOID</span>
      </div>

      <!-- Nav links -->
      <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.875rem] font-medium transition-colors"
          :class="[
            route.path === item.href
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          ]"
        >
          <component
            :is="item.icon"
            class="w-5 h-5 shrink-0"
            :class="route.path === item.href ? 'text-emerald-600' : 'text-gray-400'"
          />
          {{ item.name }}
        </NuxtLink>
      </nav>

      <!-- User + Logout -->
      <div class="p-4 border-t border-gray-200 shrink-0">
        <div class="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 mb-3">
          <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
            {{ user?.email?.charAt(0).toUpperCase() || 'A' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-gray-900 truncate">{{ user?.email }}</p>
            <p class="text-[0.625rem] text-gray-500">Administrator</p>
          </div>
        </div>

        <button
          @click="handleLogout"
          class="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[0.875rem] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <ArrowRightOnRectangleIcon class="w-5 h-5 shrink-0 text-rose-500" />
          Logout
        </button>
      </div>
    </aside>
  </div>
</template>
