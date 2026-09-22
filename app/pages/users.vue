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
            <h1 class="text-base font-medium text-gray-900 leading-none">User Management</h1>
          </div>
        </div>
        <button @click="openAddModal" class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[0.875rem] font-medium transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-rose-500/30">
          <PlusIcon class="w-4 h-4" />
          Tambah User
        </button>
      </header>

      <main class="p-6 space-y-6 max-w-[1440px] mx-auto">
        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="stat in stats" :key="stat.label" class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">{{ stat.label }}</p>
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="stat.badgeClass">
                <component :is="stat.icon" class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ stat.value }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ stat.subtitle }}</p>
          </div>
        </div>

        <!-- Search & Filter -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <MagnifyingGlassIcon class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input v-model="search" type="text" placeholder="Cari nama atau username..." class="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-[0.9rem] text-gray-900 placeholder:text-gray-400 outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 transition-all shadow-sm" />
          </div>
          <select v-model="filterRole" class="h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] text-gray-700 outline-none focus:border-rose-500/50 transition-all cursor-pointer min-w-[130px] shadow-sm">
            <option value="">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="mentor">Mentor</option>
            <option value="student">Student</option>
          </select>
        </div>

        <!-- Table -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div v-if="isLoadingUsers" class="flex items-center justify-center py-20">
            <div class="w-7 h-7 border-2 border-gray-200 border-t-rose-500 rounded-full animate-spin"></div>
          </div>
          <div v-else-if="filteredUsers.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
            <UsersIcon class="w-10 h-10 text-gray-400 mb-3" />
            <p class="text-gray-500 font-medium">Tidak ada user ditemukan</p>
          </div>
          <table v-else class="w-full">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50/50">
                <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">User</th>
                <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest hidden md:table-cell">Username</th>
                <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest hidden lg:table-cell">Email</th>
                <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Roles</th>
                <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest hidden lg:table-cell">Dibuat</th>
                <th class="px-5 py-3.5 text-right text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in filteredUsers" :key="u.id" class="border-b border-gray-100 hover:bg-gray-50/80 transition-colors group">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center text-[0.8125rem] font-medium shrink-0" :style="{ background: getAvatarColor(u.fullname) + '22', color: getAvatarColor(u.fullname) }">
                      {{ getInitials(u.fullname) }}
                    </div>
                    <p class="text-[0.875rem] font-medium text-gray-900 truncate">{{ u.fullname }}</p>
                  </div>
                </td>
                <td class="px-5 py-4 hidden md:table-cell">
                  <span class="text-[0.875rem] text-gray-500 font-mono">{{ u.username || '—' }}</span>
                </td>
                <td class="px-5 py-4 hidden lg:table-cell">
                  <div class="flex items-center gap-2 group/email">
                    <span class="text-[0.875rem] text-gray-500">{{ u.email || '—' }}</span>
                    <button v-if="u.email" @click="copyToClipboard(u.email)" class="text-gray-400 hover:text-rose-500 opacity-0 group-hover/email:opacity-100 transition-opacity" title="Salin Email">
                      <ClipboardDocumentIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <div class="flex flex-wrap gap-1.5">
                    <span v-for="role in (u.roles || [])" :key="role" class="px-2 py-0.5 rounded-md text-[0.6875rem] font-medium uppercase tracking-wider" :style="{ background: getRoleColor(role) + '18', color: getRoleColor(role) }">{{ role }}</span>
                  </div>
                </td>
                <td class="px-5 py-4 hidden lg:table-cell">
                  <span class="text-[0.8125rem] text-gray-500">{{ formatDate(u.created_at) }}</span>
                </td>
                <td class="px-5 py-4 text-right">
                  <button @click="openEditModal(u)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100">
                    <PencilSquareIcon class="w-4 h-4" />
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>

  <!-- Modal -->
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showModal" class="fixed inset-0 z-[500] flex items-center justify-center p-4" @click.self="closeModal">
        <div class="absolute inset-0 bg-gray-900/40"></div>
        <div class="relative w-full max-w-[480px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <UserPlusIcon class="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h2 class="text-base font-medium text-gray-900 leading-none">{{ isEditing ? 'Edit User' : 'Tambah User Baru' }}</h2>
                <p class="text-xs text-gray-500 mt-0.5">{{ isEditing ? 'Ubah data profil pengguna' : 'Daftarkan ke Supabase Auth & tabel users' }}</p>
              </div>
            </div>
            <button @click="closeModal" class="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="px-6 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-gray-700">Nama Lengkap <span class="text-rose-500">*</span></label>
              <input v-model="modalForm.fullname" type="text" placeholder="Nama Lengkap" class="mfield" />
              <p v-if="modalErrors.fullname" class="text-[0.75rem] text-rose-500">{{ modalErrors.fullname }}</p>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-gray-700">Username <span class="text-rose-500">*</span></label>
              <input v-model="modalForm.username" type="text" placeholder="username_keren" class="mfield" />
              <p v-if="modalErrors.username" class="text-[0.75rem] text-rose-500">{{ modalErrors.username }}</p>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-gray-700">Email <span class="text-rose-500">*</span></label>
              <div class="flex gap-2">
                <input v-model="modalForm.email" type="email" placeholder="user@pixelnoid.dev" class="mfield" :disabled="isEditing" :class="{ 'opacity-50 cursor-not-allowed bg-gray-50': isEditing }" />
                <button v-if="isEditing" type="button" @click="copyToClipboard(modalForm.email)" class="flex items-center justify-center w-[44px] h-[44px] shrink-0 border border-gray-200 rounded-xl bg-white text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm" title="Salin Email">
                  <ClipboardDocumentIcon class="w-5 h-5" />
                </button>
              </div>
              <p v-if="isEditing" class="text-[0.7rem] text-gray-500">Email tidak bisa diubah.</p>
              <p v-if="modalErrors.email" class="text-[0.75rem] text-rose-500">{{ modalErrors.email }}</p>
            </div>
            <div v-if="!isEditing" class="space-y-1.5">
              <label class="text-xs font-medium text-gray-700">Password <span class="text-rose-500">*</span></label>
              <div class="relative">
                <input v-model="modalForm.password" :type="showModalPw ? 'text' : 'password'" placeholder="Min. 8 karakter" class="mfield pr-10" />
                <button type="button" @click="showModalPw = !showModalPw" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <EyeIcon v-if="!showModalPw" class="w-4 h-4" />
                  <EyeSlashIcon v-else class="w-4 h-4" />
                </button>
              </div>
              <p v-if="modalErrors.password" class="text-[0.75rem] text-rose-500">{{ modalErrors.password }}</p>
            </div>
            <div class="space-y-2">
              <label class="text-[0.8125rem] font-bold text-gray-700">Roles <span class="text-rose-500">*</span></label>
              <p class="text-[0.7rem] text-gray-500">Bisa pilih lebih dari satu role</p>
              <div class="flex flex-wrap gap-2">
                <button v-for="role in availableRoles" :key="role.value" type="button" @click="toggleRole(role.value)"
                  class="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[0.8125rem] font-bold transition-all"
                  :class="modalForm.roles.includes(role.value) ? 'border-transparent shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300'"
                  :style="modalForm.roles.includes(role.value) ? { background: role.color + '15', borderColor: role.color + '40', color: role.color } : {}">
                  <component :is="role.icon" class="w-4 h-4" />
                  {{ role.label }}
                  <CheckIcon v-if="modalForm.roles.includes(role.value)" class="w-3.5 h-3.5" />
                </button>
              </div>
              <p v-if="modalErrors.roles" class="text-[0.75rem] text-rose-500">{{ modalErrors.roles }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-[0.8125rem] font-bold text-gray-700">Avatar URL <span class="text-gray-500 font-normal">(opsional)</span></label>
              <input v-model="modalForm.avatar_url" type="url" placeholder="https://..." class="mfield" />
            </div>
            <div v-if="submitError" class="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[0.8125rem]">
              <ExclamationCircleIcon class="w-4 h-4 shrink-0 mt-0.5" />{{ submitError }}
            </div>
            <div v-if="submitSuccess" class="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-[0.8125rem]">
              <CheckCircleIcon class="w-4 h-4 shrink-0 mt-0.5" />{{ submitSuccess }}
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <button type="button" @click="closeModal" class="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm">Batal</button>
            <button type="button" @click="handleSubmit" :disabled="isSubmitting" class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[0.875rem] font-bold transition-all shadow-sm">
              <div v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <template v-else><CheckIcon class="w-4 h-4" />{{ isEditing ? 'Simpan Perubahan' : 'Buat Akun' }}</template>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Bars3Icon, PlusIcon, MagnifyingGlassIcon, UsersIcon, PencilSquareIcon, UserPlusIcon, XMarkIcon, CheckIcon, ExclamationCircleIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon, AcademicCapIcon, ShieldCheckIcon, UserCircleIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline'

useSeoMeta({ title: 'User Management — Admin Pixelnoid', description: 'Kelola semua pengguna platform.' })
definePageMeta({ layout: false })

interface UserRecord { id: string; fullname: string; username: string; roles: string[]; avatar_url?: string | null; created_at?: string; email?: string | null; type?: string | null }

const supabase = useSupabaseClient()
const sidebarOpen = ref(false)
const users = ref<UserRecord[]>([])
const isLoadingUsers = ref(true)
const search = ref('')
const filterRole = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref('')
const showModalPw = ref(false)
const editingId = ref<string | null>(null)

const modalForm = reactive({ fullname: '', username: '', email: '', password: '', roles: [] as string[], avatar_url: '', type: 'main_class' })
const modalErrors = reactive({ fullname: '', username: '', email: '', password: '', roles: '' })

const availableRoles = [
  { value: 'student', label: 'Student', color: '#443E8D', icon: AcademicCapIcon },
  { value: 'mentor',  label: 'Mentor',  color: '#10B981', icon: UserCircleIcon },
  { value: 'admin',   label: 'Admin',   color: '#F59E0B', icon: ShieldCheckIcon },
]

function getInitials(name: string) {
  if (!name) return '?'
  const p = name.trim().split(' ')
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0][0].toUpperCase()
}
const COLORS = ['#F43F5E','#8B5CF6','#3B82F6','#10B981','#F59E0B','#EC4899']
function getAvatarColor(name: string) { let h=0; for(const c of(name||''))h=c.charCodeAt(0)+((h<<5)-h); return COLORS[Math.abs(h)%COLORS.length] }
function getRoleColor(role: string) { const m:Record<string,string>={admin:'#F59E0B',mentor:'#10B981',student:'#443E8D'}; return m[role]??'#6B7280' }
function formatDate(d?: string) { if(!d)return'—'; return new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) }

