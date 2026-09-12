<template>
  <div class="quiz-editor space-y-6 max-w-[800px] mx-auto pb-12">
    <!-- Header info -->
    <div class="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
          <QuestionMarkCircleIcon class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-amber-950">Quiz Builder</h3>
          <p class="text-xs text-amber-700">Kelola soal pilihan ganda, kunci jawaban, dan pembahasan untuk lesson ini.</p>
        </div>
      </div>
      <span class="px-3 py-1 bg-amber-200/60 text-amber-900 font-bold text-xs rounded-full shrink-0">
        {{ questions.length }} Soal
      </span>
    </div>

    <!-- Question Cards List -->
    <div class="space-y-4">
      <div
        v-for="(q, qIndex) in questions"
        :key="q.id || qIndex"
        class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 transition-all hover:border-amber-300"
      >
        <!-- Question Header -->
        <div class="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
              {{ qIndex + 1 }}
            </span>
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pertanyaan Soal</span>
          </div>

          <div class="flex items-center gap-1">
            <button
              type="button"
              @click="moveUp(qIndex)"
              :disabled="qIndex === 0"
              class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
              title="Geser Atas"
            >
              <ArrowUpIcon class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click="moveDown(qIndex)"
              :disabled="qIndex === questions.length - 1"
              class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
              title="Geser Bawah"
            >
              <ArrowDownIcon class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click="duplicateQuestion(qIndex)"
              class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              title="Duplikat Soal"
            >
              <DocumentDuplicateIcon class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click="removeQuestion(qIndex)"
              class="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors"
              title="Hapus Soal"
            >
              <TrashIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Question Title Input -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Teks Pertanyaan / Soal *</label>
          <textarea
            v-model="q.question"
            rows="2"
            placeholder="Tuliskan pertanyaan kuis di sini..."
            class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
            @input="emitChange"
          />
        </div>

        <!-- Options A/B/C/D -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-xs font-medium text-gray-700">Pilihan Jawaban (Pilih lingkaran untuk jawaban benar) *</label>
            <button
              type="button"
              @click="addOption(q)"
              class="text-[0.7rem] text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 transition-colors"
            >
              <PlusIcon class="w-3 h-3" />
              Tambah Opsi
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-for="(opt, optIndex) in q.options"
              :key="optIndex"
              class="flex items-center gap-2.5 p-2 rounded-xl border transition-all"
              :class="q.correct_answer === optIndex ? 'border-emerald-500/60 bg-emerald-50/40 ring-1 ring-emerald-500/20' : 'border-gray-200 bg-gray-50/50'"
            >
              <!-- Radio Button to mark Correct Answer -->
              <input
                type="radio"
                :name="'correct-ans-' + qIndex"
                :checked="q.correct_answer === optIndex"
                @change="setCorrectAnswer(q, optIndex)"
                class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                title="Tandai sebagai jawaban benar"
              />

              <span class="w-6 text-center font-bold text-xs text-gray-500 select-none">
                {{ String.fromCharCode(65 + optIndex) }}.
              </span>

              <input
                v-model="q.options[optIndex]"
                type="text"
                :placeholder="'Opsi ' + String.fromCharCode(65 + optIndex)"
                class="flex-1 bg-transparent text-sm text-gray-800 outline-none"
                @input="emitChange"
              />

              <span v-if="q.correct_answer === optIndex" class="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[0.65rem] font-bold uppercase tracking-wider select-none">
                <CheckCircleIcon class="w-3 h-3" />
                Benar
              </span>

              <button
                v-if="q.options.length > 2"
                type="button"
                @click="removeOption(q, optIndex)"
                class="p-1 rounded text-gray-400 hover:text-rose-500 transition-colors"
                title="Hapus Opsi"
              >
                <XMarkIcon class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Explanation Input -->
        <div class="pt-2 border-t border-gray-100">
          <label class="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
            <LightBulbIcon class="w-3.5 h-3.5 text-amber-400" />
            Pembahasan / Penjelasan Jawaban (Opsional)
          </label>
          <textarea
            v-model="q.explanation"
            rows="2"
            placeholder="Tuliskan penjelasan mengapa jawaban tersebut benar..."
            class="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 bg-gray-50/50 outline-none focus:border-amber-500 focus:bg-white transition-all"
            @input="emitChange"
          />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="questions.length === 0" class="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
      <div class="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
        <QuestionMarkCircleIcon class="w-6 h-6 text-amber-400" />
      </div>
      <p class="text-sm font-medium text-gray-600 mb-1">Belum ada soal kuis</p>
      <p class="text-xs text-gray-400 mb-4">Klik tombol di bawah untuk membuat soal kuis pertama.</p>
    </div>

    <!-- Add Question Button -->
    <div class="flex justify-center">
      <button
        type="button"
        @click="addQuestion"
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-all shadow-sm hover:shadow-amber-500/20"
      >
        <PlusIcon class="w-4 h-4" />
        <span>Tambah Soal Kuis</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  QuestionMarkCircleIcon, ArrowUpIcon, ArrowDownIcon,
  DocumentDuplicateIcon, TrashIcon, PlusIcon,
  CheckCircleIcon, XMarkIcon, LightBulbIcon,
} from '@heroicons/vue/24/outline'

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: number
  explanation?: string
}

