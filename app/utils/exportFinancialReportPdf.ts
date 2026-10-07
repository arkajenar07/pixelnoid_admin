import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface FinancialRecordItem {
  id: number
  type: string // 'income' | 'expense'
  category: string
  description: string
  payment_metode?: string
  class?: string
  amount: number
  notes?: string
  status: string // 'lunas' | 'pending' | 'batal' | 'completed' | 'cancelled'
  created_at: string
}

export interface FinancialReportData {
  periodLabel?: string
  generatedAt?: string
  generatedBy?: string
  customTitle?: string
  notes?: string
  records: FinancialRecordItem[]
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

function formatRp(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val || 0)
}

function formatShortDate(d?: string): string {
  if (!d) return '-'
  try {
    const date = new Date(d)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return d || '-'
  }
}

function formatFullDateTime(d?: Date | string): string {
  const date = d ? new Date(d) : new Date()
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Generates and downloads a clean, vector PDF Financial Report
 * using jsPDF + jspdf-autotable.
 */
export async function exportFinancialReportPdf(
  data: FinancialReportData,
  customFileName?: string
): Promise<void> {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  })

  const left = 14
  const right = 196
  const width = right - left // 182mm
  let y = 14

  // --- 1. HEADER (KOP LAPORAN) ---
  const logoBase64 = await getBase64ImageFromUrl('/logo-pc.webp')
  if (logoBase64) {
    // Logo kecil di pojok kiri (sesuai standard Pixelnoid)
    doc.addImage(logoBase64, 'WEBP', left, y, 24, 8)
  }

  // Header Title & Meta on the far right
  const title = (data.customTitle || 'LAPORAN KEUANGAN').toUpperCase()
  const period = data.periodLabel || 'Semua Periode'
  const printDate = data.generatedAt || formatFullDateTime()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(26, 58, 83) // #1a3a53
  doc.text(title, right, y + 3, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(17, 17, 17)
  doc.text(`Periode: ${period}`, right, y + 7.5, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(102, 102, 102)
  doc.text(`Dicetak: ${printDate}`, right, y + 11.5, { align: 'right' })

  y += 15

  // Primary Thick Divider (#1a3a53)
  doc.setDrawColor(26, 58, 83)
  doc.setLineWidth(1.1)
  doc.line(left, y, right, y)

  y += 6

  // Helper function to draw Section Title + Underline
  const drawSectionTitle = (secTitle: string) => {
    if (y + 20 > 280) {
      doc.addPage()
      y = 16
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(26, 58, 83)
    doc.text(secTitle.toUpperCase(), left, y)

    doc.setDrawColor(26, 58, 83)
    doc.setLineWidth(0.5)
    doc.line(left, y + 2, right, y + 2)
    y += 5
  }

  // Calculate Financial Aggregates
  const records = data.records || []
  const settledIncome = records.filter(
    (r) => r.type === 'income' && (r.status === 'lunas' || r.status === 'completed')
  )
  const totalIncome = settledIncome.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

  const settledExpense = records.filter(
    (r) => r.type === 'expense' && (r.status === 'lunas' || r.status === 'completed')
  )
  const totalExpense = settledExpense.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

  const netBalance = totalIncome - totalExpense

  const lunasCount = records.filter(
    (r) => r.status === 'lunas' || r.status === 'completed'
  ).length
  const pendingCount = records.filter((r) => r.status === 'pending').length
  const batalCount = records.filter(
    (r) => r.status === 'batal' || r.status === 'cancelled'
  ).length

  // --- 2. RINGKASAN EKSEKUTIF ---
  drawSectionTitle('Ringkasan Finansial')

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    margin: { left, right: 210 - right },
    head: [['TOTAL PEMASUKAN', 'TOTAL PENGELUARAN', 'SALDO BERSIH', 'REKAP STATUS']],
    body: [
      [
        `${formatRp(totalIncome)}\n${settledIncome.length} Transaksi Lunas`,
        `${formatRp(totalExpense)}\n${settledExpense.length} Transaksi Lunas`,
        `${formatRp(netBalance)}\n${netBalance >= 0 ? 'Surplus Operasional' : 'Defisit Kas'}`,
        `Total: ${records.length} Mutasi\nLunas: ${lunasCount} | Pending: ${pendingCount} | Batal: ${batalCount}`
      ]
    ],
    headStyles: {
      fillColor: [240, 242, 244],
      textColor: [26, 58, 83],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2,
      lineColor: [85, 85, 85],
      lineWidth: 0.2
    },
    bodyStyles: {
      fontStyle: 'bold',
      fontSize: 10,
      textColor: [17, 17, 17],
      halign: 'center',
      valign: 'middle',
      cellPadding: 3,
      lineColor: [85, 85, 85],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: width / 4, textColor: [13, 122, 72] }, // Emerald
      1: { cellWidth: width / 4, textColor: [185, 28, 28] }, // Rose
      2: {
        cellWidth: width / 4,
        textColor: netBalance >= 0 ? [26, 58, 83] : [185, 28, 28]
      },
      3: {
        cellWidth: width / 4,
        fontSize: 8,
        fontStyle: 'normal',
        textColor: [55, 65, 81]
      }
    }
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // --- 3. RINGKASAN ARUS KAS PER KATEGORI (TOP CATEGORIES) ---
  const categoryMap: Record<
    string,
    { category: string; type: string; count: number; total: number }
  > = {}

  for (const r of records) {
    if (r.status !== 'lunas' && r.status !== 'completed') continue
    const catName = r.category?.trim() || 'Lain-lain'
    const key = `${r.type}_${catName.toLowerCase()}`
    if (!categoryMap[key]) {
      categoryMap[key] = {
        category: catName,
        type: r.type,
        count: 0,
        total: 0
      }
    }
    categoryMap[key].count += 1
    categoryMap[key].total += Number(r.amount) || 0
  }

  const categoryList = Object.values(categoryMap).sort((a, b) => b.total - a.total)

  if (categoryList.length > 0) {
    drawSectionTitle('Rincian Arus Kas Berdasarkan Kategori')

    const categoryRows = categoryList.map((item, idx) => {
      const isIncome = item.type === 'income'
      const baseTotal = isIncome ? totalIncome : totalExpense
      const percentage = baseTotal > 0 ? ((item.total / baseTotal) * 100).toFixed(1) : '0'
      return [
        (idx + 1).toString(),
        item.category,
        isIncome ? 'Pemasukan' : 'Pengeluaran',
        item.count.toString(),
        formatRp(item.total),
        `${percentage}%`
      ]
    })

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      margin: { left, right: 210 - right },
      head: [['No', 'Kategori', 'Tipe', 'Jml', 'Total Nominal', 'Porsi']],
      body: categoryRows,
      headStyles: {
        fillColor: [240, 242, 244],
        textColor: [26, 58, 83],
        fontStyle: 'bold',
        fontSize: 8,
        valign: 'middle',
        cellPadding: 2,
        lineColor: [85, 85, 85],
        lineWidth: 0.2
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [17, 17, 17],
        valign: 'middle',
        cellPadding: 2,
        lineColor: [85, 85, 85],
        lineWidth: 0.2
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 26 },
        3: { halign: 'center', cellWidth: 14 },
        4: { halign: 'right', fontStyle: 'bold', cellWidth: 38 },
        5: { halign: 'right', cellWidth: 18 }
      }
    })

    y = (doc as any).lastAutoTable.finalY + 6
  }

  // --- 4. DAFTAR MUTASI / TRANSAKSI DETAIL ---
  drawSectionTitle(`Rincian Mutasi Transaksi (${records.length} Data)`)

  const transactionRows = records.map((r, idx) => {
    const isIncome = r.type === 'income'
    const sign = isIncome ? '+' : '-'
    const descWithClass = r.class
      ? `${r.description || '—'}\nKelas: ${r.class}`
      : r.description || '—'
    const catWithMethod = r.payment_metode
      ? `${r.category || '—'}\nMetode: ${r.payment_metode}`
      : r.category || '—'
    const statusUpper = (r.status || 'lunas').toUpperCase()

    return [
      (idx + 1).toString(),
      formatShortDate(r.created_at),
      descWithClass,
      catWithMethod,
      isIncome ? 'Income' : 'Expense',
      statusUpper,
      `${sign} ${formatRp(Number(r.amount) || 0)}`
    ]
  })

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    showHead: 'everyPage',
    margin: { left, right: 210 - right, bottom: 20 },
    head: [['No', 'Tanggal', 'Deskripsi & Keterangan', 'Kategori & Metode', 'Tipe', 'Status', 'Nominal (Rp)']],
    body: transactionRows.length > 0 ? transactionRows : [['-', '-', 'Tidak ada data transaksi yang sesuai', '-', '-', '-', '-']],
    foot: [
      [
        '',
        '',
        `Total: ${records.length} Transaksi Tercatat`,
        '',
        '',
        'Saldo Kas:',
        formatRp(netBalance)
      ]
    ],
    headStyles: {
      fillColor: [240, 242, 244],
      textColor: [26, 58, 83],
      fontStyle: 'bold',
      fontSize: 8,
      valign: 'middle',
      cellPadding: 2.2,
      lineColor: [85, 85, 85],
      lineWidth: 0.2
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [17, 17, 17],
      valign: 'middle',
      cellPadding: 2,
      lineColor: [85, 85, 85],
      lineWidth: 0.2
    },
    footStyles: {
      fillColor: [240, 242, 244],
      textColor: [26, 58, 83],
      fontStyle: 'bold',
      fontSize: 8,
      valign: 'middle',
      cellPadding: 2.5,
      lineColor: [85, 85, 85],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'left', cellWidth: 50 },
      3: { halign: 'left', cellWidth: 35 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 29 }
    },
    didParseCell: (dataCell) => {
      // Colorize amount column and status column in body
      if (dataCell.section === 'body') {
        const rowData = records[dataCell.row.index]
        if (rowData) {
          if (dataCell.column.index === 6) {
            dataCell.cell.styles.textColor =
              rowData.type === 'income' ? [13, 122, 72] : [185, 28, 28]
          }
          if (dataCell.column.index === 5) {
            const st = (rowData.status || '').toLowerCase()
            if (st === 'lunas' || st === 'completed') {
              dataCell.cell.styles.textColor = [13, 122, 72]
            } else if (st === 'pending') {
              dataCell.cell.styles.textColor = [202, 138, 4]
            } else {
              dataCell.cell.styles.textColor = [107, 114, 128]
            }
          }
        }
      }
    }
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // --- 5. CATATAN TAMBAHAN (JIKA ADA) ---
  if (data.notes && data.notes.trim()) {
    drawSectionTitle('Catatan Laporan')

    autoTable(doc, {
      startY: y,
      theme: 'plain',
      margin: { left, right: 210 - right },
      body: [[data.notes.trim()]],
      styles: {
        fontSize: 8,
        textColor: [55, 65, 81],
        cellPadding: { top: 1.5, bottom: 1.5, left: 1, right: 1 }
      }
    })

    y = (doc as any).lastAutoTable.finalY + 6
  }

  // --- 6. PENGESAHAN & TANDA TANGAN ---
  if (y + 35 > 280) {
    doc.addPage()
    y = 20
  }

  const sigCenterX = 165
  const sigLineStart = 135
  const sigLineEnd = 196

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(102, 102, 102)
  doc.text('Diverifikasi & Disahkan oleh,', sigCenterX, y + 4, { align: 'center' })

  y += 20

  doc.setDrawColor(17, 17, 17)
  doc.setLineWidth(0.3)
  doc.line(sigLineStart, y, sigLineEnd, y)

  y += 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(17, 17, 17)
  doc.text(data.generatedBy || 'Divisi Keuangan Pixelnoid', sigCenterX, y, { align: 'center' })

  y += 3.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(102, 102, 102)
  doc.text('Pixelnoid Digi Academy', sigCenterX, y, { align: 'center' })

  // --- 7. RUNNING FOOTER ON ALL PAGES ---
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setDrawColor(221, 221, 221)
    doc.setLineWidth(0.2)
    doc.line(left, 287, right, 287)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(
      'Dokumen Resmi Pixelnoid Financial System • Rahasia & Terverifikasi',
      left,
      291
    )

    doc.text(`Halaman ${p} dari ${totalPages}`, right, 291, { align: 'right' })
  }

  // File Name Formulation
  const safePeriod = period.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
  const dateStamp = new Date().toISOString().split('T')[0]
  const fileName =
    customFileName || `Laporan_Keuangan_Pixelnoid_${safePeriod}_${dateStamp}.pdf`

  // Download directly
  doc.save(fileName)
}
