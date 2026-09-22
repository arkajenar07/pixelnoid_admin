<template>
  <div class="flex min-h-screen bg-gray-50 text-gray-900 antialiased overflow-x-hidden font-sans">
    <AdminSidebar :open="sidebarOpen" @update:open="sidebarOpen = $event" />
    
    <div class="flex-1 w-full min-w-0 lg:ml-[260px]">
      <!-- Header -->
      <header class="sticky top-0 z-[100] flex w-full items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200">
        <div class="flex items-center gap-4">
          <button class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors lg:hidden" @click="sidebarOpen = !sidebarOpen">
            <Bars3Icon class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-base font-semibold text-gray-900 leading-none">Student Assigment Management</h1>
          </div>
        </div>

        <button
          @click="openAddAssignmentModal"
          class="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#5530AB] hover:bg-[#43238A] text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          <PlusIcon class="w-4 h-4" />
          <span>Buat Tugas Baru</span>
        </button>
      </header>

      <main class="p-6 space-y-6 max-w-[1440px] mx-auto">
        <!-- Top Metrics -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Total Tugas</p>
              <div class="w-8 h-8 rounded-lg bg-[#5530AB]/10 text-[#5530AB] flex items-center justify-center">
                <DocumentTextIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ assignments.length }}</p>
            <p class="text-xs text-gray-500 mt-1">Quizizz, Praktek & Studi Kasus</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Total Siswa Aktif</p>
              <div class="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                <AcademicCapIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ studentsList.length }}</p>
            <p class="text-xs text-gray-500 mt-1">Terdaftar di platform</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Tugas Terkumpul</p>
              <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircleIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ totalSubmittedSubmissions }}</p>
            <p class="text-xs text-emerald-700 font-semibold mt-1">{{ overallCompletionRate }}% dari total penugasan</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between">
              <p class="text-[0.6875rem] font-bold text-gray-500 uppercase tracking-widest">Perlu Feedback</p>
              <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <ChatBubbleLeftRightIcon class="w-4 h-4" />
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ totalPendingFeedback }}</p>
            <p class="text-xs text-amber-700 font-semibold mt-1">Menunggu review mentor</p>
          </div>
        </div>

        <!-- Navigation Tabs & Filters -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
          <!-- Tabs -->
          <div class="flex items-center p-1 bg-gray-100 rounded-lg w-fit">
            <button
              @click="activeTab = 'assignments'"
              class="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer"
              :class="activeTab === 'assignments' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-900'"
            >
              <ClipboardDocumentListIcon class="w-4 h-4" />
              Daftar Tugas ({{ assignments.length }})
            </button>
            <button
              @click="activeTab = 'students'"
              class="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer"
              :class="activeTab === 'students' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-900'"
            >
              <UsersIcon class="w-4 h-4" />
              Monitoring Siswa ({{ studentsList.length }})
            </button>
          </div>

          <!-- Filters -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="relative flex-1 sm:w-64 min-w-[200px]">
              <MagnifyingGlassIcon class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="activeTab === 'assignments' ? 'Cari judul tugas...' : 'Cari nama siswa...'"
                class="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors"
              />
            </div>

            <!-- Filter Type -->
            <select
              v-if="activeTab === 'assignments'"
              v-model="filterType"
              class="h-10 px-3.5 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors cursor-pointer"
            >
              <option value="">Semua Tipe Tugas</option>
              <option value="quizizz">Quizizz</option>
              <option value="practice">Praktek</option>
              <option value="case_study">Studi Kasus</option>
            </select>
          </div>
        </div>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!-- TAB 1: DAFTAR TUGAS -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'assignments'" class="space-y-4">
          <!-- Loading State -->
          <div v-if="isLoadingAssignments" class="bg-white border border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center">
            <div class="w-8 h-8 border-2 border-gray-200 border-t-[#5530AB] rounded-full animate-spin"></div>
            <p class="text-xs text-gray-500 mt-3 font-semibold">Memuat data tugas...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredAssignments.length === 0" class="bg-white border border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center text-center">
            <div class="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
              <ClipboardDocumentCheckIcon class="w-7 h-7" />
            </div>
            <h3 class="text-sm font-bold text-gray-900">Belum ada tugas ditemukan</h3>
            <p class="text-xs text-gray-500 mt-1 max-w-sm">
              {{ searchQuery || filterType ? 'Coba ubah kata kunci pencarian atau filter tipe tugas.' : 'Buat tugas Quizizz, Praktek, atau Studi Kasus baru sekarang.' }}
            </p>
            <button
              v-if="!searchQuery && !filterType"
              @click="openAddAssignmentModal"
              class="mt-4 px-4 py-2 rounded-lg bg-[#5530AB] text-white text-xs font-semibold hover:bg-[#43238A] transition-colors cursor-pointer"
            >
              Buat Tugas Pertama
            </button>
          </div>

          <!-- Assignments Grid -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <div
              v-for="item in filteredAssignments"
              :key="item.id"
              class="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#5530AB] transition-colors flex flex-col justify-between group"
            >
              <div>
                <!-- Top Badge & Actions -->
                <div class="flex items-start justify-between gap-2 mb-3">
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.6875rem] font-bold uppercase"
                    :class="getTypeBadgeClasses(item.type)"
                  >
                    <component :is="getTypeIcon(item.type)" class="w-3.5 h-3.5" />
                    {{ getTypeLabel(item.type) }}
                  </span>

                  <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      @click="openEditAssignmentModal(item)"
                      class="p-1.5 rounded-md text-gray-400 hover:text-[#5530AB] hover:bg-[#5530AB]/10 transition-colors cursor-pointer"
                      title="Edit Tugas"
                    >
                      <PencilSquareIcon class="w-4 h-4" />
                    </button>
                    <button
                      @click="deleteAssignment(item)"
                      class="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Tugas"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Title & Description -->
                <h3 class="text-base font-bold text-gray-900 group-hover:text-[#5530AB] transition-colors leading-snug">
                  {{ item.title }}
                </h3>
                <p class="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                  {{ item.description || 'Tidak ada instruksi tambahan.' }}
                </p>

                <!-- Reference Link -->
                <div v-if="item.link_url" class="mt-4">
                  <a
                    :href="item.link_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 font-semibold hover:text-[#5530AB] hover:bg-[#5530AB]/5 hover:border-[#5530AB]/30 transition-colors truncate max-w-full"
                  >
                    <LinkIcon class="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    <span class="truncate">{{ item.link_url }}</span>
                    <ArrowTopRightOnSquareIcon class="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <!-- Due Date -->
                <div class="flex items-center gap-1.5 mt-4 text-xs font-semibold" :class="isOverdue(item.due_date) ? 'text-rose-600' : 'text-gray-500'">
                  <CalendarIcon class="w-3.5 h-3.5 shrink-0" />
                  <span>Deadline: {{ formatDueDate(item.due_date) }}</span>
                  <span v-if="isOverdue(item.due_date)" class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[0.625rem]">Terlewat</span>
                </div>
              </div>

              <!-- Bottom Stats & Progress -->
              <div class="mt-5 pt-4 border-t border-gray-100 space-y-4">
                <!-- Progress bar -->
                <div>
                  <div class="flex items-center justify-between text-xs mb-1.5">
                    <span class="text-gray-500 font-semibold">Status Pengumpulan</span>
                    <span class="font-bold text-gray-900">
                      {{ item.stats?.submittedCount || 0 }}/{{ item.stats?.totalAssigned || 0 }} ({{ item.stats?.completionRate || 0 }}%)
                    </span>
                  </div>
                  <div class="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="item.stats?.completionRate === 100 ? 'bg-emerald-500' : 'bg-[#5530AB]'"
                      :style="{ width: `${item.stats?.completionRate || 0}%` }"
                    ></div>
                  </div>
                </div>

                <!-- Footer details & button -->
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center -space-x-1.5 overflow-hidden">
                    <template v-for="(sub, idx) in (item.student_assignments || []).slice(0, 4)" :key="sub.id">
                      <div
                        class="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[0.5rem] font-bold text-white"
                        :style="{ background: getAvatarColor(sub.users?.fullname || 'Student') }"
                        :title="sub.users?.fullname || 'Student'"
                      >
                        {{ getInitials(sub.users?.fullname || '?') }}
                      </div>
                    </template>
                    <div
                      v-if="(item.student_assignments || []).length > 4"
                      class="w-6 h-6 rounded-full border-2 border-white bg-gray-100 text-gray-600 flex items-center justify-center text-[0.5rem] font-bold"
                    >
                      +{{ (item.student_assignments || []).length - 4 }}
                    </div>
                  </div>

                  <button
                    @click="openSubmissionsModal(item)"
                    class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-[#5530AB] hover:text-white text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>Cek Submisi</span>
                    <ChevronRightIcon class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!-- TAB 2: MONITORING SISWA -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <div v-else-if="activeTab === 'students'" class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div v-if="isLoadingStudents" class="flex items-center justify-center py-20">
            <div class="w-8 h-8 border-2 border-gray-200 border-t-[#5530AB] rounded-full animate-spin"></div>
          </div>

          <div v-else-if="filteredStudentsSummary.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
            <UsersIcon class="w-10 h-10 text-gray-300 mb-3" />
            <p class="text-sm font-bold text-gray-900">Tidak ada siswa ditemukan</p>
            <p class="text-xs text-gray-500 mt-1">Cek kembali filter pencarian Anda.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b border-gray-200 bg-gray-50">
                  <th class="px-5 py-3 text-[0.6875rem] font-bold text-gray-500 uppercase tracking-wider">Siswa</th>
                  <th class="px-5 py-3 text-[0.6875rem] font-bold text-gray-500 uppercase tracking-wider">Tugas Di-assign</th>
                  <th class="px-5 py-3 text-[0.6875rem] font-bold text-gray-500 uppercase tracking-wider">Sudah Upload</th>
                  <th class="px-5 py-3 text-[0.6875rem] font-bold text-gray-500 uppercase tracking-wider">Belum Upload</th>
                  <th class="px-5 py-3 text-[0.6875rem] font-bold text-gray-500 uppercase tracking-wider">Rata-Rata Nilai</th>
                  <th class="px-5 py-3 text-right text-[0.6875rem] font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 text-sm">
                <tr v-for="stu in filteredStudentsSummary" :key="stu.id" class="hover:bg-gray-50 transition-colors">
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        :style="{ background: getAvatarColor(stu.fullname || stu.username || 'Student') }"
                      >
                        {{ getInitials(stu.fullname || stu.username || '?') }}
                      </div>
                      <div>
                        <p class="font-bold text-gray-900 leading-tight">{{ stu.fullname || 'Tanpa Nama' }}</p>
                        <p class="text-[0.6875rem] text-gray-500 font-mono mt-0.5">@{{ stu.username || '—' }}</p>
                      </div>
                    </div>
                  </td>

                  <td class="px-5 py-3">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-100 text-gray-800 text-xs font-bold">
                      <DocumentTextIcon class="w-3.5 h-3.5 text-gray-500" />
                      {{ stu.totalAssigned }}
                    </span>
                  </td>

                  <td class="px-5 py-3">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-bold">
                      <CheckCircleIcon class="w-3.5 h-3.5 text-emerald-600" />
                      {{ stu.totalSubmitted }}
                    </span>
                  </td>

                  <td class="px-5 py-3">
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold"
                      :class="stu.totalPending > 0 ? 'bg-rose-50 text-rose-700' : 'bg-gray-100 text-gray-500'"
                    >
                      <ExclamationCircleIcon class="w-3.5 h-3.5" :class="stu.totalPending > 0 ? 'text-rose-600' : 'text-gray-400'" />
                      {{ stu.totalPending }}
                    </span>
                  </td>

                  <td class="px-5 py-3">
                    <span v-if="stu.averageGrade !== null" class="font-bold text-[#5530AB] bg-[#5530AB]/10 px-2.5 py-1 rounded">
                      {{ stu.averageGrade }} / 100
                    </span>
                    <span v-else class="text-xs text-gray-400 font-medium">Belum ada</span>
                  </td>

                  <td class="px-5 py-3 text-right">
                    <button
                      @click="openStudentDetailModal(stu)"
                      class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 hover:bg-[#5530AB] hover:text-white transition-colors cursor-pointer"
                    >
                      <span>Lihat Riwayat</span>
                      <ChevronRightIcon class="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: TAMBAH / EDIT TUGAS -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="assignmentModal.open" class="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="assignmentModal.open = false" />
          
          <div class="relative w-full max-w-2xl bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-[#5530AB]/10 flex items-center justify-center">
                  <ClipboardDocumentCheckIcon class="w-4 h-4 text-[#5530AB]" />
                </div>
                <div>
                  <h2 class="text-base font-bold text-gray-900 leading-tight">{{ assignmentModal.isEditing ? 'Edit Tugas' : 'Buat Tugas Baru' }}</h2>
                </div>
              </div>
              <button @click="assignmentModal.open = false" class="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer">
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <form @submit.prevent="submitAssignmentForm" class="p-6 space-y-5 overflow-y-auto flex-1">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-800 uppercase tracking-wider">Judul Tugas <span class="text-rose-500">*</span></label>
                <input
                  v-model="assignmentForm.title"
                  type="text"
                  required
                  placeholder="Contoh: Praktek Redesign Mobile Checkout Funnel"
                  class="w-full h-10 px-3 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors"
                />
              </div>

              <div class="space-y-2">
                <label class="text-xs font-bold text-gray-800 uppercase tracking-wider">Pilih Jenis Tugas <span class="text-rose-500">*</span></label>
                <div class="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    @click="assignmentForm.type = 'quizizz'"
                    class="flex flex-col items-center p-3 rounded-xl border-2 text-center transition-colors cursor-pointer"
                    :class="assignmentForm.type === 'quizizz' ? 'border-[#5530AB] bg-[#5530AB]/5 text-[#5530AB]' : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'"
                  >
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5" :class="assignmentForm.type === 'quizizz' ? 'bg-[#5530AB]/10' : 'bg-gray-100'">
                      <SparklesIcon class="w-4 h-4" />
                    </div>
                    <span class="text-xs font-bold">Quizizz</span>
                  </button>

                  <button
                    type="button"
                    @click="assignmentForm.type = 'practice'"
                    class="flex flex-col items-center p-3 rounded-xl border-2 text-center transition-colors cursor-pointer"
                    :class="assignmentForm.type === 'practice' ? 'border-[#5530AB] bg-[#5530AB]/5 text-[#5530AB]' : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'"
                  >
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5" :class="assignmentForm.type === 'practice' ? 'bg-[#5530AB]/10' : 'bg-gray-100'">
                      <CodeBracketIcon class="w-4 h-4" />
                    </div>
                    <span class="text-xs font-bold">Praktek</span>
                  </button>

                  <button
                    type="button"
                    @click="assignmentForm.type = 'case_study'"
                    class="flex flex-col items-center p-3 rounded-xl border-2 text-center transition-colors cursor-pointer"
                    :class="assignmentForm.type === 'case_study' ? 'border-[#5530AB] bg-[#5530AB]/5 text-[#5530AB]' : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'"
                  >
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5" :class="assignmentForm.type === 'case_study' ? 'bg-[#5530AB]/10' : 'bg-gray-100'">
                      <BriefcaseIcon class="w-4 h-4" />
                    </div>
                    <span class="text-xs font-bold">Studi Kasus</span>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-gray-800 uppercase tracking-wider">Link Tambahan <span class="text-gray-500 font-normal">(opsional)</span></label>
                  <input
                    v-model="assignmentForm.link_url"
                    type="url"
                    placeholder="https://quizizz.com/..."
                    class="w-full h-10 px-3 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-gray-800 uppercase tracking-wider">Batas Waktu (Deadline)</label>
                  <input
                    v-model="assignmentForm.due_date"
                    type="datetime-local"
                    class="w-full h-10 px-3 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors"
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-800 uppercase tracking-wider">Deskripsi Tugas</label>
                <textarea
                  v-model="assignmentForm.description"
                  rows="3"
                  placeholder="Tuliskan petunjuk pengerjaan..."
                  class="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors resize-none"
                ></textarea>
              </div>

              <div class="space-y-2 pt-3 border-t border-gray-200">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-xs font-bold text-gray-800 uppercase tracking-wider">Assign ke Siswa <span class="text-rose-500">*</span></label>
                    <p class="text-xs text-gray-500 mt-0.5">Terpilih {{ assignmentForm.student_ids.length }} / {{ studentsList.length }} siswa</p>
                  </div>
                  <button
                    type="button"
                    @click="toggleSelectAllStudents"
                    class="text-xs font-bold text-[#5530AB] bg-[#5530AB]/10 hover:bg-[#5530AB]/20 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
                  >
                    {{ assignmentForm.student_ids.length === studentsList.length ? 'Batal Pilih Semua' : 'Pilih Semua Siswa' }}
                  </button>
                </div>

                <div class="border border-gray-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-100 bg-gray-50 p-1">
                  <div
                    v-for="s in studentsList"
                    :key="s.id"
                    @click="toggleStudentSelection(s.id)"
                    class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
                  >
                    <div class="flex items-center gap-3">
                      <input
                        type="checkbox"
                        :checked="assignmentForm.student_ids.includes(s.id)"
                        class="rounded border-gray-300 text-[#5530AB] focus:ring-[#5530AB] pointer-events-none"
                      />
                      <div
                        class="w-6 h-6 rounded-md flex items-center justify-center text-[0.625rem] font-bold text-white shrink-0"
                        :style="{ background: getAvatarColor(s.fullname || s.username || 'Student') }"
                      >
                        {{ getInitials(s.fullname || s.username || '?') }}
                      </div>
                      <span class="text-xs font-bold text-gray-900">{{ s.fullname || s.username }}</span>
                    </div>
                    <span class="text-[0.6875rem] text-gray-500 font-mono">@{{ s.username }}</span>
                  </div>
                </div>
              </div>

              <p v-if="assignmentModal.error" class="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200 font-medium">
                {{ assignmentModal.error }}
              </p>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  @click="assignmentModal.open = false"
                  class="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  :disabled="assignmentModal.saving || !assignmentForm.title || assignmentForm.student_ids.length === 0"
                  class="px-5 py-2 rounded-lg bg-[#5530AB] hover:bg-[#43238A] text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  <div v-if="assignmentModal.saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span v-else>{{ assignmentModal.isEditing ? 'Simpan Perubahan' : 'Terbitkan Tugas' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: DETAIL & SUBMISSIONS PER TUGAS -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="submissionsModal.open" class="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="submissionsModal.open = false" />
          
          <div class="relative w-full max-w-4xl bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div class="flex items-start justify-between px-6 py-5 border-b border-gray-200 shrink-0">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[0.6875rem] font-bold uppercase"
                    :class="getTypeBadgeClasses(submissionsModal.assignment?.type)"
                  >
                    <component :is="getTypeIcon(submissionsModal.assignment?.type)" class="w-3.5 h-3.5" />
                    {{ getTypeLabel(submissionsModal.assignment?.type) }}
                  </span>
                  <span class="text-xs text-gray-500 font-medium">Deadline: {{ formatDueDate(submissionsModal.assignment?.due_date) }}</span>
                </div>
                <h2 class="text-lg font-bold text-gray-900">{{ submissionsModal.assignment?.title }}</h2>
                <div v-if="submissionsModal.assignment?.link_url" class="mt-2">
                  <a
                    :href="submissionsModal.assignment?.link_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 text-xs text-[#5530AB] font-bold hover:underline"
                  >
                    <LinkIcon class="w-3 h-3" />
                    Buka Link Tambahan →
                  </a>
                </div>
              </div>
              <button @click="submissionsModal.open = false" class="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer">
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <div class="p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50">
              <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Daftar Pengumpulan Siswa ({{ (submissionsModal.assignment?.student_assignments || []).length }})
              </h3>

              <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table class="w-full text-left text-sm">
                  <thead>
                    <tr class="bg-gray-50/50 border-b border-gray-200">
                      <th class="px-4 py-3 text-[0.6875rem] font-bold text-gray-500 uppercase tracking-wider">Siswa</th>
                      <th class="px-4 py-3 text-[0.6875rem] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th class="px-4 py-3 text-[0.6875rem] font-bold text-gray-500 uppercase tracking-wider">Link Upload Tugas</th>
                      <th class="px-4 py-3 text-[0.6875rem] font-bold text-gray-500 uppercase tracking-wider">Feedback & Nilai</th>
                      <th class="px-4 py-3 text-right text-[0.6875rem] font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr
                      v-for="sub in (submissionsModal.assignment?.student_assignments || [])"
                      :key="sub.id"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-2.5">
                          <div
                            class="w-7 h-7 rounded-md flex items-center justify-center text-white text-[0.625rem] font-bold shrink-0"
                            :style="{ background: getAvatarColor(sub.users?.fullname || 'Student') }"
                          >
                            {{ getInitials(sub.users?.fullname || '?') }}
                          </div>
                          <div>
                            <p class="font-bold text-gray-900 text-xs leading-tight">{{ sub.users?.fullname || 'Student' }}</p>
                          </div>
                        </div>
                      </td>

                      <td class="px-4 py-3">
                        <span
                          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[0.6875rem] font-bold uppercase"
                          :class="getStatusBadgeClasses(sub.status)"
                        >
                          {{ getStatusLabel(sub.status) }}
                        </span>
                      </td>

                      <td class="px-4 py-3 max-w-[200px]">
                        <div v-if="sub.submission_url" class="space-y-1">
                          <a
                            :href="sub.submission_url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#5530AB]/10 text-[#5530AB] hover:bg-[#5530AB]/20 text-xs font-bold truncate max-w-full transition-colors"
                            :title="sub.submission_url"
                          >
                            <LinkIcon class="w-3 h-3 shrink-0" />
                            <span class="truncate">Buka Tugas</span>
                          </a>
                          <p v-if="sub.submitted_at" class="text-[0.625rem] text-gray-500 font-medium">
                            Diunggah: {{ formatDateOnly(sub.submitted_at) }}
                          </p>
                        </div>
                        <div v-else class="text-xs text-gray-400 font-medium">
                          Belum upload
                        </div>
                      </td>

                      <td class="px-4 py-3 max-w-[220px]">
                        <div v-if="sub.feedback || sub.grade !== null" class="space-y-1">
                          <div v-if="sub.grade !== null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-900 text-xs font-bold">
                            Nilai: {{ sub.grade }}
                          </div>
                          <p v-if="sub.feedback" class="text-xs text-gray-700 line-clamp-2">
                            "{{ sub.feedback }}"
                          </p>
                        </div>
                        <span v-else class="text-xs text-gray-400 font-medium">Belum dinilai</span>
                      </td>

                      <td class="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          @click="openUploadLinkModal(sub)"
                          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                          title="Upload / Ubah Link Tugas"
                        >
                          <ArrowUpTrayIcon class="w-3.5 h-3.5" />
                          <span>{{ sub.submission_url ? 'Edit' : 'Upload' }}</span>
                        </button>

                        <button
                          @click="openFeedbackModal(sub)"
                          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#5530AB] hover:bg-[#43238A] text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <ChatBubbleBottomCenterTextIcon class="w-3.5 h-3.5" />
                          <span>Nilai</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: BERI FEEDBACK & NILAI -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="feedbackModal.open" class="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="feedbackModal.open = false" />
          
          <div class="relative w-full max-w-lg bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <ChatBubbleBottomCenterTextIcon class="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h2 class="text-base font-bold text-gray-900 leading-tight">Review & Feedback</h2>
                  <p class="text-xs text-gray-500 mt-0.5">{{ feedbackModal.submission?.users?.fullname || 'Siswa' }}</p>
                </div>
              </div>
              <button @click="feedbackModal.open = false" class="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer">
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <form @submit.prevent="submitFeedbackForm" class="p-6 space-y-4 bg-gray-50">
              <div v-if="feedbackModal.submission?.submission_url" class="p-3 bg-white rounded-lg border border-gray-200 text-xs">
                <p class="font-bold text-gray-700 mb-1">Link Tugas Siswa:</p>
                <a
                  :href="feedbackModal.submission?.submission_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-[#5530AB] font-bold hover:underline break-all"
                >
                  <LinkIcon class="w-3.5 h-3.5 shrink-0" />
                  <span>{{ feedbackModal.submission?.submission_url }}</span>
                </a>
                <p v-if="feedbackModal.submission?.submission_notes" class="text-gray-600 mt-2 text-xs">
                  <strong>Catatan:</strong> "{{ feedbackModal.submission?.submission_notes }}"
                </p>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-800 uppercase tracking-wider">Nilai / Skor (0 - 100)</label>
                <input
                  v-model="feedbackForm.grade"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Contoh: 95"
                  class="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-800 uppercase tracking-wider">Catatan Feedback</label>
                <textarea
                  v-model="feedbackForm.feedback"
                  rows="4"
                  required
                  placeholder="Berikan saran atau apresiasi..."
                  class="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors resize-none"
                ></textarea>
              </div>

              <p v-if="feedbackModal.error" class="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                {{ feedbackModal.error }}
              </p>

              <div class="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  @click="feedbackModal.open = false"
                  class="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  :disabled="feedbackModal.saving || !feedbackForm.feedback"
                  class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <div v-if="feedbackModal.saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span v-else>Simpan Feedback</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: UPLOAD / SUBMIT LINK TUGAS -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="uploadLinkModal.open" class="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="uploadLinkModal.open = false" />
          
          <div class="relative w-full max-w-md bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <ArrowUpTrayIcon class="w-4 h-4 text-gray-700" />
                </div>
                <div>
                  <h2 class="text-base font-bold text-gray-900 leading-tight">Upload Link Tugas</h2>
                  <p class="text-xs text-gray-500 mt-0.5">{{ uploadLinkModal.submission?.users?.fullname || 'Siswa' }}</p>
                </div>
              </div>
              <button @click="uploadLinkModal.open = false" class="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer">
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <form @submit.prevent="submitLinkUploadForm" class="p-6 space-y-4 bg-gray-50">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-800 uppercase tracking-wider">Link Hasil Tugas <span class="text-rose-500">*</span></label>
                <input
                  v-model="uploadLinkForm.submission_url"
                  type="text"
                  required
                  placeholder="https://..."
                  class="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-800 uppercase tracking-wider">Catatan Tambahan</label>
                <textarea
                  v-model="uploadLinkForm.submission_notes"
                  rows="2"
                  class="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors resize-none"
                ></textarea>
              </div>

              <p v-if="uploadLinkModal.error" class="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                {{ uploadLinkModal.error }}
              </p>

              <div class="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  @click="uploadLinkModal.open = false"
                  class="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-bold hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  :disabled="uploadLinkModal.saving || !uploadLinkForm.submission_url"
                  class="px-5 py-2 rounded-lg bg-[#5530AB] hover:bg-[#43238A] text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <div v-if="uploadLinkModal.saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span v-else>Simpan Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: RIWAYAT TUGAS SISWA -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="studentDetailModal.open" class="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="studentDetailModal.open = false" />
          
          <div class="relative w-full max-w-2xl bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                  :style="{ background: getAvatarColor(studentDetailModal.student?.fullname || 'Student') }"
                >
                  {{ getInitials(studentDetailModal.student?.fullname || '?') }}
                </div>
                <div>
                  <h2 class="text-base font-bold text-gray-900 leading-tight">{{ studentDetailModal.student?.fullname }}</h2>
                  <p class="text-xs text-gray-500">@{{ studentDetailModal.student?.username }} • Riwayat Tugas</p>
                </div>
              </div>
              <button @click="studentDetailModal.open = false" class="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer">
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <div class="p-6 overflow-y-auto space-y-4 flex-1 bg-gray-50">
              <div v-if="studentDetailModal.submissions.length === 0" class="text-center py-10 text-gray-500 text-xs font-medium">
                Belum ada penugasan untuk siswa ini.
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="sub in studentDetailModal.submissions"
                  :key="sub.id"
                  class="p-4 rounded-xl border border-gray-200 bg-white"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <span
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.625rem] font-bold uppercase mb-1"
                        :class="getTypeBadgeClasses(sub.assignment?.type)"
                      >
                        {{ getTypeLabel(sub.assignment?.type) }}
                      </span>
                      <h4 class="text-sm font-bold text-gray-900">{{ sub.assignment?.title }}</h4>
                    </div>
                    <span
                      class="inline-flex items-center px-2 py-1 rounded text-[0.625rem] font-bold uppercase"
                      :class="getStatusBadgeClasses(sub.status)"
                    >
                      {{ getStatusLabel(sub.status) }}
                    </span>
                  </div>

                  <div v-if="sub.submission_url" class="flex items-center gap-2 mt-3">
                    <a
                      :href="sub.submission_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 text-xs text-[#5530AB] font-bold hover:underline"
                    >
                      <LinkIcon class="w-3.5 h-3.5" />
                      <span>Link Hasil Tugas</span>
                    </a>
                  </div>

                  <div v-if="sub.feedback || sub.grade !== null" class="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs mt-3">
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="font-bold text-gray-700">Feedback Mentor:</span>
                      <span v-if="sub.grade !== null" class="font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded">
                        Nilai: {{ sub.grade }}
                      </span>
                    </div>
                    <p class="text-gray-800 leading-relaxed">{{ sub.feedback }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import AdminSidebar from '~/components/AdminSidebar.vue'
import {
  Bars3Icon,
  PlusIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleBottomCenterTextIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  CodeBracketIcon,
  BriefcaseIcon,
  PencilSquareIcon,
  TrashIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  ChevronRightIcon,
  UsersIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  ArrowUpTrayIcon
} from '@heroicons/vue/24/outline'

useSeoMeta({
  title: 'Student Management & Penugasan — Admin Pixelnoid',
  description: 'Kelola tugas Quizizz, Praktek, Studi Kasus, pengumpulan link siswa, dan feedback mentor.'
})
definePageMeta({ layout: false })

// ── Types ──────────────────────────────────────────────────────────
interface StudentUser {
  id: string
  fullname: string | null
  username: string | null
  avatar_url?: string | null
}

interface StudentAssignmentRow {
  id: number
  assignment_id: number
  student_id: string
  status: 'pending' | 'submitted' | 'reviewed'
  submission_url?: string | null
  submission_notes?: string | null
  submitted_at?: string | null
  grade?: number | null
  feedback?: string | null
  feedback_by?: string | null
  feedback_at?: string | null
  users?: StudentUser | null
  assignment?: {
    id: number
    title: string
    type: string
    due_date?: string | null
  }
}

interface AssignmentItem {
  id: number
  title: string
  description?: string | null
  type: 'quizizz' | 'practice' | 'case_study'
  link_url?: string | null
  due_date?: string | null
  created_by?: string | null
  created_at: string
  student_assignments: StudentAssignmentRow[]
  stats?: {
    totalAssigned: number
    submittedCount: number
    pendingCount: number
    reviewedCount: number
    completionRate: number
  }
}

// ── State ──────────────────────────────────────────────────────────
const sidebarOpen = ref(false)
const activeTab = ref<'assignments' | 'students'>('assignments')
const searchQuery = ref('')
const filterType = ref('')

const assignments = ref<AssignmentItem[]>([])
const studentsList = ref<StudentUser[]>([])
const isLoadingAssignments = ref(true)
const isLoadingStudents = ref(true)

// ── Modals State ───────────────────────────────────────────────────
const assignmentModal = reactive({
  open: false,
  isEditing: false,
  editingId: null as number | null,
  saving: false,
  error: ''
})

const assignmentForm = reactive({
  title: '',
  description: '',
  type: 'practice' as 'quizizz' | 'practice' | 'case_study',
  link_url: '',
  due_date: '',
  student_ids: [] as string[]
})

const submissionsModal = reactive({
  open: false,
  assignment: null as AssignmentItem | null
})

const feedbackModal = reactive({
  open: false,
  submission: null as StudentAssignmentRow | null,
  saving: false,
  error: ''
})

const feedbackForm = reactive({
  grade: '' as number | string,
  feedback: ''
})

const uploadLinkModal = reactive({
  open: false,
  submission: null as StudentAssignmentRow | null,
  saving: false,
  error: ''
})

const uploadLinkForm = reactive({
  submission_url: '',
  submission_notes: ''
})

const studentDetailModal = reactive({
  open: false,
  student: null as any,
  submissions: [] as any[]
})

// ── Computed Metrics ───────────────────────────────────────────────
const totalSubmittedSubmissions = computed(() => {
  return assignments.value.reduce((acc, curr) => acc + (curr.stats?.submittedCount || 0), 0)
})

const totalPendingFeedback = computed(() => {
  let count = 0
  for (const a of assignments.value) {
    for (const sub of a.student_assignments || []) {
      if (sub.status === 'submitted') count++
    }
  }
  return count
})

const overallCompletionRate = computed(() => {
  const totalAssigned = assignments.value.reduce((acc, curr) => acc + (curr.stats?.totalAssigned || 0), 0)
  if (totalAssigned === 0) return 0
  return Math.round((totalSubmittedSubmissions.value / totalAssigned) * 100)
})

const filteredAssignments = computed(() => {
  let list = assignments.value
  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    list = list.filter(a => a.title.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q)))
  }
  if (filterType.value) {
    list = list.filter(a => a.type === filterType.value)
  }
  return list
})

const filteredStudentsSummary = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return studentsList.value
    .map(stu => {
      const subs: StudentAssignmentRow[] = []
      for (const a of assignments.value) {
        const found = (a.student_assignments || []).find(s => s.student_id === stu.id)
        if (found) {
          subs.push({
            ...found,
            assignment: {
              id: a.id,
              title: a.title,
              type: a.type,
              due_date: a.due_date
            }
          })
        }
      }

      const totalAssigned = subs.length
      const totalSubmitted = subs.filter(s => s.status === 'submitted' || s.status === 'reviewed').length
      const totalPending = subs.filter(s => s.status === 'pending').length
      
      const gradedSubs = subs.filter(s => s.grade !== null && s.grade !== undefined)
      const averageGrade = gradedSubs.length > 0
        ? Math.round(gradedSubs.reduce((acc, curr) => acc + Number(curr.grade || 0), 0) / gradedSubs.length)
        : null

      return {
        ...stu,
        totalAssigned,
        totalSubmitted,
        totalPending,
        averageGrade,
        submissions: subs
      }
    })
    .filter(stu => {
      if (!q) return true
      return (stu.fullname && stu.fullname.toLowerCase().includes(q)) ||
             (stu.username && stu.username.toLowerCase().includes(q))
    })
})

