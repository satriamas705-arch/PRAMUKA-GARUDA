import { Peserta, Penguji, Kelompok, PenilaianPeserta, AppSettings } from '../types';
import {
  INITIAL_PESERTA,
  INITIAL_PENGUJI,
  INITIAL_KELOMPOK,
  INITIAL_PENILAIAN,
  DEFAULT_SETTINGS,
} from '../data/initialData';

const STORAGE_KEYS = {
  PESERTA: 'pg_banyumas_peserta_v1',
  PENGUJI: 'pg_banyumas_penguji_v1',
  KELOMPOK: 'pg_banyumas_kelompok_v1',
  PENILAIAN: 'pg_banyumas_penilaian_v1',
  SETTINGS: 'pg_banyumas_settings_v1',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function loadPeserta(): Peserta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PESERTA);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading peserta', e);
  }
  return INITIAL_PESERTA;
}

export function savePeserta(data: Peserta[]) {
  localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(data));
}

export function loadPenguji(): Penguji[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENGUJI);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading penguji', e);
  }
  return INITIAL_PENGUJI;
}

export function savePenguji(data: Penguji[]) {
  localStorage.setItem(STORAGE_KEYS.PENGUJI, JSON.stringify(data));
}

export function loadKelompok(): Kelompok[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KELOMPOK);
    if (raw) {
      const parsed: Kelompok[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => {
          const matchInitial = INITIAL_KELOMPOK.find((init) => init.id === item.id);
          return {
            ...item,
            namaPenguji:
              item.namaPenguji ||
              matchInitial?.namaPenguji ||
              'Kak Sugeng Priyono, S.Pd., M.Si.',
            pengujiIds: item.pengujiIds || matchInitial?.pengujiIds || ['penguji-1'],
          };
        });
      }
    }
  } catch (e) {
    console.error('Error loading kelompok', e);
  }
  return INITIAL_KELOMPOK;
}

export function saveKelompok(data: Kelompok[]) {
  localStorage.setItem(STORAGE_KEYS.KELOMPOK, JSON.stringify(data));
}

export function loadPenilaian(): Record<string, PenilaianPeserta> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENILAIAN);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading penilaian', e);
  }
  return INITIAL_PENILAIAN;
}

export function savePenilaian(data: Record<string, PenilaianPeserta>) {
  localStorage.setItem(STORAGE_KEYS.PENILAIAN, JSON.stringify(data));
}

export function resetAllDataToDefault() {
  localStorage.removeItem(STORAGE_KEYS.PESERTA);
  localStorage.removeItem(STORAGE_KEYS.PENGUJI);
  localStorage.removeItem(STORAGE_KEYS.KELOMPOK);
  localStorage.removeItem(STORAGE_KEYS.PENILAIAN);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
}
