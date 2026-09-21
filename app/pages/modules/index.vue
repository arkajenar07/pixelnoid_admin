<template>
  <div class="flex min-h-screen bg-gray-50 text-gray-900 antialiased overflow-x-hidden font-sans">
    <AdminSidebar :open="sidebarOpen" @update:open="sidebarOpen = $event" />

    <div class="flex-1 w-full min-w-0 lg:ml-[260px] flex flex-col">
      <!-- Topbar -->
      <header class="sticky top-0 z-[100] flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200">
        <div class="flex items-center gap-4">
          <button class="lg:hidden p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors" @click="sidebarOpen = !sidebarOpen">
            <Bars3Icon class="w-5 h-5" />
          </button>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#F4F1FA] text-[#5530AB]">
                <BookOpenIcon class="w-3 h-3" />
                Module Management
              </span>
            </div>
            <h1 class="text-base font-semibold text-gray-900">Kelola Modul & Lesson</h1>
          </div>
        </div>
        <button
          @click="openCreateModuleModal"
          class="flex items-center gap-2 px-4 py-2 rounded-md bg-[#5530AB] hover:bg-[#432687] text-white text-sm font-medium transition-colors"
        >
          <PlusIcon class="w-4 h-4" />
          Buat Modul
        </button>
      </header>

      <main class="p-6 space-y-5 max-w-[900px] mx-auto w-full">

        <!-- Class Selector -->
        <div class="flex items-center gap-4 bg-white p-4 rounded-md border border-gray-200">
          <label class="text-sm font-semibold text-gray-700">Pilih Kelas:</label>
          <select v-model="selectedClassId" class="flex-1 h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors bg-white cursor-pointer">
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex items-center justify-center py-20">
          <div class="w-8 h-8 border-2 border-gray-200 border-t-[#5530AB] rounded-full animate-spin" />
        </div>

        <!-- Empty -->
        <div v-else-if="modules.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
          <div class="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
            <BookOpenIcon class="w-7 h-7" />
          </div>
          <h3 class="text-base font-semibold text-gray-800 mb-1">Belum ada modul</h3>
          <p class="text-sm text-gray-500 mb-4">Buat modul pertama untuk mulai mengisi konten lesson.</p>
          <button @click="openCreateModuleModal" class="px-5 py-2.5 bg-[#5530AB] text-white rounded-md text-sm font-medium hover:bg-[#432687] transition-colors">
            Buat Modul Pertama
          </button>
        </div>

        <!-- Module Cards with Smooth TransitionGroup -->
        <TransitionGroup v-else name="module-list" tag="div" class="space-y-4 pb-24">
          <div
            v-for="(mod, mIndex) in modules"
            :key="mod.id"
            class="bg-white rounded-md border transition-all duration-200 ease-out"
            :class="[
              dragOverModuleIndex === mIndex ? 'border-[#5530AB] ring-1 ring-[#5530AB] bg-[#F4F1FA]' : 'border-gray-200',
              draggedModuleIndex === mIndex ? 'opacity-40 border-dashed border-[#5530AB]' : ''
            ]"
            :draggable="true"
            @dragstart="onModuleDragStart($event, mIndex)"
            @dragover.prevent="onModuleDragOver($event, mIndex)"
            @dragleave="onModuleDragLeave($event, mIndex)"
            @drop="onModuleDrop($event, mIndex)"
            @dragend="onModuleDragEnd"
          >
            <!-- Module Header -->
            <div class="flex items-center gap-3 p-4">
              <!-- Drag Handle & Order Badge -->
              <div class="flex items-center gap-2 shrink-0">
                <div
                  class="cursor-grab active:cursor-grabbing p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  title="Tarik untuk memindahkan urutan modul"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                  </svg>
                </div>
                <span class="w-6 h-6 rounded-md bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
                  {{ mIndex + 1 }}
                </span>
              </div>

              <!-- Collapsible Toggle Button -->
              <button
                class="w-7 h-7 rounded-md bg-gray-50 hover:bg-[#F4F1FA] flex items-center justify-center text-gray-400 hover:text-[#5530AB] transition-colors shrink-0"
                @click="toggleModule(mod.id)"
              >
                <ChevronRightIcon
                  class="w-4 h-4 transition-transform duration-200"
                  :class="expandedModules.has(mod.id) ? 'rotate-90' : ''"
                />
              </button>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-semibold text-gray-900 truncate">{{ mod.title }}</h3>
                  <span
                    class="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    :class="mod.is_published ? 'bg-[#5530AB]/10 text-[#5530AB]' : 'bg-gray-100 text-gray-500'"
                  >
                    {{ mod.is_published ? 'Published' : 'Draft' }}
                  </span>
                  <span class="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                    <SparklesIcon class="w-3 h-3 text-amber-500" />
                    {{ getModuleTotalXp(mod) }} XP
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-1">{{ mod.module_lessons?.length ?? 0 }} lesson · Class ID: {{ mod.class_id }}</p>
              </div>

              <!-- Actions & Quick Up/Down -->
              <div class="flex items-center gap-2 shrink-0">
                <!-- Move Up / Down Buttons -->
                <div class="flex items-center bg-gray-50 rounded-md p-0.5 border border-gray-200">
                  <button
                    type="button"
                    @click.stop="moveModuleUp(mIndex)"
                    :disabled="mIndex === 0"
                    class="p-1 rounded-sm text-gray-500 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-30 transition-colors"
                    title="Geser ke Atas"
                  >
                    <ArrowUpIcon class="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    @click.stop="moveModuleDown(mIndex)"
                    :disabled="mIndex === modules.length - 1"
                    class="p-1 rounded-sm text-gray-500 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-30 transition-colors"
                    title="Geser ke Bawah"
                  >
                    <ArrowDownIcon class="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  @click="openAddLessonModal(mod)"
                  class="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-[#F4F1FA] hover:text-[#5530AB] text-gray-700 text-xs font-medium transition-colors"
                >
                  <PlusIcon class="w-3.5 h-3.5" />
                  Lesson
                </button>
                <button
                  @click="openEditModuleModal(mod)"
                  class="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <PencilIcon class="w-4 h-4" />
                </button>
                <button
                  @click="deleteModule(mod)"
                  class="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Lessons list (collapsible) -->
            <Transition name="collapse">
              <div v-if="expandedModules.has(mod.id)" class="border-t border-gray-200">
                <div v-if="!mod.module_lessons?.length" class="px-5 py-4 text-sm text-gray-500 italic bg-gray-50">
                  Belum ada lesson di modul ini.
                </div>
                <TransitionGroup name="lesson-list" tag="div">
                  <div
                    v-for="(lesson, lIndex) in (mod.module_lessons || [])"
                    :key="lesson.id"
                    class="flex items-center gap-4 px-5 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 group/lesson transition-colors"
                  >
                    <!-- Lesson Number & Move Buttons -->
                    <div class="flex items-center gap-2">
                      <span class="w-5 text-right text-xs font-bold text-gray-400">
                        {{ lIndex + 1 }}.
                      </span>
                      <div class="flex flex-col gap-0.5 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                        <button
                          type="button"
                          @click.stop="moveLessonUp(mod, lIndex)"
                          :disabled="lIndex === 0"
                          class="p-0.5 rounded text-gray-400 hover:text-gray-900 disabled:opacity-30"
                          title="Geser Lesson ke Atas"
                        >
                          <ArrowUpIcon class="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          @click.stop="moveLessonDown(mod, lIndex)"
                          :disabled="lIndex === (mod.module_lessons?.length || 0) - 1"
                          class="p-0.5 rounded text-gray-400 hover:text-gray-900 disabled:opacity-30"
                          title="Geser Lesson ke Bawah"
                        >
                          <ArrowDownIcon class="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div class="w-6 h-6 rounded flex items-center justify-center shrink-0"
                      :class="lessonTypeColor(lesson.type)">
                      <component :is="lessonTypeIcon(lesson.type)" class="w-3.5 h-3.5" />
                    </div>

                    <!-- Lesson Title & Info (Inline Editable) -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center">
                        <input
                          v-model="lesson.title"
                          type="text"
                          placeholder="Judul Lesson"
                          @change="onLessonTitleChange(mod, lesson)"
                          @keydown.enter="($event.target as HTMLElement).blur()"
                          class="text-sm font-semibold text-gray-800 bg-transparent hover:bg-white focus:bg-white px-2 py-0.5 -ml-2 rounded border border-transparent hover:border-gray-300 focus:border-[#5530AB] outline-none w-full transition-colors"
                          title="Klik untuk mengubah nama lesson"
                        />
                      </div>
                      <p class="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 px-0.5">
                        <span class="uppercase tracking-wider font-medium">{{ lesson.type }}</span>
                        <span>· order: {{ lIndex + 1 }}</span>
                        <span v-if="lesson.content?.length" class="text-[#5530AB]">· {{ lesson.content.length }} blok</span>
                        <span v-if="lesson.saving" class="text-gray-400 flex items-center gap-1 ml-2">
                          <span class="w-2.5 h-2.5 border-2 border-[#5530AB] border-t-transparent rounded-full animate-spin" />
                          Menyimpan...
                        </span>
                        <span v-else-if="lesson.saveSuccess" class="text-[#5530AB] font-medium flex items-center gap-1 ml-2">
                          <CheckIcon class="w-3 h-3 text-[#5530AB]" />
                          Tersimpan
                        </span>
                      </p>
                    </div>

                    <!-- XP Reward Input -->
                    <div class="flex items-center gap-2 shrink-0 bg-amber-50 rounded px-2 py-1">
                      <span class="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                        <SparklesIcon class="w-3.5 h-3.5 text-amber-500" />
                        XP
                      </span>
                      <input
                        v-model.number="lesson.xp_reward"
                        type="number"
                        min="0"
                        placeholder="0"
                        @change="onLessonXpChange(mod, lesson)"
                        @keydown.enter="($event.target as HTMLElement).blur()"
                        class="w-14 text-center font-bold text-gray-800 bg-white border border-amber-200 rounded py-0.5 px-1 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                        title="Ubah XP Reward untuk lesson ini"
                      />
                    </div>

                    <div class="flex items-center gap-1.5 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                      <NuxtLink
                        :to="`/modules/${lesson.id}/edit`"
                        class="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors"
                      >
                        <PencilSquareIcon class="w-3.5 h-3.5" />
                        Edit Konten
                      </NuxtLink>
                      <button
                        @click="deleteLesson(lesson, mod)"
                        class="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </TransitionGroup>

                <!-- Module Lessons Summary Footer -->
                <div v-if="mod.module_lessons?.length" class="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <span>Total: <strong class="text-gray-800">{{ mod.module_lessons.length }}</strong> lesson</span>
                  <div class="flex items-center gap-1.5 font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded">
                    <SparklesIcon class="w-3.5 h-3.5 text-amber-600" />
                    <span>Total XP Modul: {{ getModuleTotalXp(mod) }} XP</span>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </TransitionGroup>

        <!-- Floating Save Changes Bar -->
        <Transition name="slide-up">
          <div
            v-if="hasOrderChanges"
            class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-4 px-6 py-3 rounded-md bg-gray-900 text-white shadow-lg border border-gray-800 max-w-xl w-[90%]"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full bg-[#5530AB] animate-pulse shrink-0" />
              <p class="text-xs font-medium truncate">Urutan modul telah diubah. Simpan perubahan ke database?</p>
            </div>

            <div class="flex items-center gap-2 pl-4 border-l border-gray-700 shrink-0">
              <button
                type="button"
                @click="cancelOrderChanges"
                :disabled="savingOrder"
                class="px-3 py-1.5 rounded-md text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                @click="saveOrderChanges"
                :disabled="savingOrder"
                class="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#5530AB] hover:bg-[#432687] text-white text-xs font-semibold transition-colors disabled:opacity-60"
              >
                <div v-if="savingOrder" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{{ savingOrder ? 'Menyimpan...' : 'Simpan Perubahan' }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </main>
    </div>

    <!-- ═══════════════ Modal: Create/Edit Module ═══════════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="moduleModal.open" class="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gray-900/50" @click="moduleModal.open = false" />
          <div class="relative w-full max-w-lg bg-white rounded-md shadow-xl overflow-hidden border border-gray-200">
            <!-- Modal header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wider">
                {{ moduleModal.mode === 'create' ? 'Buat Modul Baru' : 'Edit Modul' }}
              </h2>
              <button @click="moduleModal.open = false" class="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 transition-colors">
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>
            <!-- Modal body -->
            <form @submit.prevent="saveModule" class="p-6 space-y-4">
              <div>
                <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 block">Judul Modul *</label>
                <input v-model="moduleForm.title" type="text" placeholder="Contoh: Dasar-dasar HTML" required
                  class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors" />
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 block">Kelas *</label>
                <select v-model.number="moduleForm.class_id" required
                  class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] transition-colors bg-white cursor-pointer">
                  <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 block">Deskripsi</label>
                <textarea v-model="moduleForm.description" rows="3" placeholder="Deskripsi singkat modul..."
                  class="w-full px-3 py-2 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors resize-none" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 block">Urutan</label>
                  <input v-model.number="moduleForm.sort_order" type="number" min="0"
                    class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 block">Total XP</label>
                  <div class="w-full h-10 px-3 rounded-md bg-gray-100 border border-gray-300 text-sm font-semibold text-amber-700 flex items-center gap-1.5">
                    <SparklesIcon class="w-4 h-4 text-amber-600" />
                    {{ moduleModal.mode === 'edit' ? (moduleForm.xp_reward || 0) : 0 }} XP
                  </div>
                  <p class="text-[10px] text-gray-500 mt-1">Dihitung dari akumulasi lesson</p>
                </div>
              </div>
              <div class="flex items-center gap-4 pt-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="moduleForm.is_published" type="checkbox" class="w-4 h-4 rounded border-gray-300 text-[#5530AB] focus:ring-[#5530AB]" />
                  <span class="text-sm font-medium text-gray-700">Published</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="moduleForm.is_locked_default" type="checkbox" class="w-4 h-4 rounded border-gray-300 text-[#5530AB] focus:ring-[#5530AB]" />
                  <span class="text-sm font-medium text-gray-700">Locked by default</span>
                </label>
              </div>
              <!-- Actions -->
              <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" @click="moduleModal.open = false"
                  class="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  Batal
                </button>
                <button type="submit" :disabled="moduleModal.saving"
                  class="px-5 py-2 rounded-md bg-[#5530AB] hover:bg-[#432687] text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-2">
                  <div v-if="moduleModal.saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {{ moduleModal.mode === 'create' ? 'Buat Modul' : 'Simpan Perubahan' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ═══════════════ Modal: Add Lesson ═══════════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="lessonModal.open" class="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gray-900/50" @click="lessonModal.open = false" />
          <div class="relative w-full max-w-md bg-white rounded-md shadow-xl overflow-hidden border border-gray-200">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Tambah Lesson Baru</h2>
              <button @click="lessonModal.open = false" class="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 transition-colors">
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>
            <form @submit.prevent="saveLesson" class="p-6 space-y-4">
              <div>
                <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 block">Judul Lesson *</label>
                <input v-model="lessonForm.title" type="text" placeholder="Contoh: Pengenalan Tag HTML" required
                  class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors" />
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 block">Tipe</label>
                <select v-model="lessonForm.type"
                  class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] transition-colors bg-white cursor-pointer">
                  <option value="text">Text</option>
                  <option value="video">Video</option>
                  <option value="quiz">Quiz</option>
                </select>
              </div>
              <div v-if="lessonForm.type === 'video'">
                <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 block">URL Video</label>
                <input v-model="lessonForm.video_url" type="url" placeholder="https://youtube.com/..."
                  class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 block">Urutan</label>
                  <input v-model.number="lessonForm.sort_order" type="number" min="0"
                    class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 block">XP Reward</label>
                  <input v-model.number="lessonForm.xp_reward" type="number" min="0" placeholder="0"
                    class="w-full h-10 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors" />
                </div>
              </div>
              <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" @click="lessonModal.open = false"
                  class="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Batal</button>
                <button type="submit" :disabled="lessonModal.saving"
                  class="px-5 py-2 rounded-md bg-[#5530AB] hover:bg-[#432687] text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-2">
                  <div v-if="lessonModal.saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Tambah Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import AdminSidebar from '~/components/AdminSidebar.vue'
