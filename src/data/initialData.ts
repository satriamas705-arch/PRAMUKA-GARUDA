import { ItemAdministrasi, ItemWawancara, Peserta, Penguji, Kelompok, AppSettings, PenilaianPeserta } from '../types';

export const DEFAULT_ADMINISTRASI_TEMPLATE: Omit<ItemAdministrasi, 'tersedia' | 'catatan'>[] = [
  {
    id: 1,
    pencapaian: 'Dapat menunjukkan SKU Tingkat Penggalang Ramu',
  },
  {
    id: 2,
    pencapaian: 'Dapat menunjukkan Fotokopi STL SKU Tingkat Penggalang Ramu',
  },
  {
    id: 3,
    pencapaian: 'Dapat menunjukkan SKU Tingkat Penggalang Rakit',
  },
  {
    id: 4,
    pencapaian: 'Dapat menunjukkan Fotokopi STL SKU Tingkat Penggalang Rakit',
  },
  {
    id: 5,
    pencapaian: 'Dapat menunjukkan SKU Tingkat Penggalang Terap',
  },
  {
    id: 6,
    pencapaian: 'Dapat menunjukkan Fotokopi STL SKU Tingkat Penggalang Terap',
  },
  {
    id: 7,
    pencapaian: 'Dapat menunjukkan SKK dengan rincian 5 macam dari masing - masing bidang (25 TKK)',
  },
  {
    id: 8,
    pencapaian: 'Dapat menunjukkan Fotokopi STL SKK dengan rincian 5 macam dari masing - masing bidang (25 TKK) khusus penggalang putri jika bidang berwarna kuning (bidang agama, mental, moral dan spiritual) tidak terpenuhi maka bisa digantikan dengan bidang lain',
  },
  {
    id: 9,
    pencapaian: 'Dapat menunjukkan dari 25 TKK yang telah dicapai sekurang - kurangnya 2 macam tingkat utama dan 3 macam tingkat madya',
  },
  {
    id: 10,
    pencapaian: 'Dapat menunjukkan foto hasta karya sekurang - kurangnya 6 macam',
  },
  {
    id: 11,
    pencapaian: 'Dapat menunjukkan surat keterangan berkelakuan baik dan menjadi contoh teladan di rumah dari orang tua',
  },
  {
    id: 12,
    pencapaian: 'Dapat menunjukkan surat keterangan berkelakuan baik dan menjadi contoh teladan di lingkungan masyarakat dari Ketua RT dan RW',
  },
  {
    id: 13,
    pencapaian: 'Dapat menunjukkan surat keterangan berkelakuan baik dan menjadi contoh teladan di lingkungan sekolah dari pembina gugus depan',
  },
  {
    id: 14,
    pencapaian: 'Dapat menunjukkan surat keterangan berkelakuan baik dan menjadi contoh teladan di lingkungan sekolah dari Ketua Mabigus',
  },
];