const stats = computed(() => [
  {
    label: 'Total User',
    value: users.value.length,
    subtitle: 'Pengguna terdaftar',
    icon: UsersIcon,
    badgeClass: 'bg-[#5530AB]/10 text-[#5530AB]'
  },
  {
    label: 'Student',
    value: users.value.filter(u => u.roles?.includes('student')).length,
    subtitle: 'Akun siswa',
    icon: AcademicCapIcon,
    badgeClass: 'bg-blue-100 text-blue-700'
  },
  {
    label: 'Mentor',
    value: users.value.filter(u => u.roles?.includes('mentor')).length,
    subtitle: 'Instruktur & pengajar',
    icon: UserCircleIcon,
    badgeClass: 'bg-emerald-100 text-emerald-700'
  },
  {
    label: 'Admin',
    value: users.value.filter(u => u.roles?.includes('admin')).length,
    subtitle: 'Pengelola sistem',
    icon: ShieldCheckIcon,
    badgeClass: 'bg-amber-100 text-amber-700'
  },
])

const filteredUsers = computed(() => {
  let list = users.value
  const q = search.value.toLowerCase().trim()
  if (q) list = list.filter(u => u.fullname?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q))
  if (filterRole.value) list = list.filter(u => u.roles?.includes(filterRole.value))
  return list
})

