export const DEFAULT_DRIVE_FOLDER_ID = '1U3-esoCeuPgEN8TEyNJhblshxJmnj-Jb';
export const DEFAULT_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1U3-esoCeuPgEN8TEyNJhblshxJmnj-Jb?usp=sharing';
export const SYNC_FILE_NAME = 'data_pramuka_garuda_sync.json';

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  parents?: string[];
}

export interface FolderAccessStatus {
  accessible: boolean;
  canAddChildren: boolean;
  canEdit: boolean;
  folderName: string;
  message: string;
}

/**
 * Periksa hak akses akun pengguna terhadap folder target Google Drive
 */
export async function checkDriveFolderAccess(
  accessToken: string,
  folderId = DEFAULT_DRIVE_FOLDER_ID
): Promise<FolderAccessStatus> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${folderId}?supportsAllDrives=true&fields=id,name,capabilities,webViewLink`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (res.status === 401) {
      throw new Error('Sesi Google Drive telah berakhir (401). Silakan hubungkan kembali akun Anda.');
    }

    if (!res.ok) {
      if (res.status === 404 || res.status === 403) {
        return {
          accessible: false,
          canAddChildren: false,
          canEdit: false,
          folderName: 'Folder Bersama',
          message:
            'Folder resmi dibagikan dengan mode Hanya Baca (Viewer). Sinkronisasi tetap membaca data dari sini dan mencadangkan data baru ke Drive Anda.',
        };
      }
      const errText = await res.text();
      return {
        accessible: false,
        canAddChildren: false,
        canEdit: false,
        folderName: 'Folder Target',
        message: `Status folder (${res.status}): ${errText}`,
      };
    }

    const data = await res.json();
    const canAddChildren = !!data.capabilities?.canAddChildren;
    const canEdit = !!data.capabilities?.canEdit;

    return {
      accessible: true,
      canAddChildren,
      canEdit,
      folderName: data.name || 'Folder Resmi',
      message: canAddChildren
        ? 'Akses penuh: Berkas dapat dibaca dan disimpan langsung ke dalam folder bersama resmi.'
        : 'Akses membaca (Viewer): Berkas dibaca dari folder ini dan dicadangkan ke Google Drive akun Anda.',
    };
  } catch (err: any) {
    if (err.message?.includes('401')) throw err;
    return {
      accessible: false,
      canAddChildren: false,
      canEdit: false,
      folderName: 'Folder Target',
      message: err?.message || 'Tidak dapat menghubungi Google Drive.',
    };
  }
}

/**
 * Cari file sinkronisasi utama 'data_pramuka_garuda_sync.json'
 * Mencari di dalam folder resmi terlebih dahulu, lalu di drive pengguna jika tidak ditemukan.
 */
export async function findSyncFile(
  accessToken: string,
  folderId = DEFAULT_DRIVE_FOLDER_ID
): Promise<DriveFileInfo | null> {
  // 1. Coba cari di dalam folder target
  try {
    const queryInFolder = encodeURIComponent(
      `'${folderId}' in parents and name = '${SYNC_FILE_NAME}' and trashed = false`
    );
    const url = `https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&includeItemsFromAllDrives=true&q=${queryInFolder}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,parents)&pageSize=5`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (res.status === 401) {
      throw new Error('Sesi Google Drive telah berakhir (401). Silakan hubungkan kembali akun Anda.');
    }

    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return data.files[0];
      }
    }
  } catch (err: any) {
    if (err.message?.includes('401')) throw err;
    console.warn('Pencarian di folder target belum menemukan file, mencari di drive root:', err);
  }

  // 2. Jika tidak ditemukan di folder atau folder dibatasi, cari di seluruh file yang dapat diakses akun
  try {
    const queryGlobal = encodeURIComponent(
      `name = '${SYNC_FILE_NAME}' and trashed = false`
    );
    const urlGlobal = `https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&includeItemsFromAllDrives=true&q=${queryGlobal}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,parents)&orderBy=modifiedTime desc&pageSize=5`;

    const resGlobal = await fetch(urlGlobal, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (resGlobal.status === 401) {
      throw new Error('Sesi Google Drive telah berakhir (401). Silakan hubungkan kembali akun Anda.');
    }

    if (resGlobal.ok) {
      const dataGlobal = await resGlobal.json();
      if (dataGlobal.files && dataGlobal.files.length > 0) {
        return dataGlobal.files[0];
      }
    }
  } catch (err: any) {
    if (err.message?.includes('401')) throw err;
    console.warn('Pencarian global gagal:', err);
  }

  return null;
}

/**
 * Daftar seluruh file JSON backup & sync yang ada di dalam folder atau Drive
 */
export async function listDriveBackupFiles(
  accessToken: string,
  folderId = DEFAULT_DRIVE_FOLDER_ID
): Promise<DriveFileInfo[]> {
  const query = encodeURIComponent(
    `('${folderId}' in parents or name contains 'Pramuka_Garuda' or name contains 'pramuka_garuda') and trashed = false`
  );
  const url = `https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&includeItemsFromAllDrives=true&q=${query}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,parents)&orderBy=modifiedTime desc&pageSize=50`;

  let res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 401) {
    throw new Error('Sesi Google Drive telah berakhir (401). Silakan hubungkan kembali akun Anda.');
  }

  // Jika query dengan folderId ditolak oleh Google Drive (karena bukan pemilik), fallback ke query nama file
  if (!res.ok) {
    const fallbackQuery = encodeURIComponent(
      `(name contains 'Pramuka_Garuda' or name contains 'pramuka_garuda') and trashed = false`
    );
    const fallbackUrl = `https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&includeItemsFromAllDrives=true&q=${fallbackQuery}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,parents)&orderBy=modifiedTime desc&pageSize=50`;
    res = await fetch(fallbackUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal membaca isi berkas dari Google Drive (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Baca isi file JSON dari Google Drive berdasarkan File ID secara aman
 */
export async function readDriveJsonFile<T = any>(
  accessToken: string,
  fileId: string
): Promise<T> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    throw new Error('Sesi Google Drive telah berakhir (401). Silakan hubungkan kembali akun Anda.');
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal mengunduh data file dari Google Drive (${res.status}): ${errorText}`);
  }

  const rawText = await res.text();
  if (!rawText || !rawText.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(rawText) as T;
  } catch (parseErr) {
    console.warn('File di Google Drive bukan JSON valid atau kosong, menggunakan objek kosong:', parseErr);
    return {} as T;
  }
}

