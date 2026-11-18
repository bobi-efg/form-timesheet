# Form Timesheet → Google Sheet

Form web (`index.html`) dengan **Sign in with Google**. Data disimpan ke Google Sheet lewat Google Apps Script (`Code.gs`).
Semua akun Google boleh mengisi; email pengisi diambil dari login Google dan diverifikasi di server, jadi tidak bisa dipalsukan.

## 1. Google Cloud — OAuth Client
1. **APIs & Services → OAuth consent screen**: User type **External**, scope cukup default (`email`, `profile`, `openid`), lalu **Publish app** (status *In production*). Scope ini tidak sensitif, jadi tidak perlu verifikasi Google.
2. **APIs & Services → Credentials → OAuth client ID** (tipe *Web application*):
   - **Authorized JavaScript origins**: alamat tempat form dibuka, misalnya `http://localhost:8000` (tes) dan `https://<username>.github.io` (hosting). Tanpa path, tanpa `/` di akhir.
3. Salin **Client ID** (berakhiran `.apps.googleusercontent.com`). Client Secret tidak dipakai.

## 2. Apps Script (akun Gmail)
1. Di Google Sheet: **Extensions → Apps Script**, tempel isi `Code.gs`, isi `CLIENT_ID`, **Save**.
2. **Deploy → Manage deployments → Edit (pensil) → Version: New version**
   - Execute as: **Me** — Who has access: **Anyone**
3. Klik **Deploy**. Google akan minta izin baru (akses ke layanan eksternal, untuk memeriksa token) — izinkan.

## 3. Form
1. Di `index.html`, isi `CLIENT_ID` (sama persis dengan di `Code.gs`) dan pastikan `SCRIPT_URL` benar.
2. Form **tidak bisa** dibuka dengan klik dua kali (`file://`) karena login Google butuh alamat http(s). Untuk tes lokal, di folder ini jalankan:
   ```
   python -m http.server 8000
   ```
   lalu buka `http://localhost:8000`.
3. Untuk dipakai tim, host `index.html` di GitHub Pages / Netlify / Vercel dan tambahkan alamatnya ke Authorized JavaScript origins.

## 4. Deploy (CI/CD ke GitHub Pages)
Setiap push ke branch `main` otomatis men-deploy `index.html` ke
`https://bobi-efg.github.io/form-timesheet/` lewat GitHub Actions (`.github/workflows/deploy.yml`).

- Deploy akan **gagal dengan sengaja** kalau `CLIENT_ID` / `SCRIPT_URL` di `index.html` masih `PASTE_...`.
- Setup sekali: repo **Settings → Pages → Source: GitHub Actions**.
- Tambahkan `https://bobi-efg.github.io` ke Authorized JavaScript origins OAuth Client.
- `Code.gs` **tidak** ikut ter-deploy otomatis — perubahan di sana tetap di-deploy manual di Apps Script (New version).

## Catatan
- Setiap mengubah `Code.gs`, deploy ulang dengan **New version** supaya URL tetap sama.
- Login Google berlaku ±1 jam; kalau habis, form meminta masuk lagi tanpa menghapus isian.
- Header kolom dibuat otomatis saat data pertama masuk.
