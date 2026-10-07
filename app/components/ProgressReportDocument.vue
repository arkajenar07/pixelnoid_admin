<template>
  <div :style="s.root">

    <!-- KOP LAPORAN -->
    <div :style="s.header">
      <div :style="s.headerLeft">
        <img src="/logo-pc.webp" alt="Pixelnoid Logo" :style="s.logo" />
      </div>
      <div :style="s.headerPeriod">{{ report?.student_info?.period || '-' }}</div>
    </div>

    <div :style="s.dividerThick"></div>

    <!-- INFORMASI SISWA -->
    <div :style="s.section">
      <p :style="s.sectionTitle">INFORMASI SISWA</p>
      <div :style="s.dividerThin"></div>
      <table :style="s.plainTable">
        <tbody>
          <tr>
            <td :style="s.infoLabel">Nama Siswa</td>
            <td :style="s.infoValue">{{ report?.student_info?.name || '-' }}</td>
          </tr>
          <tr>
            <td :style="s.infoLabel">Program</td>
            <td :style="s.infoValue">{{ report?.student_info?.program || '-' }}</td>
          </tr>
          <tr>
            <td :style="s.infoLabel">Pengajar / Mentor</td>
            <td :style="s.infoValue">{{ report?.student_info?.mentor || '-' }}</td>
          </tr>
          <tr>
            <td :style="s.infoLabel">Periode Laporan</td>
            <td :style="s.infoValue">{{ report?.student_info?.period || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- REKAP KEHADIRAN -->
    <div :style="s.section">
      <p :style="s.sectionTitle">REKAP KEHADIRAN</p>
      <div :style="s.dividerThin"></div>
      <table :style="s.borderedTable">
        <thead>
          <tr>
            <th :style="s.th">Total Pertemuan</th>
            <th :style="s.th">Hadir</th>
            <th :style="s.th">Izin / Sakit</th>
            <th :style="s.th">Tidak Hadir</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td :style="s.tdBig">{{ report?.attendance?.total_sessions ?? 0 }}</td>
            <td :style="s.tdBig">{{ report?.attendance?.attended ?? 0 }}</td>
            <td :style="s.tdBig">{{ report?.attendance?.excused ?? 0 }}</td>
            <td :style="s.tdBig">{{ report?.attendance?.absent ?? 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PENILAIAN MODUL PELAJARAN -->
    <div :style="s.section">
      <p :style="s.sectionTitle">PENILAIAN MODUL PELAJARAN</p>
      <div :style="s.dividerThin"></div>
      <table :style="s.borderedTable">
        <thead>
          <tr>
            <th :style="{ ...s.th, textAlign: 'left' }">Modul</th>
            <th :style="{ ...s.th, width: '12%' }">Nilai</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(mod, i) in (report?.module_reports || [])" :key="i">
            <td :style="{ ...s.td, fontWeight: 'bold' }">{{ mod.name }}</td>
            <td :style="{ ...s.td, textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }">{{ mod.score }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PENCAPAIAN KOMPETENSI -->
    <div v-if="report?.competencies?.length" :style="s.section">
      <p :style="s.sectionTitle">PENCAPAIAN KOMPETENSI</p>
      <div :style="s.dividerThin"></div>
      <table :style="s.borderedTable">
        <thead>
          <tr>
            <th :style="{ ...s.th, textAlign: 'left', width: '70%' }">Kompetensi</th>
            <th :style="{ ...s.th, width: '30%' }">Level</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(comp, i) in (report?.competencies || [])" :key="i">
            <td :style="s.td">{{ comp.description }}</td>
            <td :style="{ ...s.td, textAlign: 'center', fontWeight: 'bold' }">{{ comp.level }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CATATAN PENGAJAR & REKOMENDASI -->
    <div v-if="report?.teacher_notes" :style="s.section">
      <p :style="s.sectionTitle">CATATAN PENGAJAR &amp; REKOMENDASI</p>
      <div :style="s.dividerThin"></div>
      <table :style="s.plainTable">
        <tbody>
          <tr v-if="report?.teacher_notes?.development">
            <td :style="s.noteLabel">Perkembangan Siswa</td>
            <td :style="s.noteValue">{{ report.teacher_notes.development }}</td>
          </tr>
          <tr v-if="report?.teacher_notes?.evaluation">
            <td :style="s.noteLabel">Evaluasi &amp; Peningkatan</td>
            <td :style="s.noteValue">{{ report.teacher_notes.evaluation }}</td>
          </tr>
          <tr v-if="report?.teacher_notes?.recommendation">
            <td :style="s.noteLabel">Rekomendasi</td>
            <td :style="s.noteValue">{{ report.teacher_notes.recommendation }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TANDA TANGAN -->
    <div :style="s.signatureRow">
      <div :style="s.signatureBox">
        <p :style="s.signatureLabel">Mentor Pembimbing,</p>
        <div :style="s.signatureLine">
          <p :style="s.signatureName">{{ report?.student_info?.mentor || 'Mentor Pixelnoid' }}</p>
          <p :style="s.signatureRole">Pixelnoid Academic Team</p>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div :style="s.footerDivider"></div>
    <p :style="s.footerText">
      Diterbitkan oleh Pixelnoid Learning System &bull; Verifikasi dokumen melalui sistem akademik Pixelnoid
    </p>

  </div>
</template>

<script setup lang="ts">
defineProps<{
  report: any
}>()

const s = {
  root: {
    fontFamily: 'Arial, sans-serif',
    background: '#ffffff',
    color: '#111111',
    fontSize: '13px',
    lineHeight: '1.5',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    height: '36px',
    width: 'auto',
    display: 'block',
    objectFit: 'contain',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '900',
    color: '#111111',
    margin: '0',
    letterSpacing: '0.3px',
    lineHeight: '1.2',
  },
  headerSubtitle: {
    fontSize: '12px',
    color: '#666666',
    margin: '3px 0 0 0',
  },
  headerPeriod: {
    fontSize: '17px',
    fontWeight: 'bold',
    color: '#111111',
    whiteSpace: 'nowrap',
  },
  dividerThick: {
    borderTop: '3.5px solid #1a3a53',
    margin: '12px 0 18px 0',
  },
  dividerThin: {
    borderTop: '1.5px solid #1a3a53',
    margin: '6px 0 12px 0',
  },
  section: {
    marginBottom: '22px',
  },
  sectionTitle: {
    fontSize: '11.5px',
    fontWeight: 'bold',
    color: '#1a3a53',
    letterSpacing: '0.9px',
    textTransform: 'uppercase',
    margin: '0 0 4px 0',
  },
  plainTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  borderedTable: {
    width: '100%',
    borderCollapse: 'collapse',
    border: '1px solid #555555',
  },
  infoLabel: {
    fontSize: '13px',
    color: '#666666',
    padding: '4px 0',
    width: '32%',
    verticalAlign: 'middle',
  },
  infoValue: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#111111',
    padding: '4px 0',
    verticalAlign: 'middle',
  },
  th: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#1a3a53',
    backgroundColor: '#f0f2f4',
    padding: '10px 12px',
    border: '1px solid #555555',
    textAlign: 'center',
    verticalAlign: 'middle',
    lineHeight: '1.3',
  },
  tdBig: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#111111',
    textAlign: 'center',
    padding: '14px 10px',
    border: '1px solid #555555',
    verticalAlign: 'middle',
    lineHeight: '1.2',
  },
  td: {
    fontSize: '13px',
    color: '#111111',
    padding: '10px 12px',
    border: '1px solid #555555',
    verticalAlign: 'middle',
    lineHeight: '1.4',
  },
  noteLabel: {
    fontSize: '13px',
    color: '#666666',
    padding: '4px 0',
    width: '36%',
    verticalAlign: 'top',
  },
  noteValue: {
    fontSize: '13px',
    color: '#111111',
    lineHeight: '1.65',
    verticalAlign: 'top',
    padding: '4px 0',
  },
  signatureRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '36px',
  },
  signatureBox: {
    textAlign: 'center',
    minWidth: '180px',
  },
  signatureLabel: {
    fontSize: '12px',
    color: '#666666',
    marginBottom: '50px',
    marginTop: '0',
  },
  signatureLine: {
    borderTop: '1px solid #111111',
    paddingTop: '4px',
  },
  signatureName: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#111111',
    margin: '0',
  },
  signatureRole: {
    fontSize: '11px',
    color: '#666666',
    margin: '0',
  },
  footerDivider: {
    borderTop: '1px solid #dddddd',
    margin: '24px 0 10px 0',
  },
  footerText: {
    fontSize: '10px',
    color: '#aaaaaa',
    textAlign: 'center',
    margin: '0',
  },
} as const
</script>
