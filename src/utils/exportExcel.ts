import * as XLSX from 'xlsx';
import { Peserta, Penguji, Kelompok, PenilaianPeserta, AppSettings } from '../types';

interface RekapRowData {
  peserta: Peserta;
  kelompok?: Kelompok;
  penilaian?: PenilaianPeserta;
  penguji?: Penguji;
}

export function exportRekapitulasiToExcel(
  items: RekapRowData[],
  settings: AppSettings,
  filterKelompokName?: string
) {
  // Build data rows
  const headers = [
    'NO',
    'NO. PESERTA',
    'NAMA PESERTA',
    'L/P',
    'PANGKALAN / GUDEP',
    'REGU / KELOMPOK',
    'ADMINISTRASI (YA/14)',
    'STATUS ADMIN',
    'SKOR WAWANCARA (MAX 55)',
    'PERSENTASE (%)',
    'STATUS KELULUSAN',
    'PENGUJI',
    'TANGGAL PENILAIAN',
  ];

  const rows = items.map((item, index) => {
    const pen = item.penilaian;
    let adminYaCount = 0;
    let skorWawancara = 0;
    let persentase = 0;
    let statusKelulusan = 'BELUM DINILAI';
    let statusAdmin = '-';

    if (pen) {
      adminYaCount = pen.administrasi.filter((a) => a.tersedia).length;
      statusAdmin = adminYaCount === 14 ? 'Lengkap' : `${adminYaCount}/14 (Belum Lengkap)`;
      skorWawancara = pen.wawancara.reduce((sum, w) => sum + (w.poin || 0), 0);
      persentase = Number(((skorWawancara / 55) * 100).toFixed(2));
      statusKelulusan = persentase >= 80 ? 'LULUS' : 'BELUM LULUS';
    }

    return [
      index + 1,
      item.peserta.nomorPeserta,
      item.peserta.nama,
      item.peserta.jenisKelamin,
      item.peserta.pangkalan + (item.peserta.gudep ? ` (${item.peserta.gudep})` : ''),
      item.kelompok?.nama || '-',
      pen ? `${adminYaCount}/14` : '-',
      statusAdmin,
      pen ? skorWawancara : '-',
      pen ? `${persentase}%` : '-',
      statusKelulusan,
      item.penguji?.nama || '-',
      pen?.tanggalPenilaian || '-',
    ];
  });

  // Calculate summary
  const total = items.length;
  const sudahDinilai = items.filter((i) => !!i.penilaian).length;
  const lulus = items.filter((i) => {
    if (!i.penilaian) return false;
    const skor = i.penilaian.wawancara.reduce((sum, w) => sum + (w.poin || 0), 0);
    return (skor / 55) * 100 >= 80;
  }).length;
  const belumLulus = sudahDinilai - lulus;

  // Title and header info block
  const sheetData: (string | number)[][] = [
    ['REKAPITULASI PENILAIAN PENCAPAIAN PRAMUKA GARUDA'],
    [`${settings.golongan.toUpperCase()} - ${settings.kwartirCabang.toUpperCase()}`],
    [`TAHUN ${settings.tahun}`],
    filterKelompokName ? [`Filter Regu/Kelompok: ${filterKelompokName}`] : [],
    [],
    [
      `Total Peserta: ${total}`,
      `Sudah Dinilai: ${sudahDinilai}`,
      `Lulus (>= 80%): ${lulus}`,
      `Belum Lulus: ${belumLulus}`,
      `Standar Kelulusan: Minimal 80% (Skor >= 44)`,
    ],
    [],
    headers,
    ...rows,
    [],
    ['', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', `Ditetapkan di: ${settings.tempat}`, '', ''],
    ['', '', '', '', '', '', '', '', '', '', `Tanggal: ${new Date().toLocaleDateString('id-ID')}`, '', ''],
    ['', '', '', '', '', '', '', '', '', '', 'Tim Penguji Pramuka Garuda', '', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // NO
    { wch: 18 }, // NO PESERTA
    { wch: 28 }, // NAMA
    { wch: 6 },  // L/P
    { wch: 32 }, // PANGKALAN
    { wch: 24 }, // REGU
    { wch: 20 }, // ADMIN
    { wch: 22 }, // STATUS ADMIN
    { wch: 24 }, // SKOR WAWANCARA
    { wch: 16 }, // %
    { wch: 18 }, // STATUS
    { wch: 30 }, // PENGUJI
    { wch: 16 }, // TANGGAL
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi Nilai');

  const fileName = `Rekap_Nilai_Pramuka_Garuda_${settings.tahun}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportLembarIndividuToExcel(
  peserta: Peserta,
  penilaian: PenilaianPeserta,
  penguji: Penguji | undefined,
  settings: AppSettings
) {
  const adminYaCount = penilaian.administrasi.filter((a) => a.tersedia).length;
  const totalSkorWawancara = penilaian.wawancara.reduce((sum, w) => sum + (w.poin || 0), 0);
  const persentase = Number(((totalSkorWawancara / 55) * 100).toFixed(2));
  const statusKelulusan = persentase >= 80 ? 'LULUS' : 'BELUM LULUS';

  const wb = XLSX.utils.book_new();

  // SHEET 1: FORM LENGKAP
  const sheetContent: (string | number)[][] = [
    ['KRITERIA KELULUSAN PENCAPAIAN PRAMUKA GARUDA'],
    [`${settings.golongan.toUpperCase()} - ${settings.kwartirCabang.toUpperCase()}`],
    [`TAHUN ${settings.tahun}`],
    [],
    ['Nama', `: ${peserta.nama}`],
    ['Nomor Peserta', `: ${peserta.nomorPeserta}`],
    ['Pangkalan', `: ${peserta.pangkalan}`],
    ['Gugus Depan', `: ${peserta.gudep || '-'}`],
    ['Jenis Kelamin', `: ${peserta.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}`],
    ['Penguji', `: ${penguji?.nama || '-'}`],
    ['Tanggal Ujian', `: ${penilaian.tanggalPenilaian}`],
    [],
    ['A. ADMINISTRASI'],
    ['NO', 'PENCAPAIAN', 'KETERSEDIAAN DATA', 'KETERANGAN / CATATAN'],
  ];

  penilaian.administrasi.forEach((item) => {
    sheetContent.push([
      item.id,
      item.pencapaian,
      item.tersedia ? 'YA' : 'TIDAK',
      item.catatan || '',
    ]);
  });

  sheetContent.push([]);
  sheetContent.push([
    'Catatan Administrasi:',
    `Terpenuhi ${adminYaCount} dari 14 butir. Point-point yang belum terpenuhi diberikan waktu 3 hari sebelum pelaksanaan Wawancara.`,
  ]);
  sheetContent.push([]);
  sheetContent.push(['B. WAWANCARA']);
  sheetContent.push(['NO', 'PENCAPAIAN', 'POIN KEMAMPUAN (1 - 5)', 'KETERANGAN / CATATAN']);

  penilaian.wawancara.forEach((item) => {
    sheetContent.push([
      item.id,
      item.pencapaian,
      item.poin || 0,
      item.catatan || '',
    ]);
  });

  sheetContent.push([]);
  sheetContent.push(['KETERANGAN SKALA POIN: 1. Sangat Kurang | 2. Kurang | 3. Cukup | 4. Baik | 5. Sangat Baik']);
  sheetContent.push([]);
  sheetContent.push(['RANGKUMAN PENILAIAN AKHIR']);
  sheetContent.push(['Jumlah Poin Diperoleh', totalSkorWawancara, 'Poin Maksimal: 55']);
  sheetContent.push(['% Pencapaian', `${persentase}%`, 'Formula: (Poin / 55) * 100%']);
  sheetContent.push(['KRITERIA KELULUSAN', statusKelulusan, 'LULUS jika tercapai minimal 80% (Poin >= 44)']);
  if (penilaian.catatanUmum) {
    sheetContent.push(['Catatan Umum Penguji', penilaian.catatanUmum]);
  }
  sheetContent.push([]);
  sheetContent.push(['', '', `${settings.tempat}, ${penilaian.tanggalPenilaian || settings.tahun}`]);
  sheetContent.push(['', '', 'Tim Penguji:']);
  sheetContent.push([]);
  sheetContent.push([]);
  sheetContent.push(['', '', penguji?.nama || '(....................................)']);

  const ws = XLSX.utils.aoa_to_sheet(sheetContent);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 65 },
    { wch: 22 },
    { wch: 40 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Lembar Penilaian Garuda');

  const safeName = peserta.nama.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Lembar_Nilai_${safeName}_${settings.tahun}.xlsx`);
}