// ── Data Fetching ──────────────────────────────────────────────────
async function fetchAssignments() {
  isLoadingAssignments.value = true
  try {
    const res = await $fetch<{ assignments: AssignmentItem[] }>('/api/admin/assignments')
    assignments.value = res.assignments || []
    if (submissionsModal.assignment) {
      const refreshed = assignments.value.find(a => a.id === submissionsModal.assignment!.id)
      if (refreshed) submissionsModal.assignment = refreshed
    }
  } catch (err: any) {
    console.error('[fetchAssignments]', err?.data?.statusMessage || err?.message || err)
  } finally {
    isLoadingAssignments.value = false
  }
}

async function fetchStudents() {
  isLoadingStudents.value = true
  try {
    const res = await $fetch<{ students: StudentUser[] }>('/api/admin/students')
    studentsList.value = res.students || []
  } catch (err: any) {
    console.error('[fetchStudents]', err?.data?.statusMessage || err?.message || err)
  } finally {
    isLoadingStudents.value = false
  }
}

onMounted(() => {
  fetchAssignments()
  fetchStudents()
})

// ── Modal Actions: Assignment ──────────────────────────────────────
function openAddAssignmentModal() {
  assignmentModal.isEditing = false
  assignmentModal.editingId = null
  assignmentModal.error = ''
  assignmentForm.title = ''
  assignmentForm.description = ''
  assignmentForm.type = 'practice'
  assignmentForm.link_url = ''
  assignmentForm.due_date = ''
  assignmentForm.student_ids = studentsList.value.map(s => s.id)
  assignmentModal.open = true
}

