import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive');

// In-memory token cache (never stored in localStorage/sessionStorage per security guidelines)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
} | null = null;
let isSigningIn = false;

type AuthSuccessCallback = (user: any, token: string) => void;
type AuthFailureCallback = () => void;

const listeners: { success?: AuthSuccessCallback; failure?: AuthFailureCallback }[] = [];

export const initGoogleAuth = (
  onAuthSuccess?: AuthSuccessCallback,
  onAuthFailure?: AuthFailureCallback
) => {
  const listener = { success: onAuthSuccess, failure: onAuthFailure };
  listeners.push(listener);

  // If already authenticated in memory, fire callback immediately
  if (cachedAccessToken && (cachedGoogleUser || auth.currentUser)) {
    if (onAuthSuccess) {
      onAuthSuccess(cachedGoogleUser || auth.currentUser, cachedAccessToken);
    }
  }

  const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      cachedGoogleUser = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      };
      if (cachedAccessToken) {
        listeners.forEach((l) => l.success?.(user, cachedAccessToken!));
      } else if (!isSigningIn) {
        listeners.forEach((l) => l.failure?.());
      }
    } else {
      if (!cachedAccessToken) {
        cachedGoogleUser = null;
        listeners.forEach((l) => l.failure?.());
      }
    }
  });

  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
    unsubscribe();
  };
};

/**
 * Memastikan script Google Identity Services (GIS) termuat
 */
async function ensureGisLoaded(): Promise<boolean> {
  if ((window as any).google?.accounts?.oauth2) return true;
  return new Promise((resolve) => {
    let script = document.querySelector('script[src*="gsi/client"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    const start = Date.now();
    const interval = setInterval(() => {
      if ((window as any).google?.accounts?.oauth2) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - start > 4000) {
        clearInterval(interval);
        resolve(false);
      }
    }, 100);
  });
}

/**
 * Masuk menggunakan Google Identity Services (GIS Token Client).
 * Sangat andal di lingkungan iframe / AI Studio preview karena tidak bergantung pada cookie pihak ketiga di firebaseapp.com.
 */
export async function signInWithGIS(): Promise<{ user: any; accessToken: string }> {
  await ensureGisLoaded();
  const googleObj = (window as any).google;
  if (!googleObj?.accounts?.oauth2) {
    throw new Error('Google Identity Services belum dapat dimuat. Pastikan koneksi internet stabil.');
  }

  const clientId = firebaseConfig.oAuthClientId;
  if (!clientId) {
    throw new Error('OAuth Client ID tidak ditemukan dalam konfigurasi.');
  }

  return new Promise((resolve, reject) => {
    let resolved = false;

    // Timeout pengaman 90 detik
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Waktu otentikasi habis. Silakan klik Hubungkan Akun Google dan selesaikan login di jendela popup.'));
      }
    }, 90000);

    const tokenClient = googleObj.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope:
        'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: async (tokenResponse: any) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        if (tokenResponse.error) {
          if (tokenResponse.error === 'access_denied') {
            return reject(new Error('Izin akses Google Drive ditolak oleh pengguna.'));
          }
          return reject(new Error(`Google OAuth error: ${tokenResponse.error}`));
        }
        if (!tokenResponse.access_token) {
          return reject(new Error('Token akses tidak diterima dari Google.'));
        }

        const token = tokenResponse.access_token;
        cachedAccessToken = token;

        // Ambil profil pengguna dari Google UserInfo
        let profile = {
          displayName: 'Pengguna Google',
          email: '',
          photoURL: '',
        };

        try {
          const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            profile = {
              displayName: profileData.name || profileData.email || 'Pengguna Google',
              email: profileData.email || '',
              photoURL: profileData.picture || '',
            };
          }
        } catch (e) {
          console.warn('Gagal memuat profil GIS:', e);
        }

        cachedGoogleUser = profile;
        listeners.forEach((l) => l.success?.(profile, token));
        resolve({ user: profile, accessToken: token });
      },
      error_callback: (err: any) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        reject(new Error(err?.message || 'Proses otentikasi Google dibatalkan atau jendela ditutup.'));
      },
    });

    tokenClient.requestAccessToken({ prompt: '' });
  });
}

/**
 * Masuk menggunakan Firebase Auth
 */
export async function signInWithFirebase(): Promise<{ user: any; accessToken: string }> {
  return new Promise((resolve, reject) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Waktu login Firebase habis. Mencoba metode alternatif...'));
      }
    }, 45000);

    signInWithPopup(auth, provider)
      .then(async (result) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (!credential?.accessToken) {
          return reject(new Error('Gagal mendapatkan token akses dari Google.'));
        }

        cachedAccessToken = credential.accessToken;
        cachedGoogleUser = {
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        };

        listeners.forEach((l) => l.success?.(result.user, cachedAccessToken!));
        resolve({ user: result.user, accessToken: cachedAccessToken });
      })
      .catch((err) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Masuk dengan Akun Google
 * Secara cerdas mendeteksi lingkungan iframe:
 * Di dalam iframe, prioritaskan GIS (Google Identity Services) yang tidak terpengaruh blokir cookie pihak ketiga.
 * Jika di luar iframe, coba Firebase lalu beralih ke GIS.
 */
export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (isInIframe) {
      // Prioritaskan GIS di dalam iframe
      try {
        const gisResult = await signInWithGIS();
        return gisResult;
      } catch (gisErr: any) {
        console.warn('GIS gagal di dalam iframe, mencoba Firebase Auth sebagai fallback:', gisErr);
        try {
          const fbResult = await signInWithFirebase();
          return fbResult;
        } catch (fbErr: any) {
          throw gisErr || fbErr;
        }
      }
    } else {
      // Di luar iframe, coba Firebase Auth terlebih dahulu, lalu GIS
      try {
        const fbResult = await signInWithFirebase();
        return fbResult;
      } catch (fbErr: any) {
        console.warn('Firebase Auth gagal, mencoba GIS:', fbErr);
        const gisResult = await signInWithGIS();
        return gisResult;
      }
    }
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    if (error.code === 'auth/popup-blocked') {
      throw new Error(
        'Jendela pop-up Google Sign-In diblokir browser. Harap izinkan pop-up pada bilah alamat (address bar), lalu coba lagi.'
      );
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Jendela login ditutup sebelum otentikasi selesai. Silakan coba lagi.');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setGoogleAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCurrentGoogleUser = (): any => {
  return cachedGoogleUser || auth.currentUser;
};

export const googleSignOut = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Signout error:', e);
  }
  cachedAccessToken = null;
  cachedGoogleUser = null;
  listeners.forEach((l) => l.failure?.());
};
