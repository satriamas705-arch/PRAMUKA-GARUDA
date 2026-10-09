import { AuthUser, Penguji } from '../types';

const AUTH_STORAGE_KEY = 'pg_banyumas_auth_user_v1';

/**
 * Normalizes text: lowercase and removes non-alphanumeric characters
 */
export function cleanString(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Extracts possible password variants from an examiner's full name.
 * e.g., "Kak Sugeng Priyono, S.Pd., M.Si." ->
 * ["sugengpriyono", "kaksugengpriyono", "kaksugengpriyonospdmsi"]
 */
export function getPengujiPasswordCandidates(fullName: string): string[] {
  const candidates: Set<string> = new Set();

  // Variant 1: Complete raw string stripped
  const rawClean = cleanString(fullName);
  if (rawClean) candidates.add(rawClean);

  // Variant 2: Remove common Indonesian Scout prefixes like "kak", "kakak", "drs", "dr", "haji", "hj"
  // and common academic titles like "s.pd", "m.pd", "m.si", "s.sos", "s.ag", "s.t", "m.m"
  const strippedTitle = fullName
    .replace(/\b(kak|kakak|drs|dr|dra|h|hj|prof|ir)\b\.?/gi, '')
    .replace(/,\s*(s\.pd|m\.pd|m\.si|s\.sos|s\.ag|s\.t|m\.m|m\.kom|s\.kom|s\.e|s\.ip|s\.psi).*$/gi, '')
    .trim();

  const coreClean = cleanString(strippedTitle);
  if (coreClean) candidates.add(coreClean);

  // Variant 3: With "kak" prefix attached to the core name
  if (coreClean) {
    candidates.add(`kak${coreClean}`);
  }

  // Variant 4: First two words combined (often first name + last name)
  const words = fullName
    .replace(/[,.]/g, '')
    .split(/\s+/)
    .filter((w) => !['kak', 'kakak', 's.pd', 'm.pd', 'm.si', 's.sos'].includes(w.toLowerCase()));

  if (words.length >= 2) {
    candidates.add(cleanString(`${words[0]}${words[1]}`));
  } else if (words.length === 1) {
    candidates.add(cleanString(words[0]));
  }

  return Array.from(candidates);
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export function attemptLogin(
  usernameInput: string,
  passwordInput: string,
  pengujiList: Penguji[]
): LoginResult {
  const username = usernameInput.trim().toLowerCase();
  const password = passwordInput.trim();
  const passwordClean = cleanString(password);

  if (!username) {
    return { success: false, error: 'Username wajib diisi.' };
  }

  if (!password) {
    return { success: false, error: 'Password wajib diisi.' };
  }

  // ================= 1. ADMIN LOGIN =================
  if (username === 'admin') {
    if (password === 'admin') {
      return {
        success: true,
        user: {
          role: 'admin',
          username: 'admin',
          displayName: 'Administrator Kwarcab',
        },
      };
    }
    return {
      success: false,
      error: 'Password admin salah. Gunakan password: admin',
    };
  }

  // ================= 2. PENGUJI LOGIN =================
  if (username === 'penguji') {
    // Check if passwordClean matches any of the registered penguji candidates
    for (const penguji of pengujiList) {
      const candidates = getPengujiPasswordCandidates(penguji.nama);
      if (candidates.includes(passwordClean)) {
        return {
          success: true,
          user: {
            role: 'penguji',
            username: 'penguji',
            displayName: penguji.nama,
            pengujiId: penguji.id,
            pengujiData: penguji,
          },
        };
      }
    }

    return {
      success: false,
      error:
        'Password penguji tidak cocok dengan nama penguji yang terdaftar. Masukkan nama penguji dengan huruf kecil dan disambung (contoh: sugengpriyono).',
    };
  }

  return {
    success: false,
    error: 'Username tidak dikenal. Gunakan "admin" atau "penguji".',
  };
}

export function loadCurrentAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load auth user', err);
  }
  return null;
}

export function clearAuthUser(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear auth user', err);
  }
}

export function saveCurrentAuthUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to save auth user', err);
  }
}
