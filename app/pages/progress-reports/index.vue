<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import {
  Bars3Icon,
  SparklesIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  PrinterIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  AcademicCapIcon,
  UserIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  CheckBadgeIcon,
  ArrowDownTrayIcon,
  FolderArrowDownIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/outline'

// State Sidebar Mobile
const sidebarOpen = ref(false)

// Tabs tampilan hasil: 'visual' | 'history'
const activeResultTab = ref<'visual' | 'history'>('visual')

// Status generate AI
const isGenerating = ref(false)
const generationStep = ref('Memulai proses...')
const copyToast = ref<string | null>(null)
const saveStatus = ref<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' })

// Riwayat laporan tersimpan
const savedReports = ref<any[]>([])
const loadingSavedReports = ref(false)

// Daftar siswa dari database untuk autocomplete
const studentsList = ref<{ id: string; fullname: string; username: string }[]>([])

// State Form Mentor
const form = reactive({
  student: {
    name: '',
    program: '',
    mentor: '',
    period: ''
  },
  attendance: {
    total_sessions: 4,
    attended: 4,
    excused: 0,
    absent: 0
  },
  modules: [
    {
      name: '',
      score: 85,
      strengths: [] as string[],
      improvements: [] as string[],
      strengthInput: '',
      improvementInput: ''
    }
  ],
  period_observation: {
    strengths: [] as string[],
    progress: [] as string[],
    challenges: [] as string[],
    next_focus: [] as string[],
    additional_comment: '',
    strengthInput: '',
    progressInput: '',
    challengeInput: '',
    focusInput: ''
  }
})

// Suggested keywords untuk kemudahan mentor
const suggestionPills = {
  moduleStrengths: [
    'memahami konsep dasar',
    'implementasi tepat',
    'struktur data baik',
    'integrasi fitur lancar',
    'logika terstruktur',
    'inisiatif tinggi'
  ],
  moduleImprovements: [
    'error handling',
    'testing & validasi',
    'kerapian struktur kode',
    'modularisasi fungsi',
    'kecepatan eksekusi',
    'penamaan variabel'
  ],
  periodStrengths: [
    'cepat memahami materi baru',
    'mampu menerapkan konsep',
    'logika pemrograman cukup terstruktur',
    'aktif bertanya',
    'fokus saat pembelajaran'
  ],
  periodProgress: [
    'lebih mandiri dalam problem solving',
    'mampu mengintegrasikan beberapa fitur',
    'penulisan sintaks lebih rapi',
    'percaya diri mengerjakan tugas'
  ],
  periodChallenges: [
    'penanganan skenario error',
    'pengujian program (testing)',
    'struktur kode modular',
    'manajemen waktu pengerjaan'
  ],
  periodFocus: [
    'modularisasi fungsi',
    'debugging mandiri',
    'latihan testing menyeluruh',
    'best practice penulisan kode'
  ]
}

// Hasil report dari AI
const reportResult = ref<{
  student_info?: { name: string; program: string; mentor: string; period: string }
  attendance?: { total_sessions: number; attended: number; excused: number; absent: number }
  module_reports?: Array<{
    name: string
    score: number
    notes: { study_notes: string; performance: string }
  }>
  competencies?: Array<{
    description: string
    level: string
  }>
  teacher_notes?: {
    development: string
    evaluation: string
    recommendation: string
  }
  human_readable_text?: string
} | null>(null)

// Hitung persentase kehadiran
const attendanceRate = computed(() => {
  const total = Number(form.attendance.total_sessions) || 0
  const attended = Number(form.attendance.attended) || 0
  if (total === 0) return 100
  return Math.round((attended / total) * 100)
})

// Helper Tag Input
const addTag = (list: string[], inputRef: { value: string }) => {
  const trimmed = inputRef.value.trim().replace(/^,+|,+$/g, '')
  if (trimmed && !list.includes(trimmed)) {
    list.push(trimmed)
  }
  inputRef.value = ''
}

const removeTag = (list: string[], index: number) => {
  list.splice(index, 1)
}

const addSuggestion = (list: string[], text: string) => {
  if (!list.includes(text)) {
    list.push(text)
  }
}

// Tambah & Hapus Modul
const addModule = () => {
  form.modules.push({
    name: '',
    score: 80,
    strengths: [],
    improvements: [],
    strengthInput: '',
    improvementInput: ''
  })
}

const removeModule = (index: number) => {
  if (form.modules.length > 1) {
    form.modules.splice(index, 1)
  }
}

// Muat Contoh Data dari README
const loadSampleData = () => {
  form.student.name = 'Jibril Shaquille Abrisam'
  form.student.program = 'Python Programming'
  form.student.mentor = 'Arka Jenar Ma’arif'
  form.student.period = 'Juli 2025'

  form.attendance.total_sessions = 4
  form.attendance.attended = 4
  form.attendance.excused = 0
  form.attendance.absent = 0

  form.modules = [
    {
      name: 'Python Final Project - Table Relation System',
      score: 90,
      strengths: ['memahami konsep relasi data', 'implementasi tepat', 'struktur data baik'],
      improvements: [],
      strengthInput: '',
      improvementInput: ''
    },
    {
      name: 'Python Final Project - Final Application System',
      score: 80,
      strengths: ['integrasi fitur', 'memahami alur program', 'implementasi cukup baik'],
      improvements: ['error handling', 'testing', 'struktur kode'],
      strengthInput: '',
      improvementInput: ''
    }
  ]

  form.period_observation.strengths = [
    'cepat memahami materi',
    'mampu menerapkan konsep',
    'logika pemrograman cukup terstruktur'
  ]
  form.period_observation.progress = [
    'lebih mandiri',
    'mampu mengintegrasikan beberapa fitur'
  ]
  form.period_observation.challenges = [
    'error handling',
    'testing',
    'struktur kode'
  ]
  form.period_observation.next_focus = [
    'modularisasi',
    'debugging',
    'testing'
  ]
  form.period_observation.additional_comment = ''

  showToast('Contoh data dari README berhasil dimuat!')
}

// Reset Form
const resetForm = () => {
  form.student.name = ''
  form.student.program = ''
  form.student.mentor = ''
  form.student.period = ''

  form.attendance.total_sessions = 4
  form.attendance.attended = 4
  form.attendance.excused = 0
  form.attendance.absent = 0

  form.modules = [
    {
      name: '',
      score: 85,
      strengths: [],
      improvements: [],
      strengthInput: '',
      improvementInput: ''
    }
  ]

  form.period_observation.strengths = []
  form.period_observation.progress = []
  form.period_observation.challenges = []
  form.period_observation.next_focus = []
  form.period_observation.additional_comment = ''

  reportResult.value = null
  showToast('Form telah dikosongkan.')
}

// Toast Notifikasi Sederhana
const showToast = (msg: string) => {
  copyToast.value = msg
  setTimeout(() => {
    if (copyToast.value === msg) {
      copyToast.value = null
    }
  }, 3500)
}

// Salin ke Clipboard
const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast(`${label} berhasil disalin ke clipboard!`)
  } catch {
    showToast('Gagal menyalin ke clipboard.')
  }
}

