import React, { useState, useEffect } from 'react';
import {
  Peserta,
  Penguji,
  Kelompok,
  PenilaianPeserta,
  AppSettings,
  AuthUser,
} from '../types';
import {
  googleSignIn,
  googleSignOut,
  getGoogleAccessToken,
  getCurrentGoogleUser,
  initGoogleAuth,
} from '../services/googleAuthService';
import {
  DEFAULT_DRIVE_FOLDER_ID,
  DEFAULT_DRIVE_FOLDER_URL,
  SYNC_FILE_NAME,
  DriveFileInfo,
  FolderAccessStatus,
  checkDriveFolderAccess,
  findSyncFile,
  listDriveBackupFiles,
  readDriveJsonFile,
  uploadNewFileToDrive,
  updateDriveFileContent,
  deleteDriveFile,
} from '../services/googleDriveService';
import {
  AppSyncPayload,
  mergeAppData,
  buildAdminAuthoritativePayload,
  MergeResult,
} from '../services/syncManager';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  FolderSync,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  LogOut,
  Clock,
  FileText,
  FileCheck2,
  Trash2,
  Check,
  Info,
} from 'lucide-react';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  pesertaList: Peserta[];
  pengujiList: Penguji[];
  kelompokList: Kelompok[];
  penilaianMap: Record<string, PenilaianPeserta>;
  settings: AppSettings;
  onApplySyncData: (data: {
    peserta: Peserta[];
    penguji: Penguji[];
    kelompok: Kelompok[];
    penilaian: Record<string, PenilaianPeserta>;
    settings?: AppSettings;
  }) => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  pesertaList,
  pengujiList,
  kelompokList,
  penilaianMap,
  settings,
  onApplySyncData,
}) => {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<MergeResult['stats'] | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Folder access status
  const [folderStatus, setFolderStatus] = useState<FolderAccessStatus | null>(null);
  const [isCheckingFolder, setIsCheckingFolder] = useState(false);

  // Drive files listing
  const [driveFiles, setDriveFiles] = useState<DriveFileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Confirmation Modals state
  const [confirmAdminDeletionOpen, setConfirmAdminDeletionOpen] = useState(false);
  const [confirmRestoreFile, setConfirmRestoreFile] = useState<DriveFileInfo | null>(null);

  const isAdmin = currentUser.role === 'admin';

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    const existingToken = getGoogleAccessToken();
    const existingUser = getCurrentGoogleUser();
    if (existingToken && existingUser) {
      setAccessToken(existingToken);
      setGoogleUser(existingUser);
    }
    return () => unsubscribe();
  }, []);

  // Fetch drive files and folder status when authenticated and modal is open
  useEffect(() => {
    if (isOpen && accessToken) {
      fetchDriveFiles(accessToken);
      checkFolder(accessToken);
    }
  }, [isOpen, accessToken]);

  const checkFolder = async (token: string) => {
    setIsCheckingFolder(true);
    try {
      const status = await checkDriveFolderAccess(token, DEFAULT_DRIVE_FOLDER_ID);
      setFolderStatus(status);
    } catch (err: any) {
      console.warn('Gagal memeriksa status folder:', err);
      if (err.message?.includes('401')) {
        handleExpiredSession();
      }
    } finally {
      setIsCheckingFolder(false);
    }
  };

  const fetchDriveFiles = async (token: string) => {
    setIsLoadingFiles(true);
    try {
      const files = await listDriveBackupFiles(token, DEFAULT_DRIVE_FOLDER_ID);
      setDriveFiles(files);
    } catch (err: any) {
      console.warn('Gagal memuat daftar file Google Drive:', err);
      if (err.message?.includes('401')) {
        handleExpiredSession();
      }
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleExpiredSession = () => {
    setAccessToken(null);
    setGoogleUser(null);
    setFolderStatus(null);
    setErrorMessage('Sesi Google Drive telah berakhir (401). Silakan klik "Hubungkan Akun Google" untuk masuk kembali.');
  };

  /**
   * Handle Google Login
   * Mengembalikan token dan user jika berhasil, atau null jika gagal/dibatalkan.
   */
  const handleGoogleLogin = async (): Promise<{ user: any; accessToken: string } | null> => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        fetchDriveFiles(result.accessToken);
        checkFolder(result.accessToken);
        return result;
      }
      return null;
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Gagal masuk dengan akun Google. Pastikan izin popup diberikan.'
      );
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      setAccessToken(null);
      setFolderStatus(null);
      setDriveFiles([]);
      setSyncStatusMessage(null);
      setLastSyncResult(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  /**
   * SINKRONISASI NORMAL (MERGE & UPDATE)
   * Berlaku untuk seluruh pengguna (Penguji & Admin).
   * Data lama tidak dihapus, hanya diperbarui jika ada revisi terbaru.
   */
  const handleMergeSync = async () => {
    let currentToken = accessToken;
    let currentUserEmail = googleUser?.email;

    // Jika belum login, jalankan login terlebih dahulu dan lanjutkan otomatis jika berhasil
    if (!currentToken) {
      const loginResult = await handleGoogleLogin();
      if (!loginResult) return;
      currentToken = loginResult.accessToken;
      currentUserEmail = loginResult.user?.email;
    }

    setIsSyncing(true);
    setErrorMessage(null);
    setSyncStatusMessage('Membaca data database dari Google Drive...');

    try {
      const localData = {
        peserta: pesertaList,
        penguji: pengujiList,
        kelompok: kelompokList,
        penilaian: penilaianMap,
        settings,
      };

      // 1. Cari file sinkronisasi utama
      const existingFile = await findSyncFile(currentToken, DEFAULT_DRIVE_FOLDER_ID);

      let cloudData: Partial<AppSyncPayload> = {};
      if (existingFile) {
        setSyncStatusMessage('Menggabungkan data lokal dan Google Drive (Merge & Update)...');
        cloudData = await readDriveJsonFile<AppSyncPayload>(currentToken, existingFile.id);
      } else {
        setSyncStatusMessage('Membuat database awal di Google Drive...');
      }

      // 2. Lakukan penggabungan cerdas (Merge & Update) dengan resolusi ID lintas perangkat
      const mergeResult = mergeAppData(
        localData,
        cloudData,
        currentUser,
        currentUserEmail
      );

      // 3. Simpan data hasil merge kembali ke Google Drive
      setSyncStatusMessage('Menyimpan hasil sinkronisasi ke Google Drive...');
      if (existingFile) {
        await updateDriveFileContent(currentToken, existingFile.id, mergeResult.mergedData);
      } else {
        await uploadNewFileToDrive(
          currentToken,
          DEFAULT_DRIVE_FOLDER_ID,
          SYNC_FILE_NAME,
          mergeResult.mergedData
        );
      }

      // 4. Perbarui state lokal aplikasi
      onApplySyncData({
        peserta: mergeResult.mergedData.peserta,
        penguji: mergeResult.mergedData.penguji,
        kelompok: mergeResult.mergedData.kelompok,
        penilaian: mergeResult.mergedData.penilaian,
        settings: mergeResult.mergedData.settings,
      });

      setLastSyncResult(mergeResult.stats);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
      setSyncStatusMessage(
        `Sinkronisasi Merge & Update Berhasil! Total ${mergeResult.stats.totalPeserta} peserta ` +
          `(${mergeResult.stats.pesertaAddedFromCloud} baru dari cloud, ${mergeResult.stats.pesertaUpdatedFromCloud} diperbarui), ` +
          `${mergeResult.stats.totalPenilaian} berkas nilai tersimpan.`
      );

      // Segarkan daftar berkas
      fetchDriveFiles(currentToken);
    } catch (err: any) {
      console.error('Merge sync error:', err);
      if (err.message?.includes('401')) {
        handleExpiredSession();
      } else {
        setErrorMessage(`Gagal melakukan sinkronisasi: ${err?.message || 'Kesalahan jaringan'}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * SINKRONISASI PENYESUAIAN PENGHAPUSAN (KHUSUS ADMIN)
   * Data di Google Drive langsung diselaraskan dengan data aktif admin saat ini.
   */
  const handleExecuteAdminDeletionSync = async () => {
    let currentToken = accessToken;
    let currentUserEmail = googleUser?.email;

    if (!currentToken) {
      const loginResult = await handleGoogleLogin();
      if (!loginResult) return;
      currentToken = loginResult.accessToken;
      currentUserEmail = loginResult.user?.email;
    }

    if (!isAdmin) return;

    setIsSyncing(true);
    setErrorMessage(null);
    setSyncStatusMessage('Menyesuaikan status penghapusan ke Google Drive...');

    try {
      const localData = {
        peserta: pesertaList,
        penguji: pengujiList,
        kelompok: kelompokList,
        penilaian: penilaianMap,
        settings,
      };

      const authoritativePayload = buildAdminAuthoritativePayload(
        localData,
        currentUser,
        currentUserEmail
      );

      const existingFile = await findSyncFile(currentToken, DEFAULT_DRIVE_FOLDER_ID);
      if (existingFile) {
        await updateDriveFileContent(currentToken, existingFile.id, authoritativePayload);
      } else {
        await uploadNewFileToDrive(
          currentToken,
          DEFAULT_DRIVE_FOLDER_ID,
          SYNC_FILE_NAME,
          authoritativePayload
        );
      }

      setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
      setSyncStatusMessage(
        `Penyesuaian Penghapusan Berhasil! Data di Google Drive telah diselaraskan dengan ` +
          `${localData.peserta.length} peserta aktif, ${localData.penguji.length} penguji, dan ` +
          `${Object.keys(localData.penilaian).length} penilaian.`
      );

      fetchDriveFiles(currentToken);
    } catch (err: any) {
      console.error('Admin deletion sync error:', err);
      if (err.message?.includes('401')) {
        handleExpiredSession();
      } else {
        setErrorMessage(`Gagal menyinkronkan penghapusan: ${err?.message || 'Kesalahan jaringan'}`);
      }
    } finally {
      setIsSyncing(false);
      setConfirmAdminDeletionOpen(false);
    }
  };

  /**
   * BUAT SNAPSHOT CADANGAN BARU
   */
  const handleCreateSnapshotBackup = async () => {
    let currentToken = accessToken;
    let currentUserEmail = googleUser?.email;

    if (!currentToken) {
      const loginResult = await handleGoogleLogin();
      if (!loginResult) return;
      currentToken = loginResult.accessToken;
      currentUserEmail = loginResult.user?.email;
    }

    setIsSyncing(true);
    setErrorMessage(null);
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `Backup_Pramuka_Garuda_${dateStr}.json`;

    setSyncStatusMessage(`Mengunggah snapshot cadangan (${fileName})...`);

    try {
      const payload: AppSyncPayload = {
        version: 1,
        updatedAt: now.toISOString(),
        syncedBy: {
          username: currentUser.username,
          role: currentUser.role,
          displayName: currentUser.displayName,
          googleEmail: currentUserEmail,
        },
        peserta: pesertaList,
        penguji: pengujiList,
        kelompok: kelompokList,
        penilaian: penilaianMap,
        settings,
      };

      await uploadNewFileToDrive(currentToken, DEFAULT_DRIVE_FOLDER_ID, fileName, payload);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
      setSyncStatusMessage(`Snapshot cadangan "${fileName}" berhasil disimpan di Google Drive!`);
      fetchDriveFiles(currentToken);
    } catch (err: any) {
      console.error('Create backup snapshot error:', err);
      if (err.message?.includes('401')) {
        handleExpiredSession();
      } else {
        setErrorMessage(`Gagal membuat snapshot: ${err?.message || 'Kesalahan jaringan'}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * PULIHKAN DARI FILE DRIVE TERTENTU
   */
  const handleExecuteRestore = async (file: DriveFileInfo) => {
    let currentToken = accessToken;
    if (!currentToken) {
      const loginResult = await handleGoogleLogin();
      if (!loginResult) return;
      currentToken = loginResult.accessToken;
    }

    setIsSyncing(true);
    setErrorMessage(null);
    setSyncStatusMessage(`Mengunduh dan memulihkan data dari "${file.name}"...`);

    try {
      const cloudPayload = await readDriveJsonFile<AppSyncPayload>(currentToken, file.id);

      if (!cloudPayload || !Array.isArray(cloudPayload.peserta)) {
        throw new Error('Format berkas cadangan tidak valid.');
      }

      onApplySyncData({
        peserta: cloudPayload.peserta,
        penguji: cloudPayload.penguji || [],
        kelompok: cloudPayload.kelompok || [],
        penilaian: cloudPayload.penilaian || {},
        settings: cloudPayload.settings,
      });

      setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
      setSyncStatusMessage(
        `Pemulihan data dari "${file.name}" berhasil! Memuat ${cloudPayload.peserta.length} peserta dan ` +
          `${Object.keys(cloudPayload.penilaian || {}).length} penilaian.`
      );
    } catch (err: any) {
      console.error('Restore error:', err);
      if (err.message?.includes('401')) {
        handleExpiredSession();
      } else {
        setErrorMessage(`Gagal memulihkan cadangan: ${err?.message || 'Kesalahan jaringan'}`);
      }
    } finally {
      setIsSyncing(false);
      setConfirmRestoreFile(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSyncing) onClose();
      }}
    >
      <div className="bg-white text-stone-900 rounded-3xl shadow-2xl max-w-3xl w-full border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-stone-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
              <FolderSync className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide uppercase">
                  Sinkronisasi Data Google Drive
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-stone-950">
                  Cloud Backup &amp; Restore
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Penyimpanan cadangan terpusat dengan mekanisme Merge &amp; Update
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSyncing}
            onClick={onClose}
            className="p-2 hover:bg-white/15 rounded-xl transition-colors cursor-pointer text-stone-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Target Folder Link & Access Banner */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1.5 min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-amber-700" />
                <span>Folder Penyimpanan Google Drive Resmi:</span>
              </div>
              <div className="font-mono text-[11px] text-stone-700 truncate max-w-md select-all font-semibold">
                ID Folder: {DEFAULT_DRIVE_FOLDER_ID}
              </div>

              {/* Status Izin Folder */}
              {accessToken && (
                <div className="flex items-center gap-2 pt-0.5">
                  {isCheckingFolder ? (
                    <span className="text-[10px] text-stone-500 flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Memeriksa status folder...
                    </span>
                  ) : folderStatus ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        folderStatus.canAddChildren
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{folderStatus.message}</span>
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              {accessToken && (
                <button
                  type="button"
                  onClick={() => checkFolder(accessToken)}
                  disabled={isCheckingFolder}
                  className="px-3 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
                  title="Periksa ulang status folder"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingFolder ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">Uji Akses</span>
                </button>
              )}
              <a
                href={DEFAULT_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-white hover:bg-stone-50 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs hover:shadow-sm"
                title="Buka folder di tab Google Drive baru"
              >
                <span>Buka Folder Drive</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
              </a>
            </div>
          </div>

          {/* Google Auth Status Box */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {googleUser?.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google User'}
                  className="w-10 h-10 rounded-full border border-stone-300 shadow-xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-600">
                  {googleUser?.email ? googleUser.email[0].toUpperCase() : 'G'}
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-stone-900 flex items-center gap-2">
                  <span>
                    {googleUser
                      ? googleUser.displayName || 'Akun Google Terhubung'
                      : 'Belum Terhubung ke Google Drive'}
                  </span>
                  {googleUser && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Terhubung
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {googleUser ? googleUser.email : 'Masuk untuk mengizinkan aplikasi menyinkronkan data'}
                </div>
              </div>
            </div>

            {googleUser ? (
              <button
                type="button"
                onClick={handleGoogleLogout}
                disabled={isSyncing}
                className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Putus Akun</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs hover:shadow-sm self-start sm:self-auto cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isAuthenticating ? 'Menghubungkan...' : 'Hubungkan Akun Google'}</span>
              </button>
            )}
          </div>

          {/* Feedback messages */}
          {syncStatusMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <span>{syncStatusMessage}</span>
                {lastSyncTime && (
                  <span className="block text-[10px] text-emerald-700/80 mt-0.5">
                    Pukul: {lastSyncTime} WIB
                  </span>
                )}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div>{errorMessage}</div>
                {!googleUser && (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="mt-2 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Hubungkan Ulang Akun Google
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Merge & Update Sync Card (ALL USERS) */}
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-all">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-extrabold text-sm sm:text-base">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  </div>
                  <span>Sinkronisasi Merge &amp; Update</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  <strong>Direkomendasikan untuk seluruh pengguna.</strong> Menggabungkan data lokal &amp;
                  Google Drive secara dua arah. <em>Data lama tidak akan terhapus</em>, sedangkan data baru
                  dan revisi nilai akan otomatis diperbarui.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleMergeSync}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Memproses Sinkronisasi...' : 'Mulai Sinkronisasi (Merge & Update)'}</span>
                </button>
              </div>
            </div>

            {/* 2. Admin Deletion Sync Card (STRICTLY ADMIN) */}
            {isAdmin ? (
              <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 shadow-xs flex flex-col justify-between hover:border-rose-400 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-rose-950 font-extrabold text-sm sm:text-base">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                    </div>
                    <span>Sinkronisasi Penghapusan (Admin)</span>
                  </div>
                  <p className="text-xs text-rose-900 leading-relaxed">
                    <strong>Khusus Administrator:</strong> Menyelaraskan Google Drive persis seperti data aktif
                    admin saat ini. Data peserta atau penilaian yang telah Anda hapus akan <em>disesuaikan
                    (dihapus juga dari Google Drive)</em>.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-rose-200">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => setConfirmAdminDeletionOpen(true)}
                    className="w-full py-2.5 px-4 bg-rose-700 hover:bg-rose-800 active:scale-98 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-rose-700/20 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Sesuaikan Penghapusan ke Drive</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-800 font-extrabold text-sm sm:text-base">
                    <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-600 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <span>Peran Akun Penguji</span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Anda sedang login sebagai <strong>Penguji</strong>. Penguji dapat menyinkronkan nilai dan
                    data peserta dengan mode Merge &amp; Update tanpa risiko menghapus data yang ada di server.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 text-right">
                  <span className="text-[11px] font-semibold text-stone-400 italic">
                    Hak penghapusan cloud dikelola oleh Admin
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Snapshot Backup Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-stone-100/80 rounded-2xl border border-stone-200 gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-stone-500 shrink-0" />
              <span className="text-xs text-stone-700 font-medium">
                Ingin menyimpan salinan titik waktu terpisah? Buat snapshot baru di Google Drive:
              </span>
            </div>
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleCreateSnapshotBackup}
              className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>Buat Snapshot Cadangan</span>
            </button>
          </div>

          {/* Drive Files History / Restore Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-stone-500" />
                <span>Daftar Berkas Cadangan di Google Drive ({driveFiles.length})</span>
              </div>
              <button
                type="button"
                onClick={() => accessToken && fetchDriveFiles(accessToken)}
                disabled={isLoadingFiles || !accessToken}
                className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {isLoadingFiles ? (
              <div className="p-6 text-center text-xs font-semibold text-stone-400 bg-stone-50 rounded-2xl">
                Memuat daftar file dari Google Drive...
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="p-6 text-center text-xs font-medium text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                Belum ada file cadangan yang ditemukan. Klik tombol Sinkronisasi untuk membuat file pertama.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto border border-stone-200 rounded-2xl divide-y divide-stone-100">
                {driveFiles.map((f) => {
                  const isMainSync = f.name === SYNC_FILE_NAME;
                  return (
                    <div
                      key={f.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-stone-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isMainSync
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-stone-900 truncate flex items-center gap-2">
                            <span>{f.name}</span>
                            {isMainSync && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                DATABASE UTAMA
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-500">
                            Diperbarui: {new Date(f.modifiedTime).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isSyncing}
                          onClick={() => setConfirmRestoreFile(f)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 text-xs font-bold rounded-lg border border-stone-200 hover:border-amber-300 transition-colors cursor-pointer"
                          title="Pulihkan data aplikasi dari file ini"
                        >
                          <CloudDownload className="w-3 h-3 inline mr-1" />
                          Pulihkan
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 p-4 border-t border-stone-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-stone-500">
            Status: {googleUser ? `Terhubung (${googleUser.email || googleUser.displayName})` : 'Belum Terhubung'}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Admin Deletion Sync (Mandatory per SKILL.md) */}
      {confirmAdminDeletionOpen && (
        <div className="fixed inset-0 z-60 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-300 animate-in zoom-in-95 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-stone-900 uppercase">
                Konfirmasi Sinkronisasi Penghapusan
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Apakah Anda yakin ingin menyinkronkan status penghapusan ke Google Drive?
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
              <p className="font-bold">Dampak Operasi Ini:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>File di Google Drive akan diselaraskan dengan data aktif Anda saat ini.</li>
                <li>Setiap peserta, penguji, atau nilai yang telah dihapus di lokal juga akan dihapus dari Google Drive.</li>
                <li>Operasi ini tidak dapat dibatalkan secara otomatis kecuali memulihkan dari snapshot lama.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAdminDeletionOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteAdminDeletionSync}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-700/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Ya, Sinkronkan Penghapusan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Restore File (Mandatory per SKILL.md) */}
      {confirmRestoreFile && (
        <div className="fixed inset-0 z-60 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-amber-300 animate-in zoom-in-95 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
              <CloudDownload className="w-7 h-7 text-amber-700" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-stone-900 uppercase">
                Konfirmasi Pemulihan Data
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Pulihkan data aplikasi menggunakan berkas:
              </p>
              <p className="font-mono font-bold text-amber-900 text-xs bg-amber-50 py-1 px-2 rounded-lg border border-amber-200">
                {confirmRestoreFile.name}
              </p>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed text-center">
              Data peserta, penguji, kelompok, dan penilaian di perangkat ini akan diperbarui sesuai isi berkas cadangan ini.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRestoreFile(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleExecuteRestore(confirmRestoreFile)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CloudDownload className="w-4 h-4" />
                <span>Pulihkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
