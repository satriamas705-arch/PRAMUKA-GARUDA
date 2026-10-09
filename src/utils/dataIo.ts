import * as XLSX from 'xlsx';
import { Peserta, Penguji, Kelompok, PenilaianPeserta, AppSettings } from '../types';
import {
  DEFAULT_ADMINISTRASI_TEMPLATE,
  DEFAULT_WAWANCARA_TEMPLATE,
} from '../data/initialData';

/**
 * Normalizes header string to match keys flexibly
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ==========================================
// 1. DATA PESERTA (EXCEL / CSV IMPORT-EXPORT)
// ==========================================

export const PESERTA_EXCEL_HEADERS = [
  'NO. PESERTA',
  'NAMA LENGKAP',
  'L/P',
  'PANGKALAN (SEKOLAH)',
  'NO. GUDEP',
  'REGU / KELOMPOK',
  'GOLONGAN',
  'TINGKAT TKU',
  'NO. HP / WA',
  'NAMA PEMBINA',
];

export function downloadPesertaTemplate() {
  const wb = XLSX.utils.book_new();

  // Sample template rows
  const data = [
    PESERTA_EXCEL_HEADERS,
    [
      'PG-01/BMS/2026',
      'Muhammad Al Fatih',
      'L',
      'SMP Negeri 1 Purwokerto',
      '02.001 - 02.002',
      'Regu Garuda',
      'Penggalang',
      'Terap',
      '081234567890',
      'Kak Kak Budi Santoso',
    ],
    [
      'PG-02/BMS/2026',
      'Siti Nur Azizah',
      'P',
      'SMP Negeri 2 Sokaraja',
      '05.011 - 05.012',
      'Regu Melati',
      'Penggalang',
      'Terap',
      '082345678901',
      'Kak Ratna Dewi',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Column widths
  ws['!cols'] = [
    { wch: 18 }, // No Peserta
    { wch: 28 }, // Nama
    { wch: 6 },  // L/P
    { wch: 30 }, // Pangkalan
    { wch: 18 }, // Gudep
    { wch: 20 }, // Regu
    { wch: 14 }, // Golongan
    { wch: 14 }, // Tingkat
    { wch: 16 }, // HP
    { wch: 22 }, // Pembina
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template Peserta');
  XLSX.writeFile(wb, 'Template_Data_Peserta_Pramuka_Garuda.xlsx');
}

export function exportPesertaToExcel(
  pesertaList: Peserta[],
  kelompokList: Kelompok[],
  penilaianMap?: Record<string, PenilaianPeserta>,
  filename = 'Data_Peserta_Pramuka_Garuda.xlsx'
) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'NO',
    'NO. PESERTA',
    'NAMA LENGKAP',
    'L/P',
    'PANGKALAN (SEKOLAH)',
    'NO. GUDEP',
    'REGU / KELOMPOK',
    'GOLONGAN',
    'TINGKAT TKU',
    'NO. HP / WA',
    'NAMA PEMBINA',
    'STATUS PENILAIAN',
  ];

  const rows = pesertaList.map((p, idx) => {
    const kel = kelompokList.find((k) => k.id === p.kelompokId);
    const pen = penilaianMap ? penilaianMap[p.id] : undefined;
    let statusNilai = 'Belum Dinilai';
    if (pen) {
      const skor = pen.wawancara.reduce((s, w) => s + (w.poin || 0), 0);
      const pct = (skor / 55) * 100;
      statusNilai = pct >= 80 ? `Lulus (${pct.toFixed(1)}%)` : `Belum Lulus (${pct.toFixed(1)}%)`;
    }

    return [
      idx + 1,
      p.nomorPeserta,
      p.nama,
      p.jenisKelamin,
      p.pangkalan,
      p.gudep || '-',
      kel?.nama || '-',
      p.golongan,
      p.tingkatTKU,
      p.kontakHp || '-',
      p.namaPembina || '-',
      statusNilai,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 28 },
    { wch: 6 },
    { wch: 30 },
    { wch: 18 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Peserta');
  XLSX.writeFile(wb, filename);
}

export interface ParsePesertaResult {
  valid: Peserta[];
  errors: string[];
  totalParsed: number;
}

export async function parsePesertaFile(
  file: File,
  kelompokList: Kelompok[]
): Promise<ParsePesertaResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];

  // Convert to JSON with raw values
  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const valid: Peserta[] = [];
  const errors: string[] = [];

  rawData.forEach((row, idx) => {
    const rowNum = idx + 2; // header is row 1

    // Map keys by normalization
    const normalizedRow: Record<string, any> = {};
    Object.keys(row).forEach((k) => {
      normalizedRow[normalizeKey(k)] = row[k];
    });

    const nomor = (
      normalizedRow['nopeserta'] ||
      normalizedRow['nomorpeserta'] ||
      normalizedRow['nomor'] ||
      normalizedRow['no'] ||
      ''
    ).toString().trim();

    const nama = (
      normalizedRow['namalengkap'] ||
      normalizedRow['namapeserta'] ||
      normalizedRow['nama'] ||
      ''
    ).toString().trim();

    if (!nama) {
      errors.push(`Baris ${rowNum}: Nama peserta kosong.`);
      return;
    }

    const jkRaw = (
      normalizedRow['lp'] ||
      normalizedRow['jeniskelamin'] ||
      normalizedRow['jk'] ||
      'L'
    ).toString().trim().toUpperCase();
    const jenisKelamin: 'L' | 'P' = jkRaw.startsWith('P') ? 'P' : 'L';

    const pangkalan = (
      normalizedRow['pangkalans Sekolah'] ||
      normalizedRow['pangkalan'] ||
      normalizedRow['sekolah'] ||
      normalizedRow['instansi'] ||
      'Pangkalan Pramuka'
    ).toString().trim();

    const gudep = (
      normalizedRow['nogudep'] ||
      normalizedRow['gudep'] ||
      ''
    ).toString().trim();

    const reguNama = (
      normalizedRow['regukelompok'] ||
      normalizedRow['regu'] ||
      normalizedRow['kelompok'] ||
      ''
    ).toString().trim();

    let kelompokId: string | undefined = undefined;
    if (reguNama) {
      const match = kelompokList.find(
        (k) => k.nama.toLowerCase() === reguNama.toLowerCase()
      );
      if (match) {
        kelompokId = match.id;
      }
    }

    const golonganRaw = (
      normalizedRow['golongan'] ||
      'Penggalang'
    ).toString().trim();
    const validGolongan: Peserta['golongan'] =
      ['Penggalang', 'Siaga', 'Penegak', 'Pandega'].find(
        (g) => g.toLowerCase() === golonganRaw.toLowerCase()
      ) as any || 'Penggalang';

    const tingkatRaw = (
      normalizedRow['tingkattku'] ||
      normalizedRow['tingkat'] ||
      normalizedRow['tku'] ||
      'Terap'
    ).toString().trim();
    const validTingkat: Peserta['tingkatTKU'] =
      ['Ramu', 'Rakit', 'Terap', 'Bantara', 'Laksana', 'Mula', 'Bantu', 'Tata'].find(
        (t) => t.toLowerCase() === tingkatRaw.toLowerCase()
      ) as any || 'Terap';

    const kontakHp = (
      normalizedRow['nohpwa'] ||
      normalizedRow['nohp'] ||
      normalizedRow['hp'] ||
      normalizedRow['telepon'] ||
      normalizedRow['kontak'] ||
      ''
    ).toString().trim();

    const namaPembina = (
      normalizedRow['namapembina'] ||
      normalizedRow['pembina'] ||
      ''
    ).toString().trim();

    const finalNomor = nomor || `PG-${(valid.length + 1).toString().padStart(2, '0')}/BMS/2026`;

    valid.push({
      id: `peserta-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      nomorPeserta: finalNomor,
      nama,
      jenisKelamin,
      pangkalan,
      gudep,
      kelompokId,
      golongan: validGolongan,
      tingkatTKU: validTingkat,
      kontakHp,
      namaPembina,
    });
  });

  return {
    valid,
    errors,
    totalParsed: rawData.length,
  };
}

// ==========================================
// 2. DATA PENGUJI (EXCEL / CSV IMPORT-EXPORT)
// ==========================================

export const PENGUJI_EXCEL_HEADERS = [
  'NO',
  'NAMA PENGUJI',
  'NTA / NIP',
  'JABATAN',
  'PANGKALAN / INSTANSI',
  'NO. HP / WHATSAPP',
];

export function downloadPengujiTemplate() {
  const wb = XLSX.utils.book_new();

  const data = [
    ['NAMA PENGUJI', 'NTA / NIP', 'JABATAN', 'PANGKALAN / INSTANSI', 'NO. HP / WHATSAPP'],
    [
      'Kak Sugeng Priyono, S.Pd., M.Si.',
      'NTA. 11.02.00.001',
      'Andalan Cabang Urusan Penggalang',
      'Kwarcab Banyumas',
      '081234567890',
    ],
    [
      'Kak Tri Wahyuni, M.Pd.',
      'NTA. 11.02.00.002',
      'Pelatih Pusdiklatcab',
      'Kwarcab Banyumas',
      '081345678901',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 32 }, // Nama
    { wch: 20 }, // NTA
    { wch: 34 }, // Jabatan
    { wch: 24 }, // Pangkalan
    { wch: 18 }, // HP
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template Penguji');
  XLSX.writeFile(wb, 'Template_Data_Penguji_Pramuka_Garuda.xlsx');
}

export function exportPengujiToExcel(
  pengujiList: Penguji[],
  penilaianMap?: Record<string, PenilaianPeserta>,
  filename = 'Data_Tim_Penguji_Pramuka_Garuda.xlsx'
) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'NO',
    'NAMA PENGUJI',
    'NTA / NIP',
    'JABATAN',
    'PANGKALAN / INSTANSI',
    'NO. HP / WHATSAPP',
    'JUMLAH PESERTA DIUJI',
  ];

  const rows = pengujiList.map((pj, idx) => {
    let diujiCount = 0;
    if (penilaianMap) {
      diujiCount = Object.values(penilaianMap).filter((pen) => pen.pengujiId === pj.id).length;
    }

    return [
      idx + 1,
      pj.nama,
      pj.nipNta || '-',
      pj.jabatan,
      pj.pangkalan,
      pj.noHp || '-',
      diujiCount,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 32 },
    { wch: 20 },
    { wch: 34 },
    { wch: 24 },
    { wch: 18 },
    { wch: 22 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Penguji');
  XLSX.writeFile(wb, filename);
}

export interface ParsePengujiResult {
  valid: Penguji[];
  errors: string[];
  totalParsed: number;
}

export async function parsePengujiFile(file: File): Promise<ParsePengujiResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];

  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const valid: Penguji[] = [];
  const errors: string[] = [];

  rawData.forEach((row, idx) => {
    const rowNum = idx + 2;

    const normalizedRow: Record<string, any> = {};
    Object.keys(row).forEach((k) => {
      normalizedRow[normalizeKey(k)] = row[k];
    });

    const nama = (
      normalizedRow['namapenguji'] ||
      normalizedRow['nama'] ||
      ''
    ).toString().trim();

    if (!nama) {
      errors.push(`Baris ${rowNum}: Nama penguji kosong.`);
      return;
    }

    const nipNta = (
      normalizedRow['ntanip'] ||
      normalizedRow['nta'] ||
      normalizedRow['nip'] ||
      normalizedRow['nipnta'] ||
      `NTA. 11.02.00.${(idx + 1).toString().padStart(3, '0')}`
    ).toString().trim();

    const jabatan = (
      normalizedRow['jabatan'] ||
      'Penguji Penilaian Pramuka Garuda'
    ).toString().trim();

    const pangkalan = (
      normalizedRow['pangkalans Instansi'] ||
      normalizedRow['pangkalan'] ||
      normalizedRow['instansi'] ||
      'Kwarcab Banyumas'
    ).toString().trim();

    const noHp = (
      normalizedRow['nohpwhatsapp'] ||
      normalizedRow['nohp'] ||
      normalizedRow['hp'] ||
      normalizedRow['telepon'] ||
      normalizedRow['wa'] ||
      ''
    ).toString().trim();

    valid.push({
      id: `penguji-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      nama,
      nipNta,
      jabatan,
      pangkalan,
      noHp,
    });
  });

  return {
    valid,
    errors,
    totalParsed: rawData.length,
  };
}

// ========================================================
// 3. REKAP NILAI TIM PENILAI (EXPORT & IMPORT TIAP TIM)
// ========================================================

export const REKAP_TIM_EXCEL_HEADERS = [
  'NO',
  'NO. PESERTA',
  'NAMA ANDIK',
  'L/P',
  'PANGKALAN',
  'ADMINISTRASI (YA/14)',
  'STATUS ADMIN',
  'SKOR WAWANCARA (MAX 55)',
  'PERSENTASE (%)',
  'STATUS KELULUSAN',
  'TIM PENGUJI',
  'TANGGAL PENILAIAN',
  'CATATAN',
];

/**
 * Ekspor Rekap Nilai untuk 1 Tim Penilai tertentu ke file Excel
 */
