// Google Apps Script (GAS) Code.gs generator & template
// User can deploy this as a Web App to use Google Sheets as their primary cloud database!

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
 *    - Description: "SI PANTAI GIZI API v1.0"
 *    - Execute as: "Me" (Saya - email akun Google Anda)
 *    - Who has access: "Anyone" (Siapa saja)
 * 8. Klik Deploy, berikan otorisasi izin Google Spreadsheet jika diminta.
 * 9. Salin "Web app URL" (akhiran /exec) dan tempel ke menu "Pengaturan & Integrasi GAS" di aplikasi web SI PANTAI GIZI.
 * 10. Klik tombol "Setup Database Otomatis" di aplikasi web untuk membuat seluruh sheet & header otomatis!
 */

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
      'deliveredToPatientAt', 'consumptionCategory', 'consumptionPercentage', 'leftoverPercentage',
      'billedPortionCount', 'finalBilledAmount', 'billingStatus', 'createdAt', 'updatedAt'
    ],
    [SHEET_NAMES.PATIENTS]: [
      'id', 'mrn', 'name', 'gender', 'birthDate', 'room', 'bed',
      'admissionDate', 'dischargeDate', 'dischargedAt', 'dischargedBy', 'dischargeNotes',
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
      return createJsonResponse({
        status: 'SUCCESS',
        message: 'Koneksi ke Google Sheets SI PANTAI GIZI Aktif',
        spreadsheetName: ss.getName(),
        spreadsheetId: ss.getId(),
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
 * Handle POST Requests (Sinkronisasi Order, Transaksi, Audit Log & 1-Click Setup)
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

    if (action === 'syncAll') {
      // Sinkronisasi data menyeluruh dari Web App ke Google Sheets
      const payload = postData.payload || {};
      
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
      const order = postData.order;
      if (!order || !order.id) {
        return createJsonResponse({ status: 'ERROR', message: 'Data order tidak lengkap' });
      }
      upsertOrders(ss, [order]);
      return createJsonResponse({ status: 'SUCCESS', message: 'Order berhasil diperbarui di Spreadsheet' });
    }

    if (action === 'logAudit') {
      const log = postData.log;
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
