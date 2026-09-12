# README — Student Progress Report Generator

## Tujuan

Sistem ini mengubah input terstruktur dari mentor menjadi laporan perkembangan siswa yang siap digunakan.

Prinsip utama:

> Mentor mengisi data faktual + nilai + keyword observasi. AI menghasilkan seluruh narasi laporan.

AI **tidak boleh mengarang fakta, pencapaian, materi, atau kondisi siswa** yang tidak terdapat dalam input.

---

## 1. Input Mentor

Mentor cukup mengisi:

### Data Siswa
- Nama siswa
- Program
- Mentor
- Periode laporan

### Kehadiran
- Total pertemuan
- Hadir
- Izin/Sakit
- Tidak hadir

### Penilaian Modul
Untuk setiap modul:
- Nama modul
- Nilai
- Keyword kekuatan
- Keyword yang perlu ditingkatkan

### Observasi Periode
Keyword/checklist:
- Performa umum
- Perkembangan
- Kendala
- Fokus berikutnya

### Komentar Tambahan
Opsional. Boleh kosong.

---

## 2. Struktur Input yang Disarankan

Gunakan struktur data seperti berikut:

```json
{
  "student": {
    "name": "Jibril Shaquille Abrisam",
    "program": "Python Programming",
    "mentor": "Arka Jenar Ma’arif",
    "period": "Juli 2025"
  },
  "attendance": {
    "total_sessions": 4,
    "attended": 4,
    "excused": 0,
    "absent": 0
  },
  "modules": [
    {
      "name": "Python Final Project - Table Relation System",
      "score": 90,
      "strengths": [
        "memahami konsep relasi data",
        "implementasi tepat",
        "struktur data baik"
      ],
      "improvements": []
    },
    {
      "name": "Python Final Project - Final Application System",
      "score": 80,
      "strengths": [
        "integrasi fitur",
        "memahami alur program",
        "implementasi cukup baik"
      ],
      "improvements": [
        "error handling",
        "testing",
        "struktur kode"
      ]
    }
  ],
  "period_observation": {
    "strengths": [
      "cepat memahami materi",
      "mampu menerapkan konsep",
      "logika pemrograman cukup terstruktur"
    ],
    "progress": [
      "lebih mandiri",
      "mampu mengintegrasikan beberapa fitur"
    ],
    "challenges": [
      "error handling",
      "testing",
      "struktur kode"
    ],
    "next_focus": [
      "modularisasi",
      "debugging",
      "testing"
    ],
    "additional_comment": ""
  }
}
```

---

## 3. Expected Output

AI harus menghasilkan laporan dengan struktur berikut:

```text
INFORMASI SISWA

Nama Siswa
Jibril Shaquille Abrisam

Program
Python Programming

Pengajar / Mentor
Arka Jenar Ma’arif

Periode Laporan
Juli 2025


REKAP KEHADIRAN

Total Pertemuan : 4
Hadir           : 4
Izin / Sakit    : 0
Tidak Hadir     : 0


PENILAIAN MODUL PELAJARAN

Modul:
Python Final Project - Table Relation System

Nilai:
90

Catatan:
Catatan belajar: Siswa mempelajari konsep relasi data dan penerapannya dalam struktur data Python untuk membentuk sistem yang terorganisir.
Performa: Sangat baik. Siswa mampu memahami konsep relasi data dan menerapkannya dengan tepat.


Modul:
Python Final Project - Final Application System

Nilai:
80

Catatan:
Catatan belajar: Siswa mempelajari proses integrasi berbagai fitur menjadi satu aplikasi yang utuh serta pengelolaan alur program.
Performa: Baik. Siswa telah mampu mengintegrasikan fitur dengan baik, namun masih perlu meningkatkan error handling, testing, dan struktur kode.


PENCAPAIAN KOMPETENSI

Kompetensi:
- Memahami konsep relasi data pada sistem aplikasi → Mahir
- Mengimplementasikan hubungan antar data menggunakan struktur data Python → Mahir
- Mengintegrasikan berbagai fitur menjadi satu aplikasi → Berkembang menuju Mahir
- Menyusun alur program yang terstruktur dan konsisten → Berkembang menuju Mahir
- Membangun final project berbasis CLI → Berkembang menuju Mahir


CATATAN PENGAJAR & REKOMENDASI

Perkembangan Siswa:
Jibril menunjukkan perkembangan yang baik selama periode pembelajaran. Ia mampu memahami konsep relasi data dan menerapkannya dalam pengembangan final project. Kemampuan dalam mengintegrasikan beberapa fitur juga mengalami peningkatan.

Evaluasi:
Jibril disarankan memperbanyak latihan testing pada berbagai skenario penggunaan serta meningkatkan penerapan error handling. Penyusunan kode secara modular juga perlu terus dilatih.

Rekomendasi:
Mempertahankan kemampuan dalam memahami relasi data dan integrasi fitur, sekaligus meningkatkan debugging, testing, dan modularisasi kode.
```

---

## 4. Aturan AI Generation

1. Gunakan hanya informasi dari input mentor.
2. Jangan membuat fakta baru.
3. Jangan menaikkan atau menurunkan pencapaian tanpa dasar.
4. Narasi harus terdengar profesional, natural, objektif, dan cocok dibaca siswa maupun orang tua.
5. Hindari pengulangan kalimat antar bagian.
6. Nilai harus tetap sama dengan input.
7. Keyword mentor harus diterjemahkan menjadi kalimat yang natural.
8. Jika keyword improvement kosong, jangan memaksakan kekurangan.
9. Jika komentar tambahan kosong, abaikan bagian tersebut.
10. Kompetensi dapat dibuat dari mapping program/module + nilai + keyword.
11. Gunakan bahasa Indonesia yang jelas dan tidak terlalu formal.
12. Jangan menggunakan klaim seperti "menguasai seluruh materi" kecuali memang didukung input.
13. Prioritaskan perkembangan siswa, bukan hanya deskripsi materi.

---

## 5. Prinsip Kompetensi

Gunakan level sebagai indikasi umum:

```text
90–100 → Mahir
80–89  → Berkembang menuju Mahir
70–79  → Berkembang
60–69  → Perlu Penguatan
<60    → Perlu Pendampingan
```

Level boleh disesuaikan berdasarkan keyword mentor.

Contoh:

```text
Score 80
+ "mampu mengintegrasikan fitur"
+ "masih perlu error handling"

=> "Berkembang menuju Mahir"
```

---

## 6. Format Output Machine-Readable

Selain laporan human-readable, sistem sebaiknya dapat mengembalikan JSON:

```json
{
  "student_info": {},
  "attendance": {},
  "module_reports": [],
  "competencies": [],
  "teacher_notes": {
    "development": "",
    "evaluation": "",
    "recommendation": ""
  }
}
```

Tujuannya agar hasil AI dapat langsung dimasukkan ke template PDF/Word atau sistem report generator.

---

## Target Akhir

Flow sistem:

```text
Mentor Form
    ↓
Structured Input
    ↓
AI Report Generator
    ↓
Validated JSON
    ↓
Report Template
    ↓
PDF / Document
```

Fokus sistem adalah membuat proses laporan bulanan menjadi cepat, konsisten, dan minim penulisan manual oleh mentor.
