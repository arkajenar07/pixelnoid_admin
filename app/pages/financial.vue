<template>
  <div class="flex min-h-screen bg-gray-50 text-gray-900 antialiased font-sans overflow-x-hidden">
    <AdminSidebar :open="sidebarOpen" @update:open="sidebarOpen = $event" />
    <div class="flex-1 w-full min-w-0 lg:ml-[260px]">
      <!-- Header -->
      <header class="sticky top-0 z-[100] flex w-full items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200">
        <div class="flex items-center gap-4">
          <button class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors lg:hidden" @click="sidebarOpen = !sidebarOpen">
            <Bars3Icon class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-base font-semibold text-gray-900 leading-none">Financial Tracker</h1>
          </div>
        </div>
        <button @click="openAddModal" class="flex items-center gap-2 px-4 py-2 rounded-md bg-[#5530AB] hover:bg-[#432687] text-white text-sm font-medium transition-colors">
          <PlusIcon class="w-4 h-4" />
          Tambah Transaksi
        </button>
      </header>

      <main class="p-6 space-y-6 max-w-[1440px] mx-auto">
        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Total Pemasukan</p>
              <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ArrowTrendingUpIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ formatCurrency(totalIncome) }}</p>
            <p class="text-xs text-emerald-700 font-semibold mt-1">Akumulasi penerimaan</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Total Pengeluaran</p>
              <div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <ArrowTrendingDownIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ formatCurrency(totalExpense) }}</p>
            <p class="text-xs text-rose-700 font-semibold mt-1">Akumulasi pengeluaran</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Saldo Bersih</p>
              <div class="w-8 h-8 rounded-lg bg-[#5530AB]/10 text-[#5530AB] flex items-center justify-center">
                <ScaleIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ formatCurrency(totalIncome - totalExpense) }}</p>
            <p class="text-xs text-gray-500 mt-1">Kas operasional aktif</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Total Transaksi</p>
              <div class="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                <ReceiptPercentIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ records.length }}</p>
            <p class="text-xs text-gray-500 mt-1">Seluruh mutasi tercatat</p>
          </div>
        </div>

        <!-- Search & Filter -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <MagnifyingGlassIcon class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input v-model="search" type="text" placeholder="Cari deskripsi, kategori, kelas..." class="w-full h-10 pl-10 pr-4 rounded-md border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors" />
          </div>
          <select v-model="filterType" class="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-700 outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors cursor-pointer min-w-[150px]">
            <option value="">Semua Tipe</option>
            <option value="income">Pemasukan (Income)</option>
            <option value="expense">Pengeluaran (Expense)</option>
          </select>
          <select v-model="filterStatus" class="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-700 outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors cursor-pointer min-w-[150px]">
            <option value="">Semua Status</option>
            <option value="lunas">Lunas</option>
            <option value="pending">Pending</option>
            <option value="batal">Batal</option>
          </select>
        </div>

        <!-- Table -->
        <div class="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div v-if="isLoading" class="flex items-center justify-center py-20">
            <div class="w-7 h-7 border-2 border-gray-200 border-t-[#5530AB] rounded-full animate-spin"></div>
          </div>
          <div v-else-if="filteredRecords.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center mb-3">
              <BanknotesIcon class="w-6 h-6 text-gray-400" />
            </div>
            <p class="text-gray-900 font-medium text-sm">Tidak ada transaksi ditemukan</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full whitespace-nowrap text-left border-collapse">
              <thead>
                <tr class="border-b border-gray-200 bg-gray-50">
                  <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Deskripsi</th>
                  <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipe & Kategori</th>
                  <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Jumlah</th>
                  <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="r in filteredRecords" :key="r.id" class="hover:bg-gray-50 transition-colors group">
                  <td class="px-5 py-4 max-w-[250px]">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ r.description || '—' }}</p>
                    <p v-if="r.class" class="text-xs text-gray-500 truncate mt-0.5">Kelas: {{ r.class }}</p>
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" :class="r.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                        {{ r.type === 'income' ? 'Income' : 'Expense' }}
                      </span>
                      <span class="text-xs text-gray-600 font-medium">{{ r.category || '—' }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-4">
                    <span class="text-sm font-semibold" :class="r.type === 'income' ? 'text-emerald-600' : 'text-gray-900'">
                      {{ r.type === 'income' ? '+' : '-' }}{{ formatCurrency(r.amount) }}
                    </span>
                    <p v-if="r.payment_metode" class="text-xs text-gray-500 mt-0.5">{{ r.payment_metode }}</p>
                  </td>
                  <td class="px-5 py-4">
                    <span class="px-2 py-1 rounded text-[11px] font-semibold uppercase tracking-wider" :class="{
                      'bg-emerald-50 text-emerald-700 border border-emerald-200': r.status === 'lunas' || r.status === 'completed',
                      'bg-amber-50 text-amber-700 border border-amber-200': r.status === 'pending',
                      'bg-gray-100 text-gray-600 border border-gray-200': r.status === 'batal' || r.status === 'cancelled'
                    }">{{ r.status }}</span>
                  </td>
                  <td class="px-5 py-4">
                    <span class="text-xs text-gray-600">{{ formatDate(r.created_at) }}</span>
                  </td>
                  <td class="px-5 py-4 text-right">
                    <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button @click="openEditModal(r)" class="p-1.5 rounded-md text-gray-500 hover:text-[#5530AB] hover:bg-[#F4F1FA] transition-colors" title="Edit">
                        <PencilSquareIcon class="w-4 h-4" />
                      </button>
                      <button @click="handleDelete(r.id)" class="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors" title="Hapus">
                        <TrashIcon class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>

  <!-- Modal -->
  <Teleport to="body">
    <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showModal" class="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-gray-900/50" @click.self="closeModal">
        <div class="relative w-full max-w-xl bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-md bg-[#F4F1FA] flex items-center justify-center">
                <BanknotesIcon class="w-4 h-4 text-[#5530AB]" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wider">{{ isEditing ? 'Edit Transaksi' : 'Tambah Transaksi' }}</h2>
              </div>
            </div>
            <button @click="closeModal" class="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors">
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="px-6 py-5 space-y-4 overflow-y-auto">
            
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Tipe <span class="text-red-500">*</span></label>
                <select v-model="modalForm.type" class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors bg-white cursor-pointer">
                  <option value="income">Pemasukan (Income)</option>
                  <option value="expense">Pengeluaran (Expense)</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Status <span class="text-red-500">*</span></label>
                <select v-model="modalForm.status" class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors bg-white cursor-pointer">
                  <option value="lunas">Lunas</option>
                  <option value="pending">Pending</option>
                  <option value="batal">Batal</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Jumlah (Rp) <span class="text-red-500">*</span></label>
                <input v-model.number="modalForm.amount" type="number" placeholder="500000" class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Kategori <span class="text-red-500">*</span></label>
                <input v-model="modalForm.category" type="text" placeholder="Contoh: Course Fee, Server" class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Deskripsi Singkat</label>
              <input v-model="modalForm.description" type="text" placeholder="Pembayaran course web master" class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Metode Pembayaran</label>
                <input v-model="modalForm.payment_metode" type="text" placeholder="Transfer Bank, E-Wallet" class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Terkait Kelas</label>
                <input v-model="modalForm.class" type="text" placeholder="Nama kelas jika ada" class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Catatan Tambahan (Opsional)</label>
              <textarea v-model="modalForm.notes" rows="3" placeholder="Informasi tambahan..." class="w-full p-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors resize-none"></textarea>
            </div>

            <div v-if="submitError" class="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs">
              <ExclamationCircleIcon class="w-4 h-4 shrink-0" />{{ submitError }}
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
            <button type="button" @click="closeModal" class="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Batal</button>
            <button type="button" @click="handleSubmit" :disabled="isSubmitting" class="flex items-center gap-2 px-4 py-2 rounded-md bg-[#5530AB] hover:bg-[#432687] disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors">
              <div v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <template v-else><CheckIcon class="w-4 h-4" />{{ isEditing ? 'Simpan Perubahan' : 'Simpan Transaksi' }}</template>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Bars3Icon, PlusIcon, MagnifyingGlassIcon, BanknotesIcon, PencilSquareIcon, XMarkIcon, CheckIcon, ExclamationCircleIcon, TrashIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ScaleIcon, ReceiptPercentIcon } from '@heroicons/vue/24/outline'

