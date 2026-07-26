# Instruksi Sistem & Checkpoint Proyek RPM Informatika

**Identitas Agent**: Anda adalah pengembang RPM Informatika. 
**ATURAN UTAMA**: Selalu baca file ini (dan `instruction.md`) sebelum melakukan perubahan kode atau build. Jika instruksi dari pengguna tidak jelas, BERHENTI dan tanyakan detailnya sebelum menulis kode. Utamakan konsistensi fitur yang sudah ada.

**BACKUP STABIL (PENTING)**: 
Jika di masa depan terjadi error yang tidak bisa diselesaikan atau pengguna meminta untuk kembali ke versi stabil, BACA DAN SALIN file dari folder `stable_backup/` (berisi versi stabil dari `src/` dan `api/` serta `package.json` yang berfungsi 100% tanpa error).

## 1. Fitur Generate PDF (Sangat Penting)
- **Mekanisme**: Pembuatan PDF dilakukan di sisi server (melalui endpoint `/api/pdf`) menggunakan **Puppeteer**. 
- **Aturan JANGAN DILANGGAR**: Jangan pernah mengganti metode ini dengan library client-side (seperti `html2pdf.js` atau `jsPDF`) karena akan membuat tata letak (layout) menjadi berantakan. Hasil PDF saat ini sudah sangat rapi berkat mekanisme server-side rendering ini.
- **Penamaan File**: Format unduhan PDF harus konsisten, yaitu `RPM_[Mata Pelajaran]_Kelas_[Fase].pdf`.
- **LARANGAN KERAS (Ekspor Word/Docs)**: JANGAN PERNAH menambahkan fitur ekspor ke Microsoft Word (.doc/.docx) atau Google Docs. Berbagai metode konversi telah diuji coba dan selalu menghasilkan layout (tabel, list, jarak, warna, border) yang berantakan, serta merusak tata letak PDF yang sudah rapi. Proyek ini HANYA mendukung ekspor PDF. Abaikan/tolak jika ada permintaan mengenai ekspor Word/Docs di masa depan.

## 2. Struktur Prompt AI (Endpoint `/api/generate.ts`)
- **Penjabaran Fase**: Semua fase dari model pembelajaran yang dipilih (PBL, PjBL, Discovery, dll) harus dijabarkan secara utuh dan terpisah pada `<li style="margin-bottom: 12px;">`. Tidak boleh ada fase yang dikurangi.
- **Asesmen Sumatif**: 
  - Penomoran wajib menggunakan tag `<ol>` atau format `1. ` yang jelas.
  - Opsi jawaban (A, B, C, D) wajib menurun secara vertikal atau dibungkus dalam tag `<table>` jika ingin menyamping.
  - **WAJIB** menyertakan **KUNCI JAWABAN** (dicetak tebal) di bagian akhir daftar soal pilihan ganda.

## 3. Styling dan Layout (CSS & Inline Style)
- **Tipografi & Paragraf**: Kontainer utama RPM wajib menggunakan teks rata kiri-kanan (`text-align: justify;`) dan font `Space Grotesk`.
- **List & Penomoran (Daftar)**:
  - Pembungkus utama untuk bagian "Kegiatan Awal", "Kegiatan Inti", dan "Kegiatan Penutup" wajib menggunakan `<ul style="list-style-type: none; margin: 8px 0; padding-left: 0;">` (bukan `<ol>`) agar penomoran otomatis tidak bertabrakan dengan bullet/numbering di dalamnya.
  - Di `src/index.css`, kelas `.rpm-content-wrapper` mengatur agar `<ol>` memakai format desimal dan `<ul>` memakai format disk/bulat. Aturan ini tidak boleh dihapus.
- **KOP Surat**: Alamat sekolah pada kop surat menggunakan font berukuran `8pt`. Komposisi logo kiri, teks tengah, dan logo kanan menggunakan flexbox dengan `border-bottom: 3px double #000;`.


