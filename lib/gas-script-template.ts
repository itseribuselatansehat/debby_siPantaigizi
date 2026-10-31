// Google Apps Script (GAS) Code.gs generator & template
// User can deploy this as a Web App to use Google Sheets as their primary cloud database
// and Google Drive folder 1xsrknKxLZVC-YryvoTCbavbUkEn4EwLk for permanent photo storage!

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * SI PANTAI GIZI — GOOGLE APPS SCRIPT WEB APP BACKEND & DATABASE CONNECTOR
 * Puskesmas Kepulauan Seribu Selatan
 * Sistem Pemantauan Asupan Nutrisi, Tagihan, dan Distribusi Gizi SOP Rawat Inap
 * ============================================================================
 * 
 * PETUNJUK INSTALASI:
 * 1. Buka Google Spreadsheet baru di https://sheets.new
 * 2. Beri nama Spreadsheet, contoh: "DATABASE_SI_PANTAI_GIZI"
 * 3. Buka menu Extensions (Ekstensi) > Apps Script
 * 4. Hapus semua kode default di editor, lalu PASTE SELURUH KODE INI ke Code.gs
 * 5. Klik tombol "Deploy" (Terapkan) di kanan atas > "New deployment" (Penerapan baru).
 * 6. Pilih tipe: "Web app" (Aplikasi web).
 * 7. Isi konfigurasi:
 *    - Description: "SI PANTAI GIZI API & Drive v2.0"
 *    - Execute as: "Me" (Saya - email akun Google Anda)
 *    - Who has access: "Anyone" (Siapa saja)
 * 8. Klik Deploy, berikan otorisasi izin Google Spreadsheet & Google Drive jika diminta.
 * 9. Salin "Web app URL" (akhiran /exec) dan tempel ke menu "Pengaturan & Integrasi GAS" di aplikasi web SI PANTAI GIZI.
 * 10. Klik tombol "Setup Database Otomatis" di aplikasi web untuk membuat seluruh sheet & header otomatis!
 * 11. Folder Google Drive foto otomatis diarahkan ke: 1xsrknKxLZVC-YryvoTCbavbUkEn4EwLk
 */

const DEFAULT_DRIVE_FOLDER_ID = '1xsrknKxLZVC-YryvoTCbavbUkEn4EwLk';

const SHEET_NAMES = {
  ORDERS: 'MealOrders',
  PATIENTS: 'Patients',
  USERS: 'Users',
  MENUS: 'Menus',
  DIET_TYPES: 'DietTypes',
  PROVIDERS: 'Providers',
  AUDIT_LOGS: 'AuditLogs',
  APP_SETTINGS: 'AppSettings'
};

/**
 * Inisialisasi otomatis lembar kerja dan baris header jika belum ada
 */
function setupDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const schemas = {
    [SHEET_NAMES.ORDERS]: [
      'id', 'orderNumber', 'serviceDate', 'schedule', 'patientMrn', 'patientName',
      'patientAge', 'room', 'bed', 'medicalDiagnosis', 'allergies', 'dietTypeName',
      'texture', 'menuName', 'portionCount', 'pricePerPortion', 'totalEstimatedPrice',
      'status', 'orderedByName', 'orderedByRole', 'reviewedByName', 'reviewedAt',
      'providerName', 'providerAcceptedAt', 'shippedAt', 'receivedAt', 'checklistPassed',
      'deliveredToPatientAt', 'servedMealPhotoUrl', 'consumptionCategory', 'consumptionPercentage', 'leftoverPercentage',
      'billedPortionCount', 'finalBilledAmount', 'billingStatus', 'createdAt', 'updatedAt'
    ],
    [SHEET_NAMES.PATIENTS]: [
      'id', 'mrn', 'name', 'gender', 'birthDate', 'room', 'bed',
      'admissionDate', 'dischargeDate', 'dischargedAt', 'dischargedBy', 'dischargeNotes',
      'registeredByName', 'attendingNurseName',
      'status', 'clinicalDiagnosis', 'foodAllergies', 'dietaryRestrictions'
    ],
    [SHEET_NAMES.USERS]: [
      'id', 'name', 'nipOrNik', 'role', 'email', 'phoneNumber', 'unitOrWard', 'providerId'
    ],
    [SHEET_NAMES.MENUS]: [
      'id', 'code', 'name', 'dietCategoryName', 'texture', 'components', 'pricePerPortion', 'contractReference'
    ],
    [SHEET_NAMES.DIET_TYPES]: [
      'id', 'code', 'name', 'description', 'allowedTextures'
    ],
    [SHEET_NAMES.PROVIDERS]: [
      'id', 'name', 'code', 'contactPerson', 'phone', 'address', 'contractNumber'
    ],
    [SHEET_NAMES.AUDIT_LOGS]: [
      'id', 'timestamp', 'userName', 'userRole', 'action', 'module', 'referenceId', 'details'
    ],
    [SHEET_NAMES.APP_SETTINGS]: [
      'key', 'value', 'updatedAt'
    ]
  };

  const createdSheets = [];
  for (const sheetName in schemas) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      createdSheets.push(sheetName);
    }
    const headers = schemas[sheetName];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  }

  Logger.log('Inisialisasi tabel Google Sheets berhasil!');
  return {
    status: 'SUCCESS',
    message: 'Seluruh tabel database Google Sheets SI PANTAI GIZI berhasil disiapkan.',
    spreadsheetName: ss.getName(),
    sheets: Object.keys(schemas)
  };
}

