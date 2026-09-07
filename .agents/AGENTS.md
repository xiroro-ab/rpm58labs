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
