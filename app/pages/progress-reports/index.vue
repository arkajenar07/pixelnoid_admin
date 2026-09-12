<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import {
  Bars3Icon,
  SparklesIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  CodeBracketSquareIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
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

// Tabs tampilan hasil: 'visual' | 'text' | 'json' | 'history'
const activeResultTab = ref<'visual' | 'text' | 'json' | 'history'>('visual')

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
    // Siapkan payload bersih
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
      // Scroll ke hasil laporan pada mobile
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
    // Pastikan tab visual aktif agar element tampil utuh di DOM
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

  // AMANKAN KE LOCAL STORAGE TERLEBIH DAHULU! Data tidak akan pernah hilang.
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

    // Jika Supabase berhasil, tandai status lokal menjadi synced
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

    // Gabungkan list: sertakan item cloud, dan item lokal yang belum ada di cloud
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

// Warna Badge Level Kompetensi — disederhanakan jadi 3 tingkat semantik
const getCompetencyBadgeClass = (level: string) => {
  const l = (level || '').toLowerCase()
  if (l.includes('mahir') && !l.includes('menuju')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  if (l.includes('menuju') || l.includes('berkembang')) {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }
  return 'bg-red-50 text-red-700 border-red-200'
}

// Warna Nilai Score Badge — disederhanakan jadi 3 tingkat semantik
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
  <div class="flex min-h-screen bg-gray-50 text-gray-900 antialiased overflow-x-clip font-sans">
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
          class="fixed top-5 right-5 z-[200] flex items-center gap-2.5 px-4 py-3 bg-gray-900 text-white rounded-md text-sm border border-gray-800 pointer-events-auto"
        >
          <CheckCircleIcon class="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{{ copyToast }}</span>
        </div>
      </transition>

      <!-- Sticky Top Header (Hidden on Print) -->
      <header class="sticky top-0 z-[100] flex w-full items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200 print:hidden">
        <div class="flex items-center gap-4">
          <button
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors lg:hidden"
            @click="sidebarOpen = !sidebarOpen"
          >
            <Bars3Icon class="w-5 h-5" />
          </button>
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-[0.6875rem] font-semibold text-indigo-700">
                <SparklesIcon class="w-3.5 h-3.5" />
                AI Powered
              </span>
              <span class="text-xs text-gray-300">•</span>
              <span class="text-xs text-gray-500">Gemini 3.6 Flash</span>
            </div>
            <h1 class="text-base font-semibold text-gray-900 leading-none">Student Progress Report Generator</h1>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            @click="loadSampleData"
            class="flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
            title="Muat contoh data dari README untuk pengujian cepat"
          >
            <SparklesIcon class="w-4 h-4 text-gray-400" />
            <span class="hidden sm:inline">Muat Contoh Data</span>
            <span class="sm:hidden">Contoh</span>
          </button>

          <button
            @click="resetForm"
            class="flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-medium transition-colors"
            title="Bersihkan formulir"
          >
            <ArrowPathIcon class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      <!-- Main Content Container -->
      <main class="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
        <!-- Intro ringkas: deskripsi & petunjuk -->
        <div class="bg-white border border-gray-200 rounded-lg px-5 py-4 print:hidden">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
              <DocumentChartBarIcon class="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h2 class="text-sm font-semibold text-gray-900">Laporan Perkembangan Siswa</h2>
              <p class="text-xs text-gray-500 mt-1 leading-relaxed max-w-2xl">
                Isi data faktual: absensi, nilai modul, dan keyword observasi. AI akan menyusunnya menjadi laporan naratif yang objektif, terstruktur, dan siap dibagikan kepada siswa maupun wali murid.
              </p>
            </div>
          </div>
        </div>

        <!-- Layout Grid: Form (Kiri) & Hasil Laporan (Kanan) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          <!-- ================= KOLOM KIRI: FORMULIR INPUT MENTOR ================= -->
          <div class="lg:col-span-5 space-y-6 print:hidden sticky top-20">

            <!-- Card 1: Data Siswa & Informasi Laporan -->
            <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-md bg-gray-100 text-gray-600 flex items-center justify-center font-bold">
                    <UserIcon class="w-4 h-4" />
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-gray-900">1. Data Siswa & Sesi</h3>
                    <p class="text-[0.6875rem] text-gray-500">Identitas murid dan periode evaluasi</p>
                  </div>
                </div>
              </div>

              <div class="space-y-3.5">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">
                    Nama Siswa <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      v-model="form.student.name"
                      type="text"
                      list="students-list"
                      placeholder="Contoh: Jibril Shaquille Abrisam"
                      class="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    />
                    <datalist id="students-list">
                      <option v-for="s in studentsList" :key="s.id" :value="s.fullname">
                        {{ s.username ? `@${s.username}` : '' }}
                      </option>
                    </datalist>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">
                    Program Pelatihan <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.student.program"
                    type="text"
                    placeholder="Contoh: Python Programming / Web Development"
                    class="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-1">
                      Pengajar / Mentor
                    </label>
                    <input
                      v-model="form.student.mentor"
                      type="text"
                      placeholder="Contoh: Arka Jenar Ma’arif"
                      class="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-1">
                      Periode Laporan
                    </label>
                    <input
                      v-model="form.student.period"
                      type="text"
                      placeholder="Contoh: Juli 2025"
                      class="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 2: Rekap Kehadiran -->
            <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-md bg-gray-100 text-gray-600 flex items-center justify-center font-bold">
                    <CalendarDaysIcon class="w-4 h-4" />
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-gray-900">2. Rekap Kehadiran</h3>
                    <p class="text-[0.6875rem] text-gray-500">Statistik presensi selama periode berjalan</p>
                  </div>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {{ attendanceRate }}% Kehadiran
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label class="block text-[0.6875rem] font-medium text-gray-500 mb-1">Total Pertemuan</label>
                  <input
                    v-model.number="form.attendance.total_sessions"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 rounded-md border border-gray-300 text-center font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label class="block text-[0.6875rem] font-medium text-emerald-600 mb-1">Hadir</label>
                  <input
                    v-model.number="form.attendance.attended"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 rounded-md border border-emerald-200 bg-emerald-50/40 text-center font-semibold text-sm text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label class="block text-[0.6875rem] font-medium text-amber-600 mb-1">Izin / Sakit</label>
                  <input
                    v-model.number="form.attendance.excused"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 rounded-md border border-amber-200 bg-amber-50/40 text-center font-semibold text-sm text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label class="block text-[0.6875rem] font-medium text-red-600 mb-1">Tidak Hadir</label>
                  <input
                    v-model.number="form.attendance.absent"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 rounded-md border border-red-200 bg-red-50/40 text-center font-semibold text-sm text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <!-- Card 3: Penilaian Modul Pelajaran -->
            <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-md bg-gray-100 text-gray-600 flex items-center justify-center font-bold">
                    <BookOpenIcon class="w-4 h-4" />
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-gray-900">3. Penilaian Modul Pelajaran</h3>
                    <p class="text-[0.6875rem] text-gray-500">Nilai & keyword capaian tiap modul</p>
                  </div>
                </div>

                <button
                  type="button"
                  @click="addModule"
                  class="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <PlusIcon class="w-3.5 h-3.5" />
                  Tambah Modul
                </button>
              </div>

              <!-- List Modul -->
              <div class="space-y-4">
                <div
                  v-for="(mod, mIdx) in form.modules"
                  :key="mIdx"
                  class="p-4 rounded-md border border-gray-200 bg-gray-50 space-y-3 relative group"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-1">
                        <label class="text-xs font-semibold text-gray-700">Modul #{{ mIdx + 1 }}</label>
                        <button
                          v-if="form.modules.length > 1"
                          type="button"
                          @click="removeModule(mIdx)"
                          class="text-gray-400 hover:text-red-500 p-1 rounded-md transition-colors"
                          title="Hapus modul ini"
                        >
                          <TrashIcon class="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        v-model="mod.name"
                        type="text"
                        placeholder="Contoh: Python Final Project - Table Relation System"
                        class="w-full px-3 py-2 rounded-md border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <!-- Nilai Modul -->
                  <div>
                    <div class="flex items-center justify-between text-xs mb-1">
                      <span class="font-medium text-gray-600">Nilai Modul:</span>
                      <span class="font-semibold px-2 py-0.5 rounded-md text-xs border" :class="getScoreBadgeClass(mod.score)">
                        {{ mod.score }} / 100
                      </span>
                    </div>
                    <div class="flex items-center gap-3">
                      <input
                        v-model.number="mod.score"
                        type="range"
                        min="0"
                        max="100"
                        class="flex-1 accent-indigo-600 cursor-pointer"
                      />
                      <input
                        v-model.number="mod.score"
                        type="number"
                        min="0"
                        max="100"
                        class="w-16 px-2 py-1 text-center font-semibold text-sm rounded-md border border-gray-300 bg-white"
                      />
                    </div>
                  </div>

                  <!-- Keyword Kekuatan Modul -->
                  <div>
                    <label class="block text-[0.6875rem] font-semibold text-gray-700 mb-1">
                      Keyword Kekuatan (Ketik & Enter / Koma)
                    </label>
                    <div class="flex flex-wrap gap-1.5 p-2 bg-white rounded-md border border-gray-300 min-h-[38px]">
                      <span
                        v-for="(st, sIdx) in mod.strengths"
                        :key="sIdx"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        {{ st }}
                        <button type="button" @click="removeTag(mod.strengths, sIdx)" class="hover:text-gray-900">
                          <XMarkIcon class="w-3 h-3" />
                        </button>
                      </span>
                      <input
                        v-model="mod.strengthInput"
                        @keydown.enter.prevent="addTag(mod.strengths, { value: mod.strengthInput })"
                        @keydown.comma.prevent="addTag(mod.strengths, { value: mod.strengthInput })"
                        type="text"
                        placeholder="Tambah keyword..."
                        class="flex-1 min-w-[110px] text-xs outline-none bg-transparent"
                      />
                    </div>
                    <!-- Suggestion Chips -->
                    <div class="flex flex-wrap gap-1 mt-1.5">
                      <button
                        v-for="(sug, sugIdx) in suggestionPills.moduleStrengths.slice(0, 3)"
                        :key="sugIdx"
                        type="button"
                        @click="addSuggestion(mod.strengths, sug)"
                        class="text-[0.625rem] px-2 py-0.5 rounded-full bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 border border-gray-200 transition-colors"
                      >
                        + {{ sug }}
                      </button>
                    </div>
                  </div>

                  <!-- Keyword Improvement Modul -->
                  <div>
                    <label class="block text-[0.6875rem] font-semibold text-gray-700 mb-1">
                      Keyword Perlu Ditingkatkan (Opsional)
                    </label>
                    <div class="flex flex-wrap gap-1.5 p-2 bg-white rounded-md border border-gray-300 min-h-[38px]">
                      <span
                        v-for="(imp, iIdx) in mod.improvements"
                        :key="iIdx"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        {{ imp }}
                        <button type="button" @click="removeTag(mod.improvements, iIdx)" class="hover:text-gray-900">
                          <XMarkIcon class="w-3 h-3" />
                        </button>
                      </span>
                      <input
                        v-model="mod.improvementInput"
                        @keydown.enter.prevent="addTag(mod.improvements, { value: mod.improvementInput })"
                        @keydown.comma.prevent="addTag(mod.improvements, { value: mod.improvementInput })"
                        type="text"
                        placeholder="Tambah keyword..."
                        class="flex-1 min-w-[110px] text-xs outline-none bg-transparent"
                      />
                    </div>
                    <!-- Suggestion Chips -->
                    <div class="flex flex-wrap gap-1 mt-1.5">
                      <button
                        v-for="(sug, sugIdx) in suggestionPills.moduleImprovements.slice(0, 3)"
                        :key="sugIdx"
                        type="button"
                        @click="addSuggestion(mod.improvements, sug)"
                        class="text-[0.625rem] px-2 py-0.5 rounded-full bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 border border-gray-200 transition-colors"
                      >
                        + {{ sug }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 4: Observasi Periode Belajar -->
            <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
              <div class="flex items-center gap-2 pb-3 border-b border-gray-100">
                <div class="w-8 h-8 rounded-md bg-gray-100 text-gray-600 flex items-center justify-center font-bold">
                  <DocumentTextIcon class="w-4 h-4" />
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-gray-900">4. Observasi Periode</h3>
                  <p class="text-[0.6875rem] text-gray-500">Performa umum, kendala, dan rekomendasi fokus</p>
                </div>
              </div>

              <div class="space-y-3.5">
                <!-- Kekuatan Periode -->
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">
                    Kekuatan / Performa Umum Siswa
                  </label>
                  <div class="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-md border border-gray-300 min-h-[40px]">
                    <span
                      v-for="(t, idx) in form.period_observation.strengths"
                      :key="idx"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {{ t }}
                      <button type="button" @click="removeTag(form.period_observation.strengths, idx)" class="hover:text-gray-900">
                        <XMarkIcon class="w-3.5 h-3.5" />
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
                  <div class="flex flex-wrap gap-1 mt-1.5">
                    <button
                      v-for="(sug, sIdx) in suggestionPills.periodStrengths"
                      :key="sIdx"
                      type="button"
                      @click="addSuggestion(form.period_observation.strengths, sug)"
                      class="text-[0.625rem] px-2 py-0.5 rounded-full bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 border border-gray-200 transition-colors"
                    >
                      + {{ sug }}
                    </button>
                  </div>
                </div>

                <!-- Perkembangan Siswa -->
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">
                    Perkembangan Siswa
                  </label>
                  <div class="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-md border border-gray-300 min-h-[40px]">
                    <span
                      v-for="(t, idx) in form.period_observation.progress"
                      :key="idx"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {{ t }}
                      <button type="button" @click="removeTag(form.period_observation.progress, idx)" class="hover:text-gray-900">
                        <XMarkIcon class="w-3.5 h-3.5" />
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
                  <div class="flex flex-wrap gap-1 mt-1.5">
                    <button
                      v-for="(sug, sIdx) in suggestionPills.periodProgress"
                      :key="sIdx"
                      type="button"
                      @click="addSuggestion(form.period_observation.progress, sug)"
                      class="text-[0.625rem] px-2 py-0.5 rounded-full bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 border border-gray-200 transition-colors"
                    >
                      + {{ sug }}
                    </button>
                  </div>
                </div>

                <!-- Kendala / Tantangan -->
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">
                    Kendala / Tantangan
                  </label>
                  <div class="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-md border border-gray-300 min-h-[40px]">
                    <span
                      v-for="(t, idx) in form.period_observation.challenges"
                      :key="idx"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {{ t }}
                      <button type="button" @click="removeTag(form.period_observation.challenges, idx)" class="hover:text-gray-900">
                        <XMarkIcon class="w-3.5 h-3.5" />
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
                  <div class="flex flex-wrap gap-1 mt-1.5">
                    <button
                      v-for="(sug, sIdx) in suggestionPills.periodChallenges"
                      :key="sIdx"
                      type="button"
                      @click="addSuggestion(form.period_observation.challenges, sug)"
                      class="text-[0.625rem] px-2 py-0.5 rounded-full bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 border border-gray-200 transition-colors"
                    >
                      + {{ sug }}
                    </button>
                  </div>
                </div>

                <!-- Fokus Berikutnya -->
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">
                    Fokus Pembelajaran Berikutnya
                  </label>
                  <div class="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-md border border-gray-300 min-h-[40px]">
                    <span
                      v-for="(t, idx) in form.period_observation.next_focus"
                      :key="idx"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {{ t }}
                      <button type="button" @click="removeTag(form.period_observation.next_focus, idx)" class="hover:text-gray-900">
                        <XMarkIcon class="w-3.5 h-3.5" />
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
                  <div class="flex flex-wrap gap-1 mt-1.5">
                    <button
                      v-for="(sug, sIdx) in suggestionPills.periodFocus"
                      :key="sIdx"
                      type="button"
                      @click="addSuggestion(form.period_observation.next_focus, sug)"
                      class="text-[0.625rem] px-2 py-0.5 rounded-full bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 border border-gray-200 transition-colors"
                    >
                      + {{ sug }}
                    </button>
                  </div>
                </div>

                <!-- Komentar Tambahan (Opsional) -->
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">
                    Catatan Tambahan Mentor (Opsional)
                  </label>
                  <textarea
                    v-model="form.period_observation.additional_comment"
                    rows="2"
                    placeholder="Tulis catatan personal atau konteks khusus lainnya..."
                    class="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                class="w-full py-3.5 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <template v-if="isGenerating">
                  <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ generationStep }}</span>
                </template>
                <template v-else>
                  <SparklesIcon class="w-5 h-5" />
                  <span>Generate Progress Report (AI)</span>
                </template>
              </button>
            </div>

          </div>

          <!-- ================= KOLOM KANAN: PREVIEW LAPORAN (PRINTABLE) ================= -->
          <div id="report-results-view" class="lg:col-span-7 space-y-4">

            <!-- Controls Toolbar (Hidden saat Print) -->
            <div class="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <!-- Tab Switcher -->
              <div class="flex items-center p-1 bg-gray-100 rounded-md">
                <button
                  type="button"
                  @click="activeResultTab = 'visual'"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                  :class="activeResultTab === 'visual' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-900'"
                >
                  <DocumentChartBarIcon class="w-4 h-4" />
                  Laporan Visual
                </button>
                <button
                  type="button"
                  @click="activeResultTab = 'text'"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                  :class="activeResultTab === 'text' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-900'"
                >
                  <DocumentTextIcon class="w-4 h-4" />
                  Plain Text
                </button>
                <button
                  type="button"
                  @click="activeResultTab = 'json'"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                  :class="activeResultTab === 'json' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-900'"
                >
                  <CodeBracketSquareIcon class="w-4 h-4" />
                  JSON
                </button>
                <button
                  type="button"
                  @click="activeResultTab = 'history'"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                  :class="activeResultTab === 'history' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-900'"
                >
                  <FolderArrowDownIcon class="w-4 h-4" />
                  Riwayat ({{ savedReports.length }})
                </button>
              </div>

              <!-- Action Buttons -->
              <div v-if="reportResult" class="flex flex-wrap items-center gap-2">
                <!-- Tombol Utama: Download as PDF -->
                <button
                  type="button"
                  :disabled="isDownloadingPdf"
                  @click="downloadPdf"
                  class="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold transition-colors cursor-pointer disabled:cursor-wait"
                  title="Download Laporan Resmi sebagai file PDF"
                >
                  <ArrowDownTrayIcon class="w-4 h-4 shrink-0" :class="{ 'animate-bounce': isDownloadingPdf }" />
                  <span>{{ isDownloadingPdf ? 'Menyiapkan PDF...' : 'Download as PDF' }}</span>
                </button>

                <!-- Tombol Cetak Dokumen -->
                <button
                  type="button"
                  @click="printReport"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                  title="Buka dialog Cetak Browser"
                >
                  <PrinterIcon class="w-3.5 h-3.5 text-gray-500" />
                  <span>Cetak</span>
                </button>

                <!-- Tombol Simpan Laporan -->
                <button
                  type="button"
                  :disabled="isSaving"
                  @click="saveToDatabase"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-wait"
                  title="Simpan ke Database Supabase & Penyimpanan Lokal"
                >
                  <CheckBadgeIcon class="w-3.5 h-3.5 text-gray-500" />
                  <span>{{ isSaving ? 'Menyimpan...' : 'Simpan Laporan' }}</span>
                </button>
              </div>
            </div>

            <!-- Notice Status Penyimpanan / Database Supabase -->
            <div
              v-if="saveStatus.message"
              class="p-4 rounded-lg text-xs flex items-start justify-between gap-3 print:hidden"
              :class="saveStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'"
            >
              <div class="flex items-start gap-2.5">
                <CheckCircleIcon v-if="saveStatus.type === 'success'" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <ExclamationTriangleIcon v-else class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p class="font-medium leading-relaxed">{{ saveStatus.message }}</p>
                  <div v-if="saveStatus.type === 'error'" class="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      @click="showSqlSetupModal = true"
                      class="px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors"
                    >
                      Buka Panduan SQL Supabase
                    </button>
                    <button
                      type="button"
                      @click="copySqlScript"
                      class="px-3 py-1 rounded-md bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-xs transition-colors"
                    >
                      {{ copiedSql ? 'SQL Tersalin!' : 'Salin SQL Script' }}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                @click="saveStatus = { type: '', message: '' }"
                class="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>

            <!-- Empty State jika belum di-generate -->
            <div
              v-if="!reportResult && activeResultTab !== 'history'"
              class="bg-white border border-gray-200 rounded-lg p-12 text-center space-y-4 print:hidden"
            >
              <div class="w-16 h-16 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
                <SparklesIcon class="w-8 h-8" />
              </div>
              <div class="max-w-md mx-auto">
                <h3 class="text-base font-semibold text-gray-900">Hasil Laporan Akan Muncul di Sini</h3>
                <p class="text-xs text-gray-500 mt-1 leading-relaxed">
                  Isi formulir di sebelah kiri atau klik tombol <strong>"Muat Contoh Data"</strong> di bagian atas untuk melihat demonstrasi laporan yang dihasilkan oleh AI.
                </p>
              </div>
              <button
                type="button"
                @click="loadSampleData"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
              >
                <SparklesIcon class="w-4 h-4" />
                Coba Contoh dari README
              </button>
            </div>

            <!-- TAB 1: VISUAL REPORT (TEMPLATE RESMI PIXELNOID & SIAP PRINT/PDF) -->
            <div
              v-if="reportResult && activeResultTab === 'visual'"
              id="printable-report-card"
              class="printable-report bg-white border border-gray-200 rounded-lg p-8"
            >
              <ProgressReportDocument :report="reportResult" />
            </div>

            <!-- TAB 2: PLAIN TEXT OUTPUT -->
            <div
              v-if="reportResult && activeResultTab === 'text'"
              class="bg-white border border-gray-200 rounded-lg p-6 space-y-4 print:hidden"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-sm font-semibold text-gray-900">Format Plain Text</h4>
                  <p class="text-xs text-gray-500">Cocok untuk disalin langsung ke WhatsApp, email wali murid, atau Notion</p>
                </div>
                <button
                  type="button"
                  @click="copyToClipboard(reportResult?.human_readable_text || '', 'Teks Laporan')"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                >
                  <ClipboardDocumentCheckIcon class="w-4 h-4 text-gray-500" />
                  Salin Teks
                </button>
              </div>

              <div class="relative">
                <pre class="w-full p-4 rounded-md bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px] border border-gray-800">{{ reportResult.human_readable_text }}</pre>
              </div>
            </div>

            <!-- TAB 3: MACHINE READABLE JSON -->
            <div
              v-if="reportResult && activeResultTab === 'json'"
              class="bg-white border border-gray-200 rounded-lg p-6 space-y-4 print:hidden"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-sm font-semibold text-gray-900">Format JSON</h4>
                  <p class="text-xs text-gray-500">Format terstruktur untuk integrasi PDF template, Word generator, atau database</p>
                </div>
                <button
                  type="button"
                  @click="copyToClipboard(JSON.stringify(reportResult, null, 2), 'JSON Laporan')"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                >
                  <ClipboardDocumentIcon class="w-4 h-4 text-gray-500" />
                  Salin JSON
                </button>
              </div>

              <div class="relative">
                <pre class="w-full p-4 rounded-md bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px] border border-gray-800">{{ JSON.stringify(reportResult, null, 2) }}</pre>
              </div>
            </div>

            <!-- TAB 4: RIWAYAT LAPORAN TERSIMPAN -->
            <div
              v-if="activeResultTab === 'history'"
              class="bg-white border border-gray-200 rounded-lg p-6 space-y-4 print:hidden"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 class="text-sm font-semibold text-gray-900">Riwayat Laporan Perkembangan Siswa</h4>
                  <p class="text-xs text-gray-500">Laporan tersimpan di database Supabase dan penyimpanan lokal browser</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    v-if="hasUnsyncedLocalReports"
                    type="button"
                    :disabled="isSyncing"
                    @click="syncPendingReports"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                    title="Kirim laporan dari browser lokal ke database Supabase"
                  >
                    <ArrowPathIcon class="w-3.5 h-3.5" :class="{ 'animate-spin': isSyncing }" />
                    <span>Sinkronkan ke Cloud</span>
                  </button>

                  <button
                    type="button"
                    @click="fetchSavedReports"
                    class="p-2 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
                    title="Perbarui daftar"
                  >
                    <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loadingSavedReports }" />
                  </button>
                </div>
              </div>

              <!-- Notice jika tabel Supabase belum siap -->
              <div
                v-if="!tableExists"
                class="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div class="flex items-center gap-2">
                  <ExclamationTriangleIcon class="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Tabel Supabase belum dibuat. Semua laporan saat ini diamankan di penyimpanan lokal browser Anda.</span>
                </div>
                <button
                  type="button"
                  @click="showSqlSetupModal = true"
                  class="font-semibold underline text-amber-800 hover:text-amber-900 shrink-0 cursor-pointer"
                >
                  Panduan Setup SQL
                </button>
              </div>

              <div v-if="loadingSavedReports" class="text-center py-10 text-xs text-gray-400">
                Memuat riwayat laporan...
              </div>

              <div v-else-if="savedReports.length === 0" class="text-center py-12 space-y-2 border border-dashed border-gray-200 rounded-lg">
                <FolderArrowDownIcon class="w-10 h-10 text-gray-300 mx-auto" />
                <p class="text-xs text-gray-500">Belum ada laporan yang tersimpan.</p>
                <p class="text-[0.625rem] text-gray-400">Generate laporan terlebih dahulu lalu klik "Simpan Laporan".</p>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="item in savedReports"
                  :key="item.id"
                  class="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group bg-white"
                >
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <h5 class="text-sm font-semibold text-gray-900">{{ item.student_name }}</h5>
                      <span class="px-2 py-0.5 rounded-full text-[0.6875rem] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {{ item.period }}
                      </span>
                      <span
                        v-if="item.isLocalOnly"
                        class="px-2 py-0.5 rounded-full text-[0.625rem] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                        title="Tersimpan lokal di browser, belum tersinkronisasi ke Supabase"
                      >
                        Penyimpanan Lokal
                      </span>
                      <span
                        v-else
                        class="px-2 py-0.5 rounded-full text-[0.625rem] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        Supabase Cloud
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-0.5">Program: {{ item.program }} • Mentor: {{ item.mentor_name }}</p>
                    <p class="text-[0.625rem] text-gray-400 mt-1">Dibuat: {{ new Date(item.created_at).toLocaleString('id-ID') }}</p>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      @click="loadSavedReportToView(item)"
                      class="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                    >
                      Buka
                    </button>

                    <button
                      type="button"
                      @click="downloadSavedReportPdf(item)"
                      class="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                      title="Download langsung sebagai file PDF"
                    >
                      <ArrowDownTrayIcon class="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>

                    <button
                      v-if="item.isLocalOnly"
                      type="button"
                      @click="deleteLocalReport(item.id)"
                      class="p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                      title="Hapus dari penyimpanan lokal"
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
        class="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 transition-opacity print:hidden"
      >
        <div class="bg-white rounded-lg max-w-2xl w-full p-6 border border-gray-200 space-y-5">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-base font-semibold text-gray-900">Setup Database Supabase Diperlukan</h3>
                <p class="text-xs text-gray-500">Tabel <code class="bg-gray-100 px-1 py-0.5 rounded font-mono text-[0.6875rem] text-red-600">student_progress_reports</code> belum ada di database cloud.</p>
              </div>
            </div>
            <button
              type="button"
              @click="showSqlSetupModal = false"
              class="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 cursor-pointer"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <div class="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 leading-relaxed">
            <CheckCircleIcon class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Laporan Anda aman:</strong> Data sudah tersimpan di penyimpanan lokal browser. Anda dapat langsung mengunduh PDF atau menyalin format teksnya sekarang juga.
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-gray-700">Script SQL Supabase:</span>
              <button
                type="button"
                @click="copySqlScript"
                class="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900 bg-white px-2.5 py-1 rounded-md border border-gray-300 transition-colors cursor-pointer"
              >
                <ClipboardDocumentCheckIcon class="w-3.5 h-3.5" />
                <span>{{ copiedSql ? 'Tersalin!' : 'Salin Script SQL' }}</span>
              </button>
            </div>

            <div class="relative rounded-md bg-gray-900 border border-gray-800 p-3.5 overflow-hidden">
              <pre class="text-[0.6875rem] text-gray-100 font-mono overflow-x-auto max-h-48 leading-relaxed">{{ sqlScriptContent }}</pre>
            </div>
          </div>

          <div class="bg-gray-50 rounded-md p-4 border border-gray-200 text-xs space-y-2">
            <p class="font-semibold text-gray-800">Cara Mengaktifkan di Supabase (3 Langkah):</p>
            <ol class="list-decimal list-inside space-y-1 text-gray-600 pl-1 text-[0.6875rem] leading-relaxed">
              <li>Klik tombol <strong>"Buka Supabase SQL Editor"</strong> di bawah.</li>
              <li>Tempel (Paste / Ctrl+V) script SQL yang telah disalin ke editor Supabase.</li>
              <li>Klik tombol hijau <strong>"Run"</strong> di Supabase. Selesai!</li>
            </ol>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              @click="showSqlSetupModal = false"
              class="px-4 py-2.5 rounded-md border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Tutup & Gunakan Lokal Saja
            </button>

            <div class="flex items-center gap-2">
              <a
                href="https://supabase.com/dashboard/project/gtgmqhsdiwrqixijzufa/sql/new"
                target="_blank"
                class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-gray-900 hover:bg-black text-white text-xs font-semibold transition-colors"
              >
                <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5" />
                <span>Buka Supabase SQL Editor</span>
              </a>

              <button
                type="button"
                :disabled="isSyncing"
                @click="syncPendingReports"
                class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowPathIcon class="w-3.5 h-3.5" :class="{ 'animate-spin': isSyncing }" />
                <span>{{ isSyncing ? 'Menyinkronkan...' : 'Coba Sinkronkan Sekarang' }}</span>
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
  /* Sembunyikan elemen dashboard & navigasi saat print */
  body, html {
    background: #ffffff !important;
    font-size: 11pt !important;
  }

  header,
  aside,
  button,
  .print\:hidden,
  .lg\:ml-\[260px\],
  .fixed {
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