/**
 * Handle GET Requests (Healthcheck, Data Fetch & 1-Click Setup)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'ping';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'setupDatabase') {
      const setupRes = setupDatabaseSheets();
      return createJsonResponse(setupRes);
    }

    if (action === 'ping') {
      let driveFolderStatus = 'UNKNOWN';
      try {
        const folder = DriveApp.getFolderById(DEFAULT_DRIVE_FOLDER_ID);
        driveFolderStatus = 'CONNECTED (' + folder.getName() + ')';
      } catch (err) {
        driveFolderStatus = 'FOLDER_NOT_ACCESSIBLE: ' + err.toString();
      }

      return createJsonResponse({
        status: 'SUCCESS',
        message: 'Koneksi ke Google Sheets & Drive SI PANTAI GIZI Aktif',
        spreadsheetName: ss.getName(),
        spreadsheetId: ss.getId(),
        googleDriveFolderId: DEFAULT_DRIVE_FOLDER_ID,
        driveFolderStatus: driveFolderStatus,
        timeJakarta: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd-MM-yyyy HH:mm:ss') + ' WIB'
      });
    }

    if (action === 'getOrders') {
      const sheet = ss.getSheetByName(SHEET_NAMES.ORDERS);
      if (!sheet || sheet.getLastRow() < 2) {
        return createJsonResponse({ status: 'SUCCESS', data: [] });
      }
      const data = sheetToObjects(sheet);
      return createJsonResponse({ status: 'SUCCESS', count: data.length, data: data });
    }

    return createJsonResponse({ status: 'ERROR', message: 'Aksi GET tidak dikenali: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'ERROR', error: err.toString() });
  }
}

/**
 * Handle POST Requests (Sinkronisasi Order, Transaksi, Audit Log, Upload Foto Drive & 1-Click Setup)
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'setupDatabase') {
      const setupRes = setupDatabaseSheets();
      return createJsonResponse(setupRes);
    }

    // =========================================================================
    // SIMPAN FOTO KE GOOGLE DRIVE FOLDER (1xsrknKxLZVC-YryvoTCbavbUkEn4EwLk)
    // =========================================================================
    if (action === 'uploadPhoto' || action === 'uploadFile') {
      const folderId = postData.folderId || (postData.payload && postData.payload.folderId) || DEFAULT_DRIVE_FOLDER_ID;
      const base64Data = postData.base64Data || (postData.payload && postData.payload.base64Data);
      const fileName = postData.fileName || (postData.payload && postData.payload.fileName) || ('gizi_' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss') + '.jpg');
      const mimeType = postData.mimeType || (postData.payload && postData.payload.mimeType) || 'image/jpeg';

      if (!base64Data) {
        return createJsonResponse({ status: 'ERROR', message: 'Data foto (base64) kosong.' });
      }

      let folder;
      try {
        folder = DriveApp.getFolderById(folderId);
      } catch (err) {
        return createJsonResponse({
          status: 'ERROR',
          message: 'Folder Google Drive (' + folderId + ') tidak dapat diakses. Pastikan folder sudah dibagikan atau akun Apps Script memiliki izin.'
        });
      }

      // Bersihkan header data URL (contoh: data:image/jpeg;base64,...)
      let cleanBase64 = base64Data;
      if (cleanBase64.indexOf(',') > -1) {
        cleanBase64 = cleanBase64.split(',')[1];
      }

      const decoded = Utilities.base64Decode(cleanBase64);
      const blob = Utilities.newBlob(decoded, mimeType, fileName);
      const file = folder.createFile(blob);

      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {
        // Abaikan jika domain membatasi izin sharing publik
      }

      const fileId = file.getId();
      const webViewLink = 'https://drive.google.com/file/d/' + fileId + '/view?usp=sharing';
      const directThumbnail = 'https://lh3.googleusercontent.com/d/' + fileId;

      return createJsonResponse({
        status: 'SUCCESS',
        message: 'Foto berhasil disimpan di Google Drive folder ' + folderId,
        fileId: fileId,
        fileUrl: webViewLink,
        directLink: directThumbnail,
        fileName: fileName,
        folderId: folderId,
        folderUrl: 'https://drive.google.com/drive/folders/' + folderId
      });
    }

    if (action === 'syncAll') {
      // Sinkronisasi data menyeluruh dari Web App ke Google Sheets
      const payload = postData.payload || {};
      
      if (payload.patients && Array.isArray(payload.patients)) {
        upsertPatients(ss, payload.patients);
      }
      if (payload.orders && Array.isArray(payload.orders)) {
        upsertOrders(ss, payload.orders);
      }
      if (payload.auditLogs && Array.isArray(payload.auditLogs)) {
        appendAuditLogs(ss, payload.auditLogs);
      }

      return createJsonResponse({
        status: 'SUCCESS',
        message: 'Sinkronisasi dengan Google Spreadsheet berhasil disimpan.',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'saveOrder') {
      const order = postData.order || (postData.payload && postData.payload.order);
      if (!order || !order.id) {
        return createJsonResponse({ status: 'ERROR', message: 'Data order tidak lengkap' });
      }
      upsertOrders(ss, [order]);
      return createJsonResponse({ status: 'SUCCESS', message: 'Order berhasil diperbarui di Spreadsheet' });
    }

    if (action === 'logAudit') {
      const log = postData.log || (postData.payload && postData.payload.log);
      if (log) {
        appendAuditLogs(ss, [log]);
      }
      return createJsonResponse({ status: 'SUCCESS', message: 'Audit log tercatat di Spreadsheet' });
    }

    return createJsonResponse({ status: 'ERROR', message: 'Aksi POST tidak valid: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'ERROR', error: err.toString() });
  }
}

/**
 * Simpan atau perbarui data orders ke Sheet
 */
