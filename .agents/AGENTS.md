# Konteks Proyek: Generator RPM (Rencana Pembelajaran Mendalam)

Repositori ini adalah aplikasi web untuk men-generate Rencana Pembelajaran Mendalam (RPM) Kurikulum Merdeka menggunakan AI (Google Gemini, OpenAI, Claude, dsb).

## Tech Stack
- Frontend: React + Vite + TypeScript
- CSS: Tailwind CSS (tersirat dari syntax class, atau Vanilla CSS dengan utility-like classes).
- Backend / API: Serverless Functions di folder `api/` (format Vercel-like).

## Struktur File Penting
1. **Frontend / Komponen:**
   - `src/App.tsx`: File induk yang mengatur alur logika utama, state riwayat RPM, penyimpanan lokal (localStorage), pengiriman request ke backend API, dan pengaturan AI Provider.
   - `src/components/FormRPM.tsx`: Komponen untuk menerima input guru. Terdapat opsi **Model Pembelajaran** khusus. Jika guru memilih "Lainnya (Ketik Manual)...", akan muncul kotak input tambahan untuk mengetikkan nama model kustom beserta urutan **Fase/Sintaks** secara manual.
   - `src/components/ResultRPM.tsx`: Merender raw HTML hasil generate dari AI.

2. **Tipe Data Utama:**
   - `src/types.ts`: Mengandung interface inti aplikasi, khususnya `RPMFormData` yang mendefinisikan field form seperti `learningModelPhases` dan `additionalContext`.

3. **Backend / AI Prompting:**
   - `api/generate.ts`: Endpoint utama yang menyusun kerangka *prompt* dan struktur raw HTML, lalu mengirimkannya ke LLM (Gemini, dll).
   - Di file ini, kita menerapkan logika ketat *(strict logic)*: Jika guru menginputkan fase kustom (`data.learningModelPhases`), AI **WAJIB** mengikuti urutan fase tersebut tanpa berhalusinasi atau mencampur dengan "standar baku" model yang ia ketahui. Hal ini memecahkan masalah AI yang sering bandel/random saat diberi instruksi untuk model pembelajaran kustom/baru.
   - `api/enhance-rpm.ts`: API sekunder untuk menyisipkan SVG diagram secara dinamis pada HTML RPM yang sudah jadi.

## Aturan (Rules) Modifikasi atau Penambahan Fitur
1. **Menambah Input Form Baru:**
   - Tambahkan propertinya di interface `RPMFormData` (`src/types.ts`).
   - Berikan *default value* di dalam fungsi `handleResetForm` dan inisialisasi state awal di `FormRPM.tsx`.
   - Modifikasi UI di `FormRPM.tsx`.
   - Terapkan penggunaannya ke dalam variabel `prompt` di dalam `api/generate.ts`.
2. **Merombak Prompt / Output AI:**
   - Selalu berhati-hati pada instruksi ganda yang tumpang-tindih (conflict instructions) di dalam prompt (terutama di `api/generate.ts`). AI sangat sensitif dengan kata-kata seperti "harus sesuai standar" vs "ikuti input pengguna".
   - AI dilarang menggunakan output LaTeX matematis karena web merender raw HTML.
3. **Moda Deployment:**
   - Selalu *build* (menggunakan Vite) untuk mengecek potensi error TS sebelum *push*.

## Aturan Khusus Deployment (Terutama Vercel Hobby Plan)
1. **Batas Maksimal Serverless Functions:**
   - Vercel Hobby Plan (gratis) memiliki batas maksimal **12 Serverless Functions** per deployment.
   - Karena setiap file di dalam folder `api/` otomatis dianggap sebagai 1 function, kita harus menjaga jumlah file di dalamnya agar tidak melebihi 12.
   - **Solusi/Trik Bypass:** Jika butuh banyak endpoint, gabungkan ke dalam satu file *gateway/entrypoint* (contoh: `api/generate-manual.js` yang membaca `req.query.type`). Pindahkan logika asli ke file yang berawalan *underscore* (contoh: `api/_generate-manual-soal.js`). Vercel akan **mengabaikan** file berawalan `_` sehingga tidak dihitung dalam kuota fungsi.
2. **TypeScript & tsconfig.json di folder api/:**
   - Karena package.json menggunakan `\"type\": \"module\"`, jangan pernah menaruh file `tsconfig.json` dengan `\"module\": \"CommonJS\"` di dalam folder `api/`. Hal ini akan menyebabkan Vercel melakukan kompilasi ke ekstensi `.js` biasa namun menggunakan sintaks `require()`, yang pada akhirnya memicu runtime error \ReferenceError: require is not defined in ES module scope\ dan menggagalkan build/deploy.
   - Pastikan kodenya menggunakan sintaks ES Module asli (`import`/`export`). Jika error tipe TS pada dependensi tertentu (seperti genai) mengganggu, gunakan anotasi `// @ts-nocheck` atau rename file tersebut ke ekstensi `.js` saja agar tidak dikompilasi oleh TS Vercel.
3. **Generasi PDF (Puppeteer / sparticuz/chromium):**
   - Vercel Hobby membatasi durasi eksekusi hanya **10 detik**. Jika melebihi batas, request akan diputus paksa dengan Vercel HTML error \504 Gateway Timeout\. Hal ini mengakibatkan frontend menerima respon yang bukan JSON, sehingga muncul pesan generik: \\u0022Gagal dari server\u0022\.
   - **Solusi Optimasi:** Selalu gunakan `waitUntil: 'networkidle2'` di Puppeteer (karena `networkidle0` bisa menggantung menunggu *tracker* atau gambar luar), kurangi waktu jeda buatan (`setTimeout` untuk twemoji dibuat sebentar saja), dan atur `bodyParser.sizeLimit` menjadi `'4mb'` agar sesuai dengan batas payload Vercel gratis (4.5MB).

## Penambahan Fitur Baru (Soal Manual & Kisi-kisi)
- Fitur ini merupakan fitur terpisah dari generator RPM yang dapat diakses via tombol **Soal Manual** di menu utama.
- File frontend: `src/components/ManualSoalModal.tsx`.
- File backend: Mengarah ke `/api/generate-manual` (proxy) yang kemudian mengeksekusi `api/_generate-manual-soal.js` atau `api/_generate-manual-table.js`.
- Kedua file backend menggunakan JavaScript native untuk memotong kebutuhan TypeScript transpile, dan keduanya berbagi konfigurasi Puppeteer PDF (`/api/pdf`) yang sama dengan generator RPM utama (`src/components/LembarSoal.tsx`).

