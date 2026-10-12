import { Peserta } from '../types';

export type GolonganType = 'Penggalang' | 'Siaga' | 'Penegak' | 'Pandega';

/**
 * Ekstrak nama golongan singkat ('Penggalang' | 'Siaga' | 'Penegak' | 'Pandega')
 * dari teks konfigurasi pengaturan (contoh: "GOLONGAN PENGGALANG", "GOLONGAN SIAGA", dst)
 */
export function extractGolonganName(golonganStr: string | undefined): GolonganType {
  if (!golonganStr) return 'Penggalang';
  const s = golonganStr.toUpperCase();
  if (s.includes('SIAGA')) return 'Siaga';
  if (s.includes('PENEGAK')) return 'Penegak';
  if (s.includes('PANDEGA')) return 'Pandega';
  return 'Penggalang';
}

/**
 * Format nama golongan lengkap resmi (contoh: "GOLONGAN SIAGA")
 */
export function formatGolonganLabel(golonganStr: string | undefined): string {
  const short = extractGolonganName(golonganStr);
  return `GOLONGAN ${short.toUpperCase()}`;
}

export interface TKUOption {
  value: Peserta['tingkatTKU'];
  label: string;
  isGarudaPrerequisite?: boolean;
}

/**
 * Daftar opsi TKU yang valid berdasarkan golongan yang dipilih
 */
export function getTKUOptionsForGolongan(golonganStr: string | undefined): TKUOption[] {
  const g = extractGolonganName(golonganStr);
  switch (g) {
    case 'Siaga':
      return [
        { value: 'Tata', label: 'Siaga Tata (Syarat Pramuka Garuda)', isGarudaPrerequisite: true },
        { value: 'Bantu', label: 'Siaga Bantu' },
        { value: 'Mula', label: 'Siaga Mula' },
      ];
    case 'Penegak':
      return [
        { value: 'Laksana', label: 'Penegak Laksana (Syarat Pramuka Garuda)', isGarudaPrerequisite: true },
        { value: 'Bantara', label: 'Penegak Bantara' },
      ];
    case 'Pandega':
      return [
        { value: 'Pandega', label: 'Pandega (Syarat Pramuka Garuda)', isGarudaPrerequisite: true },
      ];
    case 'Penggalang':
    default:
      return [
        { value: 'Terap', label: 'Penggalang Terap (Syarat Pramuka Garuda)', isGarudaPrerequisite: true },
        { value: 'Rakit', label: 'Penggalang Rakit' },
        { value: 'Ramu', label: 'Penggalang Ramu' },
      ];
  }
}

/**
 * Ambil TKU prasyarat Pramuka Garuda default berdasarkan golongan
 */
export function getDefaultTKUForGolongan(golonganStr: string | undefined): Peserta['tingkatTKU'] {
  const g = extractGolonganName(golonganStr);
  switch (g) {
    case 'Siaga':
      return 'Tata';
    case 'Penegak':
      return 'Laksana';
    case 'Pandega':
      return 'Pandega';
    case 'Penggalang':
    default:
      return 'Terap';
  }
}

/**
 * Format butir pencapaian administrasi & wawancara agar dinamis sesuai golongan yang diatur
 */
export function formatPencapaianForGolongan(text: string, golonganSetting: string | undefined): string {
  const g = extractGolonganName(golonganSetting);
  if (g === 'Penggalang') {
    return text;
  }

  let formatted = text;

  if (g === 'Siaga') {
    formatted = formatted
      .replace(/SKU Tingkat Penggalang Ramu/g, 'SKU Tingkat Siaga Mula')
      .replace(/SKU Tingkat Penggalang Rakit/g, 'SKU Tingkat Siaga Bantu')
      .replace(/SKU Tingkat Penggalang Terap/g, 'SKU Tingkat Siaga Tata')
      .replace(/penggalang putri/g, 'siaga putri')
      .replace(/golongan penggalang/g, 'golongan siaga')
      .replace(/Golongan Penggalang/g, 'Golongan Siaga')
      .replace(/Penggalang/g, 'Siaga')
      .replace(/penggalang/g, 'siaga')
      .replace(/25 TKK/g, '10 TKK')
      .replace(
        /\(untuk penggalang pengujian IT untuk membuat dan memposting di IG video tentang kegiatan pencapaian garuda di kwarran dengan mencantumkan hastag dan tag yang telah ditentukan\)/g,
        '(untuk siaga pengujian pemanfaatan gawai dan internet ramah anak secara bijak)'
      );
  } else if (g === 'Penegak') {
    formatted = formatted
      .replace(/SKU Tingkat Penggalang Ramu/g, 'SKU Tingkat Penegak Bantara')
      .replace(/SKU Tingkat Penggalang Rakit/g, 'SKU Tingkat Penegak Laksana')
      .replace(/SKU Tingkat Penggalang Terap/g, 'SKU Tingkat Penegak Laksana (Pemenuhan Syarat Garuda)')
      .replace(/penggalang putri/g, 'penegak putri')
      .replace(/golongan penggalang/g, 'golongan penegak')
      .replace(/Golongan Penggalang/g, 'Golongan Penegak')
      .replace(/Penggalang/g, 'Penegak')
      .replace(/penggalang/g, 'penegak')
      .replace(
        /\(untuk penggalang pengujian IT untuk membuat dan memposting di IG video tentang kegiatan pencapaian garuda di kwarran dengan mencantumkan hastag dan tag yang telah ditentukan\)/g,
        '(untuk penegak pengujian pembuatan konten kepramukaan dan publikasi digital edukatif)'
      );
  } else if (g === 'Pandega') {
    formatted = formatted
      .replace(/SKU Tingkat Penggalang Ramu/g, 'SKU Tingkat Pandega')
      .replace(/SKU Tingkat Penggalang Rakit/g, 'SKU Tingkat Pandega')
      .replace(/SKU Tingkat Penggalang Terap/g, 'SKU Tingkat Pandega (Syarat Garuda)')
      .replace(/penggalang putri/g, 'pandega putri')
      .replace(/golongan penggalang/g, 'golongan pandega')
      .replace(/Golongan Penggalang/g, 'Golongan Pandega')
      .replace(/Penggalang/g, 'Pandega')
      .replace(/penggalang/g, 'pandega');
  }

  return formatted;
}