async function fetchUsers() {
  isLoadingUsers.value = true
  try {
    const result = await $fetch<{ users: UserRecord[] }>('/api/admin/list-users')
    users.value = result.users
  } catch (err: any) {
    console.error('[fetchUsers] Gagal mengambil data users:', err?.data?.statusMessage ?? err?.message)
    users.value = []
  } finally {
    isLoadingUsers.value = false
  }
}
onMounted(fetchUsers)

function resetModal() {
  Object.assign(modalForm, { fullname:'', username:'', email:'', password:'', roles:[], avatar_url:'', type: 'main_class' })
  Object.assign(modalErrors, { fullname:'', username:'', email:'', password:'', roles:'' })
  submitError.value=''; submitSuccess.value=''; showModalPw.value=false; editingId.value=null
}
function openAddModal() { resetModal(); isEditing.value=false; showModal.value=true }
function openEditModal(u: UserRecord) { resetModal(); isEditing.value=true; editingId.value=u.id; Object.assign(modalForm,{fullname:u.fullname,username:u.username,email:u.email??'',roles:[...(u.roles??[])],avatar_url:u.avatar_url??'', type: u.type ?? 'main_class'}); showModal.value=true }
function closeModal() { showModal.value=false }
function toggleRole(role: string) { const i=modalForm.roles.indexOf(role); if(i===-1)modalForm.roles.push(role); else modalForm.roles.splice(i,1) }

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Email berhasil disalin!')
  }).catch(() => {
    alert('Gagal menyalin teks')
  })
}