import {
  Bars3Icon, PlusIcon, BookOpenIcon, ChevronRightIcon,
  PencilIcon, PencilSquareIcon, TrashIcon, XMarkIcon,
  VideoCameraIcon, DocumentTextIcon, QuestionMarkCircleIcon, ClipboardDocumentListIcon,
  ArrowUpIcon, ArrowDownIcon, SparklesIcon, CheckIcon
} from '@heroicons/vue/24/outline'

useSeoMeta({ title: 'Module Management — Admin Panel' })
definePageMeta({ layout: false })

const sidebarOpen = ref(false)

// ── Data ────────────────────────────────────────────────────────
interface Lesson {
  id: number
  title: string
  slug: string
  type: string
  video_url: string | null
  sort_order: number
  xp_reward: number
  content: unknown[]
  saving?: boolean
  saveSuccess?: boolean
}

interface Module {
  id: number
  title: string
  slug: string
  description: string
  class_id: number
  is_published: boolean
  is_locked_default: boolean
  sort_order: number
  xp_reward: number
  module_lessons: Lesson[]
}

interface CourseClass {
  id: number
  name: string
}

const classes = ref<CourseClass[]>([])
const selectedClassId = ref<number | null>(null)

const modules = ref<Module[]>([])
const isLoading = ref(true)
const expandedModules = ref(new Set<number>())

