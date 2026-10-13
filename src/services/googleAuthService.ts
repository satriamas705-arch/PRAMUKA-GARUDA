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

provider.setCustomParameters({
  prompt: 'select_account',
});

// Cache the access token in memory (never in localStorage / sessionStorage per guidelines)
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

  // If already authenticated in memory, fire immediately
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
 * Sign in using Google Identity Services (GIS token client) as a resilient fallback
 * when Firebase popup is blocked by the environment/unauthorized domain.
 */
async function signInWithGIS(): Promise<{ user: any; accessToken: string }> {
  return new Promise((resolve, reject) => {
    const googleObj = (window as any).google;
    if (!googleObj?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services belum siap dimuat. Silakan muat ulang halaman.'));
    }

    const clientId = firebaseConfig.oAuthClientId;
    if (!clientId) {
      return reject(new Error('OAuth Client ID tidak ditemukan dalam konfigurasi.'));
    }

    const tokenClient = googleObj.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          return reject(new Error(`Google OAuth ditolak: ${tokenResponse.error}`));
        }
        if (!tokenResponse.access_token) {
          return reject(new Error('Token akses Google tidak diterima.'));
        }

        const token = tokenResponse.access_token;
        cachedAccessToken = token;

        // Fetch user profile from Google UserInfo endpoint
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
        reject(new Error(err?.message || 'Proses otentikasi Google GIS dibatalkan.'));
      },
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  });
}

/**
 * Masuk dengan Akun Google
 * Mencoba Firebase Auth terlebih dahulu, dan beralih secara mulus ke Google Identity Services
 * jika domain belum diizinkan atau popup Firebase terhambat.
 */
export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  try {
    isSigningIn = true;

    try {
      // 1. Coba Firebase Auth popup standar
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Gagal mendapatkan token akses dari Google.');
      }

      cachedAccessToken = credential.accessToken;
      cachedGoogleUser = {
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      };

      listeners.forEach((l) => l.success?.(result.user, cachedAccessToken!));
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (firebaseErr: any) {
      console.warn('Firebase popup sign-in encountered an issue, trying GIS fallback:', firebaseErr);

      // Jika error karena unauthorized domain atau popup blocker, coba GIS token client
      if (
        firebaseErr.code === 'auth/unauthorized-domain' ||
        firebaseErr.code === 'auth/popup-blocked' ||
        firebaseErr.code === 'auth/operation-not-supported-in-this-environment' ||
        (window as any).google?.accounts?.oauth2
      ) {
        try {
          const gisResult = await signInWithGIS();
          return gisResult;
        } catch (gisErr: any) {
          console.error('GIS fallback also failed:', gisErr);
          throw gisErr;
        }
      }

      if (firebaseErr.code === 'auth/popup-closed-by-user') {
        throw new Error('Jendela login ditutup sebelum otentikasi selesai. Silakan coba lagi.');
      }

      throw firebaseErr;
    }
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
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
