<template>
  <div class="font-[Arial,sans-serif] bg-white text-[#111] text-[13px] leading-[1.5]">

    <!-- KOP LAPORAN -->
    <div class="flex items-start justify-between mb-1.5">
      <div>
        <div class="flex items-center gap-2 mb-0.5">
          <span class="inline-grid grid-cols-2 gap-[2px] opacity-35 mt-0.5">
            <span class="block w-[5px] h-[5px] bg-[#111] rounded-[1px]"></span>
            <span class="block w-[5px] h-[5px] bg-[#111] rounded-[1px]"></span>
            <span class="block w-[5px] h-[5px] bg-[#111] rounded-[1px]"></span>
            <span class="block w-[5px] h-[5px] bg-[#111] rounded-[1px]"></span>
          </span>
          <h1 class="text-[20px] font-black text-[#111] m-0 tracking-[0.3px]">PIXELNOID DIGI ACADEMY</h1>
        </div>
        <p class="text-[12px] text-[#666] m-0 ml-[26px]">Laporan Perkembangan Siswa Bulanan</p>
      </div>
      <div class="text-[17px] font-bold text-[#111] pt-1 whitespace-nowrap">{{ report?.student_info?.period || '-' }}</div>
    </div>

    <div class="border-0 border-t-2 border-[#1a237e] my-2"></div>

    <!-- INFORMASI SISWA -->
    <div class="mb-5">
      <p class="text-[11.5px] font-bold text-[#1a237e] tracking-[0.9px] uppercase m-0 mb-0.5">INFORMASI SISWA</p>
      <div class="border-0 border-t border-[#1a237e] mb-2.5"></div>
      <table class="w-full border-collapse">
        <tbody>
          <tr>
            <td class="text-[13px] text-[#666] py-[3px] w-[36%] align-middle">Nama Siswa</td>
            <td class="text-[13px] font-bold text-[#111] py-[3px] align-middle">{{ report?.student_info?.name || '-' }}</td>
          </tr>
          <tr>
            <td class="text-[13px] text-[#666] py-[3px] w-[36%] align-middle">Program</td>
            <td class="text-[13px] font-bold text-[#111] py-[3px] align-middle">{{ report?.student_info?.program || '-' }}</td>
          </tr>
          <tr>
            <td class="text-[13px] text-[#666] py-[3px] w-[36%] align-middle">Pengajar / Mentor</td>
            <td class="text-[13px] font-bold text-[#111] py-[3px] align-middle">{{ report?.student_info?.mentor || '-' }}</td>
          </tr>
          <tr>
            <td class="text-[13px] text-[#666] py-[3px] w-[36%] align-middle">Periode Laporan</td>
            <td class="text-[13px] font-bold text-[#111] py-[3px] align-middle">{{ report?.student_info?.period || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- REKAP KEHADIRAN -->
    <div class="mb-5">
      <p class="text-[11.5px] font-bold text-[#1a237e] tracking-[0.9px] uppercase m-0 mb-0.5">REKAP KEHADIRAN</p>
      <div class="border-0 border-t border-[#1a237e] mb-2.5"></div>
      <table class="w-full border-collapse border border-[#ccc]">
        <thead>
          <tr>
            <th class="text-[12px] font-bold text-[#1a237e] bg-[#f7f7fc] py-2 px-2.5 border border-[#ccc] text-center">Total Pertemuan</th>
            <th class="text-[12px] font-bold text-[#1a237e] bg-[#f7f7fc] py-2 px-2.5 border border-[#ccc] text-center">Hadir</th>
            <th class="text-[12px] font-bold text-[#1a237e] bg-[#f7f7fc] py-2 px-2.5 border border-[#ccc] text-center">Izin / Sakit</th>
            <th class="text-[12px] font-bold text-[#1a237e] bg-[#f7f7fc] py-2 px-2.5 border border-[#ccc] text-center">Tidak Hadir</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="text-[22px] font-bold text-[#111] text-center py-3 px-2.5 border border-[#ccc] align-middle">{{ report?.attendance?.total_sessions ?? 0 }}</td>
            <td class="text-[22px] font-bold text-[#111] text-center py-3 px-2.5 border border-[#ccc] align-middle">{{ report?.attendance?.attended ?? 0 }}</td>
            <td class="text-[22px] font-bold text-[#111] text-center py-3 px-2.5 border border-[#ccc] align-middle">{{ report?.attendance?.excused ?? 0 }}</td>
            <td class="text-[22px] font-bold text-[#111] text-center py-3 px-2.5 border border-[#ccc] align-middle">{{ report?.attendance?.absent ?? 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PENILAIAN MODUL PELAJARAN -->
    <div class="mb-5">
      <p class="text-[11.5px] font-bold text-[#1a237e] tracking-[0.9px] uppercase m-0 mb-0.5">PENILAIAN MODUL PELAJARAN</p>
      <div class="border-0 border-t border-[#1a237e] mb-2.5"></div>
      <table class="w-full border-collapse border border-[#ccc]">
        <thead>
          <tr>
            <th class="text-[12px] font-bold text-[#1a237e] bg-[#f7f7fc] py-2 px-2.5 border border-[#ccc] text-left">Modul</th>
            <th class="text-[12px] font-bold text-[#1a237e] bg-[#f7f7fc] py-2 px-2.5 border border-[#ccc] text-center w-[10%]">Nilai</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(mod, i) in (report?.module_reports || [])" :key="i">
            <td class="text-[13px] text-[#111] py-[9px] px-2.5 border border-[#ccc] align-top font-bold">{{ mod.name }}</td>
            <td class="text-[14px] text-[#111] py-[9px] px-2.5 border border-[#ccc] align-top text-center font-bold">{{ mod.score }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PENCAPAIAN KOMPETENSI -->
    <div v-if="report?.competencies?.length" class="mb-5">
      <p class="text-[11.5px] font-bold text-[#1a237e] tracking-[0.9px] uppercase m-0 mb-0.5">PENCAPAIAN KOMPETENSI</p>
      <div class="border-0 border-t border-[#1a237e] mb-2.5"></div>
      <table class="w-full border-collapse border border-[#ccc]">
        <thead>
          <tr>
            <th class="text-[12px] font-bold text-[#1a237e] bg-[#f7f7fc] py-2 px-2.5 border border-[#ccc] text-left w-[70%]">Kompetensi</th>
            <th class="text-[12px] font-bold text-[#1a237e] bg-[#f7f7fc] py-2 px-2.5 border border-[#ccc] text-center w-[30%]">Level</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(comp, i) in (report?.competencies || [])" :key="i">
            <td class="text-[13px] text-[#111] py-[9px] px-2.5 border border-[#ccc] align-top">{{ comp.description }}</td>
            <td class="text-[13px] text-[#111] py-[9px] px-2.5 border border-[#ccc] align-top text-center font-bold">{{ comp.level }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CATATAN PENGAJAR & REKOMENDASI -->
    <div v-if="report?.teacher_notes" class="mb-5">
      <p class="text-[11.5px] font-bold text-[#1a237e] tracking-[0.9px] uppercase m-0 mb-0.5">CATATAN PENGAJAR &amp; REKOMENDASI</p>
      <div class="border-0 border-t border-[#1a237e] mb-2.5"></div>
      <table class="w-full border-collapse">
        <tbody>
          <tr v-if="report?.teacher_notes?.development">
            <td class="text-[13px] text-[#666] py-[3px] w-[36%] align-top">Perkembangan Siswa</td>
            <td class="text-[13px] text-[#111] leading-[1.65] align-top py-1">{{ report.teacher_notes.development }}</td>
          </tr>
          <tr v-if="report?.teacher_notes?.evaluation">
            <td class="text-[13px] text-[#666] py-[3px] w-[36%] align-top">Evaluasi &amp; Peningkatan</td>
            <td class="text-[13px] text-[#111] leading-[1.65] align-top py-1">{{ report.teacher_notes.evaluation }}</td>
          </tr>
          <tr v-if="report?.teacher_notes?.recommendation">
            <td class="text-[13px] text-[#666] py-[3px] w-[36%] align-top">Rekomendasi</td>
            <td class="text-[13px] text-[#111] leading-[1.65] align-top py-1">{{ report.teacher_notes.recommendation }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TANDA TANGAN -->
    <div class="flex justify-end mt-9">
      <div class="text-center min-w-[180px]">
        <p class="text-[12px] text-[#666] mb-[50px]">Mentor Pembimbing,</p>
        <div class="border-t border-[#111] pt-1">
          <p class="text-[13px] font-bold text-[#111] m-0">{{ report?.student_info?.mentor || 'Mentor Pixelnoid' }}</p>
          <p class="text-[11px] text-[#666] m-0">Pixelnoid Academic Team</p>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="border-0 border-t border-[#ddd] my-5 mt-6"></div>
    <p class="text-[10px] text-[#aaa] text-center m-0">
      Diterbitkan oleh Pixelnoid Learning System &bull; Verifikasi dokumen melalui sistem akademik Pixelnoid
    </p>

  </div>
</template>

<script setup lang="ts">
defineProps<{
  report: any
}>()
</script>