// ── Reorder State ───────────────────────────────────────────────
const draggedModuleIndex = ref<number | null>(null)
const dragOverModuleIndex = ref<number | null>(null)
const hasOrderChanges = ref(false)
const savingOrder = ref(false)

async function fetchClasses() {
  try {
    const data = await $fetch<{ classes: CourseClass[] }>('/api/admin/classes')
    classes.value = data.classes
    if (classes.value.length > 0) {
      selectedClassId.value = classes.value[0].id
    }
  } catch (e) {
    console.error('Error fetching classes:', e)
  }
}

async function fetchModules() {
  if (!selectedClassId.value) return
  isLoading.value = true
  try {
    const data = await $fetch<{ modules: Module[] }>('/api/admin/modules', {
      query: { class_id: selectedClassId.value }
    })
    modules.value = data.modules
    hasOrderChanges.value = false
  } catch (e) {
    console.error('Error fetching modules:', e)
  } finally {
    isLoading.value = false
  }
}

watch(selectedClassId, () => {
  fetchModules()
})

onMounted(async () => {
  await fetchClasses()
})

function toggleModule(id: number) {
  if (expandedModules.value.has(id)) {
    expandedModules.value.delete(id)
  } else {
    expandedModules.value.add(id)
  }
}

// ── Drag & Drop Handlers ────────────────────────────────────────
function onModuleDragStart(e: DragEvent, index: number) {
  draggedModuleIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }
}

