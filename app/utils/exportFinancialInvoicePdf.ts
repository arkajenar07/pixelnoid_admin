import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface InvoiceFinancialRecord {
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

function formatFullDate(d?: string): string {
  if (!d) return '-'
  try {
    const date = new Date(d)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return d || '-'
  }
}

function formatDateTime(d?: Date | string): string {
  const date = d ? new Date(d) : new Date()
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function angkaTerbilang(nilai: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ]
  nilai = Math.floor(Math.abs(nilai))
  if (nilai === 0) return 'Nol'
  if (nilai < 12) return bilangan[nilai]
  if (nilai < 20) return `${angkaTerbilang(nilai - 10)} Belas`
  if (nilai < 100) return `${angkaTerbilang(Math.floor(nilai / 10))} Puluh ${angkaTerbilang(nilai % 10)}`.trim()
  if (nilai < 200) return `Seratus ${angkaTerbilang(nilai - 100)}`.trim()
  if (nilai < 1000) return `${angkaTerbilang(Math.floor(nilai / 100))} Ratus ${angkaTerbilang(nilai % 100)}`.trim()
  if (nilai < 2000) return `Seribu ${angkaTerbilang(nilai - 1000)}`.trim()
  if (nilai < 1000000) return `${angkaTerbilang(Math.floor(nilai / 1000))} Ribu ${angkaTerbilang(nilai % 1000)}`.trim()
  if (nilai < 1000000000) return `${angkaTerbilang(Math.floor(nilai / 1000000))} Juta ${angkaTerbilang(nilai % 1000000)}`.trim()
  if (nilai < 1000000000000) return `${angkaTerbilang(Math.floor(nilai / 1000000000))} Miliar ${angkaTerbilang(nilai % 1000000000)}`.trim()
  return `${nilai}`
}

/**
 * Generates and downloads a clean, professional vector PDF invoice / receipt
 * for an individual financial transaction.
 */
export async function exportFinancialInvoicePdf(record: InvoiceFinancialRecord): Promise<void> {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  })

  const left = 14
  const right = 196
  const width = right - left // 182mm
  let y = 14

  const isIncome = record.type === 'income'
  const isLunas = record.status === 'lunas' || record.status === 'completed'
  const isPending = record.status === 'pending'

  // Invoice Number
  const dateObj = record.created_at ? new Date(record.created_at) : new Date()
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const prefix = isIncome ? 'INV' : 'VCH'
  const invoiceNo = `${prefix}-${year}${month}-${String(record.id).padStart(4, '0')}`

  // --- 1. HEADER (KOP INVOICE) ---
  const logoBase64 = await getBase64ImageFromUrl('/logo-pc.webp')
  if (logoBase64) {
    // Logo kecil di kiri atas
    doc.addImage(logoBase64, 'WEBP', left, y, 24, 8)
  }

  // Header Title & No on right
  const docTitle = isIncome ? 'INVOICE / BUKTI PEMBAYARAN' : 'BUKTI PENGELUARAN KAS'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(26, 58, 83) // #1a3a53
  doc.text(docTitle, right, y + 3, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(17, 17, 17)
  doc.text(`No: ${invoiceNo}`, right, y + 8, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(102, 102, 102)
  doc.text(`Tanggal: ${formatFullDate(record.created_at)}`, right, y + 12, { align: 'right' })

  y += 16

  // Primary Thick Divider (#1a3a53)
  doc.setDrawColor(26, 58, 83)
  doc.setLineWidth(1.1)
  doc.line(left, y, right, y)

  y += 6

  // --- 2. STATUS BADGE ---
  let statusText = 'LUNAS / PAID'
  let badgeFill = [220, 252, 231] // emerald-100
  let badgeText = [21, 128, 61] // emerald-700
  let badgeBorder = [134, 239, 172] // emerald-300

  if (isPending) {
    statusText = 'PENDING / MENUNGGU'
    badgeFill = [254, 243, 199]
    badgeText = [180, 83, 9]
    badgeBorder = [252, 211, 77]
  } else if (!isLunas) {
    statusText = (record.status || 'BATAL').toUpperCase()
    badgeFill = [243, 244, 246]
    badgeText = [107, 114, 128]
    badgeBorder = [209, 213, 219]
  }

  // Draw status box
  doc.setFillColor(badgeFill[0], badgeFill[1], badgeFill[2])
  doc.setDrawColor(badgeBorder[0], badgeBorder[1], badgeBorder[2])
  doc.setLineWidth(0.3)
  doc.roundedRect(left, y, 62, 8, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(badgeText[0], badgeText[1], badgeText[2])
  doc.text(`STATUS: ${statusText}`, left + 31, y + 5.2, { align: 'center' })

  // Right side: Transaction Type
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(102, 102, 102)
  doc.text(
    `Tipe: ${isIncome ? 'Pemasukan Kas (Income)' : 'Pengeluaran Kas (Expense)'}`,
    right,
    y + 5.2,
    { align: 'right' }
  )

  y += 13

  // Helper function to draw Section Title
  const drawSectionTitle = (title: string) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(26, 58, 83)
    doc.text(title.toUpperCase(), left, y)

    doc.setDrawColor(26, 58, 83)
    doc.setLineWidth(0.5)
    doc.line(left, y + 2, right, y + 2)
    y += 5
  }

  // --- 3. INFORMASI TRANSAKSI ---
  drawSectionTitle('Informasi Transaksi')

  const infoRows: string[][] = [
    ['Kategori', record.category || '-'],
    ['Deskripsi', record.description || '-'],
    ['Metode Pembayaran', record.payment_metode || 'Transfer / Tunai'],
    ['Terkait Kelas', record.class ? `Kelas ${record.class}` : '-'],
    ['Waktu Pencatatan', formatDateTime(record.created_at)]
  ]

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: { left, right: 210 - right },
    body: infoRows,
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 1.5, bottom: 1.5, left: 0, right: 2 }
    },
    columnStyles: {
      0: { cellWidth: 42, textColor: [102, 102, 102] },
      1: { fontStyle: 'bold', textColor: [17, 17, 17] }
    }
  })

  y = (doc as any).lastAutoTable.finalY + 7

  // --- 4. RINCIAN TAGIHAN / PEMBAYARAN ---
  drawSectionTitle('Rincian Pembayaran')

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    margin: { left, right: 210 - right },
    head: [['No', 'Item / Keterangan', 'Kategori', 'Nominal (Rp)']],
    body: [
      [
        '1',
        record.description || record.category || 'Pembayaran',
        record.category || '-',
        formatRp(Number(record.amount) || 0)
      ]
    ],
    foot: [
      ['', 'TOTAL DIBAYARKAN', '', formatRp(Number(record.amount) || 0)]
    ],
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
      fontSize: 8.5,
      textColor: [17, 17, 17],
      valign: 'middle',
      cellPadding: 3.5,
      lineColor: [85, 85, 85],
      lineWidth: 0.2
    },
    footStyles: {
      fillColor: [240, 242, 244],
      textColor: [26, 58, 83],
      fontStyle: 'bold',
      fontSize: 9.5,
      valign: 'middle',
      cellPadding: 3,
      lineColor: [85, 85, 85],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left', fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 38 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 42 }
    }
  })

  y = (doc as any).lastAutoTable.finalY + 4

  // Terbilang box
  const terbilangText = `${angkaTerbilang(Number(record.amount) || 0)} Rupiah`
  doc.setFillColor(248, 249, 250)
  doc.setDrawColor(209, 213, 219)
  doc.setLineWidth(0.2)
  doc.roundedRect(left, y, width, 8, 1, 1, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(102, 102, 102)
  doc.text('Terbilang: ', left + 3, y + 5)

  doc.setFont('helvetica', 'bolditalic')
  doc.setFontSize(8)
  doc.setTextColor(26, 58, 83)
  doc.text(terbilangText, left + 18, y + 5)

  y += 14

  // --- 5. CATATAN / INFORMASI TAMBAHAN ---
  if (record.notes && record.notes.trim()) {
    drawSectionTitle('Catatan Transaksi')

    autoTable(doc, {
      startY: y,
      theme: 'plain',
      margin: { left, right: 210 - right },
      body: [[record.notes.trim()]],
      styles: {
        fontSize: 8,
        textColor: [55, 65, 81],
        cellPadding: { top: 1, bottom: 1, left: 0, right: 0 }
      }
    })

    y = (doc as any).lastAutoTable.finalY + 6
  }

  // Syarat & Ketentuan Ketentuan Bukti
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(102, 102, 102)
  doc.text('Ketentuan & Keterangan:', left, y)
  y += 3.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(130, 130, 130)
  doc.text('1. Dokumen ini merupakan bukti pembayaran/pengeluaran resmi yang diterbitkan secara elektronik oleh Pixelnoid.', left, y)
  y += 3.2
  doc.text('2. Harap simpan dokumen invoice ini sebagai bukti sah pencatatan dan verifikasi administrasi.', left, y)
  y += 3.2
  doc.text('3. Untuk verifikasi keabsahan pembayaran, silakan hubungi bagian keuangan Pixelnoid Digi Academy.', left, y)

  y += 12

  // --- 6. PENGESAHAN / TANDA TANGAN ---
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
  doc.text('Diterbitkan secara sah oleh,', sigCenterX, y, { align: 'center' })

  y += 18

  doc.setDrawColor(17, 17, 17)
  doc.setLineWidth(0.3)
  doc.line(sigLineStart, y, sigLineEnd, y)

  y += 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(17, 17, 17)
  doc.text('Divisi Keuangan Pixelnoid', sigCenterX, y, { align: 'center' })

  y += 3.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(102, 102, 102)
  doc.text('Pixelnoid Digi Academy', sigCenterX, y, { align: 'center' })

  // --- 7. FOOTER ---
  doc.setDrawColor(221, 221, 221)
  doc.setLineWidth(0.2)
  doc.line(left, 287, right, 287)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(
    'Dokumen Resmi Pixelnoid Financial System • Bukti Transaksi Sah',
    left,
    291
  )

  doc.text(`ID: ${invoiceNo}`, right, 291, { align: 'right' })

  // File Name Formulation
  const safeTitle = (record.description || record.category || 'Transaksi')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
  const fileName = `Invoice_${invoiceNo}_${safeTitle}.pdf`

  // Download directly
  doc.save(fileName)
}