const props = defineProps<{
  modelValue: QuizQuestion[] | any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: QuizQuestion[]): void
}>()

const questions = ref<QuizQuestion[]>([])

function generateId(): string {
  return 'q_' + Math.random().toString(36).substring(2, 9)
}

watch(
  () => props.modelValue,
  (val) => {
    if (Array.isArray(val) && val.length > 0) {
      questions.value = val.map(q => ({
        id: q.id || generateId(),
        question: q.question || '',
        options: Array.isArray(q.options) && q.options.length > 0 ? [...q.options] : ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
        correct_answer: typeof q.correct_answer === 'number' ? q.correct_answer : 0,
        explanation: q.explanation || '',
      }))
    } else {
      questions.value = [
        {
          id: generateId(),
          question: '',
          options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
          correct_answer: 0,
          explanation: '',
        },
      ]
    }
  },
  { immediate: true, deep: true }
)

function emitChange() {
  emit('update:modelValue', questions.value)
}

function addQuestion() {
  questions.value.push({
    id: generateId(),
    question: '',
    options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
    correct_answer: 0,
    explanation: '',
  })
  emitChange()
}

function removeQuestion(index: number) {
  questions.value.splice(index, 1)
  emitChange()
}

function duplicateQuestion(index: number) {
  const target = questions.value[index]
  const copy: QuizQuestion = {
    ...target,
    id: generateId(),
    options: [...target.options],
  }
  questions.value.splice(index + 1, 0, copy)
  emitChange()
}

function setCorrectAnswer(q: QuizQuestion, optIndex: number) {
  q.correct_answer = optIndex
  emitChange()
}

function addOption(q: QuizQuestion) {
  if (q.options.length < 8) {
    q.options.push(`Opsi ${String.fromCharCode(65 + q.options.length)}`)
    emitChange()
  }
}

function removeOption(q: QuizQuestion, optIndex: number) {
  if (q.options.length > 2) {
    q.options.splice(optIndex, 1)
    if (q.correct_answer >= q.options.length) {
      q.correct_answer = q.options.length - 1
    }
    emitChange()
  }
}

function moveUp(index: number) {
  if (index <= 0) return
  const temp = questions.value[index]
  questions.value[index] = questions.value[index - 1]
  questions.value[index - 1] = temp
  emitChange()
}

function moveDown(index: number) {
  if (index >= questions.value.length - 1) return
  const temp = questions.value[index]
  questions.value[index] = questions.value[index + 1]
  questions.value[index + 1] = temp
  emitChange()
}
</script>
