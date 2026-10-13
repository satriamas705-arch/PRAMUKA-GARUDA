import {
  Peserta,
  Penguji,
  Kelompok,
  PenilaianPeserta,
  AppSettings,
  AuthUser,
} from '../types';

export interface AppSyncPayload {
  version: number;
  updatedAt: string;
  syncedBy: {
    username: string;
    role: string;
    displayName: string;
    googleEmail?: string;
  };
  peserta: Peserta[];
  penguji: Penguji[];
  kelompok: Kelompok[];
  penilaian: Record<string, PenilaianPeserta>;
  settings?: AppSettings;
}

export interface MergeResult {
  mergedData: AppSyncPayload;
  stats: {
    totalPeserta: number;
    pesertaAddedFromCloud: number;
    pesertaUpdatedFromCloud: number;
    totalPenguji: number;
    pengujiAddedFromCloud: number;
    totalKelompok: number;
    kelompokAddedFromCloud: number;
    totalPenilaian: number;
    penilaianUpdatedFromCloud: number;
  };
}

/**
 * Teknik MERGE AND UPDATE (Standar untuk seluruh pengguna):
 * Menggabungkan data lokal dan data di Google Drive tanpa menghapus data yang sudah ada.
 * Mengatasi disparitas ID antar perangkat secara otomatis menggunakan Nomor Peserta / NIP Penguji.
 */
