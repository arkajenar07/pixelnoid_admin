<template>
  <div class="flex min-h-screen bg-[#F7F7F9] text-gray-900 antialiased overflow-x-hidden" style="font-family: 'Instrument Sans', Inter, sans-serif">
    <AdminSidebar :open="sidebarOpen" @update:open="sidebarOpen = $event" />

    <div class="flex-1 w-full min-w-0 lg:ml-[260px]">
      <!-- Header -->
      <header class="sticky top-0 z-[100] flex w-full items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200">
        <div class="flex items-center gap-4">
          <button
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 transition-all lg:hidden"
            @click="sidebarOpen = !sidebarOpen"
          >
            <Bars3Icon class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-base font-semibold text-gray-900 leading-none">Absensi & Presensi</h1>
            <p class="text-xs text-gray-500 mt-0.5">Kelola kehadiran siswa, bukti foto sesi bimbingan, dan persetujuan (approval)</p>
          </div>
        </div>

        <button
          @click="openAddModal"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[0.875rem] font-medium transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-emerald-600/30"
        >
          <PlusIcon class="w-4 h-4" />
          Tambah Absensi
        </button>
      </header>

      <main class="p-6 space-y-6 max-w-[1440px] mx-auto">
        <!-- Stats Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-gray-500 uppercase tracking-widest">Total Presensi</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ absensiList.length }}</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-amber-600 uppercase tracking-widest">Menunggu Approval</p>
            <p class="text-2xl font-bold text-amber-600 mt-1">
              {{ absensiList.filter(a => a.status === 'pending').length }}
            </p>
          </div>
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-emerald-600 uppercase tracking-widest">Disetujui (Approved)</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">
              {{ absensiList.filter(a => a.status === 'approved').length }}
            </p>
          </div>
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[0.6875rem] font-medium text-rose-600 uppercase tracking-widest">Ditolak (Rejected)</p>
            <p class="text-2xl font-bold text-rose-600 mt-1">
              {{ absensiList.filter(a => a.status === 'rejected').length }}
            </p>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Search Bar -->
          <div class="relative flex-1">
            <MagnifyingGlassIcon class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama mentor, nama murid, topik, atau catatan..."
              class="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-[0.9rem] text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
            />
          </div>

          <!-- Status Filter -->
          <select
            v-model="filterStatus"
            class="h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] text-gray-700 outline-none focus:border-emerald-500 transition-all cursor-pointer min-w-[160px] shadow-sm"
          >
            <option value="">Semua Status</option>
            <option value="pending">Menunggu Approval</option>
            <option value="approved">Disetujui (Approved)</option>
            <option value="rejected">Ditolak (Rejected)</option>
          </select>

          <!-- Mentor Filter -->
          <select
            v-model="filterMentor"
            class="h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-[0.875rem] text-gray-700 outline-none focus:border-emerald-500 transition-all cursor-pointer min-w-[160px] shadow-sm"
          >
            <option value="">Semua Mentor</option>
            <option v-for="m in mentors" :key="m.id" :value="m.id">{{ m.fullname }}</option>
          </select>
        </div>

        <!-- Main Table Card -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <!-- Loading State -->
          <div v-if="isLoading" class="flex flex-col items-center justify-center py-20">
            <div class="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <p class="text-xs text-gray-400 mt-3">Memuat data absensi...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredAbsensi.length === 0" class="flex flex-col items-center justify-center py-20 text-center px-4">
            <div class="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
              <CheckBadgeIcon class="w-7 h-7 text-gray-400" />
            </div>
            <p class="text-gray-700 font-semibold text-sm">Tidak ada data absensi</p>
            <p class="text-gray-400 text-xs mt-1 max-w-sm">Belum ada rekapan absensi yang dibuat atau tidak ada data yang cocok dengan filter.</p>
            <button
              @click="openAddModal"
              class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all"
            >
              Tambah Absensi Baru
            </button>
          </div>

          <!-- Data Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-gray-100 bg-gray-50/50">
                  <th class="px-5 py-3.5 text-[0.6875rem] font-semibold text-gray-500 uppercase tracking-wider">Tanggal & Sesi</th>
                  <th class="px-5 py-3.5 text-[0.6875rem] font-semibold text-gray-500 uppercase tracking-wider">Mentor</th>
                  <th class="px-5 py-3.5 text-[0.6875rem] font-semibold text-gray-500 uppercase tracking-wider">Murid yang Hadir</th>
                  <th class="px-5 py-3.5 text-[0.6875rem] font-semibold text-gray-500 uppercase tracking-wider">Bukti Foto</th>
                  <th class="px-5 py-3.5 text-[0.6875rem] font-semibold text-gray-500 uppercase tracking-wider">Approval</th>
                  <th class="px-5 py-3.5 text-[0.6875rem] font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 text-sm">
                <tr v-for="item in filteredAbsensi" :key="item.id" class="hover:bg-gray-50/60 transition-colors">
                  <!-- Tanggal & Jam -->
                  <td class="px-5 py-4">
                    <div class="font-medium text-gray-900">
                      {{ formatDate(item.session_date) }}
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <ClockIcon class="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{{ item.session_time }}</span>
                    </div>
                    <div v-if="item.topic" class="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1 font-medium">
                      {{ item.topic }}
                    </div>
                  </td>

                  <!-- Mentor -->
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        <img v-if="item.mentor?.avatar_url" :src="item.mentor.avatar_url" class="w-full h-full object-cover" />
                        <span v-else>{{ (item.mentor?.fullname || 'M').charAt(0).toUpperCase() }}</span>
                      </div>
                      <div>
                        <div class="font-medium text-gray-900 leading-tight">{{ item.mentor?.fullname || 'Mentor tidak ditemukan' }}</div>
                        <div class="text-[0.6875rem] text-gray-400">@{{ item.mentor?.username || '-' }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Murid (Bisa Banyak) -->
                  <td class="px-5 py-4 max-w-[320px]">
                    <div class="flex flex-wrap gap-1.5 items-center">
                      <div
                        v-for="st in (item.students || []).slice(0, 3)"
                        :key="st.id"
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200/60"
                      >
                        <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                          {{ (st.fullname || 'S').charAt(0).toUpperCase() }}
                        </span>
                        <span class="truncate max-w-[110px]">{{ st.fullname }}</span>
                      </div>

                      <button
                        v-if="(item.students || []).length > 3"
                        @click="showAllStudents(item)"
                        class="text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors"
                      >
                        +{{ (item.students || []).length - 3 }} lainnya
                      </button>

                      <span v-if="(!item.students || item.students.length === 0)" class="text-xs text-gray-400 italic">
                        Belum ada murid dipilih
                      </span>
                    </div>
                  </td>

                  <!-- Bukti Foto Absen -->
                  <td class="px-5 py-4">
                    <div v-if="item.bukti_foto" class="flex items-center gap-2">
                      <button
                        @click="previewImage(item.bukti_foto, item)"
                        class="group relative w-12 h-12 rounded-xl overflow-hidden border border-gray-200 hover:ring-2 hover:ring-emerald-500 transition-all shrink-0 bg-gray-100 shadow-sm"
                      >
                        <img :src="item.bukti_foto" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" alt="Bukti Foto" />
                        <div class="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                          <EyeIcon class="w-4 h-4 text-white drop-shadow" />
                        </div>
                      </button>
                      <button
                        @click="previewImage(item.bukti_foto, item)"
                        class="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                      >
                        Lihat Foto
                      </button>
                    </div>
                    <div v-else class="text-xs text-gray-400 flex items-center gap-1 italic">
                      <PhotoIcon class="w-4 h-4 text-gray-300" />
                      Tidak ada foto
                    </div>
                  </td>

                  <!-- Status Approval -->
                  <td class="px-5 py-4">
                    <div class="flex flex-col items-start gap-1">
                      <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        :class="[
                          item.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        ]"
                      >
                        <CheckCircleIcon v-if="item.status === 'approved'" class="w-3.5 h-3.5 text-emerald-600" />
                        <XCircleIcon v-else-if="item.status === 'rejected'" class="w-3.5 h-3.5 text-rose-600" />
                        <ClockIcon v-else class="w-3.5 h-3.5 text-amber-600" />
                        {{ item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu Approval' }}
                      </span>

                      <!-- Rejection reason preview -->
                      <p v-if="item.status === 'rejected' && item.rejection_reason" class="text-[0.6875rem] text-rose-600 max-w-[180px] truncate" :title="item.rejection_reason">
                        Alasan: {{ item.rejection_reason }}
                      </p>
                    </div>
                  </td>

                  <!-- Aksi -->
                  <td class="px-5 py-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <!-- Quick Approve / Reject for Pending -->
                      <template v-if="item.status === 'pending'">
                        <button
                          @click="quickUpdateStatus(item, 'approved')"
                          title="Setujui Absensi"
                          class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <CheckIcon class="w-4 h-4" />
                        </button>
                        <button
                          @click="openRejectModal(item)"
                          title="Tolak Absensi"
                          class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <XMarkIcon class="w-4 h-4" />
                        </button>
                      </template>

                      <!-- Edit Button -->
                      <button
                        @click="openEditModal(item)"
                        title="Edit Absensi"
                        class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <PencilSquareIcon class="w-4 h-4" />
                      </button>

                      <!-- Delete Button -->
                      <button
                        @click="deleteAbsensi(item)"
                        title="Hapus Absensi"
                        class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
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

    <!-- ============================================================== -->
    <!-- MODAL FORM: TAMBAH / EDIT ABSENSI -->
    <!-- ============================================================== -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto"
    >
      <div class="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden my-8">
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 class="text-base font-semibold text-gray-900">
              {{ editingId ? 'Edit Data Absensi' : 'Tambah Absensi & Presensi' }}
            </h2>
            <p class="text-xs text-gray-500">Pilih mentor, murid yang hadir, jadwal sesi, bukti foto, dan persetujuan.</p>
          </div>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body Form -->
        <form @submit.prevent="saveAbsensi" class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <!-- 1. Pilih Mentor -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Pilih Mentor <span class="text-rose-500">*</span>
            </label>
            <select
              v-model="form.mentor_id"
              required
              class="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
            >
              <option value="" disabled>-- Pilih Mentor --</option>
              <option v-for="m in mentors" :key="m.id" :value="m.id">
                {{ m.fullname }} (@{{ m.username }})
              </option>
            </select>
          </div>

          <!-- 2. Pilih Murid (Bisa Banyak) -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Pilih Murid (Bisa Banyak) <span class="text-rose-500">*</span>
              </label>
              <div class="flex items-center gap-2">
                <span class="text-[0.6875rem] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {{ form.student_ids.length }} Murid Dipilih
                </span>
                <button
                  type="button"
                  @click="toggleSelectAllStudents"
                  class="text-[0.6875rem] text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  {{ isAllStudentsSelected ? 'Batal Semua' : 'Pilih Semua' }}
                </button>
              </div>
            </div>

            <!-- Student Filter Search inside multi-select box -->
            <div class="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
              <div class="p-2 border-b border-gray-200 bg-white">
                <div class="relative">
                  <MagnifyingGlassIcon class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    v-model="studentSearchQuery"
                    type="text"
                    placeholder="Ketik untuk mencari murid..."
                    class="w-full h-8 pl-8 pr-3 text-xs bg-gray-50 rounded-lg border border-gray-200 outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <!-- Student Checkbox List -->
              <div class="max-h-48 overflow-y-auto p-2 space-y-1">
                <label
                  v-for="st in filteredStudentOptions"
                  :key="st.id"
                  class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                  :class="{ 'bg-white border-emerald-200 shadow-2xs': form.student_ids.includes(st.id) }"
                >
                  <input
                    type="checkbox"
                    :value="st.id"
                    v-model="form.student_ids"
                    class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {{ (st.fullname || 'S').charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-gray-900 truncate">{{ st.fullname }}</p>
                    <p class="text-[10px] text-gray-400">@{{ st.username }}</p>
                  </div>
                </label>

                <div v-if="filteredStudentOptions.length === 0" class="py-4 text-center text-xs text-gray-400">
                  Tidak ditemukan murid dengan nama tersebut
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Tanggal Sesi & Jam Sesi -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Tanggal Sesi <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.session_date"
                type="date"
                required
                class="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Jam Sesi <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.session_time"
                type="text"
                placeholder="Contoh: 14:00 - 15:30 WIB"
                required
                class="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
              />
            </div>
          </div>

          <!-- Topik / Materi Pembahasan (Opsional) -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Topik / Materi (Opsional)
            </label>
            <input
              v-model="form.topic"
              type="text"
              placeholder="Contoh: Mentoring Project Nuxt 3 & Integrasi Supabase"
              class="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
            />
          </div>

          <!-- 4. Bukti Foto Absen -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Bukti Foto Absen
            </label>

            <!-- Image Upload Zone -->
            <div class="space-y-3">
              <div
                class="border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-emerald-50/20"
                @click="triggerFileInput"
              >
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFileUpload"
                />

                <div v-if="isUploadingPhoto" class="flex flex-col items-center py-2">
                  <div class="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p class="text-xs text-gray-500 mt-2">Mengunggah bukti foto...</p>
                </div>

                <div v-else-if="form.bukti_foto" class="flex flex-col items-center">
                  <img :src="form.bukti_foto" class="h-32 object-contain rounded-xl border border-gray-200 shadow-sm" alt="Preview Foto" />
                  <p class="text-xs text-emerald-600 font-medium mt-2">Klik untuk mengganti foto</p>
                </div>

                <div v-else class="flex flex-col items-center py-3">
                  <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                    <ArrowUpTrayIcon class="w-5 h-5 text-emerald-600" />
                  </div>
                  <p class="text-xs font-medium text-gray-700">Klik untuk unggah Bukti Foto</p>
                  <p class="text-[0.6875rem] text-gray-400 mt-0.5">Format JPG, PNG, WEBP (Maksimal 5MB)</p>
                </div>
              </div>

              <!-- Manual URL Fallback Input -->
              <div class="flex items-center gap-2">
                <input
                  v-model="form.bukti_foto"
                  type="url"
                  placeholder="Atau masukkan URL gambar langsung..."
                  class="flex-1 h-9 px-3 rounded-xl border border-gray-200 text-xs bg-white focus:border-emerald-500 outline-none"
                />
                <button
                  v-if="form.bukti_foto"
                  type="button"
                  @click="form.bukti_foto = ''"
                  class="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                >
                  Hapus Foto
                </button>
              </div>
            </div>
          </div>

          <!-- 5. Approval & Catatan -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Status Approval
              </label>
              <select
                v-model="form.status"
                class="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
              >
                <option value="pending">Menunggu Approval (Pending)</option>
                <option value="approved">Disetujui (Approved)</option>
                <option value="rejected">Ditolak (Rejected)</option>
              </select>
            </div>

            <div v-if="form.status === 'rejected'">
              <label class="block text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1.5">
                Alasan Penolakan
              </label>
              <input
                v-model="form.rejection_reason"
                type="text"
                placeholder="Contoh: Bukti foto tidak jelas/tidak sesuai"
                class="w-full h-10 px-3 rounded-xl border border-rose-200 bg-rose-50/30 text-sm text-gray-900 focus:border-rose-500 outline-none"
              />
            </div>
          </div>

          <!-- Catatan / Notes -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Catatan Sesi (Opsional)
            </label>
            <textarea
              v-model="form.notes"
              rows="2"
              placeholder="Catatan tambahan mengenai jalannya sesi atau kendala..."
              class="w-full p-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:border-emerald-500 outline-none resize-none"
            ></textarea>
          </div>

          <!-- Modal Footer Actions -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || form.student_ids.length === 0"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium transition-all shadow-sm"
            >
              <div v-if="isSubmitting" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{{ editingId ? 'Simpan Perubahan' : 'Tambah Absensi' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL REJECT / TOLAK APPROVAL DENGAN ALASAN -->
    <!-- ============================================================== -->
    <div
      v-if="isRejectModalOpen"
      class="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
    >
      <div class="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <XMarkIcon class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-900">Tolak Absensi Ini?</h3>
            <p class="text-xs text-gray-500">Berikan alasan penolakan absensi untuk mentor & murid.</p>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Alasan Penolakan
          </label>
          <input
            v-model="rejectReasonInput"
            type="text"
            placeholder="Contoh: Bukti foto buram atau waktu tidak sesuai"
            class="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:border-rose-500 outline-none"
            autofocus
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            @click="isRejectModalOpen = false"
            class="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            @click="confirmReject"
            class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors"
          >
            Konfirmasi Tolak
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL PREVIEW BUKTI FOTO (LIGHTBOX ZOOM) -->
    <!-- ============================================================== -->
    <div
      v-if="previewPhotoUrl"
      class="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      @click="previewPhotoUrl = ''"
    >
      <div class="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center" @click.stop>
        <button
          @click="previewPhotoUrl = ''"
          class="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 text-sm flex items-center gap-1 font-medium"
        >
          <XMarkIcon class="w-6 h-6" /> Tutup
        </button>

        <img
          :src="previewPhotoUrl"
          class="max-h-[75vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/10"
          alt="Bukti Foto Presensi"
        />

        <div v-if="previewItemInfo" class="mt-4 bg-white/10 backdrop-blur-md px-6 py-2.5 rounded-full text-white text-xs flex items-center gap-4">
          <span><strong>Mentor:</strong> {{ previewItemInfo.mentor?.fullname || '-' }}</span>
          <span><strong>Tanggal:</strong> {{ formatDate(previewItemInfo.session_date) }}</span>
          <span><strong>Total Murid:</strong> {{ (previewItemInfo.students || []).length }} orang</span>
          <a
            :href="previewPhotoUrl"
            target="_blank"
            class="text-emerald-300 underline font-medium hover:text-emerald-200"
          >
            Buka Tab Baru
          </a>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL DETAIL SEMUA SISWA HADIR -->
    <!-- ============================================================== -->
    <div
      v-if="showStudentModalItem"
      class="fixed inset-0 z-[215] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
      @click="showStudentModalItem = null"
    >
      <div class="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4" @click.stop>
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Daftar Murid yang Hadir</h3>
            <p class="text-xs text-gray-500">Total {{ (showStudentModalItem.students || []).length }} murid pada sesi ini</p>
          </div>
          <button @click="showStudentModalItem = null" class="text-gray-400 hover:text-gray-600">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="max-h-64 overflow-y-auto space-y-2">
          <div
            v-for="st in showStudentModalItem.students"
            :key="st.id"
            class="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100"
          >
            <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
              {{ (st.fullname || 'S').charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-900 leading-tight">{{ st.fullname }}</p>
              <p class="text-[11px] text-gray-400">@{{ st.username }}</p>
            </div>
          </div>
        </div>

        <div class="pt-2 text-right">
          <button
            @click="showStudentModalItem = null"
            class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Bars3Icon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  PhotoIcon,
  ArrowUpTrayIcon
} from '@heroicons/vue/24/outline'

// State
const sidebarOpen = ref(false)
const isLoading = ref(true)
const isSubmitting = ref(false)
const isUploadingPhoto = ref(false)

const absensiList = ref<any[]>([])
const mentors = ref<any[]>([])
const students = ref<any[]>([])

// Filter & Search
const searchQuery = ref('')
const filterStatus = ref('')
const filterMentor = ref('')
const studentSearchQuery = ref('')

// Modal state
const isModalOpen = ref(false)
const editingId = ref<number | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Photo preview modal
const previewPhotoUrl = ref('')
const previewItemInfo = ref<any>(null)

// Student list modal
const showStudentModalItem = ref<any>(null)

// Reject modal
const isRejectModalOpen = ref(false)
const rejectingItem = ref<any>(null)
const rejectReasonInput = ref('')

// Form model
const form = ref({
  mentor_id: '',
  student_ids: [] as string[],
  session_date: new Date().toISOString().split('T')[0],
  session_time: '14:00 - 15:30 WIB',
  topic: '',
  bukti_foto: '',
  status: 'pending',
  notes: '',
  rejection_reason: '',
})

// Current user
const supabaseUser = useSupabaseUser()

// Fetch Data
const fetchData = async () => {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/absensi')
    absensiList.value = res.absensi || []
    mentors.value = res.mentors || []
    students.value = res.students || []
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Gagal memuat data absensi.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})

// Filtered List
const filteredAbsensi = computed(() => {
  return absensiList.value.filter(item => {
    // Status Filter
    if (filterStatus.value && item.status !== filterStatus.value) {
      return false
    }
    // Mentor Filter
    if (filterMentor.value && item.mentor_id !== filterMentor.value) {
      return false
    }
    // Search Query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const mentorName = item.mentor?.fullname?.toLowerCase() || ''
      const topic = item.topic?.toLowerCase() || ''
      const notes = item.notes?.toLowerCase() || ''
      const date = item.session_date?.toLowerCase() || ''
      const studentsMatch = (item.students || []).some((st: any) =>
        st.fullname?.toLowerCase().includes(q) || st.username?.toLowerCase().includes(q)
      )

      if (
        !mentorName.includes(q) &&
        !topic.includes(q) &&
        !notes.includes(q) &&
        !date.includes(q) &&
        !studentsMatch
      ) {
        return false
      }
    }
    return true
  })
})

// Filtered Student Options in modal form
const filteredStudentOptions = computed(() => {
  if (!studentSearchQuery.value.trim()) return students.value
  const q = studentSearchQuery.value.toLowerCase()
  return students.value.filter(s =>
    (s.fullname && s.fullname.toLowerCase().includes(q)) ||
    (s.username && s.username.toLowerCase().includes(q))
  )
})

const isAllStudentsSelected = computed(() => {
  return students.value.length > 0 && form.value.student_ids.length === students.value.length
})

const toggleSelectAllStudents = () => {
  if (isAllStudentsSelected.value) {
    form.value.student_ids = []
  } else {
    form.value.student_ids = students.value.map(s => s.id)
  }
}

// Helpers
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

const previewImage = (url: string, item: any) => {
  previewPhotoUrl.value = url
  previewItemInfo.value = item
}

const showAllStudents = (item: any) => {
  showStudentModalItem.value = item
}

// Modal open/close
const openAddModal = () => {
  editingId.value = null
  studentSearchQuery.value = ''
  form.value = {
    mentor_id: mentors.value.length > 0 ? mentors.value[0].id : '',
    student_ids: [],
    session_date: new Date().toISOString().split('T')[0],
    session_time: '14:00 - 15:30 WIB',
    topic: '',
    bukti_foto: '',
    status: 'pending',
    notes: '',
    rejection_reason: '',
  }
  isModalOpen.value = true
}

const openEditModal = (item: any) => {
  editingId.value = item.id
  studentSearchQuery.value = ''
  form.value = {
    mentor_id: item.mentor_id || '',
    student_ids: item.student_ids ? [...item.student_ids] : (item.students || []).map((s: any) => s.id),
    session_date: item.session_date || new Date().toISOString().split('T')[0],
    session_time: item.session_time || '',
    topic: item.topic || '',
    bukti_foto: item.bukti_foto || '',
    status: item.status || 'pending',
    notes: item.notes || '',
    rejection_reason: item.rejection_reason || '',
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingId.value = null
}

// File Upload
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  const formData = new FormData()
  formData.append('file', file)

  isUploadingPhoto.value = true
  try {
    const res: any = await $fetch('/api/admin/absensi/upload', {
      method: 'POST',
      body: formData
    })
    if (res.url) {
      form.value.bukti_foto = res.url
    }
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Gagal mengunggah foto bukti absen.')
  } finally {
    isUploadingPhoto.value = false
  }
}

// Save Absensi
const saveAbsensi = async () => {
  if (!form.value.mentor_id) {
    alert('Silakan pilih mentor terlebih dahulu.')
    return
  }
  if (form.value.student_ids.length === 0) {
    alert('Pilih minimal 1 murid yang hadir.')
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      ...form.value,
      approved_by: supabaseUser.value?.id || null
    }

    if (editingId.value) {
      await $fetch(`/api/admin/absensi/${editingId.value}`, {
        method: 'PUT',
        body: payload
      })
    } else {
      await $fetch('/api/admin/absensi', {
        method: 'POST',
        body: payload
      })
    }

    closeModal()
    await fetchData()
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Gagal menyimpan data absensi.')
  } finally {
    isSubmitting.value = false
  }
}

// Quick Approval
const quickUpdateStatus = async (item: any, newStatus: string) => {
  try {
    await $fetch(`/api/admin/absensi/${item.id}`, {
      method: 'PUT',
      body: {
        status: newStatus,
        approved_by: supabaseUser.value?.id || null
      }
    })
    await fetchData()
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Gagal memperbarui status absensi.')
  }
}

const openRejectModal = (item: any) => {
  rejectingItem.value = item
  rejectReasonInput.value = ''
  isRejectModalOpen.value = true
}

const confirmReject = async () => {
  if (!rejectingItem.value) return
  try {
    await $fetch(`/api/admin/absensi/${rejectingItem.value.id}`, {
      method: 'PUT',
      body: {
        status: 'rejected',
        rejection_reason: rejectReasonInput.value.trim() || 'Ditolak oleh admin',
        approved_by: null
      }
    })
    isRejectModalOpen.value = false
    rejectingItem.value = null
    await fetchData()
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Gagal menolak absensi.')
  }
}

// Delete
const deleteAbsensi = async (item: any) => {
  const confirmed = confirm(`Hapus absensi tanggal ${item.session_date} untuk mentor ${item.mentor?.fullname || ''}?`)
  if (!confirmed) return

  try {
    await $fetch(`/api/admin/absensi/${item.id}`, {
      method: 'DELETE'
    })
    await fetchData()
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Gagal menghapus data absensi.')
  }
}
</script>