function onModuleDragOver(e: DragEvent, index: number) {
  dragOverModuleIndex.value = index
}

function onModuleDragLeave(e: DragEvent, index: number) {
  if (dragOverModuleIndex.value === index) {
    dragOverModuleIndex.value = null
  }
}

function onModuleDrop(e: DragEvent, targetIndex: number) {
  if (draggedModuleIndex.value !== null && draggedModuleIndex.value !== targetIndex) {
    const moved = modules.value.splice(draggedModuleIndex.value, 1)[0]
    modules.value.splice(targetIndex, 0, moved)
    hasOrderChanges.value = true
  }
  draggedModuleIndex.value = null
  dragOverModuleIndex.value = null
}

function onModuleDragEnd() {
  draggedModuleIndex.value = null
  dragOverModuleIndex.value = null
}

function moveModuleUp(index: number) {
  if (index <= 0) return
  const temp = modules.value[index]
  modules.value[index] = modules.value[index - 1]
  modules.value[index - 1] = temp
  hasOrderChanges.value = true
}

function moveModuleDown(index: number) {
  if (index >= modules.value.length - 1) return
  const temp = modules.value[index]
  modules.value[index] = modules.value[index + 1]
  modules.value[index + 1] = temp
  hasOrderChanges.value = true
}

function moveLessonUp(mod: Module, index: number) {
  if (!mod.module_lessons || index <= 0) return
  const temp = mod.module_lessons[index]
  mod.module_lessons[index] = mod.module_lessons[index - 1]
  mod.module_lessons[index - 1] = temp
  hasOrderChanges.value = true
}