useSeoMeta({ title: 'Financial Tracker — Admin Pixelnoid' })
definePageMeta({ layout: false })

interface FinancialRecord {
  id: number
  type: string
  category: string
  description: string
  payment_metode: string
  class: string
  amount: number
  notes: string
  status: string
  created_at: string
}

const sidebarOpen = ref(false)
const records = ref<FinancialRecord[]>([])
const isLoading = ref(true)
const search = ref('')
const filterType = ref('')
const filterStatus = ref('')

const showModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const editingId = ref<number | null>(null)

const modalForm = reactive({
  type: 'income',
  category: '',
  description: '',
  payment_metode: '',
  class: '',
  amount: 0,
  notes: '',
  status: 'lunas'
})

const totalIncome = computed(() => records.value.filter(r => r.type === 'income' && (r.status === 'lunas' || r.status === 'completed')).reduce((sum, r) => sum + r.amount, 0))
const totalExpense = computed(() => records.value.filter(r => r.type === 'expense' && (r.status === 'lunas' || r.status === 'completed')).reduce((sum, r) => sum + r.amount, 0))

const filteredRecords = computed(() => {
  let list = records.value
  const q = search.value.toLowerCase().trim()
  if (q) {
    list = list.filter(r => 
      r.description?.toLowerCase().includes(q) || 
      r.category?.toLowerCase().includes(q) ||
      r.class?.toLowerCase().includes(q)
    )
  }
  if (filterType.value) list = list.filter(r => r.type === filterType.value)
  if (filterStatus.value) list = list.filter(r => r.status === filterStatus.value)
  return list
})