export function exportRekapTimToExcel(
  tim: Kelompok,
  andikList: Peserta[],
  pengujiList: Penguji[],
  penilaianMap: Record<string, PenilaianPeserta>,
  settings: AppSettings,
  filename?: string
) {
  const wb = XLSX.utils.book_new();

  // Nama file default
  const sanitizedTimName = tim.nama.replace(/[^a-zA-Z0-9]/g, '_');
  const targetFilename = filename || `Rekap_Nilai_${sanitizedTimName}.xlsx`;

  // Baris Data
  const rows = andikList.map((andik, index) => {
    const pen = penilaianMap[andik.id];
    let adminYaCount = 0;
    let statusAdmin = 'Belum Dinilai';
    let skorWawancara = 0;
    let persentase = 0;
    let statusKelulusan = 'BELUM DINILAI';
    let pengujiNama = tim.namaPenguji || '-';
    let tanggal = '-';
    let catatan = '-';

    if (pen) {
      adminYaCount = pen.administrasi.filter((a) => a.tersedia).length;
      statusAdmin = adminYaCount === 14 ? 'Lengkap (14/14)' : `${adminYaCount}/14 (Belum Lengkap)`;
      skorWawancara = pen.wawancara.reduce((sum, w) => sum + (w.poin || 0), 0);
      persentase = Number(((skorWawancara / 55) * 100).toFixed(1));
      statusKelulusan = persentase >= 80 ? 'LULUS' : 'BELUM LULUS';
      const pengujiObj = pengujiList.find((p) => p.id === pen.pengujiId);
      pengujiNama = pengujiObj?.nama || tim.namaPenguji || 'Tim Penguji';
      tanggal = pen.tanggalPenilaian || '-';
      catatan = pen.catatanUmum || '-';
    }

    return [
      index + 1,
      andik.nomorPeserta,
      andik.nama,
      andik.jenisKelamin,
      andik.pangkalan,
      pen ? `${adminYaCount}/14` : '-',
      statusAdmin,
      pen ? skorWawancara : '-',
      pen ? `${persentase}%` : '-',
      statusKelulusan,
      pengujiNama,
      tanggal,
      catatan,
    ];
  });

  // Hitung ringkasan
  const totalAndik = andikList.length;
  const sudahDinilai = andikList.filter((a) => !!penilaianMap[a.id]).length;
  const lulus = andikList.filter((a) => {
    const pen = penilaianMap[a.id];
    if (!pen) return false;
    const skor = pen.wawancara.reduce((sum, w) => sum + (w.poin || 0), 0);
    return (skor / 55) * 100 >= 80;
  }).length;
  const belumLulus = sudahDinilai - lulus;

  // Header Dokumen Berita Acara & Rekap
  const sheetData: (string | number)[][] = [
    [settings.kopBaris1 || 'GERAKAN PRAMUKA'],
    [settings.kopBaris2 || 'KWARTIR RANTING KECAMATAN KEMRANJEN'],
    [settings.kopBaris3 || 'Alamat: Jalan Pramuka Nomor 17 Karangjati Kemranjen Banyumas'],
    [],
    ['REKAPITULASI PENILAIAN PRAMUKA GARUDA'],
    [`${settings.golongan.toUpperCase()} • TAHUN ${settings.tahun}`],
    [],
    [`NAMA TIM PENILAI : ${tim.nama}`],
    [`NAMA PANGKALAN   : ${tim.pangkalan}`],
    [`TIM PENGUJI      : ${tim.namaPenguji || '-'}`],
    [`TOTAL ANDIK      : ${totalAndik} Orang  |  Sudah Dinilai: ${sudahDinilai}  |  Lulus: ${lulus}  |  Belum Lulus: ${belumLulus}`],
    [],
    REKAP_TIM_EXCEL_HEADERS,
    ...rows,
    [],
    [],
    ['', '', '', '', '', '', '', '', '', '', `Ditetapkan di: ${settings.tempat}`],
    ['', '', '', '', '', '', '', '', '', '', `Tanggal: ${new Date().toLocaleDateString('id-ID')}`],
    ['', '', '', '', '', '', '', '', '', '', 'Tim Penguji Pramuka Garuda:'],
    ['', '', '', '', '', '', '', '', '', '', tim.namaPenguji || 'Tim Penilai'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set lebar kolom
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 18 }, // No Peserta
    { wch: 28 }, // Nama Andik
    { wch: 6 },  // L/P
    { wch: 28 }, // Pangkalan
    { wch: 16 }, // Admin (Ya/14)
    { wch: 22 }, // Status Admin
    { wch: 20 }, // Skor Wawancara
    { wch: 16 }, // Persentase %
    { wch: 18 }, // Status Kelulusan
    { wch: 32 }, // Tim Penguji
    { wch: 16 }, // Tanggal
    { wch: 30 }, // Catatan
  ];

  XLSX.utils.book_append_sheet(wb, ws, tim.nama.substring(0, 31));
  XLSX.writeFile(wb, targetFilename);
}

