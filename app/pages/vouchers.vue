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
            <h1 class="text-base font-medium text-gray-900 leading-none">Voucher Management</h1>
            <p class="text-xs text-gray-500 mt-0.5">Kelola voucher pengguna</p>
          </div>
        </div>
        <button @click="openAddModal" class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[0.875rem] font-medium transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-rose-500/30">
          <PlusIcon class="w-4 h-4" />
          Tambah Voucher
        </button>
      </header>

      <main class="p-6 space-y-6 max-w-[1440px] mx-auto">
        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Total Voucher</p>
            <p class="text-xl font-medium text-gray-900 mt-1">{{ vouchers.length }}</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Available</p>
            <p class="text-xl font-medium text-emerald-600 mt-1">{{ vouchers.filter(v => v.status === 'available').length }}</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Claimed</p>
            <p class="text-xl font-medium text-gray-900 mt-1">{{ vouchers.filter(v => v.status === 'claimed').length }}</p>
          </div>
        </div>

        <!-- Search & Filter -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <MagnifyingGlassIcon class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input v-model="search" type="text" placeholder="Cari holder atau kode voucher..." class="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-[0.9rem] text-gray-900 placeholder:text-gray-400 outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 transition-all shadow-sm" />
          </div>
          <select v-model="filterStatus" class="h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] text-gray-700 outline-none focus:border-rose-500/50 transition-all cursor-pointer min-w-[130px] shadow-sm">
            <option value="">Semua Status</option>
            <option value="available">Available</option>
            <option value="claimed">Claimed</option>
          </select>
        </div>

        <!-- Table -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div v-if="isLoading" class="flex items-center justify-center py-20">
            <div class="w-7 h-7 border-2 border-gray-200 border-t-rose-500 rounded-full animate-spin"></div>
          </div>
          <div v-else-if="filteredVouchers.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
            <TicketIcon class="w-10 h-10 text-gray-400 mb-3" />
            <p class="text-gray-500 font-medium">Tidak ada voucher ditemukan</p>
          </div>
          <table v-else class="w-full">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50/50">
                <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">ID</th>
                <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Voucher Holder</th>
                <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest hidden md:table-cell">Unique Code</th>
                <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Status</th>
                <th class="px-5 py-3.5 text-right text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in filteredVouchers" :key="v.id" class="border-b border-gray-100 hover:bg-gray-50/80 transition-colors group">
                <td class="px-5 py-4">
                  <span class="text-[0.875rem] font-mono text-gray-500">{{ v.id }}</span>
                </td>
                <td class="px-5 py-4">
                  <p class="text-[0.875rem] font-medium text-gray-900 truncate max-w-[200px]">{{ v.voucher_holder }}</p>
                </td>
                <td class="px-5 py-4 hidden md:table-cell">
                  <span class="text-[0.875rem] text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">{{ v.unique_code || '—' }}</span>
                </td>
                <td class="px-5 py-4">
                  <span 
                    class="px-2 py-0.5 rounded-md text-[0.6875rem] font-medium uppercase tracking-wider" 
                    :class="v.status === 'claimed' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'"
                  >
                    {{ v.status }}
                  </span>
                </td>
                <td class="px-5 py-4 text-right flex items-center justify-end gap-2">
                  <button @click="showQrCode(v)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-all opacity-0 group-hover:opacity-100">
                    <QrCodeIcon class="w-4 h-4" />
                    QR
                  </button>
                  <button v-if="v.status !== 'claimed'" @click="handleClaim(v.id)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all border border-emerald-200">
                    <CheckCircleIcon class="w-4 h-4" />
                    Is Claimed?
                  </button>
                  <button @click="openEditModal(v)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100">
                    <PencilSquareIcon class="w-4 h-4" />
                    Edit
                  </button>
                  <button @click="confirmDelete(v.id)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100">
                    <TrashIcon class="w-4 h-4" />
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>

  <!-- Modal Tambah/Edit -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
        <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="closeModal"></div>
        <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-full">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 class="text-lg font-bold text-gray-900">{{ isEditing ? 'Edit Voucher' : 'Tambah Voucher' }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">{{ isEditing ? 'Perbarui informasi voucher' : 'Buat voucher baru untuk user' }}</p>
            </div>
            <button @click="closeModal" class="p-2 -mr-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-5">
            <div class="space-y-1.5">
              <label class="text-[0.8125rem] font-bold text-gray-700">Voucher Holder <span class="text-rose-500">*</span></label>
              <input v-model="modalForm.voucher_holder" type="text" placeholder="Nama Pemilik Voucher" class="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] text-gray-900 placeholder:text-gray-400 outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 transition-all shadow-sm" />
              <p v-if="modalErrors.voucher_holder" class="text-[0.75rem] text-rose-500">{{ modalErrors.voucher_holder }}</p>
            </div>
            
            <div class="space-y-1.5">
              <label class="text-[0.8125rem] font-bold text-gray-700 flex justify-between">
                <span>Unique Code <span class="text-rose-500">*</span></span>
                <button type="button" @click="generateCode" class="text-rose-600 hover:text-rose-700 text-xs font-semibold">Generate Random</button>
              </label>
              <input v-model="modalForm.unique_code" type="text" placeholder="KODE-UNIK" class="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] font-mono text-gray-900 placeholder:text-gray-400 outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 transition-all shadow-sm" />
              <p v-if="modalErrors.unique_code" class="text-[0.75rem] text-rose-500">{{ modalErrors.unique_code }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-[0.8125rem] font-bold text-gray-700">Benefits <span class="text-gray-500 font-normal">(opsional)</span></label>
              <textarea v-model="modalForm.benefits" rows="3" placeholder="Deskripsi benefit voucher..." class="w-full p-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] text-gray-900 placeholder:text-gray-400 outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 transition-all shadow-sm resize-none"></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="text-[0.8125rem] font-bold text-gray-700">Status</label>
              <select v-model="modalForm.status" class="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] text-gray-900 outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 transition-all shadow-sm">
                <option value="available">Available</option>
                <option value="claimed">Claimed</option>
              </select>
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
              <template v-else><CheckIcon class="w-4 h-4" />{{ isEditing ? 'Simpan Perubahan' : 'Buat Voucher' }}</template>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal QR Code -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="qrModalOpen" class="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
        <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="qrModalOpen = false"></div>
        <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col p-6 items-center text-center">
          <button @click="qrModalOpen = false" class="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
            <XMarkIcon class="w-5 h-5" />
          </button>
          
          <h3 class="text-lg font-bold text-gray-900 mb-2">QR Code Voucher</h3>
          <p class="text-sm text-gray-500 mb-6 font-mono bg-gray-100 px-2 py-1 rounded">{{ qrVoucherCode }}</p>
          
          <div class="p-2 bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="QR Code" class="w-48 h-48" />
          </div>
          
          <a :href="qrCodeUrl" download="voucher-qrcode.png" class="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-[0.875rem] font-bold transition-all shadow-sm">
            Download QR
          </a>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Bars3Icon, PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, XMarkIcon, CheckIcon, ExclamationCircleIcon, CheckCircleIcon, TrashIcon, QrCodeIcon } from '@heroicons/vue/24/outline'