function upsertOrders(ss, orders) {
  let sheet = ss.getSheetByName(SHEET_NAMES.ORDERS);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEET_NAMES.ORDERS);
  }

  const existingData = sheet.getDataRange().getValues();
  const headers = existingData[0];
  const idColIndex = headers.indexOf('id');

  const existingMap = {};
  for (let r = 1; r < existingData.length; r++) {
    const idVal = existingData[r][idColIndex];
    if (idVal) existingMap[idVal] = r + 1; // row 1-indexed
  }

  orders.forEach(function(order) {
    const rowValues = [
      order.id || '',
      order.orderNumber || '',
      order.serviceDate || '',
      order.schedule || '',
      order.patientMrn || '',
      order.patientName || '',
      (order.patientAgeYears || 0) + ' thn',
      order.room || '',
      order.bed || '',
      order.medicalDiagnosis || '',
      Array.isArray(order.allergies) ? order.allergies.join(', ') : (order.allergies || '-'),
      order.dietTypeName || '',
      order.texture || '',
      order.menuName || '',
      order.portionCount || 1,
      order.pricePerPortionSnapshot || 0,
      order.totalEstimatedPrice || 0,
      order.status || 'DRAFT',
      order.orderedByName || '',
      order.orderedByRole || '',
      order.reviewedByName || '',
      order.reviewedAt || '',
      order.providerName || '',
      order.providerAcceptedAt || '',
      order.shippedAt || '',
      order.receivedAt || '',
      order.checklistPassed ? 'YA' : 'TIDAK',
      order.deliveredToPatientAt || '',
      order.servedMealPhotoUrl || '',
      order.leftoverAssessment ? order.leftoverAssessment.consumptionCategory : '',
      order.leftoverAssessment ? order.leftoverAssessment.consumptionPercentage : '',
      order.leftoverAssessment ? order.leftoverAssessment.leftoverPercentage : '',
      order.billedPortionCount || 0,
      order.finalBilledAmount || 0,
      order.billingStatus || 'BELUM_DIREKAP',
      order.createdAt || '',
      new Date().toISOString()
    ];

    if (existingMap[order.id]) {
      // Update existing row
      sheet.getRange(existingMap[order.id], 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      // Append new row
      sheet.appendRow(rowValues);
    }
  });
}

/**
 * Tambah catatan audit trail ke sheet AuditLogs
 */
function appendAuditLogs(ss, logs) {
  let sheet = ss.getSheetByName(SHEET_NAMES.AUDIT_LOGS);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEET_NAMES.AUDIT_LOGS);
  }

  logs.forEach(function(l) {
    sheet.appendRow([
      l.id || Utilities.getUuid(),
      l.timestamp || new Date().toISOString(),
      l.userName || '',
      l.userRole || '',
      l.action || '',
      l.module || '',
      l.referenceId || '',
      l.details || ''
    ]);
  });
}

/**
 * Simpan atau perbarui data master pasien ke Sheet Patients
 */
function upsertPatients(ss, patients) {
  let sheet = ss.getSheetByName(SHEET_NAMES.PATIENTS);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEET_NAMES.PATIENTS);
  }

  const existingData = sheet.getDataRange().getValues();
  const headers = existingData[0];
  const idColIndex = headers.indexOf('id');

  const existingMap = {};
  for (let r = 1; r < existingData.length; r++) {
    const idVal = existingData[r][idColIndex];
    if (idVal) existingMap[idVal] = r + 1;
  }

  patients.forEach(function(p) {
    const rowValues = [
      p.id || '',
      p.mrn || '',
      p.name || '',
      p.gender || '',
      p.birthDate || '',
      p.room || '',
      p.bed || '',
      p.admissionDate || '',
      p.dischargeDate || '',
      p.dischargedAt || '',
      p.dischargedBy || '',
      p.dischargeNotes || '',
      p.registeredByName || '',
      p.attendingNurseName || '',
      p.status || 'ACTIVE',
      p.clinicalDiagnosis || '',
      Array.isArray(p.foodAllergies) ? p.foodAllergies.join(', ') : (p.foodAllergies || ''),
      p.dietaryRestrictions || ''
    ];

    if (existingMap[p.id]) {
      const rowNum = existingMap[p.id];
      sheet.getRange(rowNum, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  });
}

function sheetToObjects(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  const results = [];
  for (let i = 1; i < rows.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
    }
    results.push(obj);
  }
  return results;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
