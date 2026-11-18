/**
 * Google Apps Script — menerima data dari form timesheet dan menyimpannya ke Google Sheet.
 * Pengisi wajib login dengan akun Google; email diambil dari ID token yang diverifikasi ke Google,
 * bukan dari isian form, sehingga tidak bisa dipalsukan.
 *
 * Tempel file ini di Extensions > Apps Script pada Google Sheet tujuan.
 */

// HARUS sama dengan CLIENT_ID di index.html
const CLIENT_ID = 'PASTE_CLIENT_ID_DI_SINI.apps.googleusercontent.com';

const SHEET_NAME = 'Timesheet';
const HEADERS = [
  'Timestamp', 'Nama', 'Email', 'Tanggal', 'Jam Mulai', 'Jam Selesai',
  'Total Jam', 'Proyek / Klien', 'Deskripsi Pekerjaan'
];

function doPost(e) {
  const p = e.parameter;

  let user;
  try {
    user = verifyIdToken_(p.idToken);
  } catch (err) {
    return json_({ status: 'unauthorized', message: err.message });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      p.nama || user.name || '',
      user.email,            // email terverifikasi dari Google
      p.tanggal || '',
      p.jamMulai || '',
      p.jamSelesai || '',
      p.totalJam || '',
      p.proyek || '',
      p.deskripsi || ''
    ]);
    return json_({ status: 'success' });
  } catch (err) {
    return json_({ status: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Untuk cek cepat bahwa web app sudah aktif (buka URL di browser).
function doGet() {
  return json_({ status: 'ok', message: 'Timesheet API aktif' });
}

/**
 * Memeriksa ID token ke Google. Melempar error kalau token palsu, kedaluwarsa,
 * dibuat untuk aplikasi lain, atau emailnya belum terverifikasi.
 */
function verifyIdToken_(idToken) {
  if (!idToken) throw new Error('Token tidak ada');

  const res = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (res.getResponseCode() !== 200) throw new Error('Token tidak valid atau sudah kedaluwarsa');

  const info = JSON.parse(res.getContentText());
  if (info.aud !== CLIENT_ID) throw new Error('Token bukan untuk aplikasi ini');
  if (info.iss !== 'accounts.google.com' && info.iss !== 'https://accounts.google.com') {
    throw new Error('Penerbit token tidak dikenal');
  }
  if (String(info.email_verified) !== 'true') throw new Error('Email belum terverifikasi');

  return { email: info.email, name: info.name || '' };
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