function validateModal() {
  let v=true
  Object.assign(modalErrors,{fullname:'',username:'',email:'',password:'',roles:''})
  if(!modalForm.fullname.trim()){modalErrors.fullname='Nama wajib diisi.';v=false}
  if(!modalForm.username.trim()){modalErrors.username='Username wajib diisi.';v=false}
  if(!isEditing.value){
    if(!modalForm.email.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(modalForm.email)){modalErrors.email='Email tidak valid.';v=false}
    if(!modalForm.password||modalForm.password.length<8){modalErrors.password='Password minimal 8 karakter.';v=false}
  }
  if(modalForm.roles.length===0){modalErrors.roles='Pilih minimal satu role.';v=false}
  return v
}

async function handleSubmit() {
  if(!validateModal()) return
  isSubmitting.value=true; submitError.value=''; submitSuccess.value=''

  if(isEditing.value) {
    try {
      const result = await $fetch('/api/admin/update-user', {
        method: 'POST',
        body: {
          id:         editingId.value,
          fullname:   modalForm.fullname.trim(),
          username:   modalForm.username.trim(),
          roles:      modalForm.roles,
          avatar_url: modalForm.avatar_url || null,
          type:       modalForm.roles.includes('mentor') ? modalForm.type : null
        },
      })
      submitSuccess.value = (result as any).message ?? 'Data berhasil diperbarui!'
      await fetchUsers()
      setTimeout(closeModal, 1200)
    } catch (err: any) {
      submitError.value = err?.data?.statusMessage ?? err?.message ?? 'Gagal update data user.'
    }
  } else {
    try {
      const result = await $fetch('/api/admin/create-user', {
        method: 'POST',
        body: {
          email:      modalForm.email.trim(),
          password:   modalForm.password,
          fullname:   modalForm.fullname.trim(),
          username:   modalForm.username.trim(),
          roles:      modalForm.roles,
          avatar_url: modalForm.avatar_url || null,
          type:       modalForm.roles.includes('mentor') ? modalForm.type : null
        },
      })
      submitSuccess.value = (result as any).message ?? `Akun "${modalForm.fullname}" berhasil dibuat!`
      await fetchUsers()
      setTimeout(closeModal, 1400)
    } catch (err: any) {
      const msg = err?.data?.statusMessage ?? err?.message ?? 'Terjadi kesalahan server.'
      submitError.value = msg
    }
  }
  isSubmitting.value=false
}
</script>

<style scoped>
.mfield {
  width: 100%;
  height: 44px;
  padding: 0 0.875rem;
  border-radius: 0.75rem;
  border: 1px solid #E5E7EB;
  background: white;
  color: #111827;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.mfield::placeholder { color: #9CA3AF; }
.mfield:focus { border-color: rgba(244,63,94,0.5); box-shadow: 0 0 0 2px rgba(244,63,94,0.1); }
</style>