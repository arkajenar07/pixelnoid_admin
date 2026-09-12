<template>
  <div class="report-doc">

    <!-- KOP LAPORAN -->
    <div class="rpt-header">
      <div>
        <div class="rpt-brand-row">
          <span class="rpt-dots">
            <span></span><span></span>
            <span></span><span></span>
          </span>
          <h1 class="rpt-title">PIXELNOID DIGI ACADEMY</h1>
        </div>
        <p class="rpt-subtitle">Laporan Perkembangan Siswa Bulanan</p>
      </div>
      <div class="rpt-period">{{ report?.student_info?.period || '-' }}</div>
    </div>

    <div class="rpt-line-thick"></div>

    <!-- INFORMASI SISWA -->
    <div class="rpt-section">
      <p class="rpt-section-title">INFORMASI SISWA</p>
      <div class="rpt-line-thin"></div>
      <table class="rpt-table-plain">
        <tbody>
          <tr>
            <td class="rpt-label">Nama Siswa</td>
            <td class="rpt-value">{{ report?.student_info?.name || '-' }}</td>
          </tr>
          <tr>
            <td class="rpt-label">Program</td>
            <td class="rpt-value">{{ report?.student_info?.program || '-' }}</td>
          </tr>
          <tr>
            <td class="rpt-label">Pengajar / Mentor</td>
            <td class="rpt-value">{{ report?.student_info?.mentor || '-' }}</td>
          </tr>
          <tr>
            <td class="rpt-label">Periode Laporan</td>
            <td class="rpt-value">{{ report?.student_info?.period || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- REKAP KEHADIRAN -->
    <div class="rpt-section">
      <p class="rpt-section-title">REKAP KEHADIRAN</p>
      <div class="rpt-line-thin"></div>
      <table class="rpt-table-bordered">
        <thead>
          <tr>
            <th class="rpt-th">Total Pertemuan</th>
            <th class="rpt-th">Hadir</th>
            <th class="rpt-th">Izin / Sakit</th>
            <th class="rpt-th">Tidak Hadir</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="rpt-td-num">{{ report?.attendance?.total_sessions ?? 0 }}</td>
            <td class="rpt-td-num">{{ report?.attendance?.attended ?? 0 }}</td>
            <td class="rpt-td-num">{{ report?.attendance?.excused ?? 0 }}</td>
            <td class="rpt-td-num">{{ report?.attendance?.absent ?? 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PENILAIAN MODUL PELAJARAN -->
    <div class="rpt-section">
      <p class="rpt-section-title">PENILAIAN MODUL PELAJARAN</p>
      <div class="rpt-line-thin"></div>
      <table class="rpt-table-bordered">
        <thead>
          <tr>
            <th class="rpt-th" style="width: 30%; text-align: left;">Modul</th>
            <th class="rpt-th" style="width: 10%;">Nilai</th>
            <th class="rpt-th" style="text-align: left;">Catatan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(mod, i) in (report?.module_reports || [])" :key="i">
            <td class="rpt-td" style="font-weight: 700;">{{ mod.name }}</td>
            <td class="rpt-td" style="text-align: center; font-weight: 700; font-size: 14px;">{{ mod.score }}</td>
            <td class="rpt-td rpt-notes">
              <span v-if="mod.notes?.study_notes">
                <strong>Catatan belajar:</strong>
                {{ mod.notes.study_notes.replace(/^Catatan belajar:\s*/i, '') }}
              </span>
              <span v-if="mod.notes?.study_notes && mod.notes?.performance"> </span>
              <span v-if="mod.notes?.performance">
                <strong>Performa:</strong>
                {{ mod.notes.performance.replace(/^Performa:\s*/i, '') }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PENCAPAIAN KOMPETENSI -->
    <div v-if="report?.competencies?.length" class="rpt-section">
      <p class="rpt-section-title">PENCAPAIAN KOMPETENSI</p>
      <div class="rpt-line-thin"></div>
      <table class="rpt-table-bordered">
        <thead>
          <tr>
            <th class="rpt-th" style="text-align: left; width: 70%;">Kompetensi</th>
            <th class="rpt-th" style="width: 30%;">Level</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(comp, i) in (report?.competencies || [])" :key="i">
            <td class="rpt-td">{{ comp.description }}</td>
            <td class="rpt-td" style="text-align: center; font-weight: 700;">{{ comp.level }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CATATAN PENGAJAR & REKOMENDASI -->
    <div v-if="report?.teacher_notes" class="rpt-section">
      <p class="rpt-section-title">CATATAN PENGAJAR &amp; REKOMENDASI</p>
      <div class="rpt-line-thin"></div>
      <table class="rpt-table-plain">
        <tbody>
          <tr v-if="report?.teacher_notes?.development">
            <td class="rpt-label" style="vertical-align: top;">Perkembangan Siswa</td>
            <td class="rpt-notes" style="vertical-align: top; padding: 4px 0;">{{ report.teacher_notes.development }}</td>
          </tr>
          <tr v-if="report?.teacher_notes?.evaluation">
            <td class="rpt-label" style="vertical-align: top;">Evaluasi &amp; Peningkatan</td>
            <td class="rpt-notes" style="vertical-align: top; padding: 4px 0;">{{ report.teacher_notes.evaluation }}</td>
          </tr>
          <tr v-if="report?.teacher_notes?.recommendation">
            <td class="rpt-label" style="vertical-align: top;">Rekomendasi</td>
            <td class="rpt-notes" style="vertical-align: top; padding: 4px 0;">{{ report.teacher_notes.recommendation }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TANDA TANGAN -->
    <div class="rpt-signature">
      <div class="rpt-sign-box">
        <p class="rpt-sign-label">Mentor Pembimbing,</p>
        <div class="rpt-sign-line">
          <p class="rpt-sign-name">{{ report?.student_info?.mentor || 'Mentor Pixelnoid' }}</p>
          <p class="rpt-sign-org">Pixelnoid Academic Team</p>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="rpt-footer-line"></div>
    <p class="rpt-footer-text">
      Diterbitkan oleh Pixelnoid Learning System &bull; Verifikasi dokumen melalui sistem akademik Pixelnoid
    </p>

  </div>
</template>

<script setup lang="ts">
defineProps<{
  report: any
}>()
</script>

<style scoped>
.report-doc {
  font-family: Arial, sans-serif;
  background: #ffffff;
  color: #111111;
  font-size: 13px;
  line-height: 1.5;
}

/* ── HEADER ── */
.rpt-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
}
.rpt-brand-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}
.rpt-dots {
  display: inline-grid;
  grid-template-columns: repeat(2, 5px);
  gap: 2px;
  opacity: 0.35;
  margin-top: 2px;
}
.rpt-dots span {
  display: block;
  width: 5px;
  height: 5px;
  background: #111;
  border-radius: 1px;
}
.rpt-title {
  font-family: Arial, sans-serif;
  font-size: 20px;
  font-weight: 900;
  color: #111;
  margin: 0;
  letter-spacing: 0.3px;
}
.rpt-subtitle {
  font-family: Arial, sans-serif;
  font-size: 12px;
  color: #666;
  margin: 0 0 0 26px;
}
.rpt-period {
  font-family: Arial, sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #111;
  padding-top: 4px;
  white-space: nowrap;
}

/* ── LINES ── */
.rpt-line-thick {
  border: none;
  border-top: 2px solid #1a237e;
  margin: 8px 0 18px 0;
}
.rpt-line-thin {
  border: none;
  border-top: 1px solid #1a237e;
  margin: 3px 0 11px 0;
}

/* ── SECTIONS ── */
.rpt-section {
  margin-bottom: 20px;
}
.rpt-section-title {
  font-family: Arial, sans-serif;
  font-size: 11.5px;
  font-weight: 700;
  color: #1a237e;
  letter-spacing: 0.9px;
  text-transform: uppercase;
  margin: 0 0 3px 0;
}

/* ── TABLE: PLAIN (no outer border) ── */
.rpt-table-plain {
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;
}
.rpt-label {
  font-family: Arial, sans-serif;
  font-size: 13px;
  color: #666;
  padding: 3px 0;
  width: 36%;
  vertical-align: middle;
}
.rpt-value {
  font-family: Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #111;
  padding: 3px 0;
  vertical-align: middle;
}

/* ── TABLE: BORDERED ── */
.rpt-table-bordered {
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;
  border: 1px solid #ccc;
}
.rpt-th {
  font-family: Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #1a237e;
  background: #f7f7fc;
  padding: 8px 10px;
  border: 1px solid #ccc;
  text-align: center;
}
.rpt-td {
  font-family: Arial, sans-serif;
  font-size: 13px;
  color: #111;
  padding: 9px 10px;
  border: 1px solid #ccc;
  vertical-align: top;
}
.rpt-td-num {
  font-family: Arial, sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #111;
  text-align: center;
  padding: 12px 10px;
  border: 1px solid #ccc;
  vertical-align: middle;
}
.rpt-notes {
  font-family: Arial, sans-serif;
  font-size: 13px;
  color: #111;
  line-height: 1.65;
}

/* ── SIGNATURE ── */
.rpt-signature {
  display: flex;
  justify-content: flex-end;
  margin-top: 36px;
}
.rpt-sign-box {
  text-align: center;
  min-width: 180px;
}
.rpt-sign-label {
  font-family: Arial, sans-serif;
  font-size: 12px;
  color: #666;
  margin: 0 0 50px 0;
}
.rpt-sign-line {
  border-top: 1px solid #111;
  padding-top: 4px;
}
.rpt-sign-name {
  font-family: Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #111;
  margin: 0;
}
.rpt-sign-org {
  font-family: Arial, sans-serif;
  font-size: 11px;
  color: #666;
  margin: 0;
}

/* ── FOOTER ── */
.rpt-footer-line {
  border: none;
  border-top: 1px solid #ddd;
  margin: 22px 0 7px 0;
}
.rpt-footer-text {
  font-family: Arial, sans-serif;
  font-size: 10px;
  color: #aaa;
  text-align: center;
  margin: 0;
}
</style>