export const DEFAULT_WAWANCARA_TEMPLATE: Omit<ItemWawancara, 'poin' | 'catatan'>[] = [
  {
    id: 1,
    pencapaian: 'Dapat memperkenalkan diri dengan baik dan lancar (menggunakan salah satu Bahasa internasional (Bahasa Inggris))',
  },
  {
    id: 2,
    pencapaian: 'Dapat menjelaskan tingkatan TKU pada golongan penggalang',
  },
  {
    id: 3,
    pencapaian: 'Dapat menjelaskan dan menunjukkan tingkatan TKU yang dicapai peserta sekarang',
  },
  {
    id: 4,
    pencapaian: 'Dapat menjelaskan TKK golongan penggalang pada masing - masing bidang (dipilih secara acak pada masing - masing bidang oleh penguji) (total ada 25 TKK, sekurang kurangnya 2 tingkat utama, 3 tingkat madya)',
  },
  {
    id: 5,
    pencapaian: 'Dapat menunjukkan TKK golongan penggalang pada masing - masing bidang (dipilih secara acak pada masing - masing bidang oleh penguji) (total ada 25 TKK, sekurang kurangnya 2 tingkat utama, 3 tingkat madya)',
  },
  {
    id: 6,
    pencapaian: 'Dapat menjelaskan tentang arti Pramuka Garuda',
  },
  {
    id: 7,
    pencapaian: 'Dapat menjelaskan contoh yang baik/ teladan yang sudah dilakukan sekolah dan atau sekitar lingkungan rumah',
  },
  {
    id: 8,
    pencapaian: 'Dapat menunjukkan 6 hasta karya yang telah dibuat dan membuat 2 hasta karya dari 6 hasta karya telah dibuat sebelumnya',
  },
  {
    id: 9,
    pencapaian: 'Dapat menampilkan uji bakat sesuai bakatnya',
  },
  {
    id: 10,
    pencapaian: 'Dapat membuat simpul dan atau ikatan',
  },
  {
    id: 11,
    pencapaian: 'Dapat menggunakan komputer/HP, teknologi informasi minimal internet (untuk penggalang pengujian IT untuk membuat dan memposting di IG video tentang kegiatan pencapaian garuda di kwarran dengan mencantumkan hastag dan tag yang telah ditentukan)',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  kwartirCabang: 'KWARTIR CABANG BANYUMAS',
  kwarran: 'KWARRAN KEMRANJEN',
  golongan: 'GOLONGAN PENGGALANG',
  tahun: '2026',
  tempat: 'Kemranjen, Banyumas',
  mabigusAtauKetuaPanitia: 'Drs. H. Achmad Supriyanto, M.Pd.',
  tanggalDefault: '2026-10-08',
  kopBaris1: 'GERAKAN PRAMUKA',
  kopBaris2: 'KWARTIR RANTING KECAMATAN KEMRANJEN',
  kopBaris3: 'Alamat: Jalan Pramuka Nomor 17 Karangjati Kemranjen Banyumas Kode Pos 53194',
};

export const INITIAL_PENGUJI: Penguji[] = [
  {
    id: 'penguji-1',
    nama: 'Kak Sugeng Priyono, S.Pd., M.Si.',
    nipNta: 'NTA. 11.02.00.001',
    jabatan: 'Andalan Cabang Urusan Penggalang',
    pangkalan: 'Kwarcab Banyumas',
    noHp: '0812-3456-7890',
  },
  {
    id: 'penguji-2',
    nama: 'Kak Siti Nurjanah, M.Pd.',
    nipNta: 'NTA. 11.02.00.008',
    jabatan: 'Pelatih Pembina Pramuka Pusdiklatcab',
    pangkalan: 'Kwarcab Banyumas',
    noHp: '0813-9876-5432',
  },
  {
    id: 'penguji-3',
    nama: 'Kak Bambang Trihatmojo, S.Sos.',
    nipNta: 'NTA. 11.02.00.015',
    jabatan: 'Tim Penilai Garuda Kwarcab Banyumas',
    pangkalan: 'Kwarcab Banyumas',
    noHp: '0857-1122-3344',
  },
];

export const INITIAL_KELOMPOK: Kelompok[] = [
  {
    id: 'kel-1',
    nama: 'Tim Penilai 1 (Regu Rajawali Putra)',
    jenisKelamin: 'Putra',
    pangkalan: 'SMP Negeri 1 Purwokerto',
    namaPenguji: 'Kak Sugeng Priyono, S.Pd., M.Si. & Kak Siti Nurjanah, M.Pd.',
    pengujiIds: ['penguji-1', 'penguji-2'],
    pemimpinRegu: 'Satria Pratama',
    pembinaPendamping: 'Kak Joko Susilo, S.Pd.',
  },
  {
    id: 'kel-2',
    nama: 'Tim Penilai 2 (Regu Mawar Putri)',
    jenisKelamin: 'Putri',
    pangkalan: 'SMP Negeri 1 Purwokerto',
    namaPenguji: 'Kak Siti Nurjanah, M.Pd. & Kak Bambang Trihatmojo, S.Sos.',
    pengujiIds: ['penguji-2', 'penguji-3'],
    pemimpinRegu: 'Anindya Putri Kirana',
    pembinaPendamping: 'Kak Endang Wahyuni, S.Pd.',
  },
  {
    id: 'kel-3',
    nama: 'Tim Penilai 3 (Regu Garuda Sakti Putra)',
    jenisKelamin: 'Putra',
    pangkalan: 'MTs Negeri 1 Banyumas',
    namaPenguji: 'Kak Sugeng Priyono, S.Pd., M.Si.',
    pengujiIds: ['penguji-1'],
    pemimpinRegu: 'Ahmad Faiz Ramadhan',
    pembinaPendamping: 'Kak H. Mukhlasin, S.Ag.',
  },
  {
    id: 'kel-4',
    nama: 'Tim Penilai 4 (Regu Melati Suci Putri)',
    jenisKelamin: 'Putri',
    pangkalan: 'SMP Negeri 2 Banyumas',
    namaPenguji: 'Kak Bambang Trihatmojo, S.Sos.',
    pengujiIds: ['penguji-3'],
    pemimpinRegu: 'Nabila Azzahra',
    pembinaPendamping: 'Kak Sri Rahayu, S.Pd.',
  },
];

export const INITIAL_PESERTA: Peserta[] = [
  {
    id: 'peserta-1',
    nomorPeserta: 'PG-01/BMS/2026',
    nama: 'Satria Pratama',
    jenisKelamin: 'L',
    pangkalan: 'SMP Negeri 1 Purwokerto',
    gudep: '02.001 - 02.002',
    kelompokId: 'kel-1',
    golongan: 'Penggalang',
    tingkatTKU: 'Terap',
    kontakHp: '0812-2233-4455',
    namaPembina: 'Kak Joko Susilo, S.Pd.',
  },
  {
    id: 'peserta-2',
    nomorPeserta: 'PG-02/BMS/2026',
    nama: 'Anindya Putri Kirana',
    jenisKelamin: 'P',
    pangkalan: 'SMP Negeri 1 Purwokerto',
    gudep: '02.001 - 02.002',
    kelompokId: 'kel-2',
    golongan: 'Penggalang',
    tingkatTKU: 'Terap',
    kontakHp: '0813-5566-7788',
    namaPembina: 'Kak Endang Wahyuni, S.Pd.',
  },
  {
    id: 'peserta-3',
    nomorPeserta: 'PG-03/BMS/2026',
    nama: 'Ahmad Faiz Ramadhan',
    jenisKelamin: 'L',
    pangkalan: 'MTs Negeri 1 Banyumas',
    gudep: '02.045 - 02.046',
    kelompokId: 'kel-3',
    golongan: 'Penggalang',
    tingkatTKU: 'Terap',
    kontakHp: '0858-6677-8899',
    namaPembina: 'Kak H. Mukhlasin, S.Ag.',
  },
  {
    id: 'peserta-4',
    nomorPeserta: 'PG-04/BMS/2026',
    nama: 'Nabila Azzahra',
    jenisKelamin: 'P',
    pangkalan: 'SMP Negeri 2 Banyumas',
    gudep: '02.077 - 02.078',
    kelompokId: 'kel-4',
    golongan: 'Penggalang',
    tingkatTKU: 'Terap',
    kontakHp: '0895-1234-5678',
    namaPembina: 'Kak Sri Rahayu, S.Pd.',
  },
  {
    id: 'peserta-5',
    nomorPeserta: 'PG-05/BMS/2026',
    nama: 'Dimas Bagus Wicaksono',
    jenisKelamin: 'L',
    pangkalan: 'SMP Negeri 1 Purwokerto',
    gudep: '02.001 - 02.002',
    kelompokId: 'kel-1',
    golongan: 'Penggalang',
    tingkatTKU: 'Terap',
    kontakHp: '0877-3344-5566',
    namaPembina: 'Kak Joko Susilo, S.Pd.',
  },
  {
    id: 'peserta-6',
    nomorPeserta: 'PG-06/BMS/2026',
    nama: 'Zahra Aulia Rahma',
    jenisKelamin: 'P',
    pangkalan: 'SMP Negeri 2 Banyumas',
    gudep: '02.077 - 02.078',
    kelompokId: 'kel-4',
    golongan: 'Penggalang',
    tingkatTKU: 'Terap',
    kontakHp: '0812-7788-9900',
    namaPembina: 'Kak Sri Rahayu, S.Pd.',
  },
];

// Pre-fill initial assessments matching image scenario:
// In the photo: Jumlah Poin = 37, % = 37/55 * 100% = 67.27% (BELUM LULUS)
// And another one LULUS with >= 44 points (e.g., 48 points = 87.27%)
export const INITIAL_PENILAIAN: Record<string, PenilaianPeserta> = {
  'peserta-1': {
    pesertaId: 'peserta-1',
    pengujiId: 'penguji-1',
    tanggalPenilaian: '2026-10-08',
    administrasi: DEFAULT_ADMINISTRASI_TEMPLATE.map((item) => ({
      ...item,
      tersedia: true,
      catatan: 'Lengkap dan terverifikasi',
    })),
    wawancara: [
      { id: 1, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[0].pencapaian, poin: 4, catatan: 'Lancar perkenalan English' },
      { id: 2, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[1].pencapaian, poin: 5, catatan: 'Sangat paham Ramu-Rakit-Terap' },
      { id: 3, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[2].pencapaian, poin: 5, catatan: 'Menunjukkan TKU Terap' },
      { id: 4, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[3].pencapaian, poin: 4, catatan: 'Menjelaskan 5 bidang TKK' },
      { id: 5, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[4].pencapaian, poin: 4, catatan: 'Bawa bukti TKK Utama & Madya' },
      { id: 6, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[5].pencapaian, poin: 5, catatan: 'Paham makna kiasan & lambang' },
      { id: 7, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[6].pencapaian, poin: 4, catatan: 'Aktif bakti sosial' },
      { id: 8, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[7].pencapaian, poin: 4, catatan: 'Hasta karya anyaman bambu & miniatur' },
      { id: 9, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[8].pencapaian, poin: 5, catatan: 'Uji bakat pidato & pionering' },
      { id: 10, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[9].pencapaian, poin: 5, catatan: 'Simpul pangkal, tiang, & jangkar sempurna' },
      { id: 11, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[10].pencapaian, poin: 5, catatan: 'Video IG terverifikasi link aktif' },
    ],
    catatanUmum: 'Sangat direkomendasikan menjadi Pramuka Garuda Teladan Kwartir Cabang Banyumas.',
    updatedAt: new Date().toISOString(),
  },
  'peserta-2': {
    pesertaId: 'peserta-2',
    pengujiId: 'penguji-2',
    tanggalPenilaian: '2026-10-08',
    administrasi: DEFAULT_ADMINISTRASI_TEMPLATE.map((item, idx) => ({
      ...item,
      tersedia: idx !== 13, // 13 Ya, 1 Belum (Surat mabigus masih proses)
      catatan: idx === 13 ? 'Menunggu ttd Kamabigus (diberi waktu 3 hari)' : 'Lengkap',
    })),
    // Poin 37 persis seperti di gambar foto user (37 / 55 = 67.27%)
    wawancara: [
      { id: 1, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[0].pencapaian, poin: 3, catatan: 'Perkenalan cukup lancar' },
      { id: 2, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[1].pencapaian, poin: 4, catatan: 'Memahami tingkatan' },
      { id: 3, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[2].pencapaian, poin: 4, catatan: 'Menunjukkan TKU Terap' },
      { id: 4, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[3].pencapaian, poin: 3, catatan: 'Perlu pendalaman bidang TKK' },
      { id: 5, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[4].pencapaian, poin: 3, catatan: 'TKK Madya 3 terpenuhi' },
      { id: 6, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[5].pencapaian, poin: 4, catatan: 'Memahami arti Garuda' },
      { id: 7, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[6].pencapaian, poin: 3, catatan: 'Cukup teladan di rumah' },
      { id: 8, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[7].pencapaian, poin: 3, catatan: '6 hasta karya tersedia' },
      { id: 9, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[8].pencapaian, poin: 4, catatan: 'Bakat menyanyi lagu daerah' },
      { id: 10, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[9].pencapaian, poin: 3, catatan: 'Ikatan palang perlu dipererat' },
      { id: 11, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[10].pencapaian, poin: 3, catatan: 'Konten IG sudah diunggah' },
    ],
    catatanUmum: 'Diberikan waktu perbaikan administrasi dan uji ulang wawancara untuk mencapai 80%.',
    updatedAt: new Date().toISOString(),
  },
  'peserta-3': {
    pesertaId: 'peserta-3',
    pengujiId: 'penguji-1',
    tanggalPenilaian: '2026-10-08',
    administrasi: DEFAULT_ADMINISTRASI_TEMPLATE.map((item) => ({
      ...item,
      tersedia: true,
      catatan: 'Lengkap dan tertib',
    })),
    wawancara: [
      { id: 1, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[0].pencapaian, poin: 4, catatan: '' },
      { id: 2, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[1].pencapaian, poin: 4, catatan: '' },
      { id: 3, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[2].pencapaian, poin: 4, catatan: '' },
      { id: 4, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[3].pencapaian, poin: 4, catatan: '' },
      { id: 5, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[4].pencapaian, poin: 4, catatan: '' },
      { id: 6, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[5].pencapaian, poin: 4, catatan: '' },
      { id: 7, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[6].pencapaian, poin: 4, catatan: '' },
      { id: 8, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[7].pencapaian, poin: 4, catatan: '' },
      { id: 9, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[8].pencapaian, poin: 4, catatan: '' },
      { id: 10, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[9].pencapaian, poin: 4, catatan: '' },
      { id: 11, pencapaian: DEFAULT_WAWANCARA_TEMPLATE[10].pencapaian, poin: 5, catatan: '' },
    ],
    catatanUmum: 'Memenuhi syarat kelulusan Pramuka Garuda Penggalang.',
    updatedAt: new Date().toISOString(),
  },
};
