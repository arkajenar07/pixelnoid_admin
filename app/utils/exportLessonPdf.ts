import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'

export interface ExportLessonPdfOptions {
  lessonTitle: string
  lessonType: string // 'text' | 'video' | 'quiz'
  className?: string
  moduleName?: string
  xpReward?: number
  videoUrl?: string
  blocks?: any[]
  includeHeaderLogo?: boolean
  includeClassInfo?: boolean
  includeAnswers?: boolean // For quiz (true = teacher guide with answer key, false = student worksheet)
  openInNewTab?: boolean
  customFileName?: string
}

/**
 * Fetch an image URL and convert it to base64 Data URL
 */
async function getBase64ImageFromUrl(url: string): Promise<string | null> {
  if (!url) return null
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
    console.warn('[exportLessonPdf] Could not load image as base64:', e)
    return null
  }
}

/**
 * Clean and format HTML strings from rich-text editor to plain text with proper newlines
 */
function cleanHtml(raw?: string): string {
  if (!raw) return ''
  return raw
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Format date for header and document details
 */
function formatFullDateTime(d?: Date | string): string {
  const date = d ? new Date(d) : new Date()
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WIB'
}

/**
 * Truncate long strings with ellipsis
 */
function truncate(str: string, maxLen: number): string {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str
}

/**
 * Generates and downloads a clean, publication-grade vector PDF of a lesson material
 * using jsPDF + jspdf-autotable, matching Pixelnoid brand guidelines.
 */
export async function exportLessonPdf(options: ExportLessonPdfOptions): Promise<void> {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  })

  const left = 16
  const right = 194
  const contentWidth = right - left // 178mm
  const maxBodyY = 274
  const footerY = 286
  let y = 16

  const includeHeaderLogo = options.includeHeaderLogo !== false
  const includeClassInfo = options.includeClassInfo !== false
  const includeAnswers = options.includeAnswers !== false

  // ── Helper: Page Break Guard ──────────────────────────────────────
  const ensureSpace = (neededHeight: number): void => {
    if (y + neededHeight > maxBodyY) {
      doc.addPage()
      y = 22 // Top margin for subsequent pages
    }
  }

  // ── 1. HEADER (KOP SURAT DOKUMEN) ─────────────────────────────────
  if (includeHeaderLogo) {
    const logoBase64 = await getBase64ImageFromUrl('/logo-pc.webp')
    if (logoBase64) {
      doc.addImage(logoBase64, 'WEBP', left, y, 26, 8.5)
    } else {
      // Fallback text logo
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(85, 48, 171)
      doc.text('PIXELNOID', left, y + 6)
    }

    // Top document category and meta (right aligned)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(85, 48, 171)
    doc.text('MODUL PEMBELAJARAN PIXELNOID', right, y + 3, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128)
    doc.text(`Dicetak: ${formatFullDateTime()}`, right, y + 7, { align: 'right' })

    y += 12

    // Header divider line (Brand purple + light gray accent)
    doc.setDrawColor(85, 48, 171)
    doc.setLineWidth(0.8)
    doc.line(left, y, right, y)

    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.2)
    doc.line(left, y + 1, right, y + 1)

    y += 6
  }

  // ── 2. LESSON TITLE & BADGES ──────────────────────────────────────
  // Type badge label & color
  const typeLabel = options.lessonType === 'video'
    ? 'VIDEO LESSON'
    : options.lessonType === 'quiz'
      ? 'KUIS & EVALUASI'
      : 'MATERI TEKS'

  // Type & XP tags
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  if (options.lessonType === 'video') {
    doc.setTextColor(37, 99, 235) // blue
  } else if (options.lessonType === 'quiz') {
    doc.setTextColor(217, 119, 6) // amber
  } else {
    doc.setTextColor(85, 48, 171) // purple
  }
  doc.text(`[ ${typeLabel} ]`, left, y)

  if (options.xpReward && options.xpReward > 0) {
    doc.setTextColor(180, 83, 9)
    doc.text(`+${options.xpReward} XP Reward`, left + 35, y)
  }

  y += 5

  // Big Lesson Title
  const lessonTitle = options.lessonTitle.trim() || 'Lesson Tanpa Judul'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(17, 24, 39)
  const titleLines = doc.splitTextToSize(lessonTitle, contentWidth)
  for (const tLine of titleLines) {
    ensureSpace(7)
    doc.text(tLine, left, y)
    y += 6.5
  }

  y += 1

  // ── 3. METADATA BOX (KELAS & MODUL) ───────────────────────────────
  if (includeClassInfo && (options.className || options.moduleName)) {
    ensureSpace(12)
    const boxHeight = 10
    doc.setFillColor(249, 250, 251)
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.3)
    doc.roundedRect(left, y, contentWidth, boxHeight, 1.5, 1.5, 'FD')

    // Left accent dot
    doc.setFillColor(85, 48, 171)
    doc.circle(left + 4, y + 5, 1, 'F')

    let metaX = left + 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(55, 65, 81)

    if (options.className) {
      doc.text('Kelas:', metaX, y + 6)
      metaX += doc.getTextWidth('Kelas:') + 1.5
      doc.setFont('helvetica', 'normal')
      doc.text(truncate(options.className, 35), metaX, y + 6)
      metaX += doc.getTextWidth(truncate(options.className, 35)) + 4
    }

    if (options.moduleName) {
      doc.setFont('helvetica', 'bold')
      doc.text('•  Modul:', metaX, y + 6)
      metaX += doc.getTextWidth('•  Modul:') + 1.5
      doc.setFont('helvetica', 'normal')
      doc.text(truncate(options.moduleName, 35), metaX, y + 6)
    }

    y += boxHeight + 6
  } else {
    y += 3
  }

  // ── 4. CONTENT RENDERING BY LESSON TYPE ────────────────────────────

  // ──── A. QUIZ LESSON TYPE ─────────────────────────────────────────
  if (options.lessonType === 'quiz') {
    const rawQuestions = Array.isArray(options.blocks) ? options.blocks : []
    const questions = rawQuestions.filter(q => q && typeof q === 'object' && (q.question || q.options))

    // Header Quiz
    ensureSpace(14)
    doc.setFillColor(254, 243, 199)
    doc.setDrawColor(251, 191, 36)
    doc.roundedRect(left, y, contentWidth, 12, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(146, 64, 14)
    doc.text(`KUIS EVALUASI — TOTAL ${questions.length} SOAL`, left + 4, y + 5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(180, 83, 9)
    const modeDesc = includeAnswers
      ? 'Petunjuk: Lembar ini memuat kunci jawaban dan pembahasan lengkap.'
      : 'Petunjuk: Pilihlah salah satu jawaban yang paling tepat pada lembar di bawah ini.'
    doc.text(modeDesc, left + 4, y + 9.5)

    y += 17

    if (questions.length === 0) {
      ensureSpace(12)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(156, 163, 175)
      doc.text('(Belum ada butir soal kuis yang ditambahkan pada lesson ini)', left, y)
      y += 8
    } else {
      questions.forEach((q, qIdx) => {
        const questionText = cleanHtml(q.question) || 'Pertanyaan belum diisi'
        const qLines = doc.splitTextToSize(questionText, contentWidth - 14)
        const optionsList: string[] = Array.isArray(q.options) ? q.options : []
        const correctAnswer = typeof q.correct_answer === 'number' ? q.correct_answer : 0
        const explanation = cleanHtml(q.explanation)

        // Ensure enough space for at least question title and 2 options
        ensureSpace(18 + qLines.length * 4.5)

        // Question number indicator pill
        doc.setFillColor(85, 48, 171)
        doc.roundedRect(left, y, 14, 5.5, 1, 1, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(255, 255, 255)
        doc.text(`SOAL ${qIdx + 1}`, left + 7, y + 3.8, { align: 'center' })

        // Question text
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(17, 24, 39)
        let qY = y + 4
        for (let i = 0; i < qLines.length; i++) {
          if (i === 0) {
            doc.text(qLines[i], left + 17, qY)
          } else {
            ensureSpace(5)
            doc.text(qLines[i], left + 17, qY)
          }
          qY += 4.6
        }
        y = Math.max(y + 8, qY + 1)

        // Options list
        const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F']
        optionsList.forEach((opt, optIdx) => {
          const letter = optionLetters[optIdx] || String(optIdx + 1)
          const optText = cleanHtml(opt)
          const isCorrect = optIdx === correctAnswer
          const optLines = doc.splitTextToSize(optText, contentWidth - 18)

          ensureSpace(optLines.length * 4.2 + 3)

          if (includeAnswers && isCorrect) {
            // Correct Answer Highlight
            doc.setFillColor(236, 253, 245)
            doc.setDrawColor(16, 185, 129)
            doc.roundedRect(left + 4, y, contentWidth - 4, optLines.length * 4.2 + 3, 1, 1, 'FD')

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8)
            doc.setTextColor(5, 150, 105)
            doc.text(`[✓] ${letter}.`, left + 7, y + 3.6)

            doc.setFont('helvetica', 'bold')
            doc.setTextColor(6, 95, 70)
            let optY = y + 3.6
            optLines.forEach((ol: string, idx: number) => {
              doc.text(ol + (idx === 0 ? ' (Kunci Jawaban)' : ''), left + 18, optY)
              optY += 4
            })
            y += optLines.length * 4.2 + 4.5
          } else {
            // Regular Option
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8)
            doc.setTextColor(107, 114, 128)
            doc.text(`[   ] ${letter}.`, left + 7, y + 3.5)

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8.5)
            doc.setTextColor(31, 41, 55)
            let optY = y + 3.5
            optLines.forEach((ol: string) => {
              doc.text(ol, left + 18, optY)
              optY += 4
            })
            y += optLines.length * 4 + 2
          }
        })

        // Explanation / Pembahasan
        if (includeAnswers && explanation) {
          const expLines = doc.splitTextToSize(explanation, contentWidth - 14)
          const expHeight = expLines.length * 4 + 6
          ensureSpace(expHeight + 2)

          doc.setFillColor(243, 244, 246)
          doc.setDrawColor(209, 213, 219)
          doc.roundedRect(left + 4, y + 1, contentWidth - 4, expHeight, 1, 1, 'FD')

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7.5)
          doc.setTextColor(75, 85, 99)
          doc.text('Pembahasan:', left + 8, y + 5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(55, 65, 81)
          let expY = y + 5
          expLines.forEach((el: string, idx: number) => {
            if (idx === 0) {
              doc.text(el, left + 27, expY)
            } else {
              doc.text(el, left + 8, expY)
            }
            expY += 3.8
          })
          y += expHeight + 4
        }

        // Question separator line
        ensureSpace(6)
        doc.setDrawColor(243, 244, 246)
        doc.setLineWidth(0.2)
        doc.line(left, y + 1, right, y + 1)
        y += 5
      })
    }
  }

  // ──── B. VIDEO LESSON TYPE ─────────────────────────────────────────
  else if (options.lessonType === 'video') {
    const videoUrl = options.videoUrl?.trim() || ''

    // Video Player Box / Card
    ensureSpace(34)
    doc.setFillColor(239, 246, 255)
    doc.setDrawColor(191, 219, 254)
    doc.roundedRect(left, y, contentWidth, 28, 2, 2, 'FD')

    // Left Icon Badge
    doc.setFillColor(37, 99, 235)
    doc.roundedRect(left + 4, y + 4, 8, 8, 1.5, 1.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('▶', left + 8, y + 9.5, { align: 'center' })

    // Title inside card
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 64, 175)
    doc.text('Video Pembelajaran Lesson', left + 16, y + 8)

    // URL link
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(75, 85, 99)
    doc.text('Tautan Akses Video:', left + 16, y + 13.5)

    if (videoUrl) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(37, 99, 235)
      doc.textWithLink(truncate(videoUrl, 65), left + 16, y + 18, { url: videoUrl })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(107, 114, 128)
      doc.text('Klik tautan atau pindai kode QR untuk langsung menyaksikan materi video di browser.', left + 16, y + 23)

      // QR Code on right side
      try {
        const qrDataUrl = await QRCode.toDataURL(videoUrl, { width: 120, margin: 1 })
        doc.addImage(qrDataUrl, 'PNG', right - 24, y + 3, 22, 22)
      } catch (qrErr) {
        console.warn('QR code generation skipped:', qrErr)
      }
    } else {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text('(Tautan video belum disematkan pada materi ini)', left + 16, y + 18)
    }

    y += 34

    // Summary Notes Section Header
    ensureSpace(12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(17, 24, 39)
    doc.text('Ringkasan & Catatan Materi Video', left, y)
    doc.setDrawColor(85, 48, 171)
    doc.setLineWidth(0.6)
    doc.line(left, y + 1.5, left + 28, y + 1.5)
    y += 7

    // Render description blocks if any
    const rawBlocks = Array.isArray(options.blocks) ? options.blocks : []
    if (rawBlocks.length === 0 || !rawBlocks[0]?.content) {
      ensureSpace(10)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(156, 163, 175)
      doc.text('(Tidak ada catatan teks tambahan pada materi video ini)', left, y)
      y += 8
    } else {
      for (const b of rawBlocks) {
        const content = cleanHtml(b.content)
        if (!content) continue
        const lines = doc.splitTextToSize(content, contentWidth)
        for (const l of lines) {
          ensureSpace(5)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9.5)
          doc.setTextColor(55, 65, 81)
          doc.text(l, left, y)
          y += 5
        }
        y += 2
      }
    }
  }

  // ──── C. TEXT LESSON TYPE (BLOCKS LIST) ────────────────────────────
  else {
    const rawBlocks = Array.isArray(options.blocks) ? options.blocks : []

    if (rawBlocks.length === 0) {
      ensureSpace(12)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9.5)
      doc.setTextColor(156, 163, 175)
      doc.text('(Lesson ini belum memiliki konten materi)', left, y)
      y += 8
    } else {
      for (let bIndex = 0; bIndex < rawBlocks.length; bIndex++) {
        const block = rawBlocks[bIndex]
        if (!block) continue

        const bType = block.type || 'paragraph'

        // 1. Heading 1
        if (bType === 'heading1') {
          const text = cleanHtml(block.content)
          if (!text) continue
          ensureSpace(14)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(14)
          doc.setTextColor(17, 24, 39)
          const lines = doc.splitTextToSize(text, contentWidth)
          for (const l of lines) {
            ensureSpace(6.5)
            doc.text(l, left, y)
            y += 6
          }
          // Small accent line
          doc.setDrawColor(85, 48, 171)
          doc.setLineWidth(0.6)
          doc.line(left, y, left + 20, y)
          y += 5
        }

        // 2. Heading 2
        else if (bType === 'heading2') {
          const text = cleanHtml(block.content)
          if (!text) continue
          ensureSpace(12)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.setTextColor(31, 41, 55)
          const lines = doc.splitTextToSize(text, contentWidth)
          for (const l of lines) {
            ensureSpace(5.5)
            doc.text(l, left, y)
            y += 5.5
          }
          y += 3
        }

        // 3. Heading 3
        else if (bType === 'heading3') {
          const text = cleanHtml(block.content)
          if (!text) continue
          ensureSpace(10)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10.5)
          doc.setTextColor(55, 65, 81)
          const lines = doc.splitTextToSize(text, contentWidth)
          for (const l of lines) {
            ensureSpace(5)
            doc.text(l, left, y)
            y += 5
          }
          y += 2.5
        }

        // 4. Paragraph
        else if (bType === 'paragraph') {
          const text = cleanHtml(block.content)
          if (!text) {
            y += 2
            continue
          }
          const subParagraphs = text.split('\n')
          for (const sub of subParagraphs) {
            if (!sub.trim()) {
              y += 2
              continue
            }
            const lines = doc.splitTextToSize(sub, contentWidth)
            for (const l of lines) {
              ensureSpace(5)
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(9.5)
              doc.setTextColor(31, 41, 55)
              doc.text(l, left, y)
              y += 4.8
            }
            y += 1.5
          }
          y += 1.5
        }

        // 5. Bullet List
        else if (bType === 'bulletList') {
          const items: string[] = Array.isArray(block.items) ? block.items : []
          for (const item of items) {
            const text = cleanHtml(item)
            if (!text) continue
            const lines = doc.splitTextToSize(text, contentWidth - 8)
            ensureSpace(lines.length * 4.6 + 2)

            // Draw bullet point
            doc.setFillColor(85, 48, 171)
            doc.circle(left + 2.5, y + 2.5, 0.9, 'F')

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9.5)
            doc.setTextColor(31, 41, 55)
            for (const l of lines) {
              ensureSpace(5)
              doc.text(l, left + 7, y + 3.2)
              y += 4.6
            }
            y += 0.5
          }
          y += 2
        }

        // 6. Numbered List
        else if (bType === 'numberedList') {
          const items: string[] = Array.isArray(block.items) ? block.items : []
          items.forEach((item, numIdx) => {
            const text = cleanHtml(item)
            if (!text) return
            const lines = doc.splitTextToSize(text, contentWidth - 9)
            ensureSpace(lines.length * 4.6 + 2)

            // Number prefix
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(9)
            doc.setTextColor(85, 48, 171)
            doc.text(`${numIdx + 1}.`, left + 1.5, y + 3.2)

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9.5)
            doc.setTextColor(31, 41, 55)
            for (const l of lines) {
              ensureSpace(5)
              doc.text(l, left + 8, y + 3.2)
              y += 4.6
            }
            y += 0.5
          })
          y += 2
        }

        // 7. Quote Block
        else if (bType === 'quote') {
          const text = cleanHtml(block.content)
          if (!text) continue
          const lines = doc.splitTextToSize(text, contentWidth - 12)
          const boxHeight = lines.length * 4.8 + 6

          ensureSpace(boxHeight + 2)

          // Background box
          doc.setFillColor(249, 250, 251)
          doc.rect(left, y, contentWidth, boxHeight, 'F')

          // Left purple border
          doc.setFillColor(85, 48, 171)
          doc.rect(left, y, 1.5, boxHeight, 'F')

          doc.setFont('helvetica', 'italic')
          doc.setFontSize(9.5)
          doc.setTextColor(75, 85, 99)
          let qY = y + 4.5
          for (const l of lines) {
            doc.text(l, left + 6, qY)
            qY += 4.8
          }
          y += boxHeight + 4
        }

        // 8. Callout Box
        else if (bType === 'callout') {
          const text = cleanHtml(block.content)
          if (!text) continue
          const lines = doc.splitTextToSize(text, contentWidth - 14)
          const boxHeight = lines.length * 4.6 + 10

          ensureSpace(boxHeight + 2)

          // Light purple rounded box
          doc.setFillColor(245, 243, 255)
          doc.setDrawColor(221, 214, 254)
          doc.roundedRect(left, y, contentWidth, boxHeight, 1.5, 1.5, 'FD')

          // Left accent stripe
          doc.setFillColor(85, 48, 171)
          doc.rect(left, y, 1.5, boxHeight, 'F')

          // Header
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8)
          doc.setTextColor(85, 48, 171)
          doc.text('CATATAN PENTING', left + 6, y + 5)

          // Content
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(55, 65, 81)
          let cY = y + 9.5
          for (const l of lines) {
            doc.text(l, left + 6, cY)
            cY += 4.6
          }
          y += boxHeight + 4
        }

        // 9. Code Block
        else if (bType === 'code') {
          const rawCode = block.content || ''
          const language = (block.language || 'kode').toUpperCase()
          const codeLines = rawCode.split('\n')

          ensureSpace(16)

          // Code header bar
          doc.setFillColor(241, 245, 249)
          doc.setDrawColor(203, 213, 225)
          doc.setLineWidth(0.3)
          doc.rect(left, y, contentWidth, 6, 'FD')

          doc.setFont('courier', 'bold')
          doc.setFontSize(7.5)
          doc.setTextColor(71, 85, 105)
          doc.text(`KODE [ ${language} ]`, left + 4, y + 4.2)

          y += 6

          // Code body lines
          for (let cIdx = 0; cIdx < codeLines.length; cIdx++) {
            const codeLine = codeLines[cIdx].replace(/\t/g, '    ')
            ensureSpace(5.5)

            // Line background
            doc.setFillColor(248, 250, 252)
            doc.rect(left, y, contentWidth, 4.6, 'F')

            // Line number
            doc.setFont('courier', 'normal')
            doc.setFontSize(7.5)
            doc.setTextColor(148, 163, 184)
            doc.text(String(cIdx + 1).padStart(3, ' '), left + 2, y + 3.2)

            // Line content
            doc.setFont('courier', 'normal')
            doc.setFontSize(8)
            doc.setTextColor(15, 23, 42)
            doc.text(truncate(codeLine, 88), left + 14, y + 3.2)

            y += 4.6
          }

          // Bottom border for code block
          doc.setDrawColor(203, 213, 225)
          doc.setLineWidth(0.3)
          doc.line(left, y, right, y)
          y += 4
        }

        // 10. Table Block
        else if (bType === 'table' && block.tableData?.rows?.length) {
          const rawRows: string[][] = block.tableData.rows
          const cleanedRows = rawRows.map(r => r.map(c => cleanHtml(c)))
          const hasHeadings = !!block.tableData.withHeadings && cleanedRows.length > 1
          const head = hasHeadings ? [cleanedRows[0]] : []
          const body = hasHeadings ? cleanedRows.slice(1) : cleanedRows

          ensureSpace(20)

          autoTable(doc, {
            startY: y,
            head: head.length > 0 ? head : undefined,
            body: body,
            theme: 'grid',
            margin: { left, right: 210 - right },
            headStyles: {
              fillColor: [85, 48, 171],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 8.5,
              cellPadding: 2.5,
              valign: 'middle'
            },
            bodyStyles: {
              fontSize: 8,
              textColor: [31, 41, 55],
              cellPadding: 2.2,
              valign: 'top'
            },
            alternateRowStyles: {
              fillColor: [249, 250, 251]
            },
            styles: {
              lineColor: [229, 231, 235],
              lineWidth: 0.2,
              overflow: 'linebreak'
            }
          })

          y = ((doc as any).lastAutoTable?.finalY || y) + 4
        }

        // 11. Image Block
        else if (bType === 'image' && block.url) {
          const imgUrl = block.url
          const caption = cleanHtml(block.caption)
          let loaded = false

          if (imgUrl.startsWith('data:image/') || imgUrl.startsWith('http')) {
            const base64Data = await getBase64ImageFromUrl(imgUrl)
            if (base64Data) {
              try {
                // Calculate size proportionally
                const img = new Image()
                img.src = base64Data
                await new Promise((res) => { img.onload = res; img.onerror = res })

                const naturalW = img.width || 400
                const naturalH = img.height || 250
                const maxW = contentWidth
                const maxH = 80 // max 80mm height
                const scale = Math.min(maxW / naturalW, maxH / naturalH)
                const renderW = Math.min(contentWidth, naturalW * scale)
                const renderH = naturalH * scale
                const renderX = left + (contentWidth - renderW) / 2

                ensureSpace(renderH + (caption ? 10 : 4))
                doc.addImage(base64Data, 'JPEG', renderX, y, renderW, renderH)
                y += renderH + 2

                if (caption) {
                  doc.setFont('helvetica', 'italic')
                  doc.setFontSize(7.5)
                  doc.setTextColor(107, 114, 128)
                  doc.text(caption, 105, y + 2, { align: 'center' })
                  y += 5
                }
                loaded = true
              } catch (imgErr) {
                console.warn('Could not render image to PDF:', imgErr)
              }
            }
          }

          if (!loaded) {
            // Placeholder box if image couldn't load
            ensureSpace(14)
            doc.setFillColor(249, 250, 251)
            doc.setDrawColor(209, 213, 219)
            doc.roundedRect(left, y, contentWidth, 12, 1, 1, 'FD')

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8)
            doc.setTextColor(107, 114, 128)
            doc.text(`[Lampiran Gambar]: ${caption || truncate(imgUrl, 60)}`, left + 4, y + 7)
            y += 16
          }
        }

        // 12. Bookmark Block
        else if (bType === 'bookmark' && block.url) {
          const bmTitle = cleanHtml(block.bookmarkData?.title || 'Tautan Referensi Materi')
          const bmDesc = cleanHtml(block.bookmarkData?.description)
          const bmUrl = block.url

          ensureSpace(18)
          doc.setFillColor(249, 250, 251)
          doc.setDrawColor(229, 231, 235)
          doc.roundedRect(left, y, contentWidth, 15, 1.5, 1.5, 'FD')

          // Left purple indicator
          doc.setFillColor(85, 48, 171)
          doc.rect(left, y, 1.2, 15, 'F')

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8.5)
          doc.setTextColor(17, 24, 39)
          doc.text(truncate(bmTitle, 75), left + 6, y + 5)

          if (bmDesc) {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(7.5)
            doc.setTextColor(107, 114, 128)
            doc.text(truncate(bmDesc, 80), left + 6, y + 9)
          }

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7)
          doc.setTextColor(85, 48, 171)
          doc.textWithLink(truncate(bmUrl, 75), left + 6, y + 13, { url: bmUrl })

          y += 19
        }

        // 13. Canva Slide Block
        else if (bType === 'canva' && block.url) {
          ensureSpace(16)
          doc.setFillColor(250, 245, 255)
          doc.setDrawColor(216, 180, 254)
          doc.roundedRect(left, y, contentWidth, 14, 1.5, 1.5, 'FD')

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8.5)
          doc.setTextColor(126, 34, 206)
          doc.text('PRESENTASI SLIDE CANVA', left + 6, y + 5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7.5)
          doc.setTextColor(85, 48, 171)
          doc.textWithLink(truncate(block.url, 75), left + 6, y + 9.5, { url: block.url })

          doc.setFont('helvetica', 'italic')
          doc.setFontSize(6.5)
          doc.setTextColor(147, 51, 234)
          doc.text('(Buka tautan ini di browser untuk menyimak dan menavigasi slide secara interaktif)', left + 6, y + 13)

          y += 18
        }

        // 14. Divider Block
        else if (bType === 'divider') {
          ensureSpace(8)
          doc.setDrawColor(229, 231, 235)
          doc.setLineWidth(0.3)
          doc.line(left, y + 3, right, y + 3)
          y += 7
        }
      }
    }
  }

  // ── 5. RUNNING HEADER & RUNNING FOOTER ON ALL PAGES ───────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)

    // Running Header (Pages 2+)
    if (p > 1) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(156, 163, 175)
      doc.text(`Pixelnoid • ${truncate(lessonTitle, 55)}`, left, 11)

      const headerRightText = truncate(options.className || 'Modul Pembelajaran', 35)
      doc.text(headerRightText, right, 11, { align: 'right' })

      doc.setDrawColor(243, 244, 246)
      doc.setLineWidth(0.2)
      doc.line(left, 13, right, 13)
    }

    // Running Footer (All Pages)
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.2)
    doc.line(left, footerY, right, footerY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(156, 163, 175)
    doc.text('Pixelnoid Digi Academy • Dokumen Resmi Materi Pembelajaran', left, footerY + 4)

    doc.text(`Halaman ${p} dari ${totalPages}`, right, footerY + 4, { align: 'right' })
  }

  // ── 6. FILE DOWNLOAD & TAB PREVIEW ────────────────────────────────
  const safeTitle = lessonTitle.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Lesson'
  const dateStamp = new Date().toISOString().split('T')[0]
  const fileName = options.customFileName || `Materi_${safeTitle}_${dateStamp}.pdf`

  if (options.openInNewTab && typeof window !== 'undefined') {
    const blobUrl = doc.output('bloburl')
    window.open(blobUrl, '_blank')
  }

  doc.save(fileName)
}