/**
 * Unduh template form Excel untuk mengisikan nilai tim
 */
export function downloadRekapTimTemplate(tim: Kelompok, andikList: Peserta[]) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'NO',
    'NO. PESERTA',
    'NAMA ANDIK',
    'L/P',
    'PANGKALAN',
    'SKOR WAWANCARA (1-55)',
    'ADMINISTRASI LENGKAP (YA/TIDAK)',
    'NAMA PENGUJI',
    'TANGGAL PENILAIAN (YYYY-MM-DD)',
    'CATATAN',
  ];

  // Baris pre-filled untuk andik dalam tim ini
  const rows = andikList.map((andik, idx) => [
    idx + 1,
    andik.nomorPeserta,
    andik.nama,
    andik.jenisKelamin,
    andik.pangkalan,
    50, // contoh skor
    'YA',
    tim.namaPenguji?.split('&')[0]?.trim() || 'Tim Penguji',
    new Date().toISOString().split('T')[0],
    'Catatan penilaian andik',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([
    [`TEMPLATE IMPOR NILAI - ${tim.nama}`],
    [`PANGKALAN: ${tim.pangkalan} | PENGUJI: ${tim.namaPenguji || '-'}`],
    ['PETUNJUK: Masukkan SKOR WAWANCARA (skor 1-55, standar lulus minimal 44 atau 80%), ADMINISTRASI (YA atau TIDAK), lalu simpan dan unggah kembali.'],
    [],
    headers,
    ...rows,
  ]);

  ws['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 28 },
    { wch: 6 },
    { wch: 28 },
    { wch: 22 },
    { wch: 26 },
    { wch: 28 },
    { wch: 22 },
    { wch: 30 },
  ];

  const sanitizedTim = tim.nama.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, 'Template Nilai');
  XLSX.writeFile(wb, `Template_Nilai_${sanitizedTim}.xlsx`);
}