// Generate Laporan via Gemini AI
const generateReport = async () => {
  if (!form.student.name.trim()) {
    showToast('Harap isi nama siswa terlebih dahulu.')
    return
  }
  if (!form.student.program.trim()) {
    showToast('Harap isi nama program terlebih dahulu.')
    return
  }
  if (form.modules.length === 0 || !form.modules[0].name.trim()) {
    showToast('Harap isi minimal satu modul pelajaran.')
    return
  }

  isGenerating.value = true
  generationStep.value = 'Menghubungkan ke Gemini AI...'

  const steps = [
    'Menganalisis modul dan keyword mentor...',
    'Menyusun narasi objektif capaian siswa...',
    'Memetakan tingkat kompetensi...',
    'Memvalidasi format laporan Pixelnoid...'
  ]

  let stepIdx = 0
  const interval = setInterval(() => {
    if (stepIdx < steps.length) {
      generationStep.value = steps[stepIdx]
      stepIdx++
    }
  }, 1200)

  try {
    const payload = {
      student: {
        name: form.student.name.trim(),
        program: form.student.program.trim(),
        mentor: form.student.mentor.trim() || 'Mentor Pixelnoid',
        period: form.student.period.trim() || 'Periode Berjalan'
      },
      attendance: {
        total_sessions: Number(form.attendance.total_sessions) || 0,
        attended: Number(form.attendance.attended) || 0,
        excused: Number(form.attendance.excused) || 0,
        absent: Number(form.attendance.absent) || 0
      },
      modules: form.modules.map(m => ({
        name: m.name.trim(),
        score: Number(m.score) || 0,
        strengths: m.strengths,
        improvements: m.improvements
      })),
      period_observation: {
        strengths: form.period_observation.strengths,
        progress: form.period_observation.progress,
        challenges: form.period_observation.challenges,
        next_focus: form.period_observation.next_focus,
        additional_comment: form.period_observation.additional_comment.trim()
      }
    }

    const response = await $fetch<{ success: boolean; data: any }>('/api/admin/progress-reports/generate', {
      method: 'POST',
      body: payload
    })

    if (response?.data) {
      reportResult.value = response.data
      activeResultTab.value = 'visual'
      showToast('Laporan perkembangan siswa berhasil dibuat!')
      const el = document.getElementById('report-results-view')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  } catch (err: any) {
    console.error('Generation error:', err)
    showToast(err.data?.statusMessage || err.message || 'Gagal menghasilkan laporan.')
  } finally {
    clearInterval(interval)
    isGenerating.value = false
  }
}

// State PDF Export
const isDownloadingPdf = ref(false)

// Dynamic loader helper untuk html2pdf.js agar kompatibel dengan Nuxt & SSR
let html2pdfInstance: any = null
const getHtml2Pdf = async () => {
  if (!import.meta.client) return null
  if (html2pdfInstance) return html2pdfInstance

  try {
    const mod = await import('html2pdf.js')
    html2pdfInstance = mod.default || mod
    return html2pdfInstance
  } catch (e) {
    console.warn('Dynamic import html2pdf.js failed, loading CDN fallback...', e)
  }

  return new Promise((resolve, reject) => {
    if ((window as any).html2pdf) {
      html2pdfInstance = (window as any).html2pdf
      return resolve(html2pdfInstance)
    }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    script.onload = () => {
      html2pdfInstance = (window as any).html2pdf
      resolve(html2pdfInstance)
    }
    script.onerror = (err) => reject(err)
    document.head.appendChild(script)
  })
}

// Download Laporan sebagai file PDF langsung ke komputer / HP
const downloadPdf = async () => {
  if (!reportResult.value || !import.meta.client) return

  isDownloadingPdf.value = true
  showToast('Sedang menyiapkan dokumen PDF...')

  try {
    if (activeResultTab.value !== 'visual') {
      activeResultTab.value = 'visual'
      await nextTick()
    }

    const element = document.getElementById('printable-report-card')
    if (!element) {
      throw new Error('Elemen dokumen tidak ditemukan.')
    }

    const rawStudent = form.student.name || reportResult.value.student_info?.name || 'Siswa'
    const rawPeriod = form.student.period || reportResult.value.student_info?.period || 'Periode'
    const safeStudent = rawStudent.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
    const safePeriod = rawPeriod.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
    const fileName = `Laporan_Perkembangan_${safeStudent}_${safePeriod}.pdf`

    const html2pdf = await getHtml2Pdf()
    if (!html2pdf) {
      throw new Error('Library PDF generator tidak dapat dimuat.')
    }

    const opt = {
      margin: [10, 10, 10, 10], // mm
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy']
      }
    }

    await html2pdf().set(opt).from(element).save()
    showToast(`Dokumen ${fileName} berhasil diunduh!`)
  } catch (err: any) {
    console.error('PDF download error:', err)
    showToast(`Gagal generate PDF langsung: ${err.message || 'Error'}. Mengalihkan ke cetak browser...`)
    setTimeout(() => {
      window.print()
    }, 800)
  } finally {
    isDownloadingPdf.value = false
  }
}

// Download PDF langsung dari item riwayat tersimpan
const downloadSavedReportPdf = async (item: any) => {
  loadSavedReportToView(item)
  await nextTick()
  setTimeout(() => {
    downloadPdf()
  }, 300)
}

// Modal Setup SQL & Status Sinkronisasi
const showSqlSetupModal = ref(false)
const tableExists = ref(true)
const isSyncing = ref(false)
const copiedSql = ref(false)

const LOCAL_STORAGE_KEY = 'pixelnoid_progress_reports_v1'

