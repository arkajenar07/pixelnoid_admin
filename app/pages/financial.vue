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
            <h1 class="text-base font-medium text-gray-900 leading-none">Financial Tracker</h1>
            <p class="text-xs text-gray-500 mt-0.5">Kelola pemasukan dan pengeluaran platform</p>
          </div>
        </div>
        <button @click="openAddModal" class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[0.875rem] font-medium transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-emerald-500/30">
          <PlusIcon class="w-4 h-4" />
          Tambah Transaksi
        </button>
      </header>

      <main class="p-6 space-y-6 max-w-[1440px] mx-auto">
        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Total Pemasukan</p>
            <p class="text-xl font-medium text-emerald-500 mt-1">{{ formatCurrency(totalIncome) }}</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Total Pengeluaran</p>
            <p class="text-xl font-medium text-rose-500 mt-1">{{ formatCurrency(totalExpense) }}</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Saldo Bersih</p>
            <p class="text-xl font-medium text-gray-900 mt-1">{{ formatCurrency(totalIncome - totalExpense) }}</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Total Transaksi</p>
            <p class="text-xl font-medium text-blue-500 mt-1">{{ records.length }}</p>
          </div>
        </div>

        <!-- Search & Filter -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <MagnifyingGlassIcon class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input v-model="search" type="text" placeholder="Cari deskripsi, kategori, kelas..." class="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-[0.9rem] text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm" />
          </div>
          <select v-model="filterType" class="h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] text-gray-700 outline-none focus:border-emerald-500/50 transition-all cursor-pointer min-w-[130px] shadow-sm">
            <option value="">Semua Tipe</option>
            <option value="income">Pemasukan (Income)</option>
            <option value="expense">Pengeluaran (Expense)</option>
          </select>
          <select v-model="filterStatus" class="h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] text-gray-700 outline-none focus:border-emerald-500/50 transition-all cursor-pointer min-w-[130px] shadow-sm">
            <option value="">Semua Status</option>
            <option value="lunas">Lunas</option>
            <option value="pending">Pending</option>
            <option value="batal">Batal</option>
          </select>
        </div>

        <!-- Table -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div v-if="isLoading" class="flex items-center justify-center py-20">
            <div class="w-7 h-7 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
          <div v-else-if="filteredRecords.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
            <BanknotesIcon class="w-10 h-10 text-gray-400 mb-3" />
            <p class="text-gray-500 font-medium">Tidak ada transaksi ditemukan</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full whitespace-nowrap">
              <thead>
                <tr class="border-b border-gray-100 bg-gray-50/50">
                  <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Deskripsi</th>
                  <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Tipe & Kategori</th>
                  <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Jumlah</th>
                  <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Status</th>
                  <th class="px-5 py-3.5 text-left text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Tanggal</th>
                  <th class="px-5 py-3.5 text-right text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in filteredRecords" :key="r.id" class="border-b border-gray-100 hover:bg-gray-50/80 transition-colors group">
                  <td class="px-5 py-4 max-w-[250px]">
                    <p class="text-[0.875rem] font-medium text-gray-900 truncate">{{ r.description || '—' }}</p>
                    <p v-if="r.class" class="text-xs text-gray-500 truncate mt-0.5">Kelas: {{ r.class }}</p>
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded-md text-[0.6875rem] font-medium uppercase tracking-wider" :class="r.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'">
                        {{ r.type === 'income' ? 'Income' : 'Expense' }}
                      </span>
                      <span class="text-xs text-gray-600 font-normal">{{ r.category || '—' }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-4">
                    <span class="text-[0.875rem] font-medium" :class="r.type === 'income' ? 'text-emerald-600' : 'text-gray-900'">
                      {{ r.type === 'income' ? '+' : '-' }}{{ formatCurrency(r.amount) }}
                    </span>
                    <p v-if="r.payment_metode" class="text-[0.75rem] text-gray-500 mt-0.5">{{ r.payment_metode }}</p>
                  </td>
                  <td class="px-5 py-4">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-medium" :class="{
                      'bg-emerald-50 text-emerald-600': r.status === 'lunas' || r.status === 'completed',
                      'bg-amber-50 text-amber-600': r.status === 'pending',
                      'bg-gray-100 text-gray-500': r.status === 'batal' || r.status === 'cancelled'
                    }">{{ r.status }}</span>
                  </td>
                  <td class="px-5 py-4">
                    <span class="text-xs text-gray-500">{{ formatDate(r.created_at) }}</span>
                  </td>
                  <td class="px-5 py-4 text-right">
                    <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button @click="openEditModal(r)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                        <PencilSquareIcon class="w-4 h-4" />
                        Edit
                      </button>
                      <button @click="handleDelete(r.id)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all">
                        <TrashIcon class="w-4 h-4" />
                        Hapus
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
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showModal" class="fixed inset-0 z-[500] flex items-center justify-center p-4" @click.self="closeModal">
        <div class="absolute inset-0 bg-gray-900/40"></div>
        <div class="relative w-full max-w-[560px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <BanknotesIcon class="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 class="text-[1rem] font-bold text-gray-900 leading-none">{{ isEditing ? 'Edit Transaksi' : 'Tambah Transaksi' }}</h2>
                <p class="text-[0.75rem] text-gray-500 mt-0.5">Catat pemasukan atau pengeluaran baru</p>
              </div>
            </div>
            <button @click="closeModal" class="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="px-6 py-6 space-y-4 overflow-y-auto">
            
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[0.8125rem] font-bold text-gray-700">Tipe <span class="text-rose-500">*</span></label>
                <select v-model="modalForm.type" class="mfield">
                  <option value="income">Pemasukan (Income)</option>
                  <option value="expense">Pengeluaran (Expense)</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-[0.8125rem] font-bold text-gray-700">Status <span class="text-rose-500">*</span></label>
                <select v-model="modalForm.status" class="mfield">
                  <option value="lunas">Lunas</option>
                  <option value="pending">Pending</option>
                  <option value="batal">Batal</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[0.8125rem] font-bold text-gray-700">Jumlah (Rp) <span class="text-rose-500">*</span></label>
                <input v-model.number="modalForm.amount" type="number" placeholder="500000" class="mfield" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[0.8125rem] font-bold text-gray-700">Kategori <span class="text-rose-500">*</span></label>
                <input v-model="modalForm.category" type="text" placeholder="e.g. Course Fee, Server Hosting" class="mfield" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[0.8125rem] font-bold text-gray-700">Deskripsi Singkat</label>
              <input v-model="modalForm.description" type="text" placeholder="Pembayaran course web master" class="mfield" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[0.8125rem] font-bold text-gray-700">Metode Pembayaran</label>
                <input v-model="modalForm.payment_metode" type="text" placeholder="Transfer Bank, E-Wallet" class="mfield" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[0.8125rem] font-bold text-gray-700">Terkait Kelas</label>
                <input v-model="modalForm.class" type="text" placeholder="Nama kelas jika ada" class="mfield" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[0.8125rem] font-bold text-gray-700">Catatan Tambahan (Opsional)</label>
              <textarea v-model="modalForm.notes" rows="3" placeholder="Informasi tambahan..." class="mfield py-2.5 h-auto resize-none"></textarea>
            </div>

            <div v-if="submitError" class="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[0.8125rem]">
              <ExclamationCircleIcon class="w-4 h-4 shrink-0 mt-0.5" />{{ submitError }}
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
            <button type="button" @click="closeModal" class="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm">Batal</button>
            <button type="button" @click="handleSubmit" :disabled="isSubmitting" class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[0.875rem] font-bold transition-all shadow-sm">
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
import { Bars3Icon, PlusIcon, MagnifyingGlassIcon, BanknotesIcon, PencilSquareIcon, XMarkIcon, CheckIcon, ExclamationCircleIcon, TrashIcon } from '@heroicons/vue/24/outline'

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
.mfield:focus { border-color: rgba(16,185,129,0.5); box-shadow: 0 0 0 2px rgba(16,185,129,0.1); }
</style>