export interface ParseRekapTimResult {
  updatedPenilaian: Record<string, PenilaianPeserta>;
  successCount: number;
  matchedAndik: {
    pesertaId: string;
    nomorPeserta: string;
    nama: string;
    skorWawancara: number;
    persentase: number;
    status: string;
    adminLengkap: boolean;
  }[];
  errors: string[];
  totalRows: number;
}

/**
 * Parsing file Excel/CSV rekap nilai untuk tim penilai
 */
export async function parseRekapNilaiTimFile(
  file: File,
  tim: Kelompok,
  andikList: Peserta[],
  pengujiList: Penguji[],
  existingPenilaian: Record<string, PenilaianPeserta>
): Promise<ParseRekapTimResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const updatedPenilaian: Record<string, PenilaianPeserta> = {};
  const matchedAndik: ParseRekapTimResult['matchedAndik'] = [];
  const errors: string[] = [];

  // Default penguji ID
  const defaultPengujiId =
    tim.pengujiIds?.[0] || pengujiList[0]?.id || 'penguji-1';

  rawRows.forEach((row, idx) => {
    // Normalisasikan key baris
    const normalizedRow: Record<string, any> = {};
    Object.keys(row).forEach((k) => {
      normalizedRow[normalizeKey(k)] = row[k];
    });

    const noPesertaRaw = (
      normalizedRow['nopeserta'] ||
      normalizedRow['nomorpeserta'] ||
      normalizedRow['nomor'] ||
      normalizedRow['no'] ||
      ''
    ).toString().trim();

    const namaRaw = (
      normalizedRow['namaandik'] ||
      normalizedRow['namapeserta'] ||
      normalizedRow['nama'] ||
      ''
    ).toString().trim();

    if (!noPesertaRaw && !namaRaw) {
      return;
    }

    // Cari andik yang cocok berdasarkan nomor peserta atau nama
    const andik = andikList.find((a) => {
      if (noPesertaRaw && a.nomorPeserta.toLowerCase() === noPesertaRaw.toLowerCase()) {
        return true;
      }
      if (namaRaw && a.nama.toLowerCase().includes(namaRaw.toLowerCase())) {
        return true;
      }
      return false;
    });

    if (!andik) {
      errors.push(`Baris ${idx + 2}: Andik dengan no/nama "${noPesertaRaw || namaRaw}" tidak ditemukan dalam tim ${tim.nama}.`);
      return;
    }

    // Baca skor wawancara
    let skorWawancaraRaw =
      normalizedRow['skorwawancara155'] ||
      normalizedRow['skorwawancara'] ||
      normalizedRow['wawancara'] ||
      normalizedRow['skor'] ||
      normalizedRow['nilai'] ||
      44;

    let skorNum = parseFloat(skorWawancaraRaw.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(skorNum)) skorNum = 44;
    if (skorNum > 55 && skorNum <= 100) {
      skorNum = Math.round((skorNum / 100) * 55);
    }
    skorNum = Math.min(55, Math.max(0, skorNum));

    // Baca administrasi lengkap
    const adminRaw = (
      normalizedRow['administrasilengkapyatidak'] ||
      normalizedRow['administrasi'] ||
      normalizedRow['admin'] ||
      normalizedRow['kelengkapanadmin'] ||
      'YA'
    ).toString().trim().toUpperCase();

    const isLengkap =
      adminRaw.includes('YA') ||
      adminRaw.includes('LENGKAP') ||
      adminRaw === '14' ||
      adminRaw === 'TRUE';

    // Baca tanggal
    const tanggalPenilaian =
      (normalizedRow['tanggalpenilaianyyyymmdd'] ||
        normalizedRow['tanggalpenilaian'] ||
        normalizedRow['tanggal'] ||
        '').toString().trim() || new Date().toISOString().split('T')[0];

    // Baca catatan
    const catatanUmum =
      (normalizedRow['catatan'] ||
        normalizedRow['keterangan'] ||
        '').toString().trim() || 'Nilai diimpor melalui rekap tim';

    // Baca penguji
    const pengujiRaw = (
      normalizedRow['namapenguji'] ||
      normalizedRow['penguji'] ||
      ''
    ).toString().trim();

    let pengujiId = defaultPengujiId;
    if (pengujiRaw) {
      const matchP = pengujiList.find((p) =>
        p.nama.toLowerCase().includes(pengujiRaw.toLowerCase())
      );
      if (matchP) pengujiId = matchP.id;
    }

    // Bangun item administrasi (14 items)
    const administrasi = DEFAULT_ADMINISTRASI_TEMPLATE.map((tpl) => ({
      ...tpl,
      tersedia: isLengkap,
      catatan: isLengkap ? 'Lengkap' : 'Perlu dilengkapi',
    }));

    // Bangun item wawancara (11 items) yang menjumlahkan ke skorNum
    const baseScore = Math.floor(skorNum / 11);
    const remainder = skorNum % 11;
    const wawancara = DEFAULT_WAWANCARA_TEMPLATE.map((tpl, i) => {
      const extra = i < remainder ? 1 : 0;
      const point = Math.min(5, Math.max(1, baseScore + extra));
      return {
        ...tpl,
        poin: point,
        catatan: point >= 4 ? 'Sangat Baik' : 'Cukup',
      };
    });

    const newPenilaian: PenilaianPeserta = {
      pesertaId: andik.id,
      pengujiId,
      tanggalPenilaian,
      administrasi,
      wawancara,
      catatanUmum,
      updatedAt: new Date().toISOString(),
    };

    updatedPenilaian[andik.id] = newPenilaian;

    const persentase = Number(((skorNum / 55) * 100).toFixed(1));
    const status = persentase >= 80 ? 'LULUS' : 'BELUM LULUS';

    matchedAndik.push({
      pesertaId: andik.id,
      nomorPeserta: andik.nomorPeserta,
      nama: andik.nama,
      skorWawancara: skorNum,
      persentase,
      status,
      adminLengkap: isLengkap,
    });
  });

  return {
    updatedPenilaian,
    successCount: matchedAndik.length,
    matchedAndik,
    errors,
    totalRows: rawRows.length,
  };
}