const sqlScriptContent = `-- ==============================================================================
-- PIXELNOID LMS - STUDENT PROGRESS REPORTS SCHEMA
-- ==============================================================================

-- 1. Helper function updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Tabel Utama: public.student_progress_reports
CREATE TABLE IF NOT EXISTS public.student_progress_reports (
    id BIGSERIAL PRIMARY KEY,
    student_name VARCHAR(255) NOT NULL,
    student_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    mentor_name VARCHAR(255) NOT NULL,
    mentor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    program VARCHAR(255) NOT NULL,
    period VARCHAR(100) NOT NULL,
    input_data JSONB NOT NULL,
    generated_report JSONB NOT NULL,
    human_readable_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexing untuk kecepatan pencarian
CREATE INDEX IF NOT EXISTS idx_progress_reports_student_name ON public.student_progress_reports(student_name);
CREATE INDEX IF NOT EXISTS idx_progress_reports_period ON public.student_progress_reports(period);
CREATE INDEX IF NOT EXISTS idx_progress_reports_created_at ON public.student_progress_reports(created_at DESC);

-- 4. Trigger auto updated_at
DROP TRIGGER IF EXISTS trg_progress_reports_updated_at ON public.student_progress_reports;
CREATE TRIGGER trg_progress_reports_updated_at
    BEFORE UPDATE ON public.student_progress_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.student_progress_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin & Mentor full access on student_progress_reports" ON public.student_progress_reports;
CREATE POLICY "Admin & Mentor full access on student_progress_reports"
    ON public.student_progress_reports FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND (u.roles @> ARRAY['admin']::text[] OR u.roles @> ARRAY['mentor']::text[])
        )
    );

DROP POLICY IF EXISTS "Students can view their own progress reports" ON public.student_progress_reports;
CREATE POLICY "Students can view their own progress reports"
    ON public.student_progress_reports FOR SELECT TO authenticated
    USING (student_id = auth.uid());`

const copySqlScript = async () => {
  try {
    await navigator.clipboard.writeText(sqlScriptContent)
    copiedSql.value = true
    showToast('Script SQL berhasil disalin ke clipboard!')
    setTimeout(() => { copiedSql.value = false }, 3000)
  } catch {
    showToast('Gagal menyalin SQL ke clipboard.')
  }
}