function moveLessonDown(mod: Module, index: number) {
  if (!mod.module_lessons || index >= mod.module_lessons.length - 1) return
  const temp = mod.module_lessons[index]
  mod.module_lessons[index] = mod.module_lessons[index + 1]
  mod.module_lessons[index + 1] = temp
  hasOrderChanges.value = true
}

async function saveOrderChanges() {
  savingOrder.value = true
  try {
    const modulePayload = modules.value.map((m, idx) => ({
      id: m.id,
      sort_order: idx + 1,
    }))
    const lessonPayload = modules.value.flatMap(m =>
      (m.module_lessons || []).map((l, idx) => ({
        id: l.id,
        sort_order: idx + 1,
      }))
    )

    await $fetch('/api/admin/modules/reorder', {
      method: 'POST',
      body: { modules: modulePayload, lessons: lessonPayload },
    })

    hasOrderChanges.value = false
    await fetchModules()
  } catch (e) {
    console.error('Gagal menyimpan urutan:', e)
    alert('Gagal menyimpan urutan modul. Silakan coba lagi.')
  } finally {
    savingOrder.value = false
  }
}

async function cancelOrderChanges() {
  hasOrderChanges.value = false
  await fetchModules()
}

// ── Lesson type helpers ─────────────────────────────────────────
function lessonTypeIcon(type: string) {
  const map: Record<string, unknown> = {
    video: VideoCameraIcon,
    text: DocumentTextIcon,
    quiz: QuestionMarkCircleIcon,
    task: ClipboardDocumentListIcon,
  }
  return map[type] || DocumentTextIcon
}

