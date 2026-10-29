/**
 * Helper untuk mengunggah foto langsung ke Google Drive Folder: 1xsrknKxLZVC-YryvoTCbavbUkEn4EwLk
 * Terintegrasi dengan Google Apps Script Web App Puskesmas Kepulauan Seribu Selatan
 */

export const TARGET_GOOGLE_DRIVE_FOLDER_ID = '1xsrknKxLZVC-YryvoTCbavbUkEn4EwLk';
export const TARGET_GOOGLE_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${TARGET_GOOGLE_DRIVE_FOLDER_ID}`;

export interface DriveUploadResult {
  success: boolean;
  fileUrl?: string;
  directLink?: string;
  fileId?: string;
  folderId?: string;
  folderUrl?: string;
  message?: string;
}

export async function uploadPhotoToDrive(params: {
  base64Data: string;
  fileName?: string;
  mimeType?: string;
  folderId?: string;
}): Promise<DriveUploadResult> {
  const folderId = params.folderId || TARGET_GOOGLE_DRIVE_FOLDER_ID;

  try {
    const res = await fetch('/api/gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'uploadPhoto',
        folderId,
        base64Data: params.base64Data,
        fileName: params.fileName || `sajian_gizi_${Date.now()}.jpg`,
        mimeType: params.mimeType || 'image/jpeg',
      }),
    });

    const data = await res.json();
    if (data.success && data.data && (data.data.status === 'SUCCESS' || data.data.fileId)) {
      return {
        success: true,
        fileUrl: data.data.fileUrl,
        directLink: data.data.directLink,
        fileId: data.data.fileId,
        folderId: data.data.folderId || folderId,
        folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
        message: data.data.message || 'Foto tersimpan di Google Drive',
      };
    } else {
      return {
        success: false,
        message: data.message || data.data?.message || 'Gagal mengunggah foto ke Google Drive',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Terjadi kesalahan jaringan saat mengunggah foto ke Google Drive',
    };
  }
}
