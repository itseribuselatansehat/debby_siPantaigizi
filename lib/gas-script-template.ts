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
 *    - Description: "SI PANTAI GIZI Database & Drive v3.0"
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
  ROOMS: 'Rooms',
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
      'id', 'name', 'nipOrNik', 'role', 'email', 'username', 'password', 'status', 'phoneNumber', 'unitOrWard', 'providerId', 'updatedAt'
    ],
    [SHEET_NAMES.MENUS]: [
      'id', 'code', 'name', 'dietCategoryName', 'texture', 'components', 'pricePerPortion', 'contractReference', 'updatedAt'
    ],
    [SHEET_NAMES.ROOMS]: [
      'id', 'room', 'bed', 'type', 'updatedAt'
    ],
    [SHEET_NAMES.DIET_TYPES]: [
      'id', 'code', 'name', 'description', 'allowedTextures', 'updatedAt'
    ],
    [SHEET_NAMES.PROVIDERS]: [
      'id', 'code', 'name', 'contactPerson', 'phone', 'address', 'contractNumber', 'contractStart', 'contractEnd', 'status', 'updatedAt'
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

    if (action === 'getDatabase') {
      return createJsonResponse({
        status: 'SUCCESS',
        spreadsheetName: ss.getName(),
        database: {
          users: getSheetData(ss, SHEET_NAMES.USERS),
          patients: getSheetData(ss, SHEET_NAMES.PATIENTS),
          orders: getSheetData(ss, SHEET_NAMES.ORDERS),
          menus: getSheetData(ss, SHEET_NAMES.MENUS),
          rooms: getSheetData(ss, SHEET_NAMES.ROOMS),
          dietTypes: getSheetData(ss, SHEET_NAMES.DIET_TYPES),
          providers: getSheetData(ss, SHEET_NAMES.PROVIDERS),
          auditLogs: getSheetData(ss, SHEET_NAMES.AUDIT_LOGS),
          settings: getSettingsFromSheet(ss)
        }
      });
    }

    if (action === 'getUsers') {
      return createJsonResponse({ status: 'SUCCESS', data: getSheetData(ss, SHEET_NAMES.USERS) });
    }

    if (action === 'getOrders') {
      return createJsonResponse({ status: 'SUCCESS', data: getSheetData(ss, SHEET_NAMES.ORDERS) });
    }

    if (action === 'getPatients') {
      return createJsonResponse({ status: 'SUCCESS', data: getSheetData(ss, SHEET_NAMES.PATIENTS) });
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

    return createJsonResponse({ status: 'ERROR', message: 'Aksi GET tidak dikenali: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'ERROR', error: err.toString() });
  }
}

/**
 * Handle POST Requests
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

    if (action === 'getDatabase') {
      return createJsonResponse({
        status: 'SUCCESS',
        spreadsheetName: ss.getName(),
        database: {
          users: getSheetData(ss, SHEET_NAMES.USERS),
          patients: getSheetData(ss, SHEET_NAMES.PATIENTS),
          orders: getSheetData(ss, SHEET_NAMES.ORDERS),
          menus: getSheetData(ss, SHEET_NAMES.MENUS),
          rooms: getSheetData(ss, SHEET_NAMES.ROOMS),
          dietTypes: getSheetData(ss, SHEET_NAMES.DIET_TYPES),
          providers: getSheetData(ss, SHEET_NAMES.PROVIDERS),
          auditLogs: getSheetData(ss, SHEET_NAMES.AUDIT_LOGS),
          settings: getSettingsFromSheet(ss)
        }
      });
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
          message: 'Folder Google Drive (' + folderId + ') tidak dapat diakses. Pastikan folder sudah dibagikan.'
        });
      }

      let cleanBase64 = base64Data;
      if (cleanBase64.indexOf(',') > -1) {
        cleanBase64 = cleanBase64.split(',')[1];
      }

      const decoded = Utilities.base64Decode(cleanBase64);
      const blob = Utilities.newBlob(decoded, mimeType, fileName);
      const file = folder.createFile(blob);

      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {}

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

    // =========================================================================
    // SINKRONISASI MENYELURUH (USERS, PATIENTS, ORDERS, MENUS, ROOMS, DIETS, ETC)
    // =========================================================================
    if (action === 'syncAll') {
      const payload = postData.payload || {};

      if (payload.users && Array.isArray(payload.users)) {
        upsertUsers(ss, payload.users);
      }
      if (payload.patients && Array.isArray(payload.patients)) {
        upsertPatients(ss, payload.patients);
      }
      if (payload.orders && Array.isArray(payload.orders)) {
        upsertOrders(ss, payload.orders);
      }
      if (payload.menus && Array.isArray(payload.menus)) {
        upsertMenus(ss, payload.menus);
      }
      if (payload.rooms && Array.isArray(payload.rooms)) {
        upsertRooms(ss, payload.rooms);
      }
      if (payload.dietTypes && Array.isArray(payload.dietTypes)) {
        upsertDietTypes(ss, payload.dietTypes);
      }
      if (payload.providers && Array.isArray(payload.providers)) {
        upsertProviders(ss, payload.providers);
      }
      if (payload.auditLogs && Array.isArray(payload.auditLogs)) {
        appendAuditLogs(ss, payload.auditLogs);
      }
      if (payload.settings) {
        upsertSettings(ss, payload.settings);
      }

      return createJsonResponse({
        status: 'SUCCESS',
        message: 'Seluruh data pengguna, pasien, order makanan, master data & pengaturan berhasil disinkronkan ke Google Spreadsheet.',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'syncUsers' && postData.users) {
      upsertUsers(ss, postData.users);
      return createJsonResponse({ status: 'SUCCESS', message: 'Data pengguna berhasil disinkronkan ke Spreadsheet' });
    }

    return createJsonResponse({ status: 'ERROR', message: 'Aksi POST tidak valid: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'ERROR', error: err.toString() });
  }
}

/**
 * Simpan / perbarui data Users
 */
function upsertUsers(ss, users) {
  let sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  }

  const existingData = sheet.getDataRange().getValues();
  const headers = existingData[0];
  const idColIndex = headers.indexOf('id');
  const existingMap = {};

  for (let r = 1; r < existingData.length; r++) {
    const idVal = existingData[r][idColIndex];
    if (idVal) existingMap[idVal] = r + 1;
  }

  users.forEach(function(u) {
    const rowValues = [
      u.id || '',
      u.name || '',
      u.nipOrNik || '',
      u.role || '',
      u.email || '',
      u.username || '',
      u.password || '',
      u.status || 'ACTIVE',
      u.phoneNumber || '',
      u.unitOrWard || '',
      u.providerId || '',
      new Date().toISOString()
    ];

    if (existingMap[u.id]) {
      sheet.getRange(existingMap[u.id], 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  });
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
    if (idVal) existingMap[idVal] = r + 1;
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
      sheet.getRange(existingMap[order.id], 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
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
      sheet.getRange(existingMap[p.id], 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  });
}

/**
 * Simpan / perbarui Menus
 */
function upsertMenus(ss, menus) {
  let sheet = ss.getSheetByName(SHEET_NAMES.MENUS);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEET_NAMES.MENUS);
  }

  const existingData = sheet.getDataRange().getValues();
  const idColIndex = existingData[0].indexOf('id');
  const existingMap = {};
  for (let r = 1; r < existingData.length; r++) {
    const idVal = existingData[r][idColIndex];
    if (idVal) existingMap[idVal] = r + 1;
  }

  menus.forEach(function(m) {
    const rowValues = [
      m.id || '',
      m.code || '',
      m.name || '',
      m.dietCategoryName || '',
      m.texture || '',
      Array.isArray(m.components) ? m.components.join(', ') : (m.components || ''),
      m.pricePerPortion || 0,
      m.contractReference || '',
      new Date().toISOString()
    ];
    if (existingMap[m.id]) {
      sheet.getRange(existingMap[m.id], 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  });
}

/**
 * Simpan / perbarui Rooms
 */
function upsertRooms(ss, rooms) {
  let sheet = ss.getSheetByName(SHEET_NAMES.ROOMS);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEET_NAMES.ROOMS);
  }

  const existingData = sheet.getDataRange().getValues();
  const idColIndex = existingData[0].indexOf('id');
  const existingMap = {};
  for (let r = 1; r < existingData.length; r++) {
    const idVal = existingData[r][idColIndex];
    if (idVal) existingMap[idVal] = r + 1;
  }

  rooms.forEach(function(rItem) {
    const rowValues = [
      rItem.id || '',
      rItem.room || '',
      rItem.bed || '',
      rItem.type || '',
      new Date().toISOString()
    ];
    if (existingMap[rItem.id]) {
      sheet.getRange(existingMap[rItem.id], 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  });
}

/**
 * Simpan / perbarui DietTypes
 */
function upsertDietTypes(ss, dietTypes) {
  let sheet = ss.getSheetByName(SHEET_NAMES.DIET_TYPES);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEET_NAMES.DIET_TYPES);
  }

  const existingData = sheet.getDataRange().getValues();
  const idColIndex = existingData[0].indexOf('id');
  const existingMap = {};
  for (let r = 1; r < existingData.length; r++) {
    const idVal = existingData[r][idColIndex];
    if (idVal) existingMap[idVal] = r + 1;
  }

  dietTypes.forEach(function(d) {
    const rowValues = [
      d.id || '',
      d.code || '',
      d.name || '',
      d.description || '',
      Array.isArray(d.allowedTextures) ? d.allowedTextures.join(', ') : (d.allowedTextures || ''),
      new Date().toISOString()
    ];
    if (existingMap[d.id]) {
      sheet.getRange(existingMap[d.id], 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  });
}

/**
 * Simpan / perbarui Providers
 */
function upsertProviders(ss, providers) {
  let sheet = ss.getSheetByName(SHEET_NAMES.PROVIDERS);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEET_NAMES.PROVIDERS);
  }

  const existingData = sheet.getDataRange().getValues();
  const idColIndex = existingData[0].indexOf('id');
  const existingMap = {};
  for (let r = 1; r < existingData.length; r++) {
    const idVal = existingData[r][idColIndex];
    if (idVal) existingMap[idVal] = r + 1;
  }

  providers.forEach(function(pr) {
    const rowValues = [
      pr.id || '',
      pr.code || '',
      pr.name || '',
      pr.contactPerson || '',
      pr.phone || '',
      pr.address || '',
      pr.contractNumber || '',
      pr.contractStart || '',
      pr.contractEnd || '',
      pr.status || 'ACTIVE',
      new Date().toISOString()
    ];
    if (existingMap[pr.id]) {
      sheet.getRange(existingMap[pr.id], 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  });
}

/**
 * Simpan / perbarui AppSettings
 */
function upsertSettings(ss, settings) {
  let sheet = ss.getSheetByName(SHEET_NAMES.APP_SETTINGS);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEET_NAMES.APP_SETTINGS);
  }

  const existingData = sheet.getDataRange().getValues();
  const keyColIndex = existingData[0].indexOf('key');
  const existingMap = {};
  for (let r = 1; r < existingData.length; r++) {
    const kVal = existingData[r][keyColIndex];
    if (kVal) existingMap[kVal] = r + 1;
  }

  for (const k in settings) {
    const val = typeof settings[k] === 'object' ? JSON.stringify(settings[k]) : String(settings[k]);
    const row = [k, val, new Date().toISOString()];
    if (existingMap[k]) {
      sheet.getRange(existingMap[k], 1, 1, 3).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
  }
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

function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const results = [];
  for (let i = 1; i < rows.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = rows[i][j];
      // Parse array fields if string with comma
      if (headers[j] === 'components' || headers[j] === 'allowedTextures' || headers[j] === 'foodAllergies' || headers[j] === 'allergies') {
        if (typeof val === 'string' && val.indexOf(',') > -1) {
          val = val.split(',').map(function(s) { return s.trim(); });
        } else if (typeof val === 'string' && val.trim().length > 0) {
          val = [val.trim()];
        }
      }
      obj[headers[j]] = val;
    }
    results.push(obj);
  }
  return results;
}

function getSettingsFromSheet(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.APP_SETTINGS);
  if (!sheet || sheet.getLastRow() < 2) return {};
  const rows = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < rows.length; i++) {
    const k = rows[i][0];
    let v = rows[i][1];
    try {
      v = JSON.parse(v);
    } catch (e) {}
    if (k) settings[k] = v;
  }
  return settings;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
