import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ProgressReportData {
  student_info?: {
    name?: string
    program?: string
    mentor?: string
    period?: string
  }
  attendance?: {
    total_sessions?: number
    attended?: number
    excused?: number
    absent?: number
  }
  module_reports?: Array<{
    name: string
    score: number | string
  }>
  competencies?: Array<{
    description: string
    level: string
  }>
  teacher_notes?: {
    development?: string
    evaluation?: string
    recommendation?: string
  }
}

/**
 * Fetch an image URL and convert it to base64 Data URL
 */
async function getBase64ImageFromUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.warn('Could not load logo as base64:', e)
    return null
  }
}

/**
 * Generates and downloads a clean, professional vector PDF of the progress report
 * using jsPDF + jspdf-autotable (eliminates all html2canvas rendering/padding bugs).
 */
export async function exportProgressReportPdf(
  report: ProgressReportData,
  customFileName?: string
): Promise<void> {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  })

  const left = 14
  const right = 196
  const width = right - left
  let y = 14

  // --- 1. HEADER (KOP LAPORAN) ---
  const logoBase64 = await getBase64ImageFromUrl('/logo-pc.webp')
  if (logoBase64) {
    // Logo kecil di pojok kiri
    doc.addImage(logoBase64, 'WEBP', left, y, 24, 8)
  }

  // Period on the far right
  const period = report.student_info?.period || '-'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(17, 17, 17)
  doc.text(period, right, y + 5, { align: 'right' })

  y += 12

  // Thick Divider
  doc.setDrawColor(26, 58, 83)
  doc.setLineWidth(1.1)
  doc.line(left, y, right, y)

  y += 6

  // Helper function to draw Section Title + Underline
  const drawSectionTitle = (title: string) => {
    // Check if near page bottom before starting a new section
    if (y + 20 > 280) {
      doc.addPage()
      y = 16
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(26, 58, 83)
    doc.text(title.toUpperCase(), left, y)

    doc.setDrawColor(26, 58, 83)
    doc.setLineWidth(0.5)
    doc.line(left, y + 2, right, y + 2)
    y += 5
  }

  // --- 2. INFORMASI SISWA ---
  drawSectionTitle('Informasi Siswa')

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: { left, right: 210 - right },
    body: [
      ['Nama Siswa', report.student_info?.name || '-'],
      ['Program', report.student_info?.program || '-'],
      ['Pengajar / Mentor', report.student_info?.mentor || '-'],
      ['Periode Laporan', report.student_info?.period || '-']
    ],
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 1.2, bottom: 1.2, left: 0, right: 2 }
    },
    columnStyles: {
      0: { cellWidth: 45, textColor: [102, 102, 102] },
      1: { fontStyle: 'bold', textColor: [17, 17, 17] }
    }
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // --- 3. REKAP KEHADIRAN ---
  drawSectionTitle('Rekap Kehadiran')

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    margin: { left, right: 210 - right },
    head: [['Total Pertemuan', 'Hadir', 'Izin / Sakit', 'Tidak Hadir']],
    body: [[
      report.attendance?.total_sessions ?? 0,
      report.attendance?.attended ?? 0,
      report.attendance?.excused ?? 0,
      report.attendance?.absent ?? 0
    ]],
    headStyles: {
      fillColor: [240, 242, 244],
      textColor: [26, 58, 83],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2.5,
      lineColor: [85, 85, 85],
      lineWidth: 0.2
    },
    bodyStyles: {
      fontStyle: 'bold',
      fontSize: 15,
      textColor: [17, 17, 17],
      halign: 'center',
      valign: 'middle',
      cellPadding: 3.5,
      lineColor: [85, 85, 85],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: width / 4 },
      1: { cellWidth: width / 4 },
      2: { cellWidth: width / 4 },
      3: { cellWidth: width / 4 }
    }
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // --- 4. PENILAIAN MODUL PELAJARAN ---
  drawSectionTitle('Penilaian Modul Pelajaran')

  const moduleRows = (report.module_reports || []).map((m) => [m.name, m.score])
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    margin: { left, right: 210 - right },
    head: [['Modul', 'Nilai']],
    body: moduleRows.length > 0 ? moduleRows : [['Belum ada modul yang dinilai', '-']],
    headStyles: {
      fillColor: [240, 242, 244],
      textColor: [26, 58, 83],
      fontStyle: 'bold',
      fontSize: 8.5,
      valign: 'middle',
      cellPadding: 2.5,
      lineColor: [85, 85, 85],
      lineWidth: 0.2
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [17, 17, 17],
      valign: 'middle',
      cellPadding: 2.5,
      lineColor: [85, 85, 85],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center', fontStyle: 'bold', fontSize: 9.5, cellWidth: 26 }
    }
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // --- 5. PENCAPAIAN KOMPETENSI ---
  if (report.competencies && report.competencies.length > 0) {
    drawSectionTitle('Pencapaian Kompetensi')

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      margin: { left, right: 210 - right },
      head: [['Kompetensi', 'Level']],
      body: report.competencies.map((c) => [c.description, c.level]),
      headStyles: {
        fillColor: [240, 242, 244],
        textColor: [26, 58, 83],
        fontStyle: 'bold',
        fontSize: 8.5,
        valign: 'middle',
        cellPadding: 2.5,
        lineColor: [85, 85, 85],
        lineWidth: 0.2
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [17, 17, 17],
        valign: 'middle',
        cellPadding: 2.5,
        lineColor: [85, 85, 85],
        lineWidth: 0.2
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center', fontStyle: 'bold', cellWidth: 48 }
      }
    })

    y = (doc as any).lastAutoTable.finalY + 6
  }

  // --- 6. CATATAN PENGAJAR & REKOMENDASI ---
  if (report.teacher_notes) {
    const notes: string[][] = []
    if (report.teacher_notes.development) {
      notes.push(['Perkembangan Siswa', report.teacher_notes.development])
    }
    if (report.teacher_notes.evaluation) {
      notes.push(['Evaluasi & Peningkatan', report.teacher_notes.evaluation])
    }
    if (report.teacher_notes.recommendation) {
      notes.push(['Rekomendasi', report.teacher_notes.recommendation])
    }

    if (notes.length > 0) {
      drawSectionTitle('Catatan Pengajar & Rekomendasi')

      autoTable(doc, {
        startY: y,
        theme: 'plain',
        margin: { left, right: 210 - right },
        body: notes,
        styles: {
          fontSize: 8.5,
          cellPadding: { top: 1.5, bottom: 1.5, left: 0, right: 2 }
        },
        columnStyles: {
          0: { cellWidth: 45, textColor: [102, 102, 102], valign: 'top' },
          1: { textColor: [17, 17, 17], valign: 'top' }
        }
      })

      y = (doc as any).lastAutoTable.finalY + 6
    }
  }

  // --- 7. TANDA TANGAN ---
  if (y + 35 > 280) {
    doc.addPage()
    y = 20
  }

  const sigCenterX = 165
  const sigLineStart = 135
  const sigLineEnd = 196

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(102, 102, 102)
  doc.text('Mentor Pembimbing,', sigCenterX, y + 4, { align: 'center' })

  y += 20

  doc.setDrawColor(17, 17, 17)
  doc.setLineWidth(0.3)
  doc.line(sigLineStart, y, sigLineEnd, y)

  y += 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(17, 17, 17)
  doc.text(report.student_info?.mentor || 'Mentor Pixelnoid', sigCenterX, y, { align: 'center' })

  y += 3.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(102, 102, 102)
  doc.text('Pixelnoid Academic Team', sigCenterX, y, { align: 'center' })

  // --- 8. FOOTER ON ALL PAGES ---
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setDrawColor(221, 221, 221)
    doc.setLineWidth(0.2)
    doc.line(left, 287, right, 287)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(170, 170, 170)
    doc.text(
      'Diterbitkan oleh Pixelnoid Learning System • Verifikasi dokumen melalui sistem akademik Pixelnoid',
      105,
      291,
      { align: 'center' }
    )
  }

  // Determine file name
  const rawStudent = report.student_info?.name || 'Siswa'
  const rawPeriod = report.student_info?.period || 'Periode'
  const safeStudent = rawStudent.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
  const safePeriod = rawPeriod.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
  const fileName = customFileName || `Laporan_Perkembangan_${safeStudent}_${safePeriod}.pdf`

  // Save / trigger direct browser download
  doc.save(fileName)
}