import { TicketIcon } from '@heroicons/vue/24/solid'
import QRCode from 'qrcode'

useSeoMeta({ title: 'Voucher Management — Admin Pixelnoid', description: 'Kelola semua voucher pengguna.' })
definePageMeta({ layout: false })

interface Voucher { id: number; voucher_holder: string; unique_code: string; benefits: string; status: string; }

const sidebarOpen = ref(false)
const vouchers = ref<Voucher[]>([])
const isLoading = ref(true)
const search = ref('')
const filterStatus = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref('')
const editingId = ref<number | null>(null)

const qrModalOpen = ref(false)
const qrCodeUrl = ref('')
const qrVoucherCode = ref('')

const modalForm = reactive({ voucher_holder: '', unique_code: '', benefits: '', status: 'available' })
const modalErrors = reactive({ voucher_holder: '', unique_code: '' })

const filteredVouchers = computed(() => {
  let list = vouchers.value
  const q = search.value.toLowerCase().trim()
  if (q) list = list.filter(v => v.voucher_holder?.toLowerCase().includes(q) || v.unique_code?.toLowerCase().includes(q))
  if (filterStatus.value) list = list.filter(v => v.status === filterStatus.value)
  return list
})

async function fetchVouchers() {
  isLoading.value = true
  try {
    const result = await $fetch<{ vouchers: Voucher[] }>('/api/admin/vouchers')
    vouchers.value = result.vouchers
  } catch (err: any) {
    console.error('Gagal mengambil data voucher:', err?.data?.statusMessage ?? err?.message)
  } finally {
    isLoading.value = false
  }
}
onMounted(fetchVouchers)