function formatCurrency(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function fetchRecords() {
  isLoading.value = true
  try {
    const result = await $fetch<{ financial: FinancialRecord[] }>('/api/admin/financial')
    records.value = result.financial
  } catch (err: any) {
    console.error('[fetchRecords] Error:', err?.message)
    records.value = []
  } finally {
    isLoading.value = false
  }
}
onMounted(fetchRecords)

function resetModal() {
  Object.assign(modalForm, { type: 'income', category: '', description: '', payment_metode: '', class: '', amount: 0, notes: '', status: 'lunas' })
  submitError.value = ''
  editingId.value = null
}

function openAddModal() {
  resetModal()
  isEditing.value = false
  showModal.value = true
}

function openEditModal(r: FinancialRecord) {
  resetModal()
  isEditing.value = true
  editingId.value = r.id
  Object.assign(modalForm, {
    type: r.type || 'income',
    category: r.category || '',
    description: r.description || '',
    payment_metode: r.payment_metode || '',
    class: r.class || '',
    amount: r.amount || 0,
    notes: r.notes || '',
    status: r.status || 'lunas'
  })
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleSubmit() {
  if (!modalForm.category || !modalForm.amount) {
    submitError.value = 'Kategori dan Jumlah wajib diisi.'
    return
  }
  
  isSubmitting.value = true
  submitError.value = ''

  try {
    if (isEditing.value) {
      await $fetch('/api/admin/financial/update', {
        method: 'POST',
        body: { id: editingId.value, ...modalForm },
      })
    } else {
      await $fetch('/api/admin/financial/create', {
        method: 'POST',
        body: { ...modalForm },
      })
    }
    await fetchRecords()
    closeModal()
  } catch (err: any) {
    submitError.value = err?.data?.statusMessage ?? err?.message ?? 'Terjadi kesalahan saat menyimpan.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(id: number) {
  if (!confirm('Apakah Anda yakin ingin menghapus data finansial ini? Data yang dihapus tidak dapat dikembalikan.')) return

  try {
    await $fetch('/api/admin/financial/delete', {
      method: 'DELETE',
      body: { id },
    })
    await fetchRecords()
  } catch (err: any) {
    alert(err?.data?.statusMessage ?? err?.message ?? 'Gagal menghapus data.')
  }
}
</script>