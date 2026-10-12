export const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Memformat tanggal menjadi format resmi Indonesia "dd mmmm yyyy"
 * Contoh: "2026-10-08" -> "08 Oktober 2026"
 */
export function formatTanggalIndonesia(dateInput?: string | null): string {
  if (!dateInput || dateInput.trim() === '') {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = BULAN_INDONESIA[today.getMonth()];
    const y = today.getFullYear();
    return `${d} ${m} ${y}`;
  }

  const trimmed = dateInput.trim();

  // Jika sudah berformat "dd MMMM yyyy", misalnya "08 Oktober 2026" atau "8 Oktober 2026"
  const alreadyPattern = new RegExp(
    `^(\\d{1,2})\\s+(${BULAN_INDONESIA.join('|')})\\s+(\\d{4})$`,
    'i'
  );
  const alreadyMatch = trimmed.match(alreadyPattern);
  if (alreadyMatch) {
    const d = String(parseInt(alreadyMatch[1], 10)).padStart(2, '0');
    // Cari nama bulan kapitalisasi yang benar
    const matchedMonthName = BULAN_INDONESIA.find(
      (b) => b.toLowerCase() === alreadyMatch[2].toLowerCase()
    ) || alreadyMatch[2];
    const y = alreadyMatch[3];
    return `${d} ${matchedMonthName} ${y}`;
  }

  // Format: YYYY-MM-DD
  const ymd = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymd) {
    const y = ymd[1];
    const monthIdx = parseInt(ymd[2], 10) - 1;
    const d = String(parseInt(ymd[3], 10)).padStart(2, '0');
    const m = BULAN_INDONESIA[monthIdx] || BULAN_INDONESIA[0];
    return `${d} ${m} ${y}`;
  }

  // Format: DD-MM-YYYY atau DD/MM/YYYY
  const dmy = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmy) {
    const d = String(parseInt(dmy[1], 10)).padStart(2, '0');
    const monthIdx = parseInt(dmy[2], 10) - 1;
    const y = dmy[3];
    const m = BULAN_INDONESIA[monthIdx] || BULAN_INDONESIA[0];
    return `${d} ${m} ${y}`;
  }

  // Fallback: parse dengan JavaScript Date
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = BULAN_INDONESIA[parsed.getMonth()];
    const y = parsed.getFullYear();
    return `${d} ${m} ${y}`;
  }

  return trimmed;
}
