<template>
  <div class="task-editor space-y-6 max-w-[800px] mx-auto pb-12">
    <!-- Header -->
    <div class="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xl shadow-sm shrink-0">
          📋
        </div>
        <div>
          <h3 class="text-sm font-semibold text-purple-950">Task & Project Assignment</h3>
          <p class="text-xs text-purple-700">Buat instruksi penugasan praktikum/proyek dan kriteria pengumpulan bagi siswa.</p>
        </div>
      </div>
    </div>

    <!-- Task Config Form -->
    <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
      <h4 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <span>⚙️</span>
        <span>Pengaturan Tugas</span>
      </h4>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Format Pengumpulan Siswa</label>
          <select
            v-model="taskForm.submission_type"
            class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-purple-500 bg-white cursor-pointer"
            @change="emitChanges"
          >
            <option value="url">🔗 Tautan / URL (Github, Figma, Website)</option>
            <option value="file">📁 Upload File (ZIP, PDF, Gambar)</option>
            <option value="text">✍️ Jawaban Teks Langsung</option>
            <option value="any">🌐 Bebas (URL / File / Teks)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Bobot Nilai Maksimal</label>
          <input
            v-model.number="taskForm.max_score"
            type="number"
            min="0"
            max="1000"
            placeholder="100"
            class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-purple-500 bg-white"
            @input="emitChanges"
          />
        </div>
      </div>
    </div>

    <!-- Instructions & Details -->
    <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-3 shadow-sm">
      <h4 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <span>📑</span>
        <span>Instruksi Tugas & Rubrik</span>
      </h4>

      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Detail Petunjuk Pengerjaan *</label>
        <textarea
          v-model="taskForm.instructions"
          rows="6"
          placeholder="Tuliskan petunjuk tugas secara detail, kebutuhan fitur/spesifikasi, dan kriteria penilaian..."
          class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all leading-relaxed"
          @input="emitChanges"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

const props = defineProps<{
  modelValue?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: any): void
}>()

const taskForm = reactive({
  instructions: '',
  submission_type: 'url',
  max_score: 100,
})

watch(
  () => props.modelValue,
  (val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      taskForm.instructions = val.instructions || ''
      taskForm.submission_type = val.submission_type || 'url'
      taskForm.max_score = typeof val.max_score === 'number' ? val.max_score : 100
    } else if (Array.isArray(val) && val[0]?.content) {
      taskForm.instructions = val[0].content
    } else if (typeof val === 'string') {
      taskForm.instructions = val
    }
  },
  { immediate: true }
)

function emitChanges() {
  emit('update:modelValue', {
    instructions: taskForm.instructions,
    submission_type: taskForm.submission_type,
    max_score: taskForm.max_score,
  })
}
</script>
