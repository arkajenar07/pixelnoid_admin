<template>
  <div class="video-editor space-y-6 max-w-[800px] mx-auto pb-12">
    <!-- Header -->
    <div class="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
          <FilmIcon class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-blue-950">Video Lesson Editor</h3>
          <p class="text-xs text-blue-700">Sematkan video pembelajaran (YouTube, Vimeo, MP4) dan kelola catatan ringkasan materi.</p>
        </div>
      </div>
    </div>

    <!-- Video URL & Settings -->
    <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
      <h4 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <VideoCameraIcon class="w-4 h-4 text-blue-500" />
        <span>Sumber Video</span>
      </h4>

      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">URL Video Pembelajaran *</label>
        <input
          v-model="internalUrl"
          type="url"
          placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
          class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all bg-white"
          @input="emitChanges"
        />
        <p class="text-[0.7rem] text-gray-400 mt-1">Mendukung tautan YouTube, Vimeo, atau link file video mp4 langsung.</p>
      </div>

      <!-- Live Player Preview -->
      <div class="pt-2">
        <label class="block text-xs font-medium text-gray-700 mb-2">Live Player Preview</label>
        <div v-if="embedUrl" class="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-md border border-gray-200">
          <iframe
            :src="embedUrl"
            class="w-full h-full"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          />
        </div>
        <div v-else class="w-full aspect-video rounded-2xl bg-gray-100 border border-dashed border-gray-300 flex flex-col items-center justify-center text-center p-6">
          <div class="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center mb-3">
            <PlayCircleIcon class="w-8 h-8 text-gray-400" />
          </div>
          <p class="text-xs font-medium text-gray-600">Belum ada video yang disematkan</p>
          <p class="text-[0.7rem] text-gray-400 mt-1">Masukkan URL video yang valid di atas untuk melihat pratinjau player.</p>
        </div>
      </div>
    </div>

    <!-- Video Description & Summary Notes -->
    <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-3 shadow-sm">
      <h4 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <DocumentTextIcon class="w-4 h-4 text-blue-500" />
        <span>Ringkasan & Catatan Video</span>
      </h4>

      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Deskripsi / Poin Penting Materi Video</label>
        <textarea
          v-model="description"
          rows="5"
          placeholder="Tuliskan poin-poin penting, rangkuman, atau petunjuk yang wajib disimak siswa dari video di atas..."
          class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all leading-relaxed"
          @input="emitChanges"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { FilmIcon, VideoCameraIcon, PlayCircleIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  videoUrl?: string
  modelValue?: any
}>()

const emit = defineEmits<{
  (e: 'update:videoUrl', url: string): void
  (e: 'update:modelValue', val: any): void
}>()

const internalUrl = ref(props.videoUrl || '')
const description = ref('')

watch(
  () => props.videoUrl,
  (newUrl) => { internalUrl.value = newUrl || '' }
)

watch(
  () => props.modelValue,
  (val) => {
    if (typeof val === 'string') {
      description.value = val
    } else if (Array.isArray(val) && val[0]?.content) {
      description.value = val[0].content
    } else if (val && typeof val === 'object' && val.description) {
      description.value = val.description
    } else {
      description.value = ''
    }
  },
  { immediate: true }
)

const embedUrl = computed(() => {
  const url = internalUrl.value.trim()
  if (!url) return ''

  // YouTube Watch URL: youtube.com/watch?v=xxxx
  const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(ytRegExp)

  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`
  }

  // Vimeo URL: vimeo.com/xxxx
  const vimeoRegExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/
  const vimeoMatch = url.match(vimeoRegExp)
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}`
  }

  // Direct MP4 or standard URL
  return url
})

function emitChanges() {
  emit('update:videoUrl', internalUrl.value)
  emit('update:modelValue', [
    { id: 'video_desc', type: 'paragraph', content: description.value }
  ])
}
</script>