export function mergeAppData(
  localData: {
    peserta: Peserta[];
    penguji: Penguji[];
    kelompok: Kelompok[];
    penilaian: Record<string, PenilaianPeserta>;
    settings: AppSettings;
  },
  cloudData: Partial<AppSyncPayload>,
  currentUser: AuthUser,
  googleEmail?: string
): MergeResult {
  const stats = {
    totalPeserta: 0,
    pesertaAddedFromCloud: 0,
    pesertaUpdatedFromCloud: 0,
    totalPenguji: 0,
    pengujiAddedFromCloud: 0,
    totalKelompok: 0,
    kelompokAddedFromCloud: 0,
    totalPenilaian: 0,
    penilaianUpdatedFromCloud: 0,
  };

  // Peta penyelarasan ID peserta: Cloud Peserta ID -> Local Peserta ID
  const cloudPesertaIdToResolvedIdMap = new Map<string, string>();

  // 1. MERGE PESERTA
  const cloudPesertaList = Array.isArray(cloudData.peserta) ? cloudData.peserta : [];
  const mergedPesertaMap = new Map<string, Peserta>();

  // Masukkan data lokal terlebih dahulu
  localData.peserta.forEach((p) => {
    const key = (p.nomorPeserta || p.id).trim().toLowerCase();
    mergedPesertaMap.set(key, { ...p });
    cloudPesertaIdToResolvedIdMap.set(p.id, p.id);
  });

  // Gabungkan dan perbarui dengan data cloud
  cloudPesertaList.forEach((cp) => {
    const key = (cp.nomorPeserta || cp.id).trim().toLowerCase();
    if (mergedPesertaMap.has(key)) {
      const existing = mergedPesertaMap.get(key)!;
      cloudPesertaIdToResolvedIdMap.set(cp.id, existing.id);

      mergedPesertaMap.set(key, {
        ...existing,
        ...cp,
        id: existing.id, // Pertahankan ID lokal yang konsisten
        nama: cp.nama || existing.nama,
        jenisKelamin: cp.jenisKelamin || existing.jenisKelamin,
        pangkalan: cp.pangkalan || existing.pangkalan,
        gudep: cp.gudep || existing.gudep,
        kelompokId: cp.kelompokId || existing.kelompokId,
        golongan: cp.golongan || existing.golongan,
        tingkatTKU: cp.tingkatTKU || existing.tingkatTKU,
        kontakHp: cp.kontakHp || existing.kontakHp,
        namaPembina: cp.namaPembina || existing.namaPembina,
      });
      stats.pesertaUpdatedFromCloud++;
    } else {
      mergedPesertaMap.set(key, { ...cp });
      cloudPesertaIdToResolvedIdMap.set(cp.id, cp.id);
      stats.pesertaAddedFromCloud++;
    }
  });

  const mergedPeserta = Array.from(mergedPesertaMap.values());
  stats.totalPeserta = mergedPeserta.length;

  // 2. MERGE PENGUJI
  const cloudPengujiIdToResolvedIdMap = new Map<string, string>();
  const cloudPengujiList = Array.isArray(cloudData.penguji) ? cloudData.penguji : [];
  const mergedPengujiMap = new Map<string, Penguji>();

  localData.penguji.forEach((pj) => {
    const key = (pj.nipNta || pj.nama).trim().toLowerCase();
    mergedPengujiMap.set(key, { ...pj });
    cloudPengujiIdToResolvedIdMap.set(pj.id, pj.id);
  });

  cloudPengujiList.forEach((cpj) => {
    const key = (cpj.nipNta || cpj.nama).trim().toLowerCase();
    if (mergedPengujiMap.has(key)) {
      const existing = mergedPengujiMap.get(key)!;
      cloudPengujiIdToResolvedIdMap.set(cpj.id, existing.id);
      mergedPengujiMap.set(key, {
        ...existing,
        ...cpj,
        id: existing.id,
      });
    } else {
      mergedPengujiMap.set(key, { ...cpj });
      cloudPengujiIdToResolvedIdMap.set(cpj.id, cpj.id);
      stats.pengujiAddedFromCloud++;
    }
  });

  const mergedPenguji = Array.from(mergedPengujiMap.values());
  stats.totalPenguji = mergedPenguji.length;

  // 3. MERGE KELOMPOK / TIM PENILAI
  const cloudKelompokList = Array.isArray(cloudData.kelompok) ? cloudData.kelompok : [];
  const mergedKelompokMap = new Map<string, Kelompok>();

  localData.kelompok.forEach((k) => {
    const key = (k.id || k.nama).trim().toLowerCase();
    mergedKelompokMap.set(key, { ...k });
  });

  cloudKelompokList.forEach((ck) => {
    const key = (ck.id || ck.nama).trim().toLowerCase();

    // Petakan ID anggota peserta & penguji dari cloud ke ID lokal
    const mappedCloudPesertaIds = (ck.pesertaIds || []).map(
      (pid) => cloudPesertaIdToResolvedIdMap.get(pid) || pid
    );
    const mappedCloudPengujiIds = (ck.pengujiIds || []).map(
      (pjid) => cloudPengujiIdToResolvedIdMap.get(pjid) || pjid
    );

    if (mergedKelompokMap.has(key)) {
      const existing = mergedKelompokMap.get(key)!;
      const combinedPesertaIds = Array.from(
        new Set([...(existing.pesertaIds || []), ...mappedCloudPesertaIds])
      );
      const combinedPengujiIds = Array.from(
        new Set([...(existing.pengujiIds || []), ...mappedCloudPengujiIds])
      );

      mergedKelompokMap.set(key, {
        ...existing,
        ...ck,
        id: existing.id,
        pesertaIds: combinedPesertaIds,
        pengujiIds: combinedPengujiIds,
      });
    } else {
      mergedKelompokMap.set(key, {
        ...ck,
        pesertaIds: mappedCloudPesertaIds,
        pengujiIds: mappedCloudPengujiIds,
      });
      stats.kelompokAddedFromCloud++;
    }
  });

  const mergedKelompok = Array.from(mergedKelompokMap.values());
  stats.totalKelompok = mergedKelompok.length;

  // 4. MERGE PENILAIAN PESERTA (DENGAN PENYELARASAN ID OTOMATIS)
  const cloudPenilaianMap = cloudData.penilaian || {};
  const mergedPenilaian: Record<string, PenilaianPeserta> = { ...localData.penilaian };

  Object.entries(cloudPenilaianMap).forEach(([cloudPesertaId, cloudPen]) => {
    // Cari ID target lokal untuk peserta ini
    const resolvedPesertaId = cloudPesertaIdToResolvedIdMap.get(cloudPesertaId) || cloudPesertaId;
    const localPen = mergedPenilaian[resolvedPesertaId];

    const normalizedCloudPen: PenilaianPeserta = {
      ...cloudPen,
      pesertaId: resolvedPesertaId,
    };

    if (!localPen) {
      mergedPenilaian[resolvedPesertaId] = normalizedCloudPen;
      stats.penilaianUpdatedFromCloud++;
    } else {
      const cloudDate = cloudPen.updatedAt ? new Date(cloudPen.updatedAt).getTime() : 0;
      const localDate = localPen.updatedAt ? new Date(localPen.updatedAt).getTime() : 0;

      if (cloudDate >= localDate) {
        // Gabungkan butir nilai administrasi & wawancara yang mungkin terisi di lokal namun belum di cloud
        const mergedAdmin = (cloudPen.administrasi || []).map((cItem) => {
          const lItem = (localPen.administrasi || []).find((li) => li.id === cItem.id);
          return {
            ...cItem,
            tersedia: cItem.tersedia || lItem?.tersedia || false,
            catatan: cItem.catatan || lItem?.catatan || '',
          };
        });

        const mergedWawancara = (cloudPen.wawancara || []).map((cItem) => {
          const lItem = (localPen.wawancara || []).find((li) => li.id === cItem.id);
          return {
            ...cItem,
            poin: cItem.poin > 0 ? cItem.poin : lItem?.poin || 0,
            catatan: cItem.catatan || lItem?.catatan || '',
          };
        });

        mergedPenilaian[resolvedPesertaId] = {
          ...normalizedCloudPen,
          administrasi: mergedAdmin.length > 0 ? mergedAdmin : normalizedCloudPen.administrasi,
          wawancara: mergedWawancara.length > 0 ? mergedWawancara : normalizedCloudPen.wawancara,
        };
        stats.penilaianUpdatedFromCloud++;
      } else {
        // Lokal lebih baru, tapi lengkapi butir kosong dari cloud jika ada
        const mergedAdmin = (localPen.administrasi || []).map((lItem) => {
          const cItem = (cloudPen.administrasi || []).find((ci) => ci.id === lItem.id);
          return {
            ...lItem,
            tersedia: lItem.tersedia || cItem?.tersedia || false,
            catatan: lItem.catatan || cItem?.catatan || '',
          };
        });

        const mergedWawancara = (localPen.wawancara || []).map((lItem) => {
          const cItem = (cloudPen.wawancara || []).find((ci) => ci.id === lItem.id);
          return {
            ...lItem,
            poin: lItem.poin > 0 ? lItem.poin : cItem?.poin || 0,
            catatan: lItem.catatan || cItem?.catatan || '',
          };
        });

        mergedPenilaian[resolvedPesertaId] = {
          ...localPen,
          administrasi: mergedAdmin,
          wawancara: mergedWawancara,
        };
      }
    }
  });

  stats.totalPenilaian = Object.keys(mergedPenilaian).length;

  // 5. MERGE SETTINGS
  const mergedSettings: AppSettings = {
    ...localData.settings,
    ...(cloudData.settings || {}),
  };

  const finalPayload: AppSyncPayload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    syncedBy: {
      username: currentUser.username,
      role: currentUser.role,
      displayName: currentUser.displayName,
      googleEmail,
    },
    peserta: mergedPeserta,
    penguji: mergedPenguji,
    kelompok: mergedKelompok,
    penilaian: mergedPenilaian,
    settings: mergedSettings,
  };

  return {
    mergedData: finalPayload,
    stats,
  };
}

/**
 * SINKRONISASI PENYESUAIAN PENGHAPUSAN (KHUSUS ADMIN):
 * Menjadikan data aktif admin sebagai acuan otoritatif mutlak,
 * sehingga data yang telah dihapus oleh Admin di lokal juga dihapus / disesuaikan di Google Drive.
 */
export function buildAdminAuthoritativePayload(
  localData: {
    peserta: Peserta[];
    penguji: Penguji[];
    kelompok: Kelompok[];
    penilaian: Record<string, PenilaianPeserta>;
    settings: AppSettings;
  },
  currentUser: AuthUser,
  googleEmail?: string
): AppSyncPayload {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    syncedBy: {
      username: currentUser.username,
      role: 'admin',
      displayName: `${currentUser.displayName} (Penyesuaian Penghapusan)`,
      googleEmail,
    },
    peserta: [...localData.peserta],
    penguji: [...localData.penguji],
    kelompok: [...localData.kelompok],
    penilaian: { ...localData.penilaian },
    settings: { ...localData.settings },
  };
}
