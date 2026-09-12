export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = (config.geminiApiKey || process.env.GEMINI_API || '').trim()

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'GEMINI_API belum dikonfigurasi pada .env sistem.'
    })
  }

  const body = await readBody(event)

  if (!body || !body.student || !body.attendance || !body.modules) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Format input tidak lengkap. Harap sertakan student, attendance, dan modules.'
    })
  }

  const studentName = body.student.name || 'Siswa'
  const program = body.student.program || '-'
  const mentor = body.student.mentor || '-'
  const period = body.student.period || '-'

  const systemPrompt = `Anda adalah AI Student Progress Report Generator resmi untuk lembaga pendidikan teknologi Pixelnoid.
Tugas Anda adalah mengubah input terstruktur dari mentor menjadi laporan perkembangan siswa yang siap digunakan, profesional, terstruktur, objektif, dan cocok dibaca oleh siswa maupun orang tua murid.

PRINSIP UTAMA:
Mentor mengisi data faktual + nilai + keyword observasi. Anda menghasilkan narasi laporan yang natural dan kontekstual.
Anda TIDAK BOLEH mengarang fakta baru, materi baru yang tidak diajarkan, pencapaian tanpa bukti, atau kondisi siswa yang tidak terdapat dalam input mentor!

ATURAN GENERASI (WAJIB DIPATUHI):
1. Gunakan HANYA informasi dari input mentor.
2. Jangan membuat fakta baru atau materi/tools yang tidak disebutkan dalam modul/input.
3. Jangan menaikkan atau menurunkan pencapaian tanpa dasar faktual.
4. Narasi harus terdengar profesional, natural, objektif, dan cocok dibaca siswa maupun orang tua.
5. Hindari pengulangan kalimat antar bagian.
6. Nilai (score) dan data kehadiran (attendance) harus persis sama dengan input.
7. Keyword mentor harus diterjemahkan menjadi kalimat yang mengalir, padu, dan kontekstual.
8. Jika keyword improvement kosong, jangan memaksakan kekurangan atau mencari-cari kelemahan.
9. Jika komentar tambahan kosong, abaikan bagian tersebut.
10. Petakan kompetensi berdasarkan modul, nilai, dan keyword dengan pedoman:
    - 90–100 -> Mahir
    - 80–89  -> Berkembang menuju Mahir
    - 70–79  -> Berkembang
    - 60–69  -> Perlu Penguatan
    - <60    -> Perlu Pendampingan
    (Tingkat kompetensi boleh disesuaikan berdasarkan keyword kekuatan/kendala dari mentor).
11. Gunakan Bahasa Indonesia yang jelas, hangat, edukatif, dan tidak terlalu kaku.
12. Jangan menggunakan klaim berlebihan seperti 'menguasai seluruh materi' kecuali didukung fakta input.
13. Prioritaskan narasi perkembangan siswa, bukan hanya mendeskripsikan ulang topik materi.

FORMAT OUTPUT WAJIB:
Keluarkan HANYA JSON valid tanpa teks markdown pembungkus dengan struktur:
{
  "student_info": {
    "name": "${studentName}",
    "program": "${program}",
    "mentor": "${mentor}",
    "period": "${period}"
  },
  "attendance": {
    "total_sessions": ${Number(body.attendance.total_sessions || 0)},
    "attended": ${Number(body.attendance.attended || 0)},
    "excused": ${Number(body.attendance.excused || 0)},
    "absent": ${Number(body.attendance.absent || 0)}
  },
  "module_reports": [
    {
      "name": "string (nama modul sesuai input)",
      "score": number (nilai persis sesuai input),
      "notes": {
        "study_notes": "string (uraian materi yang dipelajari siswa secara ringkas dan relevan)",
        "performance": "string (uraian performa siswa, kekuatan, dan hal yang perlu ditingkatkan jika ada)"
      }
    }
  ],
  "competencies": [
    {
      "description": "string (deskripsi kompetensi spesifik)",
      "level": "Mahir | Berkembang menuju Mahir | Berkembang | Perlu Penguatan | Perlu Pendampingan"
    }
  ],
  "teacher_notes": {
    "development": "string (narasi perkembangan siswa selama periode)",
    "evaluation": "string (evaluasi area yang perlu ditingkatkan/dilatih lebih lanjut)",
    "recommendation": "string (rekomendasi konkret fokus belajar ke depan)"
  }
}`

  const candidateModels = [
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-flash-latest'
  ]

  let parsedOutput: any = null
  let lastError: any = null

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemPrompt}\n\nDATA INPUT MENTOR:\n${JSON.stringify(body, null, 2)}`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3
          }
        })
      })

      const data = await response.json()

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        let rawText = data.candidates[0].content.parts[0].text.trim()
        // Hapus markdown wrapper jika ada
        if (rawText.startsWith('```json')) {
          rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (rawText.startsWith('```')) {
          rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        parsedOutput = JSON.parse(rawText)
        break
      } else if (data.error) {
        lastError = data.error.message || JSON.stringify(data.error)
        console.warn(`Model ${model} returned error:`, lastError)
      }
    } catch (err: any) {
      lastError = err.message
      console.warn(`Model ${model} fetch exception:`, err)
    }
  }

  if (!parsedOutput) {
    throw createError({
      statusCode: 502,
      statusMessage: `Gagal menghasilkan laporan via Gemini AI. Error: ${lastError || 'Tidak ada respons valid dari model.'}`
    })
  }

  // Validasi & normalisasi data
  parsedOutput.student_info = {
    name: body.student.name || parsedOutput.student_info?.name || '',
    program: body.student.program || parsedOutput.student_info?.program || '',
    mentor: body.student.mentor || parsedOutput.student_info?.mentor || '',
    period: body.student.period || parsedOutput.student_info?.period || ''
  }

  parsedOutput.attendance = {
    total_sessions: Number(body.attendance.total_sessions ?? parsedOutput.attendance?.total_sessions ?? 0),
    attended: Number(body.attendance.attended ?? parsedOutput.attendance?.attended ?? 0),
    excused: Number(body.attendance.excused ?? parsedOutput.attendance?.excused ?? 0),
    absent: Number(body.attendance.absent ?? parsedOutput.attendance?.absent ?? 0)
  }

  // Susun human-readable plain text format sesuai Section 3 di README
  const humanReadableLines: string[] = []
  humanReadableLines.push('INFORMASI SISWA\n')
  humanReadableLines.push(`Nama Siswa\n${parsedOutput.student_info.name}\n`)
  humanReadableLines.push(`Program\n${parsedOutput.student_info.program}\n`)
  humanReadableLines.push(`Pengajar / Mentor\n${parsedOutput.student_info.mentor}\n`)
  humanReadableLines.push(`Periode Laporan\n${parsedOutput.student_info.period}\n\n`)

  humanReadableLines.push('REKAP KEHADIRAN\n')
  humanReadableLines.push(`Total Pertemuan : ${parsedOutput.attendance.total_sessions}`)
  humanReadableLines.push(`Hadir           : ${parsedOutput.attendance.attended}`)
  humanReadableLines.push(`Izin / Sakit    : ${parsedOutput.attendance.excused}`)
  humanReadableLines.push(`Tidak Hadir     : ${parsedOutput.attendance.absent}\n\n`)

  humanReadableLines.push('PENILAIAN MODUL PELAJARAN\n')
  if (Array.isArray(parsedOutput.module_reports)) {
    parsedOutput.module_reports.forEach((mod: any) => {
      humanReadableLines.push(`Modul:\n${mod.name}\n`)
      humanReadableLines.push(`Nilai:\n${mod.score}\n`)
      humanReadableLines.push('Catatan:')
      const studyNotes = mod.notes?.study_notes || mod.study_notes || ''
      const performance = mod.notes?.performance || mod.performance || ''
      if (studyNotes) {
        humanReadableLines.push(studyNotes.startsWith('Catatan belajar:') ? studyNotes : `Catatan belajar: ${studyNotes}`)
      }
      if (performance) {
        humanReadableLines.push(performance.startsWith('Performa:') ? performance : `Performa: ${performance}`)
      }
      humanReadableLines.push('\n')
    })
  }

  humanReadableLines.push('PENCAPAIAN KOMPETENSI\n')
  humanReadableLines.push('Kompetensi:')
  if (Array.isArray(parsedOutput.competencies)) {
    parsedOutput.competencies.forEach((comp: any) => {
      humanReadableLines.push(`- ${comp.description} → ${comp.level}`)
    })
  }
  humanReadableLines.push('\n\n')

  humanReadableLines.push('CATATAN PENGAJAR & REKOMENDASI\n')
  const devNotes = parsedOutput.teacher_notes?.development || ''
  const evalNotes = parsedOutput.teacher_notes?.evaluation || ''
  const recNotes = parsedOutput.teacher_notes?.recommendation || ''

  humanReadableLines.push(`Perkembangan Siswa:\n${devNotes}\n`)
  humanReadableLines.push(`Evaluasi:\n${evalNotes}\n`)
  humanReadableLines.push(`Rekomendasi:\n${recNotes}`)

  const humanReadableText = humanReadableLines.join('\n')

  return {
    success: true,
    data: {
      ...parsedOutput,
      human_readable_text: humanReadableText
    }
  }
})