/**
 * Upload file JSON baru ke Google Drive menggunakan Multipart Upload atomik
 * Tidak akan membuat file kosong jika gagal.
 */
export async function uploadNewFileToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  dataContent: any
): Promise<DriveFileInfo> {
  const fileData = JSON.stringify(dataContent, null, 2);
  const boundary = '-------PG_SYNC_BOUNDARY_' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata: any = {
    name: fileName,
    mimeType: 'application/json',
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileData +
    closeDelimiter;

  let res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,modifiedTime,size,webViewLink,parents',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (res.status === 401) {
    throw new Error('Sesi Google Drive telah berakhir (401). Silakan hubungkan kembali akun Anda.');
  }

  // Jika penulisan ke folderId ditolak (403 forbidden / 404 pada shared folder), simpan ke root Drive pengguna
  if (!res.ok && (res.status === 403 || res.status === 404) && folderId) {
    console.warn(`Penyimpanan ke folder ${folderId} ditolak (${res.status}), beralih ke Drive akun pengguna.`);
    const rootMetadata = {
      name: fileName,
      mimeType: 'application/json',
    };
    const rootBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(rootMetadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileData +
      closeDelimiter;

    res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,modifiedTime,size,webViewLink,parents',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: rootBody,
      }
    );
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal mengunggah file ke Google Drive (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Perbarui konten file JSON yang sudah ada di Google Drive
 */
export async function updateDriveFileContent(
  accessToken: string,
  fileId: string,
  dataContent: any
): Promise<DriveFileInfo> {
  const fileData = JSON.stringify(dataContent, null, 2);

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true&fields=id,name,mimeType,modifiedTime,size,webViewLink,parents`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: fileData,
    }
  );

  if (res.status === 401) {
    throw new Error('Sesi Google Drive telah berakhir (401). Silakan hubungkan kembali akun Anda.');
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal memperbarui file di Google Drive (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Hapus file di Google Drive
 */
export async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    const errorText = await res.text();
    throw new Error(`Gagal menghapus file dari Google Drive (${res.status}): ${errorText}`);
  }

  return true;
}