function lessonTypeColor(type: string) {
  const map: Record<string, string> = {
    video: 'bg-rose-100 text-rose-700',
    text: 'bg-emerald-100 text-emerald-700',
    quiz: 'bg-amber-100 text-amber-700',
    task: 'bg-blue-100 text-blue-700',
  }
  return map[type] || 'bg-gray-200 text-gray-700'
}

// ── Module Modal ────────────────────────────────────────────────
const moduleModal = reactive({ open: false, mode: 'create' as 'create' | 'edit', editId: null as number | null, saving: false })
const moduleForm = reactive({
  title: '', description: '', class_id: 1,
  sort_order: 0, xp_reward: 0, estimated_minutes: 0,
  is_published: false, is_locked_default: false,
})

function openCreateModuleModal() {
  Object.assign(moduleForm, {
    title: '', description: '', class_id: selectedClassId.value || 1,
    sort_order: modules.value.length + 1, xp_reward: 0,
    is_published: false, is_locked_default: false
  })
  moduleModal.mode = 'create'
  moduleModal.editId = null
  moduleModal.open = true
}

function openEditModuleModal(mod: Module) {
  Object.assign(moduleForm, {
    title: mod.title, description: mod.description, class_id: mod.class_id,
    sort_order: mod.sort_order, xp_reward: mod.xp_reward,
    is_published: mod.is_published, is_locked_default: mod.is_locked_default,
  })
  moduleModal.mode = 'edit'
  moduleModal.editId = mod.id
  moduleModal.open = true
}

async function saveModule() {
  moduleModal.saving = true
  try {
    if (moduleModal.mode === 'create') {
      await $fetch('/api/admin/modules', { method: 'POST', body: { ...moduleForm } })
    } else {
      await $fetch(`/api/admin/modules/${moduleModal.editId}`, { method: 'PUT', body: { ...moduleForm } })
    }
    moduleModal.open = false
    await fetchModules()
  } catch (e) {
    console.error('Error saving module:', e)
  } finally {
    moduleModal.saving = false
  }
}

async function deleteModule(mod: Module) {
  if (!confirm(`Hapus modul "${mod.title}" beserta semua lesson-nya?`)) return
  await $fetch(`/api/admin/modules/${mod.id}`, { method: 'DELETE' })
  await fetchModules()
}