function resetModal() {
  Object.assign(modalForm, { voucher_holder: '', unique_code: '', benefits: '', status: 'available' })
  Object.assign(modalErrors, { voucher_holder: '', unique_code: '' })
  submitError.value = ''; submitSuccess.value = ''; editingId.value = null
}

function openAddModal() { resetModal(); isEditing.value = false; showModal.value = true }

function openEditModal(v: Voucher) { 
  resetModal(); 
  isEditing.value = true; 
  editingId.value = v.id; 
  Object.assign(modalForm, { 
    voucher_holder: v.voucher_holder, 
    unique_code: v.unique_code, 
    benefits: v.benefits || '', 
    status: v.status || 'available'
  })
  showModal.value = true 
}

function closeModal() { showModal.value = false }

function generateCode() {
  modalForm.unique_code = Math.random().toString(36).substring(2, 10).toUpperCase()
}

function validateModal() {
  let v = true
  Object.assign(modalErrors, { voucher_holder: '', unique_code: '' })
  if (!modalForm.voucher_holder.trim()) { modalErrors.voucher_holder = 'Holder wajib diisi.'; v = false }
  if (!modalForm.unique_code.trim()) { modalErrors.unique_code = 'Kode unik wajib diisi.'; v = false }
  return v
}

async function handleSubmit() {
  if (!validateModal()) return
  isSubmitting.value = true; submitError.value = ''; submitSuccess.value = ''

  try {
    if (isEditing.value && editingId.value !== null) {
      await $fetch(`/api/admin/vouchers/${editingId.value}`, {
        method: 'PUT',
        body: modalForm,
      })
      submitSuccess.value = 'Voucher berhasil diperbarui.'
    } else {
      await $fetch('/api/admin/vouchers', {
        method: 'POST',
        body: modalForm,
      })
      submitSuccess.value = 'Voucher berhasil ditambahkan.'
    }
    
    await fetchVouchers()
    setTimeout(() => { closeModal() }, 1000)
  } catch (err: any) {
    submitError.value = err?.data?.statusMessage || err?.message || 'Terjadi kesalahan.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleClaim(id: number) {
  if (!confirm('Tandai voucher ini sebagai Claimed?')) return
  try {
    await $fetch(`/api/admin/vouchers/${id}/claim`, { method: 'PATCH' })
    await fetchVouchers()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Gagal claim voucher')
  }
}

async function confirmDelete(id: number) {
  if (!confirm('Apakah Anda yakin ingin menghapus voucher ini?')) return
  try {
    await $fetch(`/api/admin/vouchers/${id}`, { method: 'DELETE' })
    await fetchVouchers()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Gagal menghapus voucher')
  }
}

async function showQrCode(v: Voucher) {
  qrVoucherCode.value = v.unique_code
  // Get base URL to construct full link for the QR Code
  const origin = window.location.origin
  const link = `${origin}/voucher/${v.unique_code}`
  try {
    qrCodeUrl.value = await QRCode.toDataURL(link, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
    qrModalOpen.value = true
  } catch (err) {
    console.error('Gagal membuat QR Code', err)
    alert('Gagal membuat QR Code')
  }
}
</script>