// Helpers Local Storage
const getLocalReports = (): any[] => {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveLocalReports = (list: any[]) => {
  if (!import.meta.client) return
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

const deleteLocalReport = (id: string | number) => {
  const localList = getLocalReports().filter(item => item.id !== id)
  saveLocalReports(localList)
  fetchSavedReports()
  showToast('Laporan lokal telah dihapus.')
}

const hasUnsyncedLocalReports = computed(() => {
  return savedReports.value.some(r => r.isLocalOnly)
})

// Simpan Laporan ke Database Supabase & Fallback Local Storage
const isSaving = ref(false)
const saveToDatabase = async () => {
  if (!reportResult.value) return

  isSaving.value = true
  saveStatus.value = { type: '', message: '' }

  const studentName = form.student.name || reportResult.value.student_info?.name || 'Siswa'
  const mentorName = form.student.mentor || reportResult.value.student_info?.mentor || ''
  const program = form.student.program || reportResult.value.student_info?.program || ''
  const period = form.student.period || reportResult.value.student_info?.period || ''

  const localItem = {
    id: `local_${Date.now()}`,
    student_name: studentName,
    mentor_name: mentorName,
    program: program,
    period: period,
    input_data: {
      student: form.student,
      attendance: form.attendance,
      modules: form.modules,
      period_observation: form.period_observation
    },
    generated_report: reportResult.value,
    human_readable_text: reportResult.value.human_readable_text,
    created_at: new Date().toISOString(),
    isLocalOnly: true
  }

  const localList = getLocalReports()
  localList.unshift(localItem)
  saveLocalReports(localList)

  try {
    const payload = {
      student_name: studentName,
      mentor_name: mentorName,
      program: program,
      period: period,
      input_data: localItem.input_data,
      generated_report: localItem.generated_report,
      human_readable_text: localItem.human_readable_text
    }

    await $fetch('/api/admin/progress-reports/save', {
      method: 'POST',
      body: payload
    })

    localItem.isLocalOnly = false
    saveLocalReports(localList)

    saveStatus.value = { type: 'success', message: 'Laporan berhasil disimpan ke database Supabase!' }
    showToast('Laporan berhasil disimpan ke Supabase!')
    tableExists.value = true
    await fetchSavedReports()
  } catch (err: any) {
    const isMissingTable = err.data?.data?.isMissingTable ||
      (err.data?.statusMessage && err.data.statusMessage.includes('student_progress_reports')) ||
      (err.message && err.message.includes('student_progress_reports'))

    if (isMissingTable) {
      tableExists.value = false
      saveStatus.value = {
        type: 'error',
        message: 'Laporan telah diamankan di Penyimpanan Lokal. Tabel Supabase belum dibuat, silakan jalankan file SQL.'
      }
      showToast('Tersimpan di Lokal! Setup tabel Supabase diperlukan.')
      showSqlSetupModal.value = true
    } else {
      saveStatus.value = {
        type: 'error',
        message: err.data?.statusMessage || err.message || 'Gagal menyimpan ke database Supabase.'
      }
      showToast('Tersimpan di Penyimpanan Lokal.')
    }
    await fetchSavedReports()
  } finally {
    isSaving.value = false
  }
}

// Ambil Riwayat Laporan (Gabungan Supabase + Penyimpanan Lokal)
const fetchSavedReports = async () => {
  loadingSavedReports.value = true
  try {
    const localReports = getLocalReports()
    let cloudReports: any[] = []

    try {
      const res = await $fetch<{ reports: any[]; tableExists?: boolean; isMissingTable?: boolean }>('/api/admin/progress-reports')
      cloudReports = (res?.reports || []).map(r => ({ ...r, isLocalOnly: false }))
      if (res?.tableExists !== undefined) {
        tableExists.value = res.tableExists
      }
    } catch {
      tableExists.value = false
    }

    const combined = [...cloudReports]
    for (const loc of localReports) {
      if (loc.isLocalOnly) {
        const existsInCloud = cloudReports.some(
          c => c.student_name === loc.student_name && c.period === loc.period && Math.abs(new Date(c.created_at).getTime() - new Date(loc.created_at).getTime()) < 5000
        )
        if (!existsInCloud) {
          combined.push(loc)
        }
      }
    }

    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    savedReports.value = combined
  } catch (e) {
    console.error('Fetch saved reports error:', e)
  } finally {
    loadingSavedReports.value = false
  }
}

// Sinkronkan Laporan Lokal yang Belum Tersimpan ke Cloud
const syncPendingReports = async () => {
  if (isSyncing.value) return
  isSyncing.value = true
  showToast('Menyinkronkan data ke Supabase...')

  const localList = getLocalReports()
  const unsynced = localList.filter(item => item.isLocalOnly)

  if (unsynced.length === 0) {
    await fetchSavedReports()
    showToast('Semua laporan sudah tersimpan di cloud!')
    isSyncing.value = false
    showSqlSetupModal.value = false
    return
  }

  let successCount = 0
  let failed = false

  for (const item of unsynced) {
    try {
      await $fetch('/api/admin/progress-reports/save', {
        method: 'POST',
        body: {
          student_name: item.student_name,
          mentor_name: item.mentor_name,
          program: item.program,
          period: item.period,
          input_data: item.input_data,
          generated_report: item.generated_report,
          human_readable_text: item.human_readable_text
        }
      })
      item.isLocalOnly = false
      successCount++
    } catch (err: any) {
      console.error('Sync item failed:', err)
      failed = true
      break
    }
  }

  saveLocalReports(localList)
  await fetchSavedReports()
  isSyncing.value = false

  if (successCount > 0 && !failed) {
    showToast(`${successCount} laporan berhasil disinkronkan ke Supabase!`)
    showSqlSetupModal.value = false
  } else if (failed) {
    showToast('Tabel Supabase belum ditemukan. Pastikan file SQL sudah dijalankan di Supabase.')
    showSqlSetupModal.value = true
  }
}

// Load Laporan Tersimpan ke View
const loadSavedReportToView = (item: any) => {
  if (item.generated_report) {
    reportResult.value = item.generated_report
    activeResultTab.value = 'visual'
    showToast(`Memuat laporan: ${item.student_name} (${item.period})`)
  }
}

// Cetak Laporan (Print Dialog Browser)
const printReport = () => {
  window.print()
}

// Fetch data siswa untuk autocomplete
const fetchStudents = async () => {
  try {
    const res = await $fetch<{ students: any[] }>('/api/admin/students')
    if (res?.students) {
      studentsList.value = res.students
    }
  } catch {
    // optional fail silently
  }
}

// Warna Nilai Score Badge
const getScoreBadgeClass = (score: number) => {
  if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (score >= 70) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-red-700 bg-red-50 border-red-200'
}

onMounted(() => {
  fetchStudents()
  fetchSavedReports()
})
</script>

<template>
  <div class="flex min-h-screen bg-gray-50 text-gray-900 antialiased font-sans">
    <AdminSidebar :open="sidebarOpen" @update:open="sidebarOpen = $event" />

    <div class="flex-1 w-full min-w-0 lg:ml-[260px] pb-16">
      <!-- Toast Notification -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform -translate-y-2 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-2 opacity-0"
      >
        <div
          v-if="copyToast"
          class="fixed top-5 right-5 z-[200] flex items-center gap-2.5 px-4 py-3 bg-[#121212] text-white text-sm border border-gray-800 pointer-events-auto"
        >
          <CheckCircleIcon class="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{{ copyToast }}</span>
        </div>
      </transition>

      <!-- Sticky Top Header (Hidden on Print) -->
      <header class="sticky top-0 z-[100] flex w-full items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200 print:hidden">
        <div class="flex items-center gap-4">
          <button
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-gray-200 text-gray-500 hover:text-[#5530AB] transition-colors lg:hidden"
            @click="sidebarOpen = !sidebarOpen"
          >
            <Bars3Icon class="w-5 h-5" />
          </button>
          <div class="flex flex-col gap-4">
            <h1 class="text-base font-bold text-gray-900 leading-none">Student Progress Report Generator</h1>
            <div class="flex items-center gap-2 mb-0.5">
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#5530AB]/20 bg-[#5530AB]/5 text-[0.6875rem] font-semibold text-[#5530AB]">
                <SparklesIcon class="w-3.5 h-3.5" />
                AI Powered
              </span>
              <span class="text-xs text-gray-400">•</span>
              <span class="text-xs text-gray-500">Gemini 3.6 Flash</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="loadSampleData"
            class="flex items-center gap-1.5 px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Muat contoh data dari README untuk pengujian cepat"
          >
            <SparklesIcon class="w-4 h-4 text-gray-500" />
            <span class="hidden sm:inline">Muat Contoh Data</span>
            <span class="sm:hidden">Contoh</span>
          </button>

          <button
            @click="resetForm"
            class="flex items-center gap-1.5 px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Bersihkan formulir"
          >
            <ArrowPathIcon class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      <!-- Main Content Container -->
      <main class="p-6 space-y-6 max-w-[1600px] mx-auto">
        <!-- Intro ringkas -->
        <div class="bg-white border border-gray-200 px-5 py-4 print:hidden">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 bg-gray-50 flex items-center justify-center shrink-0 border border-gray-200">
              <DocumentChartBarIcon class="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-gray-900">Laporan Perkembangan Siswa</h2>
              <p class="text-xs text-gray-500 mt-1 leading-relaxed max-w-2xl">
                Isi data faktual: absensi, nilai modul, dan keyword observasi. AI akan menyusunnya menjadi laporan naratif yang objektif, terstruktur, dan siap dibagikan kepada siswa maupun wali murid.
              </p>
            </div>
          </div>
        </div>

        <!-- Layout Grid: Form (Kiri) & Hasil Laporan (Kanan) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          <!-- ================= KOLOM KIRI: FORMULIR INPUT MENTOR ================= -->
          <div class="lg:col-span-5 space-y-6 print:hidden sticky top-24">

            <!-- Card 1: Data Siswa & Informasi Laporan -->
            <div class="bg-white border border-gray-200 p-5 space-y-4">
              <div class="flex items-center gap-2 pb-3 border-b border-gray-200">
                <div class="w-8 h-8 bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center font-bold">
                  <UserIcon class="w-4 h-4" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-gray-900">1. Data Siswa & Sesi</h3>
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                    Nama Siswa <span class="text-rose-500">*</span>
                  </label>
                  <input
                    v-model="form.student.name"
                    type="text"
                    list="students-list"
                    placeholder="Contoh: Jibril Shaquille Abrisam"
                    class="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors bg-gray-50 focus:bg-white"
                  />
                  <datalist id="students-list">
                    <option v-for="s in studentsList" :key="s.id" :value="s.fullname">
                      {{ s.username ? `@${s.username}` : '' }}
                    </option>
                  </datalist>
                </div>

                <div>
                  <label class="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                    Program Pelatihan <span class="text-rose-500">*</span>
                  </label>
                  <input
                    v-model="form.student.program"
                    type="text"
                    placeholder="Contoh: Python Programming"
                    class="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors bg-gray-50 focus:bg-white"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                      Pengajar / Mentor
                    </label>
                    <input
                      v-model="form.student.mentor"
                      type="text"
                      placeholder="Contoh: Arka Jenar"
                      class="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                      Periode Laporan
                    </label>
                    <input
                      v-model="form.student.period"
                      type="text"
                      placeholder="Contoh: Juli 2025"
                      class="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 2: Rekap Kehadiran -->
            <div class="bg-white border border-gray-200 p-5 space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-gray-200">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center font-bold">
                    <CalendarDaysIcon class="w-4 h-4" />
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-gray-900">2. Rekap Kehadiran</h3>
                  </div>
                </div>
                <span class="text-xs font-bold px-2 py-1 bg-[#5530AB]/10 text-[#5530AB] border border-[#5530AB]/20">
                  {{ attendanceRate }}% Kehadiran
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label class="block text-[0.6875rem] font-bold text-gray-600 mb-1.5 uppercase">Total Sesi</label>
                  <input
                    v-model.number="form.attendance.total_sessions"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 text-center font-bold text-sm focus:outline-none focus:border-[#5530AB] bg-gray-50"
                  />
                </div>
                <div>
                  <label class="block text-[0.6875rem] font-bold text-emerald-700 mb-1.5 uppercase">Hadir</label>
                  <input
                    v-model.number="form.attendance.attended"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 border border-emerald-300 bg-emerald-50 text-center font-bold text-sm text-emerald-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label class="block text-[0.6875rem] font-bold text-amber-700 mb-1.5 uppercase">Izin</label>
                  <input
                    v-model.number="form.attendance.excused"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 border border-amber-300 bg-amber-50 text-center font-bold text-sm text-amber-900 focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label class="block text-[0.6875rem] font-bold text-red-700 mb-1.5 uppercase">Absen</label>
                  <input
                    v-model.number="form.attendance.absent"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 border border-red-300 bg-red-50 text-center font-bold text-sm text-red-900 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            <!-- Card 3: Penilaian Modul Pelajaran -->
            <div class="bg-white border border-gray-200 p-5 space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-gray-200">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center font-bold">
                    <BookOpenIcon class="w-4 h-4" />
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-gray-900">3. Penilaian Modul Pelajaran</h3>
                  </div>
                </div>
                <button
                  type="button"
                  @click="addModule"
                  class="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-[#121212] text-white hover:bg-black transition-colors cursor-pointer"
                >
                  <PlusIcon class="w-3.5 h-3.5" />
                  Modul
                </button>
              </div>

              <div class="space-y-4">
                <div
                  v-for="(mod, mIdx) in form.modules"
                  :key="mIdx"
                  class="p-4 border border-gray-200 bg-gray-50 space-y-4"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-1.5">
                        <label class="text-xs font-bold text-gray-800 uppercase">Modul #{{ mIdx + 1 }}</label>
                        <button
                          v-if="form.modules.length > 1"
                          type="button"
                          @click="removeModule(mIdx)"
                          class="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <TrashIcon class="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        v-model="mod.name"
                        type="text"
                        placeholder="Contoh: Python Final Project"
                        class="w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors"
                      />
                    </div>
                  </div>

                  <!-- Nilai Modul -->
                  <div>
                    <div class="flex items-center justify-between text-xs mb-1.5">
                      <span class="font-bold text-gray-700 uppercase">Nilai Modul:</span>
                      <span class="font-bold px-2 py-0.5 text-xs border bg-white" :class="getScoreBadgeClass(mod.score)">
                        {{ mod.score }} / 100
                      </span>
                    </div>
                    <div class="flex items-center gap-3">
                      <input
                        v-model.number="mod.score"
                        type="range"
                        min="0"
                        max="100"
                        class="flex-1 accent-[#5530AB] cursor-pointer"
                      />
                      <input
                        v-model.number="mod.score"
                        type="number"
                        min="0"
                        max="100"
                        class="w-16 px-2 py-1 text-center font-bold text-sm border border-gray-300 bg-white focus:outline-none focus:border-[#5530AB]"
                      />
                    </div>
                  </div>

                  <!-- Keyword Kekuatan -->
                  <div>
                    <label class="block text-[0.6875rem] font-bold text-gray-800 mb-1.5 uppercase">
                      Keyword Kekuatan (Enter / Koma)
                    </label>
                    <div class="flex flex-wrap gap-1.5 p-2 bg-white border border-gray-300 min-h-[38px]">
                      <span
                        v-for="(st, sIdx) in mod.strengths"
                        :key="sIdx"
                        class="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-800 font-medium"
                      >
                        {{ st }}
                        <button type="button" @click="removeTag(mod.strengths, sIdx)" class="hover:text-red-600 cursor-pointer">
                          <XMarkIcon class="w-3 h-3" />
                        </button>
                      </span>
                      <input
                        v-model="mod.strengthInput"
                        @keydown.enter.prevent="addTag(mod.strengths, { value: mod.strengthInput })"
                        @keydown.comma.prevent="addTag(mod.strengths, { value: mod.strengthInput })"
                        type="text"
                        placeholder="Tambah keyword..."
                        class="flex-1 min-w-[120px] text-xs outline-none bg-transparent"
                      />
                    </div>
                    <!-- Suggestion Chips -->
                    <div class="flex flex-wrap gap-1 mt-2">
                      <button
                        v-for="(sug, sugIdx) in suggestionPills.moduleStrengths.slice(0, 3)"
                        :key="sugIdx"
                        type="button"
                        @click="addSuggestion(mod.strengths, sug)"
                        class="text-[0.625rem] px-2 py-0.5 bg-gray-100 hover:bg-[#5530AB]/10 hover:text-[#5530AB] text-gray-600 border border-gray-200 transition-colors cursor-pointer"
                      >
                        + {{ sug }}
                      </button>
                    </div>
                  </div>

                  <!-- Keyword Improvement -->
                  <div>
                    <label class="block text-[0.6875rem] font-bold text-gray-800 mb-1.5 uppercase">
                      Keyword Ditingkatkan (Opsional)
                    </label>
                    <div class="flex flex-wrap gap-1.5 p-2 bg-white border border-gray-300 min-h-[38px]">
                      <span
                        v-for="(imp, iIdx) in mod.improvements"
                        :key="iIdx"
                        class="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-800 font-medium"
                      >
                        {{ imp }}
                        <button type="button" @click="removeTag(mod.improvements, iIdx)" class="hover:text-red-600 cursor-pointer">
                          <XMarkIcon class="w-3 h-3" />
                        </button>
                      </span>
                      <input
                        v-model="mod.improvementInput"
                        @keydown.enter.prevent="addTag(mod.improvements, { value: mod.improvementInput })"
                        @keydown.comma.prevent="addTag(mod.improvements, { value: mod.improvementInput })"
                        type="text"
                        placeholder="Tambah keyword..."
                        class="flex-1 min-w-[120px] text-xs outline-none bg-transparent"
                      />
                    </div>
                    <!-- Suggestion Chips -->
                    <div class="flex flex-wrap gap-1 mt-2">
                      <button
                        v-for="(sug, sugIdx) in suggestionPills.moduleImprovements.slice(0, 3)"
                        :key="sugIdx"
                        type="button"
                        @click="addSuggestion(mod.improvements, sug)"
                        class="text-[0.625rem] px-2 py-0.5 bg-gray-100 hover:bg-[#5530AB]/10 hover:text-[#5530AB] text-gray-600 border border-gray-200 transition-colors cursor-pointer"
                      >
                        + {{ sug }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 4: Observasi Periode Belajar -->
            <div class="bg-white border border-gray-200 p-5 space-y-4">
              <div class="flex items-center gap-2 pb-3 border-b border-gray-200">
                <div class="w-8 h-8 bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center font-bold">
                  <DocumentTextIcon class="w-4 h-4" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-gray-900">4. Observasi Periode</h3>
                </div>
              </div>

              <div class="space-y-4">
                <!-- Kekuatan Periode -->
                <div>
                  <label class="block text-[0.6875rem] font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                    Kekuatan / Performa Umum Siswa
                  </label>
                  <div class="flex flex-wrap gap-1.5 p-2 bg-white border border-gray-300 min-h-[40px]">
                    <span
                      v-for="(t, idx) in form.period_observation.strengths"
                      :key="idx"
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-800 font-medium"
                    >
                      {{ t }}
                      <button type="button" @click="removeTag(form.period_observation.strengths, idx)" class="hover:text-red-600 cursor-pointer">
                        <XMarkIcon class="w-3 h-3" />
                      </button>
                    </span>
                    <input
                      v-model="form.period_observation.strengthInput"
                      @keydown.enter.prevent="addTag(form.period_observation.strengths, { value: form.period_observation.strengthInput })"
                      @keydown.comma.prevent="addTag(form.period_observation.strengths, { value: form.period_observation.strengthInput })"
                      type="text"
                      placeholder="Ketik & Enter untuk menambah..."
                      class="flex-1 min-w-[140px] text-xs outline-none bg-transparent"
                    />
                  </div>
                  <div class="flex flex-wrap gap-1 mt-2">
                    <button
                      v-for="(sug, sIdx) in suggestionPills.periodStrengths"
                      :key="sIdx"
                      type="button"
                      @click="addSuggestion(form.period_observation.strengths, sug)"
                      class="text-[0.625rem] px-2 py-0.5 bg-gray-100 hover:bg-[#5530AB]/10 hover:text-[#5530AB] text-gray-600 border border-gray-200 transition-colors cursor-pointer"
                    >
                      + {{ sug }}
                    </button>
                  </div>
                </div>

                <!-- Perkembangan Siswa -->
                <div>
                  <label class="block text-[0.6875rem] font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                    Perkembangan Siswa
                  </label>
                  <div class="flex flex-wrap gap-1.5 p-2 bg-white border border-gray-300 min-h-[40px]">
                    <span
                      v-for="(t, idx) in form.period_observation.progress"
                      :key="idx"
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-800 font-medium"
                    >
                      {{ t }}
                      <button type="button" @click="removeTag(form.period_observation.progress, idx)" class="hover:text-red-600 cursor-pointer">
                        <XMarkIcon class="w-3 h-3" />
                      </button>
                    </span>
                    <input
                      v-model="form.period_observation.progressInput"
                      @keydown.enter.prevent="addTag(form.period_observation.progress, { value: form.period_observation.progressInput })"
                      @keydown.comma.prevent="addTag(form.period_observation.progress, { value: form.period_observation.progressInput })"
                      type="text"
                      placeholder="Ketik & Enter untuk menambah..."
                      class="flex-1 min-w-[140px] text-xs outline-none bg-transparent"
                    />
                  </div>
                  <div class="flex flex-wrap gap-1 mt-2">
                    <button
                      v-for="(sug, sIdx) in suggestionPills.periodProgress"
                      :key="sIdx"
                      type="button"
                      @click="addSuggestion(form.period_observation.progress, sug)"
                      class="text-[0.625rem] px-2 py-0.5 bg-gray-100 hover:bg-[#5530AB]/10 hover:text-[#5530AB] text-gray-600 border border-gray-200 transition-colors cursor-pointer"
                    >
                      + {{ sug }}
                    </button>
                  </div>
                </div>

                <!-- Kendala / Tantangan -->
                <div>
                  <label class="block text-[0.6875rem] font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                    Kendala / Tantangan
                  </label>
                  <div class="flex flex-wrap gap-1.5 p-2 bg-white border border-gray-300 min-h-[40px]">
                    <span
                      v-for="(t, idx) in form.period_observation.challenges"
                      :key="idx"
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-800 font-medium"
                    >
                      {{ t }}
                      <button type="button" @click="removeTag(form.period_observation.challenges, idx)" class="hover:text-red-600 cursor-pointer">
                        <XMarkIcon class="w-3 h-3" />
                      </button>
                    </span>
                    <input
                      v-model="form.period_observation.challengeInput"
                      @keydown.enter.prevent="addTag(form.period_observation.challenges, { value: form.period_observation.challengeInput })"
                      @keydown.comma.prevent="addTag(form.period_observation.challenges, { value: form.period_observation.challengeInput })"
                      type="text"
                      placeholder="Ketik & Enter untuk menambah..."
                      class="flex-1 min-w-[140px] text-xs outline-none bg-transparent"
                    />
                  </div>
                  <div class="flex flex-wrap gap-1 mt-2">
                    <button
                      v-for="(sug, sIdx) in suggestionPills.periodChallenges"
                      :key="sIdx"
                      type="button"
                      @click="addSuggestion(form.period_observation.challenges, sug)"
                      class="text-[0.625rem] px-2 py-0.5 bg-gray-100 hover:bg-[#5530AB]/10 hover:text-[#5530AB] text-gray-600 border border-gray-200 transition-colors cursor-pointer"
                    >
                      + {{ sug }}
                    </button>
                  </div>
                </div>

                <!-- Fokus Berikutnya -->
                <div>
                  <label class="block text-[0.6875rem] font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                    Fokus Pembelajaran Berikutnya
                  </label>
                  <div class="flex flex-wrap gap-1.5 p-2 bg-white border border-gray-300 min-h-[40px]">
                    <span
                      v-for="(t, idx) in form.period_observation.next_focus"
                      :key="idx"
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-800 font-medium"
                    >
                      {{ t }}
                      <button type="button" @click="removeTag(form.period_observation.next_focus, idx)" class="hover:text-red-600 cursor-pointer">
                        <XMarkIcon class="w-3 h-3" />
                      </button>
                    </span>
                    <input
                      v-model="form.period_observation.focusInput"
                      @keydown.enter.prevent="addTag(form.period_observation.next_focus, { value: form.period_observation.focusInput })"
                      @keydown.comma.prevent="addTag(form.period_observation.next_focus, { value: form.period_observation.focusInput })"
                      type="text"
                      placeholder="Ketik & Enter untuk menambah..."
                      class="flex-1 min-w-[140px] text-xs outline-none bg-transparent"
                    />
                  </div>
                  <div class="flex flex-wrap gap-1 mt-2">
                    <button
                      v-for="(sug, sIdx) in suggestionPills.periodFocus"
                      :key="sIdx"
                      type="button"
                      @click="addSuggestion(form.period_observation.next_focus, sug)"
                      class="text-[0.625rem] px-2 py-0.5 bg-gray-100 hover:bg-[#5530AB]/10 hover:text-[#5530AB] text-gray-600 border border-gray-200 transition-colors cursor-pointer"
                    >
                      + {{ sug }}
                    </button>
                  </div>
                </div>

                <!-- Komentar Tambahan (Opsional) -->
                <div>
                  <label class="block text-[0.6875rem] font-bold text-gray-800 mb-1.5 uppercase tracking-wide">
                    Catatan Tambahan Mentor (Opsional)
                  </label>
                  <textarea
                    v-model="form.period_observation.additional_comment"
                    rows="2"
                    placeholder="Tulis catatan personal atau konteks khusus lainnya..."
                    class="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#5530AB] focus:ring-1 focus:ring-[#5530AB] transition-colors bg-gray-50 focus:bg-white resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Tombol Action Generate -->
            <div class="sticky bottom-4 z-20">
              <button
                type="button"
                :disabled="isGenerating"
                @click="generateReport"
                class="w-full py-3 px-6 bg-[#5530AB] hover:bg-[#43238A] disabled:bg-gray-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <template v-if="isGenerating">
                  <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ generationStep }}</span>
                </template>
                <template v-else>
                  <SparklesIcon class="w-4 h-4" />
                  <span>Generate Progress Report (AI)</span>
                </template>
              </button>
            </div>

          </div>

          <!-- ================= KOLOM KANAN: PREVIEW LAPORAN (PRINTABLE) ================= -->
          <div id="report-results-view" class="lg:col-span-7 space-y-4">

            <!-- Controls Toolbar (Hidden saat Print) -->
            <div class="bg-white border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <!-- Tab Switcher -->
              <div class="flex items-center p-1 bg-gray-100">
                <button
                  type="button"
                  @click="activeResultTab = 'visual'"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                  :class="activeResultTab === 'visual' ? 'bg-white text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-900 border border-transparent'"
                >
                  <DocumentChartBarIcon class="w-4 h-4" />
                  Visual
                </button>
                <button
                  type="button"
                  @click="activeResultTab = 'history'"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                  :class="activeResultTab === 'history' ? 'bg-white text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-900 border border-transparent'"
                >
                  <FolderArrowDownIcon class="w-4 h-4" />
                  Riwayat ({{ savedReports.length }})
                </button>
              </div>

              <!-- Action Buttons -->
              <div v-if="reportResult" class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  :disabled="isDownloadingPdf"
                  @click="downloadPdf"
                  class="flex items-center gap-1.5 px-3 py-2 bg-[#121212] hover:bg-black disabled:bg-gray-400 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-wait"
                  title="Download Laporan Resmi sebagai file PDF"
                >
                  <ArrowDownTrayIcon class="w-3.5 h-3.5 shrink-0" :class="{ 'animate-bounce': isDownloadingPdf }" />
                  <span>{{ isDownloadingPdf ? 'Menyiapkan...' : 'PDF' }}</span>
                </button>

                <button
                  type="button"
                  @click="printReport"
                  class="flex items-center gap-1.5 px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
                  title="Buka dialog Cetak Browser"
                >
                  <PrinterIcon class="w-3.5 h-3.5 text-gray-600" />
                  <span>Cetak</span>
                </button>

                <button
                  type="button"
                  :disabled="isSaving"
                  @click="saveToDatabase"
                  class="flex items-center gap-1.5 px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-colors cursor-pointer disabled:cursor-wait"
                  title="Simpan ke Database Supabase & Penyimpanan Lokal"
                >
                  <CheckBadgeIcon class="w-3.5 h-3.5 text-gray-600" />
                  <span>{{ isSaving ? 'Menyimpan...' : 'Simpan' }}</span>
                </button>
              </div>
            </div>

            <!-- Notice Status Penyimpanan / Database Supabase -->
            <div
              v-if="saveStatus.message"
              class="p-4 text-xs flex items-start justify-between gap-3 print:hidden border"
              :class="saveStatus.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-amber-50 text-amber-900 border-amber-300'"
            >
              <div class="flex items-start gap-2">
                <CheckCircleIcon v-if="saveStatus.type === 'success'" class="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <ExclamationTriangleIcon v-else class="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p class="font-bold leading-relaxed">{{ saveStatus.message }}</p>
                  <div v-if="saveStatus.type === 'error'" class="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      @click="showSqlSetupModal = true"
                      class="px-2 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold text-[0.6875rem] transition-colors cursor-pointer"
                    >
                      Panduan SQL Supabase
                    </button>
                    <button
                      type="button"
                      @click="copySqlScript"
                      class="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-400 font-bold text-[0.6875rem] transition-colors cursor-pointer"
                    >
                      {{ copiedSql ? 'SQL Tersalin!' : 'Salin SQL' }}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                @click="saveStatus = { type: '', message: '' }"
                class="text-gray-500 hover:text-gray-900 p-1 cursor-pointer"
              >
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>

            <!-- Empty State jika belum di-generate -->
            <div
              v-if="!reportResult && activeResultTab !== 'history'"
              class="bg-white border border-gray-200 p-12 text-center space-y-4 print:hidden"
            >
              <div class="w-12 h-12 bg-gray-100 text-gray-400 flex items-center justify-center mx-auto border border-gray-200">
                <SparklesIcon class="w-6 h-6" />
              </div>
              <div class="max-w-md mx-auto">
                <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide">Hasil Laporan</h3>
                <p class="text-xs text-gray-500 mt-2 leading-relaxed">
                  Isi formulir di sebelah kiri atau klik <strong>"Muat Contoh Data"</strong> di bagian atas untuk melihat demonstrasi laporan yang dihasilkan oleh AI.
                </p>
              </div>
              <button
                type="button"
                @click="loadSampleData"
                class="inline-flex items-center gap-2 px-3 py-1.5 bg-[#5530AB]/10 text-[#5530AB] font-bold text-xs transition-colors cursor-pointer"
              >
                Coba Contoh
              </button>
            </div>

            <!-- TAB 1: VISUAL REPORT -->
            <div
              v-if="reportResult && activeResultTab === 'visual'"
              id="printable-report-card"
              class="printable-report bg-white border border-gray-200 p-8"
            >
              <ProgressReportDocument :report="reportResult" />
            </div>

            <!-- TAB 2: RIWAYAT LAPORAN TERSIMPAN -->
            <div
              v-if="activeResultTab === 'history'"
              class="bg-white border border-gray-200 p-6 space-y-4 print:hidden"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 class="text-sm font-bold text-gray-900 uppercase">Riwayat Laporan</h4>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    v-if="hasUnsyncedLocalReports"
                    type="button"
                    :disabled="isSyncing"
                    @click="syncPendingReports"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-[#5530AB] hover:bg-[#43238A] text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-wait"
                  >
                    <ArrowPathIcon class="w-3.5 h-3.5" :class="{ 'animate-spin': isSyncing }" />
                    <span>Sinkronkan</span>
                  </button>
                  <button
                    type="button"
                    @click="fetchSavedReports"
                    class="p-1.5 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                    title="Perbarui daftar"
                  >
                    <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loadingSavedReports }" />
                  </button>
                </div>
              </div>

              <!-- Notice jika tabel Supabase belum siap -->
              <div
                v-if="!tableExists"
                class="p-3 border border-amber-300 bg-amber-50 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div class="flex items-center gap-2">
                  <ExclamationTriangleIcon class="w-4 h-4 text-amber-700 shrink-0" />
                  <span class="font-bold">Tabel belum ada. Laporan aman di penyimpanan lokal.</span>
                </div>
                <button
                  type="button"
                  @click="showSqlSetupModal = true"
                  class="font-bold underline text-amber-800 hover:text-amber-900 cursor-pointer"
                >
                  Setup SQL
                </button>
              </div>

              <div v-if="loadingSavedReports" class="text-center py-10 text-xs font-bold text-gray-500">
                Memuat riwayat...
              </div>

              <div v-else-if="savedReports.length === 0" class="text-center py-12 border border-gray-200 bg-gray-50">
                <FolderArrowDownIcon class="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p class="text-xs font-bold text-gray-600 uppercase">Belum ada riwayat</p>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="item in savedReports"
                  :key="item.id"
                  class="p-4 border border-gray-200 hover:border-gray-400 bg-white transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <h5 class="text-sm font-bold text-gray-900">{{ item.student_name }}</h5>
                      <span class="px-2 py-0.5 text-[0.625rem] font-bold bg-gray-100 text-gray-800 border border-gray-300">
                        {{ item.period }}
                      </span>
                      <span
                        v-if="item.isLocalOnly"
                        class="px-2 py-0.5 text-[0.625rem] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                      >
                        Lokal
                      </span>
                      <span
                        v-else
                        class="px-2 py-0.5 text-[0.625rem] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"
                      >
                        Cloud
                      </span>
                    </div>
                    <p class="text-[0.6875rem] text-gray-600 mt-1 font-medium">Program: {{ item.program }} • Mentor: {{ item.mentor_name }}</p>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      @click="loadSavedReportToView(item)"
                      class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Buka
                    </button>
                    <button
                      type="button"
                      @click="downloadSavedReportPdf(item)"
                      class="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ArrowDownTrayIcon class="w-3.5 h-3.5" />
                      PDF
                    </button>
                    <button
                      v-if="item.isLocalOnly"
                      type="button"
                      @click="deleteLocalReport(item.id)"
                      class="p-1.5 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 transition-colors cursor-pointer border border-gray-200"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Modal Panduan Eksekusi SQL Supabase -->
      <div
        v-if="showSqlSetupModal"
        class="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-gray-900/60 print:hidden"
      >
        <div class="bg-white max-w-2xl w-full p-6 border border-gray-200 space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-base font-bold text-gray-900 uppercase">Setup Database Diperlukan</h3>
              </div>
            </div>
            <button
              type="button"
              @click="showSqlSetupModal = false"
              class="text-gray-500 hover:text-gray-900 p-1.5 bg-gray-100 cursor-pointer"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <div class="p-3 border border-emerald-300 bg-emerald-50 flex items-start gap-2.5 text-xs text-emerald-900 font-medium">
            <CheckCircleIcon class="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong>Data Aman:</strong> Laporan tersimpan di penyimpanan lokal. Anda bisa unduh PDF atau salin teks sekarang.
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-gray-800 uppercase">Script SQL Supabase:</span>
              <button
                type="button"
                @click="copySqlScript"
                class="flex items-center gap-1 font-bold text-[#121212] hover:bg-gray-100 bg-white px-2.5 py-1 border border-gray-300 transition-colors cursor-pointer"
              >
                <ClipboardDocumentCheckIcon class="w-3.5 h-3.5" />
                <span>{{ copiedSql ? 'Tersalin!' : 'Salin SQL' }}</span>
              </button>
            </div>

            <div class="border border-gray-300 bg-gray-50 p-3 overflow-hidden">
              <pre class="text-[0.6875rem] text-[#121212] font-mono overflow-x-auto max-h-48">{{ sqlScriptContent }}</pre>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-3">
            <button
              type="button"
              @click="showSqlSetupModal = false"
              class="px-4 py-2 border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              Tutup
            </button>
            <div class="flex items-center gap-2">
              <a
                href="https://supabase.com/dashboard/project/gtgmqhsdiwrqixijzufa/sql/new"
                target="_blank"
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-[#121212] hover:bg-black text-white text-xs font-bold transition-colors"
              >
                <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5" />
                <span>Buka SQL Editor</span>
              </a>
              <button
                type="button"
                :disabled="isSyncing"
                @click="syncPendingReports"
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5530AB] hover:bg-[#43238A] disabled:bg-gray-400 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowPathIcon class="w-3.5 h-3.5" :class="{ 'animate-spin': isSyncing }" />
                <span>{{ isSyncing ? 'Menyinkronkan...' : 'Sinkronkan' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* CSS Cetak / Export PDF Resmi A4 */
.avoid-break {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

@media print {
  body, html {
    background: #ffffff !important;
    font-size: 11pt !important;
  }
  header, aside, button, .print\:hidden, .lg\:ml-\[260px\], .fixed {
    display: none !important;
  }
  .printable-report {
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
  }
  @page {
    size: A4;
    margin: 1.5cm;
  }
}
</style>