// ── Module & Lesson XP Helpers ─────────────────────────────────
function getModuleTotalXp(mod: Module): number {
  if (!mod.module_lessons || mod.module_lessons.length === 0) {
    return mod.xp_reward || 0
  }
  return mod.module_lessons.reduce((sum, l) => sum + (Number(l.xp_reward) || 0), 0)
}

async function onLessonTitleChange(mod: Module, lesson: Lesson) {
  if (!lesson.title?.trim()) return
  await saveLessonInline(mod, lesson)
}

async function onLessonXpChange(mod: Module, lesson: Lesson) {
  // Update local module xp_reward immediately for snappy UI
  mod.xp_reward = getModuleTotalXp(mod)
  await saveLessonInline(mod, lesson)
}

async function saveLessonInline(mod: Module, lesson: Lesson) {
  lesson.saving = true
  try {
    const res = await $fetch<{ lesson: Lesson, module_total_xp?: number }>(`/api/admin/lessons/${lesson.id}`, {
      method: 'PUT',
      body: {
        title: lesson.title,
        xp_reward: Number(lesson.xp_reward) || 0,
      }
    })
    if (res.module_total_xp !== undefined && res.module_total_xp !== null) {
      mod.xp_reward = res.module_total_xp
    } else {
      mod.xp_reward = getModuleTotalXp(mod)
    }
    lesson.saveSuccess = true
    setTimeout(() => {
      lesson.saveSuccess = false
    }, 2000)
  } catch (e) {
    console.error('Gagal mengupdate lesson inline:', e)
  } finally {
    lesson.saving = false
  }
}

// ── Lesson Modal ────────────────────────────────────────────────
const lessonModal = reactive({ open: false, moduleId: null as number | null, saving: false })
const lessonForm = reactive({ title: '', type: 'text', video_url: '', sort_order: 0, xp_reward: 0 })

function openAddLessonModal(mod: Module) {
  Object.assign(lessonForm, {
    title: '',
    type: 'text',
    video_url: '',
    sort_order: (mod.module_lessons?.length ?? 0) + 1,
    xp_reward: 0
  })
  lessonModal.moduleId = mod.id
  lessonModal.open = true
}

async function saveLesson() {
  lessonModal.saving = true
  try {
    await $fetch('/api/admin/lessons', { method: 'POST', body: { ...lessonForm, module_id: lessonModal.moduleId } })
    lessonModal.open = false
    await fetchModules()
    // Auto-expand the module that got a new lesson
    if (lessonModal.moduleId) expandedModules.value.add(lessonModal.moduleId)
  } catch (e) {
    console.error('Error saving lesson:', e)
  } finally {
    lessonModal.saving = false
  }
}

async function deleteLesson(lesson: Lesson, mod: Module) {
  if (!confirm(`Hapus lesson "${lesson.title}"?`)) return
  await $fetch(`/api/admin/lessons/${lesson.id}`, { method: 'DELETE' })
  await fetchModules()
  expandedModules.value.add(mod.id)
}
</script>

<style scoped>
.collapse-enter-active, .collapse-leave-active {
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.3, 1);
  overflow: hidden;
}
.collapse-enter-from, .collapse-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-6px);
}
.collapse-enter-to, .collapse-leave-from {
  opacity: 1;
  max-height: 600px;
  transform: translateY(0);
}

/* ── Smooth FLIP Reordering Animations ── */
.module-list-move {
  transition: transform 0.3s ease;
}
.module-list-enter-active,
.module-list-leave-active {
  transition: all 0.25s ease;
}
.module-list-enter-from,
.module-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.lesson-list-move {
  transition: transform 0.25s ease;
}
.lesson-list-enter-active,
.lesson-list-leave-active {
  transition: all 0.2s ease;
}
.lesson-list-enter-from,
.lesson-list-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

/* ── Smooth Modal & Slide Up ── */
.modal-enter-active, .modal-leave-active { transition: all 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
.slide-up-enter-to, .slide-up-leave-from {
  opacity: 1;
  transform: translate(-50%, 0);
}
</style>