/**
 * Ekspor Rekap Seluruh Tim Penilai sekaligus
 */
export function exportSemuaTimRekapToExcel(
  kelompokList: Kelompok[],
  pesertaList: Peserta[],
  pengujiList: Penguji[],
  penilaianMap: Record<string, PenilaianPeserta>,
  settings: AppSettings
) {
  const wb = XLSX.utils.book_new();

  kelompokList.forEach((tim) => {
    const andikList = pesertaList.filter((p) => p.kelompokId === tim.id);
    const rows = andikList.map((andik, index) => {
      const pen = penilaianMap[andik.id];
      let adminYa = 0;
      let skorW = 0;
      let pct = 0;
      let status = 'Belum Dinilai';

      if (pen) {
        adminYa = pen.administrasi.filter((a) => a.tersedia).length;
        skorW = pen.wawancara.reduce((s, w) => s + (w.poin || 0), 0);
        pct = Number(((skorW / 55) * 100).toFixed(1));
        status = pct >= 80 ? 'LULUS' : 'BELUM LULUS';
      }

      return [
        index + 1,
        andik.nomorPeserta,
        andik.nama,
        andik.jenisKelamin,
        andik.pangkalan,
        pen ? `${adminYa}/14` : '-',
        pen ? skorW : '-',
        pen ? `${pct}%` : '-',
        status,
        tim.namaPenguji || '-',
        pen?.tanggalPenilaian || '-',
      ];
    });

    const sheetData: (string | number)[][] = [
      [settings.kopBaris1 || 'GERAKAN PRAMUKA'],
      [settings.kopBaris2 || 'KWARTIR RANTING KECAMATAN KEMRANJEN'],
      [],
      [`REKAPITULASI PENILAIAN - ${tim.nama.toUpperCase()}`],
      [`PANGKALAN: ${tim.pangkalan} | PENGUJI: ${tim.namaPenguji || '-'}`],
      [],
      [
        'NO',
        'NO. PESERTA',
        'NAMA ANDIK',
        'L/P',
        'PANGKALAN',
        'ADMIN (YA/14)',
        'SKOR WAWANCARA',
        'PERSENTASE (%)',
        'STATUS',
        'TIM PENGUJI',
        'TANGGAL',
      ],
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 18 },
      { wch: 26 },
      { wch: 6 },
      { wch: 26 },
      { wch: 14 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 28 },
      { wch: 14 },
    ];

    const safeSheetTitle = tim.nama.substring(0, 31).replace(/[:\\/?*[\]]/g, '_');
    XLSX.utils.book_append_sheet(wb, ws, safeSheetTitle);
  });

  XLSX.writeFile(wb, 'Rekap_Semua_Tim_Penilai_Pramuka_Garuda.xlsx');
}