function openEditAssignmentModal(item: AssignmentItem) {
  assignmentModal.isEditing = true
  assignmentModal.editingId = item.id
  assignmentModal.error = ''
  assignmentForm.title = item.title
  assignmentForm.description = item.description || ''
  assignmentForm.type = item.type
  assignmentForm.link_url = item.link_url || ''
  assignmentForm.due_date = item.due_date ? new Date(item.due_date).toISOString().slice(0, 16) : ''
  assignmentForm.student_ids = (item.student_assignments || []).map(s => s.student_id)
  assignmentModal.open = true
}

function toggleSelectAllStudents() {
  if (assignmentForm.student_ids.length === studentsList.value.length) {
    assignmentForm.student_ids = []
  } else {
    assignmentForm.student_ids = studentsList.value.map(s => s.id)
  }
}

function toggleStudentSelection(id: string) {
  const idx = assignmentForm.student_ids.indexOf(id)
  if (idx > -1) {
    assignmentForm.student_ids.splice(idx, 1)
  } else {
    assignmentForm.student_ids.push(id)
  }
}

async function submitAssignmentForm() {
  if (!assignmentForm.title.trim()) {
    assignmentModal.error = 'Judul tugas wajib diisi.'
    return
  }
  if (assignmentForm.student_ids.length === 0) {
    assignmentModal.error = 'Pilih minimal satu siswa untuk di-assign tugas.'
    return
  }
  assignmentModal.saving = true
  assignmentModal.error = ''

  try {
    const payload = {
      title: assignmentForm.title,
      description: assignmentForm.description,
      type: assignmentForm.type,
      link_url: assignmentForm.link_url,
      due_date: assignmentForm.due_date ? new Date(assignmentForm.due_date).toISOString() : null,
      student_ids: assignmentForm.student_ids
    }

    if (assignmentModal.isEditing && assignmentModal.editingId) {
      await $fetch(`/api/admin/assignments/${assignmentModal.editingId}`, { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/admin/assignments', { method: 'POST', body: payload })
    }

    assignmentModal.open = false
    await fetchAssignments()
  } catch (err: any) {
    assignmentModal.error = err?.data?.statusMessage || err?.message || 'Gagal menyimpan tugas.'
  } finally {
    assignmentModal.saving = false
  }
}

async function deleteAssignment(item: AssignmentItem) {
  if (!confirm(`Hapus tugas "${item.title}" beserta seluruh data pengumpulan siswa?`)) return
  try {
    await $fetch(`/api/admin/assignments/${item.id}`, { method: 'DELETE' })
    await fetchAssignments()
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Gagal menghapus tugas.')
  }
}

// ── Submissions & Feedback Actions ─────────────────────────────────
function openSubmissionsModal(item: AssignmentItem) {
  submissionsModal.assignment = item
  submissionsModal.open = true
}

function openFeedbackModal(sub: StudentAssignmentRow) {
  feedbackModal.submission = sub
  feedbackModal.error = ''
  feedbackForm.grade = sub.grade !== null && sub.grade !== undefined ? sub.grade : ''
  feedbackForm.feedback = sub.feedback || ''
  feedbackModal.open = true
}

async function submitFeedbackForm() {
  if (!feedbackModal.submission) return
  feedbackModal.saving = true
  feedbackModal.error = ''
  try {
    await $fetch('/api/admin/assignments/feedback', {
      method: 'POST',
      body: {
        student_assignment_id: feedbackModal.submission.id,
        grade: feedbackForm.grade !== '' ? feedbackForm.grade : null,
        feedback: feedbackForm.feedback.trim(),
        status: 'reviewed'
      }
    })
    feedbackModal.open = false
    feedbackModal.submission = null
    await fetchAssignments()
  } catch (err: any) {
    feedbackModal.error = err?.data?.statusMessage || err?.message || 'Gagal menyimpan feedback.'
  } finally {
    feedbackModal.saving = false
  }
}

function openUploadLinkModal(sub: StudentAssignmentRow) {
  uploadLinkModal.submission = sub
  uploadLinkModal.error = ''
  uploadLinkForm.submission_url = sub.submission_url || ''
  uploadLinkForm.submission_notes = sub.submission_notes || ''
  uploadLinkModal.open = true
}

async function submitLinkUploadForm() {
  if (!uploadLinkModal.submission || !uploadLinkForm.submission_url.trim()) return
  uploadLinkModal.saving = true
  uploadLinkModal.error = ''
  try {
    await $fetch('/api/admin/assignments/submit-link', {
      method: 'POST',
      body: {
        student_assignment_id: uploadLinkModal.submission.id,
        submission_url: uploadLinkForm.submission_url.trim(),
        submission_notes: uploadLinkForm.submission_notes.trim()
      }
    })
    uploadLinkModal.open = false
    uploadLinkModal.submission = null
    await fetchAssignments()
  } catch (err: any) {
    uploadLinkModal.error = err?.data?.statusMessage || err?.message || 'Gagal upload link tugas.'
  } finally {
    uploadLinkModal.saving = false
  }
}

function openStudentDetailModal(stuSummary: any) {
  studentDetailModal.student = { ...stuSummary }
  studentDetailModal.submissions = stuSummary.submissions ? [...stuSummary.submissions] : []
  studentDetailModal.open = true
}

// ── Helpers ────────────────────────────────────────────────────────
function getTypeLabel(type?: string) {
  switch (type) {
    case 'quizizz': return 'Quizizz'
    case 'practice': return 'Praktek'
    case 'case_study': return 'Studi Kasus'
    default: return 'Tugas'
  }
}

function getTypeIcon(type?: string) {
  switch (type) {
    case 'quizizz': return SparklesIcon
    case 'practice': return CodeBracketIcon
    case 'case_study': return BriefcaseIcon
    default: return DocumentTextIcon
  }
}

function getTypeBadgeClasses(type?: string) {
  switch (type) {
    case 'quizizz': return 'bg-[#5530AB]/10 text-[#5530AB]'
    case 'practice': return 'bg-sky-100 text-sky-700'
    case 'case_study': return 'bg-gray-800 text-white'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'pending': return 'Belum Upload'
    case 'submitted': return 'Sudah Upload'
    case 'reviewed': return 'Sudah Dinilai'
    default: return status
  }
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case 'pending': return 'bg-rose-100 text-rose-700'
    case 'submitted': return 'bg-emerald-100 text-emerald-700'
    case 'reviewed': return 'bg-[#5530AB]/10 text-[#5530AB]'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function isOverdue(dateStr?: string | null) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function formatDueDate(iso?: string | null) {
  if (!iso) return 'Tidak ada deadline'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDateOnly(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function getInitials(name: string) {
  if (!name || name.includes('@')) return name?.[0]?.toUpperCase() || '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0][0].toUpperCase()
}

const AVATAR_COLORS = ['#5530AB', '#111827', '#2563EB', '#059669', '#D97706', '#E11D48', '#0891B2']
function getAvatarColor(name: string) {
  let hash = 0
  for (const c of name || '') hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
</script>